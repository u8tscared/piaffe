import type { Env, Role } from "../env";
import { all, audit } from "../lib/db";
import { emit } from "../lib/events";
import { nowIso } from "../lib/ids";
import { isColl, isSingleton, ID_RE, MAX_OBJECT_BYTES, SINGLETON_ID } from "./collections";
import { buildCtx, ctxCollections, PolicyError, prepareWrite, projectRead, type PolicyCtx, type Row } from "./policy";

export interface Principal { role: Role; personRef: string | null; userId: string | null; actor: string; clubId: string }
interface RecRow { coll: string; id: string; data: string; version: number; deleted: number; updated_at: string }

const parse = (s: string): Row | null => { try { const v = JSON.parse(s); return v && typeof v === "object" ? v : null; } catch { return null; } };

export async function loadCtx(env: Env, p: Principal): Promise<PolicyCtx> {
  const colls = ctxCollections(p.role);
  const rows: Record<string, Row[]> = {};
  if (colls.length) {
    const res = await all<RecRow>(env.DB, `SELECT coll, data FROM records WHERE club_id = ? AND deleted = 0 AND coll IN (${colls.map(() => "?").join(",")})`, p.clubId, ...colls);
    for (const r of res) { const d = parse(r.data); if (d) (rows[r.coll] ||= []).push(d); }
  }
  return buildCtx(p.role, p.personRef, rows);
}

/** Données complètes du club, filtrées pour ce rôle, au format de window.DATA. */
export async function bootstrapData(env: Env, p: Principal) {
  const data: Record<string, unknown> = {};
  const versions: Record<string, number> = {};
  if (p.role === "accountant") return { data, versions };
  const res = await all<RecRow>(env.DB, "SELECT coll, id, data, version FROM records WHERE club_id = ? AND deleted = 0 ORDER BY coll, created_at, id", p.clubId);
  const byColl: Record<string, Row[]> = {};
  const parsed: { coll: string; id: string; version: number; d: Row }[] = [];
  for (const r of res) {
    if (!isColl(r.coll)) continue;
    const d = parse(r.data);
    if (!d) continue;
    parsed.push({ coll: r.coll, id: r.id, version: r.version, d });
    (byColl[r.coll] ||= []).push(d);
  }
  const ctx = buildCtx(p.role, p.personRef, byColl);
  for (const r of parsed) {
    const v = projectRead(ctx, r.coll, r.d);
    if (!v) continue;
    if (isSingleton(r.coll)) data[r.coll] = v;
    else ((data[r.coll] ||= []) as Row[]).push(v);
    versions[r.coll + "/" + r.id] = r.version;
  }
  return { data, versions };
}

/** Objets modifiés (ou supprimés) depuis une date, filtrés pour ce rôle. */
export async function changesSince(env: Env, p: Principal, since: string, limit = 1000, after?: { coll: string; id: string }) {
  if (p.role === "accountant") return { changes: [], more: false, next: since };
  // Curseur (updated_at, coll, id) : pagination exacte même quand un lot entier partage le même horodatage.
  const res = after
    ? await all<RecRow>(env.DB,
      `SELECT coll, id, data, version, deleted, updated_at FROM records WHERE club_id = ?
       AND (updated_at > ? OR (updated_at = ? AND (coll > ? OR (coll = ? AND id > ?)))) ORDER BY updated_at, coll, id LIMIT ?`,
      p.clubId, since, since, after.coll, after.coll, after.id, limit + 1)
    : await all<RecRow>(env.DB,
      "SELECT coll, id, data, version, deleted, updated_at FROM records WHERE club_id = ? AND updated_at >= ? ORDER BY updated_at, coll, id LIMIT ?", p.clubId, since, limit + 1);
  const more = res.length > limit;
  const rows = res.slice(0, limit);
  const ctx = rows.length ? await loadCtx(env, p) : null;
  const changes: unknown[] = [];
  for (const r of rows) {
    if (!isColl(r.coll)) continue;
    const d = parse(r.data);
    if (!d) continue;
    const v = projectRead(ctx!, r.coll, d);
    if (!v) continue;
    changes.push(r.deleted ? { coll: r.coll, id: r.id, version: r.version, deleted: true, updated_at: r.updated_at }
      : { coll: r.coll, id: r.id, version: r.version, deleted: false, data: v, updated_at: r.updated_at });
  }
  const last = rows[rows.length - 1];
  return { changes, more, next: last ? `${last.updated_at}|${last.coll}|${last.id}` : since };
}

export interface Op { op: "upsert" | "delete"; coll: string; id: string; data?: Row; version?: number }
export type OpResult = { coll: string; id: string; ok: boolean; version?: number; conflict?: boolean; data?: Row | null; deleted?: boolean; error?: { code: string; message: string } };

const enc = new TextEncoder();
const errRes = (o: { coll?: unknown; id?: unknown }, code: string, message: string): OpResult =>
  ({ coll: String(o.coll ?? ""), id: String(o.id ?? ""), ok: false, error: { code, message } });

/**
 * Applique un lot d'opérations : contrôle d'accès, validation, versionnage optimiste, tout ou rien côté SQL
 * (db.batch est une transaction). Chaque écriture est conditionnée par la version lue : si quelqu'un a écrit entre-temps,
 * l'opération est signalée en conflit au lieu d'écraser.
 */
/** L'id « _ » des objets uniques ne suit pas ID_RE (qui exige un premier caractère alphanumérique). */
const validId = (coll: string, id: string) => ID_RE.test(id) || (isSingleton(coll) && id === SINGLETON_ID);

export async function applyBatch(env: Env, ctxExec: { waitUntil(p: Promise<unknown>): void } | null, p: Principal, ops: unknown[], ip?: string | null) {
  const db = env.DB;
  const results: (OpResult | null)[] = new Array(ops.length).fill(null);
  // 1. Lecture des versions actuelles (par paquets : D1 accepte 100 paramètres par requête).
  const keys = new Map<string, { coll: string; id: string }>();
  ops.forEach((o: any) => { if (o && isColl(o.coll) && typeof o.id === "string" && validId(o.coll, o.id)) keys.set(o.coll + "\u0000" + o.id, { coll: o.coll, id: o.id }); });
  const current = new Map<string, { data: Row | null; version: number; deleted: boolean }>();
  const byColl: Record<string, string[]> = {};
  for (const k of keys.values()) (byColl[k.coll] ||= []).push(k.id);
  for (const [coll, ids] of Object.entries(byColl)) {
    for (let i = 0; i < ids.length; i += 90) {
      const chunk = ids.slice(i, i + 90);
      const rows = await all<RecRow>(db, `SELECT coll, id, data, version, deleted FROM records WHERE club_id = ? AND coll = ? AND id IN (${chunk.map(() => "?").join(",")})`, p.clubId, coll, ...chunk);
      for (const r of rows) current.set(r.coll + "\u0000" + r.id, { data: parse(r.data), version: r.version, deleted: !!r.deleted });
    }
  }
  const ctx = await loadCtx(env, p);
  const now = nowIso();
  const stmts: D1PreparedStatement[] = [];
  const pending: { idx: number; stmt: number; coll: string; id: string; version: number; data: Row | null; previous: Row | null; deleted: boolean }[] = [];

  ops.forEach((o: any, idx) => {
    if (!o || typeof o !== "object") { results[idx] = errRes({}, "invalid_op", "Opération illisible."); return; }
    if (o.op !== "upsert" && o.op !== "delete") { results[idx] = errRes(o, "invalid_op", "L'opération doit être « upsert » ou « delete »."); return; }
    if (!isColl(o.coll)) { results[idx] = errRes(o, "unknown_collection", "Collection inconnue."); return; }
    if (typeof o.id !== "string" || !validId(o.coll, o.id)) { results[idx] = errRes(o, "invalid_id", "Identifiant invalide (lettres, chiffres, _ . : -, 64 caractères au plus)."); return; }
    if (isSingleton(o.coll) && o.id !== SINGLETON_ID) { results[idx] = errRes(o, "invalid_id", "Cette collection est un objet unique : utilisez l'id « _ »."); return; }
    const key = o.coll + "\u0000" + o.id;
    const cur = current.get(key);
    const live = cur && !cur.deleted ? cur : null;
    const serverVersion = cur ? cur.version : 0;
    if (o.version !== undefined && o.version !== null) {
      const expected = live ? cur!.version : 0;
      if (typeof o.version !== "number" || o.version !== expected) {
        const visible = live && live.data ? projectRead(ctx, o.coll, live.data) : null;
        results[idx] = { coll: o.coll, id: o.id, ok: false, conflict: true, version: serverVersion, data: visible, deleted: !live };
        return;
      }
    }
    let next: Row | null = null;
    if (o.op === "upsert") {
      if (!o.data || typeof o.data !== "object" || Array.isArray(o.data)) { results[idx] = errRes(o, "invalid_data", "Le champ « data » doit être un objet."); return; }
      next = isSingleton(o.coll) ? { ...o.data } : { ...o.data, id: o.id };
    } else if (!live) {
      results[idx] = { coll: o.coll, id: o.id, ok: true, version: serverVersion, deleted: true }; // déjà supprimé : idempotent
      return;
    }
    let final: Row | null;
    try { final = prepareWrite(ctx, o.coll, live?.data ?? null, next); }
    catch (e) {
      if (e instanceof PolicyError) { results[idx] = errRes(o, e.code, e.message); return; }
      throw e;
    }
    if (o.op === "upsert") {
      if (!isSingleton(o.coll)) final!.id = o.id;
      const json = JSON.stringify(final);
      if (enc.encode(json).length > MAX_OBJECT_BYTES) { results[idx] = errRes(o, "too_large", "Cet objet dépasse 64 Ko. Allégez-le (les fichiers vont dans les pièces jointes)."); return; }
      if (cur) {
        stmts.push(db.prepare("UPDATE records SET data = ?, version = version + 1, deleted = 0, updated_by = ?, updated_at = ? WHERE club_id = ? AND coll = ? AND id = ? AND version = ?")
          .bind(json, p.actor, now, p.clubId, o.coll, o.id, cur.version));
      } else {
        stmts.push(db.prepare("INSERT INTO records (club_id, coll, id, data, version, deleted, updated_by, created_at, updated_at) VALUES (?,?,?,?,1,0,?,?,?) ON CONFLICT DO NOTHING")
          .bind(p.clubId, o.coll, o.id, json, p.actor, now, now));
      }
      const version = serverVersion + 1;
      pending.push({ idx, stmt: stmts.length - 1, coll: o.coll, id: o.id, version, data: final, previous: live?.data ?? null, deleted: false });
      current.set(key, { data: final, version, deleted: false });
    } else {
      stmts.push(db.prepare("UPDATE records SET deleted = 1, version = version + 1, updated_by = ?, updated_at = ? WHERE club_id = ? AND coll = ? AND id = ? AND version = ?")
        .bind(p.actor, now, p.clubId, o.coll, o.id, cur!.version));
      const version = serverVersion + 1;
      pending.push({ idx, stmt: stmts.length - 1, coll: o.coll, id: o.id, version, data: null, previous: live!.data, deleted: true });
      current.set(key, { data: live!.data, version, deleted: true });
    }
  });

  const done: typeof pending = [];
  if (stmts.length) {
    const out = await db.batch(stmts);
    const failed = new Set<string>();
    for (const pd of pending) {
      const k = pd.coll + "\u0000" + pd.id;
      if (failed.has(k) || !out[pd.stmt].meta.changes) {
        // Écriture concurrente entre la lecture et l'écriture : on signale un conflit.
        failed.add(k);
        results[pd.idx] = { coll: pd.coll, id: pd.id, ok: false, conflict: true, version: pd.version - 1 };
        continue;
      }
      results[pd.idx] = { coll: pd.coll, id: pd.id, ok: true, version: pd.version, ...(pd.deleted ? { deleted: true } : { data: projectRead(ctx, pd.coll, pd.data!) }) };
      done.push(pd);
    }
  }

  if (done.length) {
    await audit(db, { club_id: p.clubId, user_id: p.userId, action: "records.batch", target: done.length === 1 ? done[0].coll + "/" + done[0].id : undefined,
      data: { by: p.actor, ops: done.slice(0, 200).map((d) => ({ coll: d.coll, id: d.id, v: d.version, del: d.deleted || undefined })) }, ip: ip ?? null });
    for (const d of done) {
      if (d.deleted) emit(env, ctxExec, { type: "record.deleted", club_id: p.clubId, coll: d.coll, id: d.id, previous: d.previous, user_id: p.userId, via: "app" });
      else emit(env, ctxExec, { type: "record.saved", club_id: p.clubId, coll: d.coll, id: d.id, data: d.data, previous: d.previous, user_id: p.userId, via: "app" });
    }
  }
  return results as OpResult[];
}
