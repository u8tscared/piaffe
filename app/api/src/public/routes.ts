/*
 * Pages publiques d'un club, sans compte (mobile d'abord) :
 *   GET  /c/:club/offrir            achat d'une carte cadeau (Stripe Connect du club si actif, sinon demande au gérant)
 *   GET  /c/:club/cheval/:ad         annonce d'un cheval à vendre (lit GET /api/public/horse-ads/:club/:ad)
 *   GET  /c/:club/avis?t=            note 1 à 5 : 4–5 → lien Google du club, 1–3 → message privé au club
 *   GET  /s/:token                   réponse à un sondage par lien signé (par famille, ou lien commun)
 * API publique (anti-robot : champ piège, délai d'affichage, limites par IP) :
 *   POST /api/public/gifts/:club     {product|-1, amount, buyer, email, to?, phone?, msg?, site, t} → {url} (paiement) ou {ok, mode:"request"}
 *   POST /api/public/reviews/:club   {rating, text?, t?, shown, site} → {ok, google_url?, ack?}
 *   POST /api/public/reviews/:club/google {ack}  l'avis a été publié sur Google (bouton cliqué)
 *   POST /api/public/surveys/:token  {global, coach?, again?, text?, site, shown}
 *   GET  /api/public/horse-ads/:club/:ad/photo   photo de profil du cheval d'une annonce en ligne
 *   POST /api/public/recommander     un cavalier recommande Stabl à son écurie (./recommander.ts)
 * Pour le gérant (session) :
 *   GET  /api/growth/links[?member=]                liens à partager (offrir, avis, sondages, annonces)
 *   POST /api/growth/gift-requests/:id/issue        demande réglée au club : crée la carte et l'envoie à l'acheteur
 * :club = identifiant court du club (slug) ou son id. Les écritures passent par applyBatch (versions, synchro des appareils).
 */
import { Hono, type Context } from "hono";
import type { AppEnv, Env } from "../env";
import { all, one, rateLimit } from "../lib/db";
import { ApiError, bad, body, isEmail, notFound } from "../lib/http";
import { nowIso } from "../lib/ids";
import { randomToken } from "../lib/crypto";
import { clientIp } from "../auth/session";
import { requireRole } from "../lib/auth";
import { applyBatch, type Principal } from "../records/store";
import { AD_PUBLISHED } from "../records/policy";
import { sendMail } from "../mail/send";
import { appUrl, ownerEmails } from "../billing/common";
import { stripe, stripeConfigured } from "../billing/stripe";
import { connectRow, feeFor } from "../billing/connect";
import { signLink, readLink } from "./tokens";
import recommander from "./recommander";
import { adPage, csp, giftPage, messagePage, reviewPage, surveyPage, eur, type PubClub } from "./pages";

const app = new Hono<AppEnv>();
app.route("/", recommander);
type Ctx = { waitUntil(p: Promise<unknown>): void } | null;

export const GIFT_DEFAULTS: [string, number][] = [["Baptême à poney", 12], ["Balade d’une heure", 35], ["Carte 10 séances", 290], ["Stage de Noël", 240]];
const KEY = /^[A-Za-z0-9_-]{1,80}$/;
const today = () => nowIso().slice(0, 10);
const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/* ---------- outils ---------- */
export async function findClub(db: D1Database, key: string): Promise<PubClub | null> {
  if (!KEY.test(key || "")) return null;
  const r = await one<{ id: string; name: string; slug: string; address: string | null; phone: string | null; email: string | null }>(db,
    "SELECT id, name, slug, address, phone, email FROM clubs WHERE slug = ? OR id = ? LIMIT 1", key, key);
  if (!r) return null;
  let city: string | null = null;
  try { city = JSON.parse(r.address || "{}").city || null; } catch { /* adresse libre */ }
  return { id: r.id, name: r.name, slug: r.slug, city, phone: r.phone, email: r.email };
}
async function record(db: D1Database, clubId: string, coll: string, id: string): Promise<Record<string, any> | null> {
  const r = await one<{ data: string }>(db, "SELECT data FROM records WHERE club_id = ? AND coll = ? AND id = ? AND deleted = 0", clubId, coll, id);
  try { return r ? JSON.parse(r.data) : null; } catch { return null; }
}
const growthCfg = (db: D1Database, clubId: string, id: string) => record(db, clubId, "growthCfg", id);
function actor(clubId: string, what: string): Principal { return { role: "manager", personRef: null, userId: null, actor: "public:" + what, clubId }; }
async function save(env: Env, ctx: Ctx, clubId: string, what: string, coll: string, id: string, data: Record<string, unknown>, ip?: string) {
  const [r] = await applyBatch(env, ctx, actor(clubId, what), [{ op: "upsert", coll, id, data }], ip);
  if (!r?.ok) throw new ApiError(503, "unavailable", "Votre envoi n'a pas pu être enregistré. Réessayez dans un instant.");
}
function html(c: Context<AppEnv>, page: string, nonce: string, status: 200 | 404 = 200) {
  return c.html(page, status, { "Content-Security-Policy": csp(nonce), "Cache-Control": "no-store", "X-Frame-Options": "DENY", "Referrer-Policy": "strict-origin-when-cross-origin" });
}
const notFoundPage = (c: Context<AppEnv>, nonce: string, title = "Page introuvable", text = "Ce lien n'existe pas ou n'est plus valable. Demandez un nouveau lien au club.") => html(c, messagePage(nonce, title, text), nonce, 404);
/** robot : champ piège rempli ou formulaire envoyé trop vite (ou trop tard) */
function isBot(b: Record<string, unknown>, field: "t" | "shown", minMs: number) {
  const shown = Number(b[field]);
  return (typeof b.site === "string" && b.site.trim() !== "") || !Number.isFinite(shown) || Date.now() - shown < minMs || Date.now() - shown > 86400000;
}
async function limit(db: D1Database, key: string, max: number, sec: number, msg: string) {
  if (!(await rateLimit(db, key, max, sec))) throw new ApiError(429, "rate_limited", msg);
}
/** prévient les gérants du club par e-mail (jamais bloquant) */
async function notifyManagers(env: Env, clubId: string, data: Record<string, unknown>) {
  try {
    for (const m of await ownerEmails(env.DB, clubId, ["owner", "manager"]))
      await sendMail(env, { to: m.email, template: "club_notice", club_id: clubId, data: { first: m.first || "", ...data } });
  } catch (e) { console.warn("notifyManagers", e); }
}
const link = (env: Env, path: string) => appUrl(env, path);

/* =====================================================================
   Cartes cadeaux
   ===================================================================== */
async function giftSettings(env: Env, club: PubClub) {
  const cfg = (await growthCfg(env.DB, club.id, "cadeaux")) || {};
  const products: [string, number][] = (Array.isArray(cfg.products) ? cfg.products : GIFT_DEFAULTS)
    .filter((p: unknown) => Array.isArray(p) && typeof p[0] === "string" && Number(p[1]) > 0).slice(0, 8).map((p: any[]) => [String(p[0]).slice(0, 60), Math.round(Number(p[1]) * 100) / 100]);
  const validity = Math.max(1, Math.min(36, Number(cfg.validity) || 12));
  let online = false;
  if (stripeConfigured(env)) { const a = await connectRow(env.DB, club.id); online = !!(a && a.charges_enabled); }
  return { products, validity, online };
}
app.get("/c/:club/offrir", async (c) => {
  const nonce = randomToken(12);
  const club = await findClub(c.env.DB, c.req.param("club"));
  if (!club) return notFoundPage(c, nonce);
  const g = await giftSettings(c.env, club);
  return html(c, giftPage({ club, ...g, thanks: c.req.query("merci") === "1", nonce }), nonce);
});
app.post("/api/public/gifts/:club", async (c) => {
  const club = await findClub(c.env.DB, c.req.param("club"));
  if (!club) throw notFound("Club introuvable.");
  const b = await body<Record<string, unknown>>(c);
  if (isBot(b, "t", 2500)) return c.json({ ok: true, mode: "request" });
  const ip = clientIp(c);
  await limit(c.env.DB, "gift:ip:" + ip, 6, 3600, "Trop de demandes envoyées. Réessayez dans une heure ou appelez le club.");
  await limit(c.env.DB, "gift:club:" + club.id, 80, 86400, "Trop de demandes aujourd'hui. Réessayez demain ou appelez le club.");
  const g = await giftSettings(c.env, club);
  const pi = Number(b.product);
  let amount: number, label: string;
  if (Number.isInteger(pi) && pi >= 0 && pi < g.products.length) { [label, amount] = g.products[pi]; }
  else {
    amount = Math.round(Number(b.amount));
    if (!(amount >= 10 && amount <= 1000)) throw bad("invalid_field", "Choisissez un montant entre 10 et 1\u202f000\u202f€.", { field: "amount" });
    label = "Carte cadeau";
  }
  const buyer = s(b.buyer, 120), email = s(b.email, 200).toLowerCase(), to = s(b.to, 80), phone = s(b.phone, 40), msg = s(b.msg, 140);
  if (buyer.length < 2) throw bad("invalid_field", "Indiquez votre nom.", { field: "buyer" });
  if (!isEmail(email)) throw bad("invalid_field", "Indiquez une adresse e-mail valide : la carte y sera envoyée.", { field: "email" });
  const id = "gr_" + randomToken(9).replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
  const data: Record<string, unknown> = { id, amount, label, buyer, email, phone, to, msg, at: nowIso(), status: g.online ? "paiement" : "demande", online: g.online };
  if (g.online) {
    const acct = (await connectRow(c.env.DB, club.id))!;
    const cents = Math.round(amount * 100), fee = feeFor(cents);
    const meta = { piaffe_club_id: club.id, piaffe_gift_id: id };
    const session = await stripe(c.env, "POST", "/v1/checkout/sessions", {
      mode: "payment", locale: "fr", customer_email: email, payment_method_types: ["card"], client_reference_id: id,
      line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: cents, product_data: { name: `Carte cadeau ${club.name}`, description: label + (to ? " · pour " + to : "") } } }],
      payment_intent_data: { metadata: meta, description: `Carte cadeau ${club.name}`, application_fee_amount: fee > 0 ? fee : undefined },
      metadata: meta,
      success_url: link(c.env, `/c/${club.slug}/offrir?merci=1`), cancel_url: link(c.env, `/c/${club.slug}/offrir`),
    }, { account: acct.stripe_account_id, idempotencyKey: "piaffe_gift_" + id });
    data.session = session.id;
    await save(c.env, c.executionCtx, club.id, "cadeau", "giftRequests", id, data, ip);
    return c.json({ ok: true, mode: "checkout", url: session.url });
  }
  await save(c.env, c.executionCtx, club.id, "cadeau", "giftRequests", id, data, ip);
  await notifyManagers(c.env, club.id, {
    title: "Nouvelle demande de carte cadeau",
    intro: `${buyer} souhaite offrir « ${label} » (${eur(amount)})${to ? " à " + to : ""}. Le paiement en ligne n'est pas encore activé : contactez-le pour le règlement.`,
    rows: [["E-mail", email], ["Téléphone", phone], ["Message sur la carte", msg]].filter((r) => r[1]),
    note: "Une fois le règlement reçu, ouvrez Croissance › Cadeaux et cliquez sur « Réglée : envoyer la carte » : le code part tout seul par e-mail. Pour encaisser en ligne la prochaine fois, activez les paiements dans Plateforme › Paiements en ligne.",
    action_label: "Ouvrir les cadeaux", action_url: link(c.env, "/#cadeaux"),
  });
  return c.json({ ok: true, mode: "request" });
});

function giftCode(slug: string) {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = crypto.getRandomValues(new Uint8Array(6));
  const pre = slug.replace(/^(les|le|la)-/, "").replace(/[^a-z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
  return pre + "-" + Array.from(r.slice(0, 4), (x) => A[x % A.length]).join("") + "-" + String(10 + (r[4] % 90));
}
/** Crée la carte (collection giftcards, celle de l'écran Cadeaux), marque la demande réglée et envoie le code. Idempotent. */
export async function issueGift(env: Env, ctx: Ctx, clubId: string, reqId: string, how: "en ligne" | "au club") {
  const r = await record(env.DB, clubId, "giftRequests", reqId);
  if (!r) throw notFound("Demande introuvable.");
  if (r.status === "payée" && r.card) return { card: r.card, code: r.code, already: true };
  const club = await one<{ slug: string; name: string }>(env.DB, "SELECT slug, name FROM clubs WHERE id = ?", clubId);
  const cfg = (await growthCfg(env.DB, clubId, "cadeaux")) || {};
  const months = Math.max(1, Math.min(36, Number(cfg.validity) || 12));
  const until = new Date(); until.setMonth(until.getMonth() + months);
  const code = giftCode(club?.slug || "club"), card = "gc_" + reqId.slice(3);
  const gc = { id: card, code, amount: r.amount, rest: r.amount, buyer: r.buyer, email: r.email, to: r.to || "À attribuer", date: today(), msg: r.msg || "", label: r.label || "Carte cadeau", online: how === "en ligne", until: until.toISOString().slice(0, 10), request: reqId };
  const res = await applyBatch(env, ctx, actor(clubId, "cadeau"), [
    { op: "upsert", coll: "giftcards", id: card, data: gc },
    { op: "upsert", coll: "giftRequests", id: reqId, data: { ...r, status: "payée", paid_at: nowIso(), paid_by: how, code, card } },
  ]);
  if (!res.every((x) => x && x.ok)) throw new ApiError(503, "unavailable", "La carte n'a pas pu être créée. Réessayez dans un instant.");
  await sendMail(env, { to: r.email, template: "gift_card", club_id: clubId,
    data: { first: String(r.buyer || "").split(" ")[0], code, amount: r.amount, label: r.label, to: r.to, message: r.msg, valid_until: gc.until } });
  return { card, code, already: false };
}
/** Stripe Connect : session de paiement d'une carte cadeau terminée (appelé par billing/connect.ts). */
export async function giftPaid(env: Env, ctx: Ctx, clubId: string, session: any): Promise<"ok" | "ignored"> {
  const id = session?.metadata?.piaffe_gift_id;
  if (typeof id !== "string" || !/^gr_[A-Za-z0-9]{4,20}$/.test(id) || session.payment_status !== "paid") return "ignored";
  const r = await record(env.DB, clubId, "giftRequests", id);
  if (!r) return "ignored";
  await issueGift(env, ctx, clubId, id, "en ligne");
  return "ok";
}
app.post("/api/growth/gift-requests/:id/issue", requireRole("manager"), async (c) => {
  const out = await issueGift(c.env, c.executionCtx, c.get("club")!.id, c.req.param("id"), "au club");
  return c.json({ ok: true, ...out });
});

/* =====================================================================
   Avis
   ===================================================================== */
app.get("/c/:club/avis", async (c) => {
  const nonce = randomToken(12);
  const club = await findClub(c.env.DB, c.req.param("club"));
  if (!club) return notFoundPage(c, nonce);
  const tok = c.req.query("t") || "";
  let first: string | undefined;
  const d = tok ? await readLink(c.env, tok, "av") : null;
  if (d && d.c === club.id && d.m) first = String((await record(c.env.DB, club.id, "members", d.m))?.first || "") || undefined;
  return html(c, reviewPage({ club, token: d && d.c === club.id ? tok : "", first, nonce }), nonce);
});
app.post("/api/public/reviews/:club", async (c) => {
  const club = await findClub(c.env.DB, c.req.param("club"));
  if (!club) throw notFound("Club introuvable.");
  const b = await body<Record<string, unknown>>(c);
  const rating = Math.round(Number(b.rating));
  if (!(rating >= 1 && rating <= 5)) throw bad("invalid_field", "Choisissez une note de 1 à 5 étoiles.", { field: "rating" });
  if (isBot(b, "shown", 1200)) return c.json({ ok: true });
  const ip = clientIp(c);
  await limit(c.env.DB, "review:ip:" + ip, 8, 3600, "Vous avez déjà envoyé plusieurs avis. Réessayez dans une heure.");
  await limit(c.env.DB, "review:club:" + club.id, 200, 86400, "Trop d'avis aujourd'hui. Réessayez demain.");
  const d = typeof b.t === "string" && b.t ? await readLink(c.env, b.t, "av") : null;
  const member = d && d.c === club.id && d.m ? d.m : null;
  const text = s(b.text, 2000);
  const id = "rv_" + randomToken(9).replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
  await save(c.env, c.executionCtx, club.id, "avis", "gReviews", id,
    { id, member, moment: d?.s ? s(d.s, 60) : "Lien d’avis", date: today(), rating, text, google: false, status: rating <= 3 ? "a_traiter" : "ok", reply: "", via: "lien" }, ip);
  if (rating <= 3) {
    const who = member ? (await record(c.env.DB, club.id, "members", member)) : null;
    await notifyManagers(c.env, club.id, {
      title: `Un avis à lire : ${rating} étoile${rating > 1 ? "s" : ""} sur 5`,
      intro: `${who ? (who.first + " " + (who.last || "")).trim() : "Une famille"} a laissé une note de ${rating} sur 5. Ce message est privé : il n'est pas publié sur Google.`,
      rows: text ? [["Message", text]] : [], note: "Un appel dans la journée change souvent tout.",
      action_label: "Ouvrir les avis", action_url: link(c.env, "/#avis"),
    });
    return c.json({ ok: true });
  }
  const cfg = (await growthCfg(c.env.DB, club.id, "avis")) || {};
  const url = typeof cfg.url === "string" && /^https:\/\/[^\s"<>]+$/.test(cfg.url.trim()) ? cfg.url.trim() : null;
  return c.json({ ok: true, google_url: url, ack: url ? await signLink(c.env, { k: "av", c: club.id, s: "ack:" + id }) : undefined });
});
app.post("/api/public/reviews/:club/google", async (c) => {
  const club = await findClub(c.env.DB, c.req.param("club"));
  if (!club) throw notFound("Club introuvable.");
  const b = await body<Record<string, unknown>>(c);
  const d = typeof b.ack === "string" ? await readLink(c.env, b.ack, "av") : null;
  if (!d || d.c !== club.id || !d.s?.startsWith("ack:")) throw bad("invalid_field", "Lien invalide.");
  const id = d.s.slice(4), r = await record(c.env.DB, club.id, "gReviews", id);
  if (r && !r.google) await save(c.env, c.executionCtx, club.id, "avis", "gReviews", id, { ...r, google: true });
  return c.json({ ok: true });
});

/* =====================================================================
   Sondages
   ===================================================================== */
async function surveyFrom(env: Env, tok: string) {
  const d = await readLink(env, tok, "sv");
  if (!d || !d.s) return null;
  const club = await findClub(env.DB, d.c);
  if (!club) return null;
  const sv = await record(env.DB, club.id, "surveys", d.s);
  if (!sv) return null;
  return { d, club, sv };
}
const answered = (sv: Record<string, any>, m?: string) => !!m && (Array.isArray(sv.answers) ? sv.answers : []).some((a: any) => a && a.member === m && !a.pending);
app.get("/s/:token", async (c) => {
  const nonce = randomToken(12);
  const x = await surveyFrom(c.env, c.req.param("token"));
  if (!x) return notFoundPage(c, nonce, "Sondage introuvable", "Ce lien n'est plus valable. Demandez un nouveau lien au club.");
  const m = x.d.m ? await record(c.env.DB, x.club.id, "members", x.d.m) : null;
  return html(c, surveyPage({ club: x.club, title: String(x.sv.title || "Votre avis compte"), coach: !!x.sv.coach, first: m?.first, token: c.req.param("token"), nonce, already: answered(x.sv, x.d.m) }), nonce);
});
app.post("/api/public/surveys/:token", async (c) => {
  const x = await surveyFrom(c.env, c.req.param("token"));
  if (!x) throw notFound("Ce sondage n'est plus disponible.");
  const b = await body<Record<string, unknown>>(c);
  const g = (v: unknown) => { const n = Math.round(Number(v)); return n >= 1 && n <= 5 ? n : undefined; };
  const global = g(b.global);
  if (!global) throw bad("invalid_field", "Donnez une note à la première question.", { field: "global" });
  if (isBot(b, "shown", 1500)) return c.json({ ok: true });
  const ip = clientIp(c), m = x.d.m || null;
  await limit(c.env.DB, "survey:ip:" + ip, 20, 3600, "Trop de réponses envoyées. Réessayez dans une heure.");
  if (!m) await limit(c.env.DB, "survey:ip:" + ip + ":" + x.sv.id, 3, 86400, "Vous avez déjà répondu à ce sondage. Merci !");
  if (answered(x.sv, m || undefined)) throw new ApiError(409, "already_answered", "Votre réponse à ce sondage est déjà enregistrée. Merci !");
  const a = { member: m, global, coach: g(b.coach), again: b.again === true ? true : b.again === false ? false : null, text: s(b.text, 2000), at: nowIso(), via: "lien", done: false };
  const before: any[] = Array.isArray(x.sv.answers) ? x.sv.answers : [];
  const i = m ? before.findIndex((y) => y && y.member === m && y.pending) : -1;
  const answers = i >= 0 ? before.map((y, k) => (k === i ? a : y)) : before.concat([a]);
  await save(c.env, c.executionCtx, x.club.id, "sondage", "surveys", x.sv.id, { ...x.sv, answers }, ip);
  if (global <= 2) await notifyManagers(c.env, x.club.id, {
    title: "Une famille déçue à rappeler", intro: `Une réponse au sondage « ${x.sv.title || "satisfaction"} » donne ${global} sur 5.`,
    rows: a.text ? [["Commentaire", a.text]] : [], action_label: "Ouvrir la satisfaction", action_url: link(c.env, "/#sondages"),
  });
  return c.json({ ok: true });
});

/* =====================================================================
   Annonces : page publique et photo
   ===================================================================== */
app.get("/c/:club/cheval/:ad", async (c) => {
  const nonce = randomToken(12);
  const club = await findClub(c.env.DB, c.req.param("club"));
  const adId = c.req.param("ad");
  if (!club || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(adId)) return notFoundPage(c, nonce);
  return html(c, adPage({ club, adId, nonce }), nonce);
});
app.get("/api/public/horse-ads/:club/:ad/photo", async (c) => {
  const club = await findClub(c.env.DB, c.req.param("club"));
  if (!club) throw notFound("Photo introuvable.");
  const ad = await record(c.env.DB, club.id, "horseAds", c.req.param("ad"));
  if (!ad || !AD_PUBLISHED.has(String(ad.status || "")) || !ad.horse) throw notFound("Photo introuvable.");
  const h = await record(c.env.DB, club.id, "horses", String(ad.horse));
  const mid = h && typeof h.photo === "string" ? h.photo : "";
  const row = mid ? await one<{ r2_key: string; thumb_key: string | null; mime: string }>(c.env.DB,
    "SELECT r2_key, thumb_key, mime FROM media WHERE club_id = ? AND id = ? AND horse_id = ? AND deleted_at IS NULL", club.id, mid, String(ad.horse)) : null;
  if (!row) throw notFound("Photo introuvable.");
  const obj = await c.env.FILES.get(row.r2_key);
  if (!obj) throw notFound("Photo introuvable.");
  return new Response(obj.body, { headers: { "content-type": row.mime, "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff" } });
});

/* =====================================================================
   Liens à partager (gérant)
   ===================================================================== */
app.get("/api/growth/links", requireRole("manager"), async (c) => {
  const club = (await findClub(c.env.DB, c.get("club")!.id))!;
  const base = `/c/${club.slug}`;
  const member = c.req.query("member") || "";
  const surveys = await all<{ id: string; data: string }>(c.env.DB, "SELECT id, data FROM records WHERE club_id = ? AND coll = 'surveys' AND deleted = 0 ORDER BY updated_at DESC LIMIT 50", club.id);
  const ads = await all<{ id: string; data: string }>(c.env.DB, "SELECT id, data FROM records WHERE club_id = ? AND coll = 'horseAds' AND deleted = 0 LIMIT 50", club.id);
  const out: Record<string, unknown> = {
    offrir: link(c.env, base + "/offrir"),
    avis: link(c.env, base + "/avis"),
    surveys: await Promise.all(surveys.map(async (r) => {
      let t = ""; try { t = JSON.parse(r.data).title || ""; } catch { /* objet abîmé */ }
      return { id: r.id, title: t, url: link(c.env, "/s/" + (await signLink(c.env, { k: "sv", c: club.id, s: r.id }))) };
    })),
    ads: ads.map((r) => { let st = ""; try { st = JSON.parse(r.data).status || ""; } catch { /* */ } return { id: r.id, status: st, url: link(c.env, base + "/cheval/" + r.id) }; }),
  };
  if (member && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(member)) {
    out.avis_member = link(c.env, base + "/avis?t=" + (await signLink(c.env, { k: "av", c: club.id, m: member })));
    const sv = c.req.query("survey");
    if (sv && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(sv)) out.survey_member = link(c.env, "/s/" + (await signLink(c.env, { k: "sv", c: club.id, s: sv, m: member })));
  }
  return c.json(out);
});

export default app;
