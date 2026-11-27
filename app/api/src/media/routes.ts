/*
 * Photos des chevaux (profil, soins, marques), fichiers dans R2.
 *   POST   /api/media                 multipart : id (med_…, créé par l'appareil), horse, file, thumb?, kind?, zone?, care?, note?, taken_at?, w?, h?
 *                                     idempotent : le même id renvoie la photo déjà enregistrée (envoi rejoué après une coupure)
 *   GET    /api/media?horse=h01       photos d'un cheval, les plus récentes d'abord (filtre kind= possible)
 *   GET    /api/media/:id/file        le fichier (v=thumb pour la vignette), servi par le Worker après contrôle d'accès
 *   PATCH  /api/media/:id             {note?, zone?, kind?}
 *   DELETE /api/media/:id             retire la photo (gérant, ou son auteur)
 * Accès : gérant et employé pour tous les chevaux du club, coach en lecture, adhérent pour ses chevaux
 * (propriétaire ou demi-pension, même règle que records), comptable jamais. Session uniquement (pas de clé d'API).
 */
import { Hono, type Context, type MiddlewareHandler } from "hono";
import type { AppEnv, Env, Role } from "../env";
import { csrf } from "../auth/csrf";
import { all, audit, one, rateLimit, run } from "../lib/db";
import { ApiError, bad, forbidden, notFound, unauthorized } from "../lib/http";
import { loadCtx } from "../records/store";

export const MAX_FILE = 1_500_000;      // l'appareil compresse à 400 Ko environ ; marge pour les anciens navigateurs
export const MAX_THUMB = 200_000;
export const MAX_PER_HORSE = 300;
export const MAX_PER_CLUB = 20_000;
const KINDS = new Set(["profil", "soin", "marques", "document"]);
const MEDIA_ID = /^med_[A-Za-z0-9_-]{6,48}$/;
const REF_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/;
/** Statuts HTTP propres aux fichiers (413 trop lourd, 415 type refusé, 410 supprimée). */
const fail = (status: number, code: string, msg: string) => new ApiError(status as ConstructorParameters<typeof ApiError>[0], code, msg);

const app = new Hono<AppEnv>();
app.use("/api/media", csrf);
app.use("/api/media/*", csrf);

interface Who { role: Role; userId: string; name: string; personRef: string | null; clubId: string }
const session: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (c.get("apiKey")) throw forbidden("Les photos se gèrent depuis l'application, pas avec une clé d'API.");
  const u = c.get("user");
  if (!u) throw unauthorized();
  const m = c.get("membership"), club = c.get("club");
  if (!club || !m) throw new ApiError(403, "no_club", "Choisissez d'abord un club.");
  if (m.role === "accountant") throw forbidden("Les photos des chevaux ne sont pas accessibles au comptable.");
  return next();
};
app.use("/api/media", session);
app.use("/api/media/*", session);

function who(c: Context<AppEnv>): Who {
  const u = c.get("user")!, m = c.get("membership")!, club = c.get("club")!;
  const name = [u.first, u.last].filter(Boolean).join(" ").trim() || u.email.split("@")[0];
  return { role: m.role, userId: u.id, name, personRef: m.person_ref, clubId: club.id };
}
const isTeam = (r: Role) => r === "owner" || r === "manager" || r === "staff";
const isManager = (r: Role) => r === "owner" || r === "manager";

/** Vérifie que le cheval existe dans ce club et que la personne y a accès (write : peut ajouter une photo). */
async function checkHorse(env: Env, w: Who, horse: string, write: boolean) {
  if (!REF_ID.test(horse)) throw bad("invalid_horse", "Cheval inconnu.");
  const rec = await one<{ id: string }>(env.DB, "SELECT id FROM records WHERE club_id = ? AND coll = 'horses' AND id = ? AND deleted = 0", w.clubId, horse);
  if (!rec) throw notFound("Ce cheval n'existe pas dans votre club.");
  if (isTeam(w.role)) return;
  if (w.role === "coach") { if (write) throw forbidden("Seuls l'équipe du club et le propriétaire ajoutent des photos."); return; }
  if (w.role === "member") {
    const ctx = await loadCtx(env, { role: w.role, personRef: w.personRef, userId: w.userId, actor: w.userId, clubId: w.clubId });
    if (ctx.horses.has(horse)) return;
  }
  throw forbidden("Vous n'avez pas accès aux photos de ce cheval.");
}

/** Type réel du fichier, lu dans ses premiers octets (on ne croit pas le type annoncé). */
export function sniff(b: Uint8Array): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
}
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

interface MediaRow {
  id: string; horse_id: string; kind: string; zone: string | null; care_id: string | null; note: string | null; mime: string; bytes: number;
  width: number | null; height: number | null; r2_key: string; thumb_key: string | null; thumb_mime: string | null;
  author_id: string | null; author_name: string | null; taken_at: string | null; created_at: string;
}
function out(r: MediaRow) {
  const base = "/api/media/" + encodeURIComponent(r.id) + "/file";
  return {
    id: r.id, horse: r.horse_id, kind: r.kind, zone: r.zone, care: r.care_id, note: r.note, w: r.width, h: r.height, bytes: r.bytes,
    author: { id: r.author_id, name: r.author_name }, taken_at: r.taken_at, created_at: r.created_at,
    url: base, thumb: r.thumb_key ? base + "?v=thumb" : base,
  };
}
const COLS = "id, horse_id, kind, zone, care_id, note, mime, bytes, width, height, r2_key, thumb_key, thumb_mime, author_id, author_name, taken_at, created_at";
async function getRow(env: Env, clubId: string, id: string) {
  return one<MediaRow>(env.DB, `SELECT ${COLS} FROM media WHERE club_id = ? AND id = ? AND deleted_at IS NULL`, clubId, id);
}
function optStr(v: unknown, max: number): string | null {
  if (v == null || typeof v !== "string") return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
}
const int = (v: unknown) => { const n = typeof v === "string" ? parseInt(v, 10) : NaN; return Number.isFinite(n) && n > 0 && n < 20000 ? n : null; };

app.post("/api/media", async (c) => {
  const w = who(c);
  const len = +(c.req.header("content-length") || 0);
  if (len > MAX_FILE + MAX_THUMB + 64_000) throw fail(413, "too_large", "Photo trop lourde : 1,5 Mo au plus.");
  let form: FormData;
  try { form = await c.req.formData(); } catch { throw bad("invalid_form", "Envoyez la photo dans un formulaire (multipart)."); }
  const id = optStr(form.get("id"), 64) || "";
  if (!MEDIA_ID.test(id)) throw bad("invalid_id", "Identifiant de photo invalide.");
  const horse = optStr(form.get("horse"), 64) || "";
  await checkHorse(c.env, w, horse, true);

  /* envoi rejoué (file hors ligne) : on renvoie la photo déjà enregistrée, sans doublon */
  const prev = await one<MediaRow & { deleted_at: string | null }>(c.env.DB, `SELECT ${COLS}, deleted_at FROM media WHERE club_id = ? AND id = ?`, w.clubId, id);
  if (prev) {
    if (prev.horse_id !== horse) throw new ApiError(409, "id_taken", "Cet identifiant de photo est déjà utilisé.");
    if (prev.deleted_at) throw fail(410, "deleted", "Cette photo a été supprimée.");
    return c.json({ media: out(prev), replay: true }, 200);
  }

  if (!(await rateLimit(c.env.DB, "media:" + w.userId, 120, 3600))) throw new ApiError(429, "rate_limited", "Beaucoup de photos en peu de temps : réessayez dans quelques minutes.");

  const file = form.get("file");
  if (!file || typeof file === "string") throw bad("missing_file", "Aucune photo reçue.");
  if (file.size > MAX_FILE) throw fail(413, "too_large", "Photo trop lourde : 1,5 Mo au plus.");
  if (file.size < 100) throw bad("invalid_file", "Ce fichier n'est pas une photo lisible.");
  const buf = new Uint8Array(await file.arrayBuffer());
  const mime = sniff(buf);
  if (!mime) throw fail(415, "unsupported_type", "Format non pris en charge : envoyez une photo JPEG, PNG ou WebP.");

  let tbuf: Uint8Array | null = null, tmime: string | null = null;
  const thumb = form.get("thumb");
  if (thumb && typeof thumb !== "string" && thumb.size > 0) {
    if (thumb.size > MAX_THUMB) throw fail(413, "too_large", "Vignette trop lourde.");
    tbuf = new Uint8Array(await thumb.arrayBuffer());
    tmime = sniff(tbuf);
    if (!tmime) throw fail(415, "unsupported_type", "Vignette dans un format non pris en charge.");
  }

  const nHorse = await one<{ n: number }>(c.env.DB, "SELECT COUNT(*) AS n FROM media WHERE club_id = ? AND horse_id = ? AND deleted_at IS NULL", w.clubId, horse);
  if ((nHorse?.n || 0) >= MAX_PER_HORSE) throw new ApiError(422, "quota", "Ce cheval a déjà " + MAX_PER_HORSE + " photos : supprimez-en quelques-unes d'abord.");
  const nClub = await one<{ n: number }>(c.env.DB, "SELECT COUNT(*) AS n FROM media WHERE club_id = ? AND deleted_at IS NULL", w.clubId);
  if ((nClub?.n || 0) >= MAX_PER_CLUB) throw new ApiError(422, "quota", "Votre club a atteint la limite de photos. Écrivez-nous pour l'augmenter.");

  const kind = optStr(form.get("kind"), 16) || "profil";
  if (!KINDS.has(kind)) throw bad("invalid_kind", "Type de photo inconnu.");
  const zone = optStr(form.get("zone"), 32), care = optStr(form.get("care"), 64), note = optStr(form.get("note"), 500);
  if (care && !REF_ID.test(care)) throw bad("invalid_care", "Soin inconnu.");
  let taken = optStr(form.get("taken_at"), 40);
  if (taken && isNaN(Date.parse(taken))) taken = null;

  const key = `clubs/${w.clubId}/media/${horse}/${id}.${EXT[mime]}`;
  const tkey = tbuf ? `clubs/${w.clubId}/media/${horse}/${id}_t.${EXT[tmime!]}` : null;
  await c.env.FILES.put(key, buf, { httpMetadata: { contentType: mime }, customMetadata: { club: w.clubId, horse, by: w.userId } });
  if (tbuf && tkey) await c.env.FILES.put(tkey, tbuf, { httpMetadata: { contentType: tmime! }, customMetadata: { club: w.clubId, horse } });
  await run(c.env.DB, `INSERT INTO media (id, club_id, horse_id, kind, zone, care_id, note, mime, bytes, width, height, r2_key, thumb_key, thumb_mime, author_id, author_name, taken_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    id, w.clubId, horse, kind, zone, care, note, mime, buf.length, int(form.get("w")), int(form.get("h")), key, tkey, tmime, w.userId, w.name, taken);
  const row = await getRow(c.env, w.clubId, id);
  return c.json({ media: out(row!) }, 201);
});

app.get("/api/media", async (c) => {
  const w = who(c);
  const horse = c.req.query("horse") || "";
  await checkHorse(c.env, w, horse, false);
  const kind = c.req.query("kind");
  const rows = kind && KINDS.has(kind)
    ? await all<MediaRow>(c.env.DB, `SELECT ${COLS} FROM media WHERE club_id = ? AND horse_id = ? AND kind = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 500`, w.clubId, horse, kind)
    : await all<MediaRow>(c.env.DB, `SELECT ${COLS} FROM media WHERE club_id = ? AND horse_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 500`, w.clubId, horse);
  return c.json({ media: rows.map(out) });
});

app.get("/api/media/:id/file", async (c) => {
  const w = who(c);
  const row = await getRow(c.env, w.clubId, c.req.param("id"));
  if (!row) throw notFound("Photo introuvable.");
  await checkHorse(c.env, w, row.horse_id, false);
  const thumb = c.req.query("v") === "thumb" && row.thumb_key;
  const key = thumb ? row.thumb_key! : row.r2_key;
  const etag = '"' + row.id + (thumb ? "t" : "") + '"';
  if (c.req.header("if-none-match") === etag) return new Response(null, { status: 304, headers: { etag } });
  const obj = await c.env.FILES.get(key);
  if (!obj) throw notFound("Fichier de la photo introuvable.");
  return new Response(obj.body, {
    headers: {
      "content-type": thumb ? row.thumb_mime || row.mime : row.mime,
      "cache-control": "private, max-age=604800, immutable",
      etag, "x-content-type-options": "nosniff", "content-disposition": "inline",
    },
  });
});

app.patch("/api/media/:id", async (c) => {
  const w = who(c);
  const row = await getRow(c.env, w.clubId, c.req.param("id"));
  if (!row) throw notFound("Photo introuvable.");
  await checkHorse(c.env, w, row.horse_id, true);
  if (!isManager(w.role) && row.author_id !== w.userId) throw forbidden("Seul l'auteur de la photo ou le gérant peut la modifier.");
  let b: Record<string, unknown>;
  try { b = await c.req.json(); } catch { throw bad("invalid_json", "Le corps de la requête doit être un objet JSON."); }
  const note = typeof b.note === "string" ? b.note.trim().slice(0, 500) || null : row.note;
  const zone = typeof b.zone === "string" ? b.zone.trim().slice(0, 32) || null : row.zone;
  const kind = typeof b.kind === "string" ? b.kind : row.kind;
  if (!KINDS.has(kind)) throw bad("invalid_kind", "Type de photo inconnu.");
  await run(c.env.DB, "UPDATE media SET note = ?, zone = ?, kind = ? WHERE club_id = ? AND id = ?", note, zone, kind, w.clubId, row.id);
  return c.json({ media: out((await getRow(c.env, w.clubId, row.id))!) });
});

app.delete("/api/media/:id", async (c) => {
  const w = who(c);
  const row = await getRow(c.env, w.clubId, c.req.param("id"));
  if (!row) throw notFound("Photo introuvable.");
  await checkHorse(c.env, w, row.horse_id, false);
  if (!isManager(w.role) && row.author_id !== w.userId) throw forbidden("Seul l'auteur de la photo ou le gérant peut la supprimer.");
  await run(c.env.DB, "UPDATE media SET deleted_at = ? WHERE club_id = ? AND id = ?", new Date().toISOString(), w.clubId, row.id);
  const keys = [row.r2_key, row.thumb_key].filter(Boolean) as string[];
  await c.env.FILES.delete(keys);
  await audit(c.env.DB, { club_id: w.clubId, user_id: w.userId, action: "media.delete", target: row.id, data: { horse: row.horse_id } });
  return c.json({ ok: true });
});

export default app;
export async function cron(_env: Env, _expr: string) { /* rien à planifier */ }
