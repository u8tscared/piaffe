import { Hono, type Context } from "hono";
import type { AppEnv } from "../env";
import { ApiError, bad, body, forbidden, unauthorized } from "../lib/http";
import { one, rateLimit, run } from "../lib/db";
import { nowIso } from "../lib/ids";
import { csrf } from "../auth/csrf";
import { slideSession, clientIp } from "../auth/session";
import { publicUser, getUser } from "../auth/users";
import { MAX_OPS, SINGLETON_COLLS, SINGLETON_ID } from "./collections";
import { applyBatch, bootstrapData, changesSince, type Principal } from "./store";
import { AD_PUBLIC_FIELDS, AD_PUBLISHED } from "./policy";
import { isEmail, notFound } from "../lib/http";
import { registerTriggers } from "./triggers";
import { features } from "../lib/features";

registerTriggers();

/* Lot A · données du club : bootstrap, lot d'écritures, flux de changements. */
const app = new Hono<AppEnv>();
app.use("/api/records/*", csrf);

/** Qui agit : un membre du club courant (selon son rôle) ou une clé d'API (scope read / write, droits de gérant). */
function principal(c: Context<AppEnv>, need: "read" | "write"): Principal {
  const k = c.get("apiKey"), club = c.get("club");
  if (k) {
    if (!club) throw unauthorized("Clé d'API invalide.");
    const ok = k.scopes.includes("*") || k.scopes.includes(need) || (need === "read" && k.scopes.includes("write"));
    if (!ok) throw forbidden(`Cette clé d'API n'a pas le droit « ${need} ».`);
    return { role: "manager", personRef: null, userId: null, actor: "key:" + k.id, clubId: club.id };
  }
  const u = c.get("user");
  if (!u) throw unauthorized();
  const m = c.get("membership");
  if (!club || !m) throw new ApiError(403, "no_club", "Choisissez d'abord un club.");
  return { role: m.role, personRef: m.person_ref, userId: u.id, actor: u.id, clubId: club.id };
}

app.get("/api/club/bootstrap", slideSession, async (c) => {
  const p = principal(c, "read");
  const club = await one<any>(c.env.DB, `SELECT id, name, slug, kind, legal_form, siren, siret, vat_number, vat_regime, address, email, phone, ffe_number,
    timezone, logo_key, plan, plan_status, trial_ends_at, settings, onboarding, created_at FROM clubs WHERE id = ?`, p.clubId);
  const parse = (s: string | null, d: unknown) => { try { return s ? JSON.parse(s) : d; } catch { return d; } };
  const clubOut = { ...club, address: parse(club.address, null), settings: parse(club.settings, {}), onboarding: parse(club.onboarding, {}) };
  if (p.role !== "owner" && p.role !== "manager") {
    // Les réglages internes (facturation, intégrations) restent au gérant ; on ne transmet que les modules actifs.
    delete clubOut.onboarding;
    clubOut.settings = clubOut.settings?.modules ? { modules: clubOut.settings.modules } : {};
  }
  const { data, versions } = await bootstrapData(c.env, p);
  if (!data.club) {
    // Fiche « club » de la démo synthétisée tant que le gérant ne l'a pas enregistrée.
    const a = clubOut.address || {};
    data.club = { name: club.name, short: club.name, city: a.city || "", address: [a.line1, a.zip, a.city].filter(Boolean).join(", "),
      siret: club.siret || "", ffe: club.ffe_number || "", boxes: 0, phone: club.phone || "", email: club.email || "", arenas: [], paddocks: [] };
  }
  const u = p.userId ? await getUser(c.env, p.userId) : null;
  return c.json({
    club: clubOut,
    me: { user: u ? publicUser(u) : null, role: p.role, person_ref: p.personRef, person_ids: (p.personRef || "").split(",").filter(Boolean) },
    data, versions, singletons: SINGLETON_COLLS, singleton_id: SINGLETON_ID, server_time: nowIso(), features: features(c.env),
  });
});

app.post("/api/records/batch", async (c) => {
  const p = principal(c, "write");
  const b = await body<any>(c);
  if (!Array.isArray(b.ops)) throw bad("invalid_field", "Le champ « ops » doit être une liste d'opérations.", { field: "ops" });
  if (!b.ops.length) return c.json({ results: [], server_time: nowIso() });
  if (b.ops.length > MAX_OPS) throw bad("too_many_ops", `Un lot compte ${MAX_OPS} opérations au plus. Découpez l'envoi.`, { max: MAX_OPS });
  const results = await applyBatch(c.env, c.executionCtx, p, b.ops, clientIp(c));
  return c.json({ results, server_time: nowIso() });
});

app.get("/api/records/changes", slideSession, async (c) => {
  const p = principal(c, "read");
  // since : date ISO, ou curseur « ISO|coll|id » renvoyé dans next_since quand more vaut true.
  const [since, ac, aid] = (c.req.query("since") || "").split("|");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(since || "")) throw bad("invalid_field", "Le paramètre « since » doit être une date ISO (ex. 2026-11-17T09:41:00.000Z).", { field: "since" });
  const lim = Math.min(Math.max(parseInt(c.req.query("limit") || "1000", 10) || 1000, 1), 2000);
  const serverTime = nowIso();
  const r = await changesSince(c.env, p, since, lim, ac && aid ? { coll: ac, id: aid } : undefined);
  return c.json({ changes: r.changes, more: r.more, next_since: r.more ? r.next : overlap(since), server_time: serverTime });
});

/** Recouvrement de 5 secondes : une écriture horodatée juste avant la lecture mais validée juste après n'est jamais perdue (le client dédoublonne par version). */
function overlap(since: string) {
  const t = new Date(Date.now() - 5000).toISOString();
  return t > since ? t : since;
}

/* Annonces de vente (module Terrain) : lecture publique d'une annonce publiée, demande d'essai sans compte.
   Anti-robot : champ piège « site » qui doit rester vide, délai minimal entre l'affichage et l'envoi, limite de débit
   par adresse IP et par annonce. Les coordonnées vont seulement au club (collection horseLeads, lue par le gérant). */
async function publishedAd(c: Context<AppEnv>) {
  const clubId = c.req.param("club") || "", adId = c.req.param("ad") || "";
  if (!/^[A-Za-z0-9_.:-]{1,64}$/.test(clubId) || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(adId)) throw notFound("Annonce introuvable.");
  const r = await one<{ data: string }>(c.env.DB, "SELECT data FROM records WHERE club_id = ? AND coll = 'horseAds' AND id = ? AND deleted = 0", clubId, adId);
  const ad = r ? (JSON.parse(r.data) as Record<string, any>) : null;
  if (!ad || !AD_PUBLISHED.has(String(ad.status || ""))) throw notFound("Cette annonce n'est plus en ligne.");
  return { clubId, adId, ad };
}
app.get("/api/public/horse-ads/:club/:ad", async (c) => {
  const { clubId, ad } = await publishedAd(c);
  const out: Record<string, unknown> = {};
  for (const k of AD_PUBLIC_FIELDS) if (ad[k] !== undefined) out[k] = ad[k];
  const h = ad.horse ? await one<{ data: string }>(c.env.DB, "SELECT data FROM records WHERE club_id = ? AND coll = 'horses' AND id = ? AND deleted = 0", clubId, String(ad.horse)) : null;
  const horse = h ? JSON.parse(h.data) : null;
  const club = await one<{ name: string }>(c.env.DB, "SELECT name FROM clubs WHERE id = ?", clubId);
  const pick = (o: any, ks: string[]) => (o ? Object.fromEntries(ks.filter((k) => o[k] !== undefined).map((k) => [k, o[k]])) : null);
  c.header("cache-control", "public, max-age=60");
  return c.json({ ad: out, horse: pick(horse, ["id", "name", "breed", "pony", "sex", "age", "born", "coat", "height", "level", "photo"]), club: { name: club?.name || "" } });
});
app.post("/api/public/horse-ads/:club/:ad/leads", async (c) => {
  const { clubId, adId } = await publishedAd(c);
  const b = await body<any>(c);
  // robot : champ piège rempli ou formulaire envoyé en moins de 3 secondes → réponse normale, rien d'enregistré
  const shown = Number(b.t);
  if ((typeof b.site === "string" && b.site.trim()) || !Number.isFinite(shown) || Date.now() - shown < 3000 || Date.now() - shown > 86400000)
    return c.json({ ok: true });
  const ip = clientIp(c);
  if (!(await rateLimit(c.env.DB, "lead:ip:" + ip, 5, 3600)) || !(await rateLimit(c.env.DB, "lead:ad:" + clubId + ":" + adId, 40, 86400)))
    throw new ApiError(429, "rate_limited", "Trop de demandes envoyées. Réessayez dans une heure ou appelez l'écurie.");
  const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const name = s(b.name, 120), email = s(b.email, 200).toLowerCase(), phone = s(b.phone, 40);
  if (name.length < 2) throw bad("invalid_field", "Indiquez votre nom.", { field: "name" });
  if (!email && phone.replace(/\D/g, "").length < 8) throw bad("invalid_field", "Indiquez un e-mail ou un téléphone pour que l'écurie puisse vous répondre.", { field: "email" });
  if (email && !isEmail(email)) throw bad("invalid_field", "Cette adresse e-mail n'est pas valide.", { field: "email" });
  const id = "ld_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const data = { ad: adId, name, email, phone, level: s(b.level, 40), budget: null, msg: s(b.msg, 2000), at: nowIso().slice(0, 16), status: "nouvelle", via: "public" };
  const p: Principal = { role: "manager", personRef: null, userId: null, actor: "public:annonce", clubId };
  const [r] = await applyBatch(c.env, c.executionCtx, p, [{ op: "upsert", coll: "horseLeads", id, data }], ip);
  if (!r?.ok) throw new ApiError(503, "unavailable", "La demande n'a pas pu être enregistrée. Réessayez dans un instant.");
  return c.json({ ok: true });
});

export default app;

/** Purge des objets supprimés depuis plus de 90 jours (les appareils hors ligne plus longtemps refont un bootstrap). */
export async function cron(env: AppEnv["Bindings"], cronExpr: string): Promise<void> {
  if (cronExpr !== "0 6 * * *") return;
  await run(env.DB, "DELETE FROM records WHERE deleted = 1 AND updated_at < ?", new Date(Date.now() - 90 * 864e5).toISOString());
  await run(env.DB, "DELETE FROM record_ops WHERE at < ?", new Date(Date.now() - 60 * 864e5).toISOString());
}
