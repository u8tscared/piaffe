import type { Env } from "../env";
import { one, json } from "../lib/db";
import { b64url, b64urlDecode, hmacSha256, safeEqual } from "../lib/crypto";
import { BRAND } from "./brand";
import { renderHtml, renderText, type Frame } from "./layout";
import { TEMPLATES, type Category, type MailCtx } from "./templates";

export interface ClubInfo { id: string; name: string; email: string | null; phone: string | null; address: string | null; logo_key: string | null; settings: string | null }

export async function loadClub(env: Env, clubId?: string | null): Promise<ClubInfo | null> {
  if (!clubId) return null;
  return one<ClubInfo>(env.DB, "SELECT id, name, email, phone, address, logo_key, settings FROM clubs WHERE id = ?", clubId);
}

function addressLine(a: string | null): string {
  const o = json<Record<string, string>>(a, {});
  if (!a) return "";
  if (!Object.keys(o).length) return a;
  return [o.line1, o.line2, [o.zip, o.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

const appUrl = (env: Env) => (env.APP_URL || "").replace(/\/$/, "");

/* ---------- Jetons de désinscription (signés, sans état) ---------- */
export async function unsubToken(env: Env, email: string, category: string, clubId: string): Promise<string> {
  const p = b64url(new TextEncoder().encode(JSON.stringify({ e: email.toLowerCase(), c: category, k: clubId })));
  const sig = b64url(await hmacSha256(env.SESSION_SECRET, "unsub:" + p)).slice(0, 32);
  return p + "." + sig;
}
export async function readUnsubToken(env: Env, t: string): Promise<{ e: string; c: string; k: string } | null> {
  const [p, sig] = String(t || "").split(".");
  if (!p || !sig) return null;
  const want = b64url(await hmacSha256(env.SESSION_SECRET, "unsub:" + p)).slice(0, 32);
  if (!safeEqual(want, sig)) return null;
  try { const o = JSON.parse(new TextDecoder().decode(b64urlDecode(p))); return o && o.e && o.c ? o : null; } catch { return null; }
}

export const CATEGORY_LABEL: Record<Category, string> = {
  essential: "E-mails essentiels (compte, factures, paiements)",
  bookings: "Confirmations de réservation",
  reminders: "Rappels de cours et de soins",
  waitlist: "Places libérées en liste d'attente",
  referrals: "Recommandations de Stabl envoyées par des cavaliers",
};

/**
 * Noms de champs envoyés par les autres lots (action_url, expires_in_*, lesson_title, coach_name…) ramenés aux
 * noms des modèles. Les deux écritures sont acceptées ; la valeur explicite du modèle l'emporte.
 */
const URL_FIELD: Record<string, string> = {
  verify_email: "verify_url", reset_password: "reset_url", magic_link: "login_url", invitation: "invitation_url", accountant_invite: "invitation_url",
  welcome_member: "activation_url", booking_confirmed: "manage_url", booking_cancelled: "book_url", waitlist_spot: "claim_url", lesson_reminder: "cancel_url",
  invoice_issued: "pay_url", payment_reminder: "pay_url", payment_failed: "retry_url", trial_ending: "plan_url", export_ready: "download_url",
  document_to_sign: "sign_url", horse_care_reminder: "horse_url", welcome_owner: "dashboard_url", migration_activate: "activate_url", migration_reminder: "activate_url",
};
export function withAliases(template: string, d: Record<string, unknown>): Record<string, any> {
  const o: Record<string, any> = { ...d };
  const set = (k: string, v: unknown) => { if ((o[k] == null || o[k] === "") && v != null && v !== "") o[k] = v; };
  const uf = URL_FIELD[template];
  if (uf) set(uf, o.action_url ?? o.invitation_url);
  set("expires_hours", o.expires_in_hours);
  set("expires_minutes", o.expires_in_minutes);
  set("expires_days", o.expires_in_days);
  set("title", o.lesson_title);
  set("time", o.start);
  set("coach", o.coach_name);
  set("arena", o.arena_name);
  set("horse", o.horse_name && template !== "horse_care_reminder" ? o.horse_name : undefined);
  if (template === "welcome_member" && o.minor && o.member_first) { o.child_first = o.member_first; if (o.first === o.member_first) o.first = ""; }
  return o;
}

export interface Rendered { subject: string; html: string; text: string; category: Category; sensitive: boolean; listUnsubscribe?: string }

/** Rend un modèle avec la charte du club (ou de la marque). Lève une erreur si le modèle est inconnu. */
export async function renderTemplate(env: Env, template: string, data: Record<string, unknown>, club: ClubInfo | null, to?: string): Promise<Rendered> {
  const def = TEMPLATES[template];
  if (!def) throw new Error("Modèle d'e-mail inconnu : " + template);
  const ctx: MailCtx = { club: club ? { id: club.id, name: club.name, email: club.email, phone: club.phone } : null, appUrl: appUrl(env) };
  const b = def.build(withAliases(template, data), ctx);
  let unsubscribeUrl: string | null = null;
  if (def.category !== "essential" && to) {
    unsubscribeUrl = `${appUrl(env)}/api/mail/unsubscribe?t=${encodeURIComponent(await unsubToken(env, to, def.category, club?.id || ""))}`;
  }
  // Pied de page : coordonnées du club ; la signature Stabl et les mentions légales sont ajoutées par la mise en page.
  const footer = club ? [club.name, addressLine(club.address), [club.email, club.phone].filter(Boolean).join(" · ")] : [];
  const frame: Frame = {
    subject: b.subject, preheader: b.preheader, blocks: b.blocks,
    headerName: club?.name || BRAND.name,
    isClub: !!club,
    logoUrl: club?.logo_key ? `${appUrl(env)}/api/mail/logo/${club.id}` : (club ? null : BRAND.logoUrl || null),
    footer, unsubscribeUrl,
    unsubscribeLabel: def.category === "referrals" ? "Ne plus recevoir de recommandations" : null,
    // Les recommandations arrivent à des écuries sans compte : pas de page de réglages à proposer.
    preferencesUrl: unsubscribeUrl && def.category !== "referrals" ? `${appUrl(env)}/reglages/notifications` : null,
    pixelUrl: typeof data.tracking_pixel === "string" ? data.tracking_pixel : null,
  };
  return {
    subject: b.subject.replace(/[\r\n]+/g, " ").replace(/[ \t]+([:;?!%€»])/g, " $1").slice(0, 250),
    html: renderHtml(frame), text: renderText(frame),
    category: def.category, sensitive: !!def.sensitive,
    listUnsubscribe: unsubscribeUrl || undefined,
  };
}
