/* Outils communs aux tests du lot D (e-mails, ICS, import). */
import { env } from "./helpers";
import { randomToken, sha256 } from "../src/lib/crypto";
import { newId } from "../src/lib/ids";

export async function putRecord(clubId: string, coll: string, id: string, data: Record<string, unknown>, o: { created?: string } = {}) {
  await env.DB.prepare("INSERT OR REPLACE INTO records (club_id, coll, id, data, version, deleted, created_at, updated_at) VALUES (?,?,?,?,1,0,?,?)")
    .bind(clubId, coll, id, JSON.stringify({ ...data, id }), o.created || "2026-09-01T10:00:00.000Z", "2026-11-01T10:00:00.000Z").run();
}
export async function getRecord(clubId: string, coll: string, id: string) {
  const r = await env.DB.prepare("SELECT data, version, deleted FROM records WHERE club_id = ? AND coll = ? AND id = ?").bind(clubId, coll, id).first<any>();
  return r ? { ...r, data: JSON.parse(r.data) } : null;
}
export async function apiKey(clubId: string, scopes: string[] = ["import"]) {
  const token = "pk_live_" + randomToken(6) + "_" + randomToken(24);
  await env.DB.prepare("INSERT INTO api_keys (id, club_id, name, prefix, hash, scopes) VALUES (?,?,?,?,?,?)")
    .bind(newId("key"), clubId, "Test", token.slice(0, 14), await sha256(token), JSON.stringify(scopes)).run();
  return token;
}
export async function setClub(clubId: string, cols: Record<string, unknown>) {
  const k = Object.keys(cols);
  await env.DB.prepare(`UPDATE clubs SET ${k.map((x) => x + " = ?").join(", ")} WHERE id = ?`).bind(...k.map((x) => cols[x]), clubId).run();
}
export const outbox = (id: string) => env.DB.prepare("SELECT * FROM email_outbox WHERE id = ?").bind(id).first<any>();
