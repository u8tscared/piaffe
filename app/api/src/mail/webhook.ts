/*
 * Webhook des fournisseurs d'e-mail : POST /webhooks/mail
 *  - Resend (signature Svix : en-têtes svix-id, svix-timestamp, svix-signature ; secret whsec_… en base64) ;
 *  - Brevo (authentification par jeton : Authorization: Bearer <secret>, ou Basic avec le secret en mot de passe,
 *    ou ?token=<secret> dans l'URL déclarée chez Brevo).
 * Secret : variable MAIL_WEBHOOK_SECRET. Sans secret configuré, le webhook refuse tout (503).
 * Rebond définitif → adresse bloquée pour tout ; plainte ou désinscription → bloquée pour le non essentiel.
 */
import type { Env } from "../env";
import { b64urlDecode, safeEqual, sha256 } from "../lib/crypto";
import { one, run } from "../lib/db";
import { ApiError } from "../lib/http";

type Ev = { eventId: string; providerId: string | null; email: string | null; kind: "hard_bounce" | "complaint" | "delivered" | "delayed" | "other" };

const enc = new TextEncoder();

export async function verifySvix(secret: string, id: string, ts: string, sigHeader: string, payload: string, nowSec = Math.floor(Date.now() / 1000)): Promise<boolean> {
  if (!id || !ts || !sigHeader) return false;
  const t = Number(ts);
  if (!isFinite(t) || Math.abs(nowSec - t) > 300) return false;
  const keyBytes = b64urlDecode(secret.replace(/^whsec_/, "").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""));
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${id}.${ts}.${payload}`)));
  const want = btoa(String.fromCharCode(...mac));
  return sigHeader.split(" ").some((p) => { const [v, s] = p.split(","); return v === "v1" && !!s && safeEqual(s, want); });
}

function parseResend(o: any, eventId: string): Ev {
  const d = o?.data || {};
  const email = (Array.isArray(d.to) ? d.to[0] : d.to) || null;
  const map: Record<string, Ev["kind"]> = { "email.complained": "complaint", "email.delivered": "delivered", "email.delivery_delayed": "delayed" };
  let kind: Ev["kind"] = map[o?.type] || "other";
  if (o?.type === "email.bounced") kind = String(d.bounce?.type || "Permanent").toLowerCase().startsWith("trans") ? "delayed" : "hard_bounce";
  return { eventId, providerId: d.email_id || null, email, kind };
}
function parseBrevo(o: any): Ev {
  const e = String(o?.event || "").toLowerCase();
  const kind: Ev["kind"] = ["hard_bounce", "hardbounce", "blocked", "invalid_email", "invalid"].includes(e) ? "hard_bounce"
    : ["spam", "complaint", "unsubscribed"].includes(e) ? "complaint"
    : e === "delivered" ? "delivered" : ["soft_bounce", "softbounce", "deferred"].includes(e) ? "delayed" : "other";
  return { eventId: "", providerId: o?.["message-id"] || null, email: o?.email || null, kind };
}

export async function handleMailWebhook(env: Env, req: Request): Promise<{ ok: true; handled: number }> {
  const secret = (env as unknown as { MAIL_WEBHOOK_SECRET?: string }).MAIL_WEBHOOK_SECRET || "";
  if (!secret) throw new ApiError(503, "webhook_not_configured", "Le webhook des e-mails n'est pas configuré (MAIL_WEBHOOK_SECRET).");
  const raw = await req.text();
  if (raw.length > 512 * 1024) throw new ApiError(400, "too_large", "Corps trop volumineux.");
  const h = req.headers;
  const events: Ev[] = [];
  if (h.get("svix-id")) {
    if (!(await verifySvix(secret, h.get("svix-id")!, h.get("svix-timestamp") || "", h.get("svix-signature") || "", raw)))
      throw new ApiError(401, "bad_signature", "Signature du webhook invalide.");
    let o: any; try { o = JSON.parse(raw); } catch { throw new ApiError(400, "invalid_json", "Corps JSON invalide."); }
    events.push(parseResend(o, "svix:" + h.get("svix-id")));
  } else {
    const authz = h.get("authorization") || "";
    let given = new URL(req.url).searchParams.get("token") || "";
    if (authz.startsWith("Bearer ")) given = authz.slice(7).trim();
    else if (authz.startsWith("Basic ")) { try { given = atob(authz.slice(6).trim()).split(":").slice(1).join(":"); } catch { given = ""; } }
    if (!given || !safeEqual(await sha256(given), await sha256(secret))) throw new ApiError(401, "bad_signature", "Jeton du webhook invalide.");
    let o: any; try { o = JSON.parse(raw); } catch { throw new ApiError(400, "invalid_json", "Corps JSON invalide."); }
    for (const x of Array.isArray(o) ? o : [o]) {
      const ev = parseBrevo(x);
      ev.eventId = "brevo:" + (await sha256(JSON.stringify([x?.id, x?.["message-id"], x?.event, x?.email, x?.ts_event ?? x?.date]))).slice(0, 40);
      events.push(ev);
    }
  }
  let handled = 0;
  for (const ev of events) {
    const row = ev.providerId ? await one<{ id: string; to_email: string }>(env.DB, "SELECT id, to_email FROM email_outbox WHERE provider_id = ?", ev.providerId) : null;
    const email = (ev.email || row?.to_email || "").toLowerCase() || null;
    const ins = await run(env.DB, "INSERT OR IGNORE INTO email_events (id, outbox_id, type, email) VALUES (?,?,?,?)", ev.eventId, row?.id ?? null, ev.kind, email);
    if (!ins.meta.changes) continue; // déjà traité
    handled++;
    if (row && ev.kind !== "other") {
      const delivery = ev.kind === "hard_bounce" ? "bounced" : ev.kind === "complaint" ? "complained" : ev.kind;
      await run(env.DB, "UPDATE email_outbox SET delivery = ? WHERE id = ?", delivery, row.id);
    }
    if (email && (ev.kind === "hard_bounce" || ev.kind === "complaint")) {
      // Un rebond définitif l'emporte sur une plainte (il bloque aussi l'essentiel).
      await run(env.DB, `INSERT INTO email_suppressions (email, reason, source) VALUES (?,?,?)
        ON CONFLICT(email) DO UPDATE SET reason = CASE WHEN email_suppressions.reason='hard_bounce' THEN 'hard_bounce' ELSE excluded.reason END`,
        email, ev.kind, ev.eventId.split(":")[0]);
    }
  }
  return { ok: true, handled };
}
