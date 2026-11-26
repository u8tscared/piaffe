import { isLocalDev } from "../lib/features";
/*
 * Fournisseurs d'envoi, appelés en fetch direct (aucun SDK) :
 *  - log    : n'envoie rien, journalise le destinataire masqué (défaut, tests, développement) ;
 *  - resend : POST https://api.resend.com/emails (Authorization: Bearer, Idempotency-Key) ;
 *  - brevo  : POST https://api.brevo.com/v3/smtp/email (en-tête api-key).
 * setFetch() permet de simuler le réseau dans les tests.
 */
import type { Env } from "../env";

export interface OutgoingMail {
  id: string;
  fromName: string;
  fromAddress: string;
  to: string;
  replyTo?: string | null;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
  attachments: { filename: string; content_b64: string; type: string }[];
  tags: { name: string; value: string }[];
}
export type SendResult = { ok: true; providerId: string } | { ok: false; retry: boolean; error: string };

let fetcher: typeof fetch = (...a) => fetch(...a);
export function setFetch(f: typeof fetch | null) { fetcher = f || ((...a) => fetch(...a)); }

/** Masque une adresse pour les journaux : l***@exemple.fr. */
export function maskEmail(e: string): string {
  const [u, d] = e.split("@");
  return (u ? u[0] : "") + "***@" + (d || "");
}

/** Dernière adresse envoyée par le fournisseur log (utile pour les tests). */
export const logSent: OutgoingMail[] = [];

function classify(status: number, body: string): SendResult {
  // 429 et 5xx : on réessaie plus tard. 4xx : erreur définitive (adresse invalide, domaine non vérifié…).
  const retry = status === 429 || status >= 500;
  return { ok: false, retry, error: `HTTP ${status} ${body.slice(0, 300)}` };
}

export async function deliver(env: Env, m: OutgoingMail): Promise<SendResult> {
  const provider = (env.MAIL_PROVIDER || "log").toLowerCase();
  if (provider === "log") {
    logSent.push(m);
    if (logSent.length > 200) logSent.shift();
    console.log("[mail:log]", m.subject, "→", maskEmail(m.to));
    if (isLocalDev(env)) { const links = (m.text || m.html || "").match(/https?:\/\/[^\s"'<>)]+/g) || []; for (const l of [...new Set(links)].filter((x) => !/unsubscribe|logo/.test(x)).slice(0, 3)) console.log("  lien :", l); }
    return { ok: true, providerId: "log_" + m.id };
  }
  if (!env.MAIL_API_KEY) return { ok: false, retry: true, error: "MAIL_API_KEY manquante" };
  const signal = AbortSignal.timeout(10000);
  try {
    if (provider === "resend") {
      const r = await fetcher("https://api.resend.com/emails", {
        method: "POST", signal,
        headers: { authorization: "Bearer " + env.MAIL_API_KEY, "content-type": "application/json", "idempotency-key": m.id },
        body: JSON.stringify({
          from: `"${m.fromName.replace(/["\\]/g, "")}" <${m.fromAddress}>`,
          to: [m.to], subject: m.subject, html: m.html, text: m.text,
          ...(m.replyTo ? { reply_to: m.replyTo } : {}),
          headers: m.headers,
          attachments: m.attachments.map((a) => ({ filename: a.filename, content: a.content_b64, content_type: a.type })),
          tags: m.tags,
        }),
      });
      const t = await r.text();
      if (!r.ok) return classify(r.status, t);
      let id = ""; try { id = JSON.parse(t).id || ""; } catch { /* corps inattendu */ }
      return { ok: true, providerId: id || "resend_" + m.id };
    }
    if (provider === "brevo") {
      const r = await fetcher("https://api.brevo.com/v3/smtp/email", {
        method: "POST", signal,
        headers: { "api-key": env.MAIL_API_KEY, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          sender: { name: m.fromName, email: m.fromAddress },
          to: [{ email: m.to }], subject: m.subject, htmlContent: m.html, textContent: m.text,
          ...(m.replyTo ? { replyTo: { email: m.replyTo } } : {}),
          // Brevo refuse les en-têtes standard : la désinscription passe par le lien du pied de page.
          headers: { ...Object.fromEntries(Object.entries(m.headers).filter(([k]) => !/^list-unsubscribe/i.test(k))), "X-Piaffe-Id": m.id },
          ...(m.attachments.length ? { attachment: m.attachments.map((a) => ({ name: a.filename, content: a.content_b64 })) } : {}),
          tags: m.tags.map((t) => t.value),
        }),
      });
      const t = await r.text();
      if (!r.ok) return classify(r.status, t);
      let id = ""; try { id = JSON.parse(t).messageId || ""; } catch { /* corps inattendu */ }
      return { ok: true, providerId: id || "brevo_" + m.id };
    }
    return { ok: false, retry: false, error: "Fournisseur d'e-mail inconnu : " + provider };
  } catch (e) {
    return { ok: false, retry: true, error: "Réseau : " + String((e as Error)?.message || e).slice(0, 200) };
  }
}
