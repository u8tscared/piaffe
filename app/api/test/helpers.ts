import { env as rawEnv, exports } from "cloudflare:workers";
const env = rawEnv as unknown as import("../src/env").Env;
export { env };
import { newId } from "../src/lib/ids";
import { randomToken, sha256 } from "../src/lib/crypto";
import type { Role } from "../src/env";

/** Appelle le Worker comme un navigateur. */
export function call(path: string, init: RequestInit & { json?: unknown; token?: string; club?: string } = {}) {
  const h = new Headers(init.headers);
  if (init.json !== undefined) { h.set("content-type", "application/json"); init.body = JSON.stringify(init.json); }
  if (init.token) h.set("authorization", "Bearer " + init.token);
  if (init.club) h.set("x-piaffe-club", init.club);
  return (exports as any).default.fetch(new Request("http://piaffe.test" + path, { ...init, headers: h }));
}

/** Crée directement en base un club, un utilisateur avec ce rôle et une session. Renvoie le jeton Bearer. */
export async function seed(role: Role = "owner", o: { clubId?: string; email?: string; personRef?: string } = {}) {
  const db = env.DB;
  const clubId = o.clubId || newId("clb");
  await db.prepare("INSERT OR IGNORE INTO clubs (id, name, slug) VALUES (?,?,?)").bind(clubId, "Écurie Test", "ecurie-" + clubId.slice(-6)).run();
  const userId = newId("usr");
  const email = o.email || `${role}.${userId.slice(-6)}@exemple.fr`;
  await db.prepare("INSERT INTO users (id, email, first, last, email_verified_at) VALUES (?,?,?,?,?)").bind(userId, email, "Léa", "Test", new Date().toISOString()).run();
  await db.prepare("INSERT INTO memberships (user_id, club_id, role, person_ref) VALUES (?,?,?,?)").bind(userId, clubId, role, o.personRef ?? null).run();
  const token = randomToken();
  await db.prepare("INSERT INTO sessions (id, user_id, club_id, expires_at) VALUES (?,?,?,?)").bind(await sha256(token), userId, clubId, new Date(Date.now() + 864e5).toISOString()).run();
  return { clubId, userId, email, token };
}
