/*
 * File d'attente des e-mails. enqueue() rend, enregistre et tente l'envoi tout de suite ;
 * processQueue() (cron toutes les 10 minutes) reprend les envois échoués avec un délai croissant.
 */
import type { Env } from "../env";
import { all, one, run } from "../lib/db";
import { newId, nowIso } from "../lib/ids";
import { isEmail } from "../lib/http";
import { formatFrom, senderAddress, senderName } from "./brand";
import { deliver, maskEmail, type OutgoingMail } from "./providers";
import { loadClub, renderTemplate } from "./render";
import { TEMPLATES } from "./templates";
import type { MailInput } from "./send";

/** Délais avant chaque nouvelle tentative, en minutes. Après la dernière, l'e-mail passe en échec. */
export const BACKOFF_MIN = [1, 5, 15, 60, 180, 360, 720];
export const MAX_ATTEMPTS = BACKOFF_MIN.length + 1;
const MAX_ATTACH_BYTES = 10 * 1024 * 1024;

const inMinutes = (m: number) => new Date(Date.now() + m * 60000).toISOString();

export interface EnqueueOpts { dedupe_key?: string; send_now?: boolean }

/** Le destinataire a-t-il refusé cette catégorie, ou l'adresse est-elle bloquée ? */
async function blockReason(env: Env, to: string, category: string, clubId: string): Promise<"suppressed" | "skipped" | null> {
  const s = await one<{ reason: string }>(env.DB, "SELECT reason FROM email_suppressions WHERE email = ?", to);
  if (s && (s.reason === "hard_bounce" || s.reason === "manual" || category !== "essential")) return "suppressed";
  if (category === "essential") return null;
  const p = await one<{ enabled: number }>(env.DB,
    "SELECT enabled FROM notification_prefs WHERE email = ? AND category = ? AND club_id IN (?, '') ORDER BY enabled ASC LIMIT 1", to, category, clubId);
  return p && !p.enabled ? "skipped" : null;
}

export async function enqueue(env: Env, m: MailInput, o: EnqueueOpts = {}): Promise<string> {
  const id = newId("eml");
  const to = String(m.to || "").trim().toLowerCase();
  const db = env.DB;
  try {
    if (o.dedupe_key) {
      const ex = await one<{ id: string }>(db, "SELECT id FROM email_outbox WHERE dedupe_key = ?", o.dedupe_key);
      if (ex) return ex.id;
    }
    const def = TEMPLATES[m.template];
    const club = await loadClub(env, m.club_id);
    const fromName = senderName(club?.name);
    const base = [id, m.club_id || null, to, m.template, fromName, o.dedupe_key || null];
    const fail = async (status: string, err: string, subject = "", category = def?.category || "essential") => {
      await run(db, `INSERT INTO email_outbox (id, club_id, to_email, template, from_name, dedupe_key, subject, category, status, last_error) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        ...base, subject || m.template, category, status, err);
      return id;
    };
    if (!def) return await fail("failed", "Modèle inconnu");
    if (!isEmail(to)) return await fail("failed", "Adresse invalide");
    const block = await blockReason(env, to, def.category, m.club_id || "");
    if (block) return await fail(block, block === "suppressed" ? "Adresse bloquée (rebond ou plainte)" : "Désactivé par le destinataire");

    const r = await renderTemplate(env, m.template, m.data || {}, club, to);
    const headers: Record<string, string> = { "X-Piaffe-Template": m.template };
    if (r.listUnsubscribe) {
      headers["List-Unsubscribe"] = `<${r.listUnsubscribe}>`;
      headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }
    const replyTo = m.reply_to || club?.email || null;

    // Pièces jointes : rangées dans R2 pour que la file reste légère et que les reprises les retrouvent.
    const att: { filename: string; type: string; key: string; size: number }[] = [];
    let total = 0;
    for (const [i, a] of (m.attachments || []).entries()) {
      const bytes = Uint8Array.from(atob(a.content_b64), (c) => c.charCodeAt(0));
      total += bytes.length;
      if (total > MAX_ATTACH_BYTES) return await fail("failed", "Pièces jointes trop lourdes (10 Mo au maximum)", r.subject);
      const key = `mail/${id}/${i}`;
      await env.FILES.put(key, bytes, { httpMetadata: { contentType: a.type } });
      att.push({ filename: String(a.filename).replace(/[\r\n"\\/]/g, "_").slice(0, 120), type: a.type || "application/octet-stream", key, size: bytes.length });
    }

    const ins = await db.prepare(
      `INSERT INTO email_outbox (id, club_id, to_email, template, from_name, dedupe_key, subject, category, reply_to, html, text, headers, attachments, sensitive, status, next_attempt_at, lease_until)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(dedupe_key) DO NOTHING`)
      .bind(...base, r.subject, r.category, replyTo, r.html, r.text, JSON.stringify(headers), JSON.stringify(att), r.sensitive ? 1 : 0,
        o.send_now === false ? "queued" : "sending", nowIso(), o.send_now === false ? null : inMinutes(2)).run();
    if (!ins.meta.changes) {
      const ex = await one<{ id: string }>(db, "SELECT id FROM email_outbox WHERE dedupe_key = ?", o.dedupe_key);
      return ex?.id || id;
    }
    if (o.send_now !== false) await attempt(env, id);
    return id;
  } catch (e) {
    console.error("[mail] mise en file impossible", m.template, maskEmail(to), String((e as Error)?.message || e));
    return id;
  }
}

interface Row {
  id: string; to_email: string; subject: string; from_name: string; reply_to: string | null; html: string | null; text: string | null;
  headers: string; attachments: string; sensitive: number; attempts: number; template: string; club_id: string | null;
}

/** Tente l'envoi d'un e-mail déjà « réservé » (status = sending). */
export async function attempt(env: Env, id: string): Promise<string> {
  const db = env.DB;
  const row = await one<Row>(db, "SELECT * FROM email_outbox WHERE id = ? AND status = 'sending'", id);
  if (!row) return "absent";
  let res;
  try {
    const attachments = [];
    for (const a of JSON.parse(row.attachments || "[]") as { filename: string; type: string; key: string }[]) {
      const obj = await env.FILES.get(a.key);
      if (!obj) throw new Error("Pièce jointe introuvable");
      const u = new Uint8Array(await obj.arrayBuffer());
      let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
      attachments.push({ filename: a.filename, type: a.type, content_b64: btoa(s) });
    }
    const out: OutgoingMail = {
      id: row.id, fromName: row.from_name, fromAddress: senderAddress(env.MAIL_FROM), to: row.to_email, replyTo: row.reply_to,
      subject: row.subject, html: row.html || "", text: row.text || "", headers: JSON.parse(row.headers || "{}"), attachments,
      tags: [{ name: "template", value: row.template }, ...(row.club_id ? [{ name: "club", value: row.club_id.replace(/[^A-Za-z0-9_-]/g, "") }] : [])],
    };
    if (!out.html) res = { ok: false as const, retry: false, error: "Corps de l'e-mail effacé" };
    else res = await deliver(env, out);
  } catch (e) {
    res = { ok: false as const, retry: true, error: String((e as Error)?.message || e).slice(0, 300) };
  }
  const attempts = row.attempts + 1;
  if (res.ok) {
    await run(db, `UPDATE email_outbox SET status='sent', attempts=?, sent_at=?, provider=?, provider_id=?, lease_until=NULL, last_error=NULL
      ${row.sensitive ? ", html=NULL, text=NULL" : ""} WHERE id=?`, attempts, nowIso(), (env.MAIL_PROVIDER || "log").toLowerCase(), res.providerId, id);
    return "sent";
  }
  if (res.retry && attempts < MAX_ATTEMPTS) {
    await run(db, "UPDATE email_outbox SET status='queued', attempts=?, next_attempt_at=?, lease_until=NULL, last_error=? WHERE id=?",
      attempts, inMinutes(BACKOFF_MIN[attempts - 1]), res.error, id);
    return "retry";
  }
  await run(db, "UPDATE email_outbox SET status='failed', attempts=?, lease_until=NULL, last_error=? WHERE id=?", attempts, res.error, id);
  console.error("[mail] échec définitif", row.template, maskEmail(row.to_email), res.error);
  return "failed";
}

/** Reprise : prend jusqu'à `limit` e-mails dus (ou bloqués en cours d'envoi depuis plus de 2 minutes). */
export async function processQueue(env: Env, limit = 50): Promise<{ picked: number; sent: number }> {
  const now = nowIso();
  const rows = await all<{ id: string }>(env.DB,
    `UPDATE email_outbox SET status='sending', lease_until=? WHERE id IN (
       SELECT id FROM email_outbox WHERE (status='queued' AND next_attempt_at <= ?) OR (status='sending' AND lease_until < ?)
       ORDER BY next_attempt_at LIMIT ?) RETURNING id`, inMinutes(3), now, now, limit);
  let sent = 0;
  for (const r of rows) if ((await attempt(env, r.id)) === "sent") sent++;
  return { picked: rows.length, sent };
}

/** Ménage quotidien : corps effacés après 7 jours, pièces jointes supprimées, file tenue à 180 jours. */
export async function purge(env: Env) {
  const d7 = new Date(Date.now() - 7 * 864e5).toISOString();
  const old = await all<{ id: string; attachments: string }>(env.DB,
    "SELECT id, attachments FROM email_outbox WHERE status IN ('sent','failed') AND created_at < ? AND (html IS NOT NULL OR attachments != '[]') LIMIT 500", d7);
  for (const o of old) {
    for (const a of JSON.parse(o.attachments || "[]") as { key: string }[]) await env.FILES.delete(a.key);
    await run(env.DB, "UPDATE email_outbox SET html=NULL, text=NULL, attachments='[]' WHERE id=?", o.id);
  }
  await run(env.DB, "DELETE FROM email_outbox WHERE created_at < ?", new Date(Date.now() - 180 * 864e5).toISOString());
}
