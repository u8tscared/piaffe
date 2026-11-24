import type { Context } from "hono";
import type { AppEnv } from "../env";
import { all, one } from "../lib/db";
import { forbidden } from "../lib/http";

export function isManager(c: Context<AppEnv>) {
  const r = c.get("membership")?.role;
  return r === "owner" || r === "manager";
}

/**
 * Fiches pour lesquelles un adhérent peut payer : ses fiches (person_ref, éventuellement plusieurs
 * séparées par des virgules pour un parent) et celles de sa famille (champ fam des fiches members).
 */
export async function payableRefs(db: D1Database, clubId: string, personRef: string | null): Promise<Set<string>> {
  const own = (personRef || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
  const set = new Set(own);
  if (!own.length) return set;
  const ph = own.map(() => "?").join(",");
  const fams = await all<{ fam: string | null }>(db,
    `SELECT json_extract(data, '$.fam') AS fam FROM records WHERE club_id = ? AND coll = 'members' AND deleted = 0 AND id IN (${ph})`, clubId, ...own);
  const famIds = [...new Set(fams.map((f) => f.fam).filter((f): f is string => typeof f === "string" && f.length > 0))];
  if (famIds.length) {
    const ph2 = famIds.map(() => "?").join(",");
    const rows = await all<{ id: string }>(db,
      `SELECT id FROM records WHERE club_id = ? AND coll = 'members' AND deleted = 0 AND json_extract(data, '$.fam') IN (${ph2}) LIMIT 50`, clubId, ...famIds);
    for (const r of rows) set.add(r.id);
  }
  return set;
}

/** Vérifie que l'appelant peut agir pour la fiche donnée (gérant : toutes ; adhérent : les siennes et sa famille). */
export async function assertCanActFor(c: Context<AppEnv>, personRef: string | null) {
  if (isManager(c)) return;
  const m = c.get("membership");
  if (m?.role !== "member" || !personRef) throw forbidden();
  const refs = await payableRefs(c.env.DB, c.get("club")!.id, m.person_ref);
  if (!refs.has(personRef)) throw forbidden("Vous ne pouvez payer que vos propres factures.");
}

/** Coordonnées d'une fiche adhérent (records members). */
export async function personInfo(db: D1Database, clubId: string, personRef: string): Promise<{ email: string | null; name: string | null; first: string | null }> {
  const r = await one<{ data: string }>(db, "SELECT data FROM records WHERE club_id = ? AND coll = 'members' AND id = ? AND deleted = 0", clubId, personRef);
  let d: any = {};
  try { d = r ? JSON.parse(r.data) : {}; } catch { d = {}; }
  const email = typeof d.email === "string" && d.email.includes("@") ? d.email : null;
  const name = [d.first, d.last].filter((x) => typeof x === "string" && x).join(" ") || (typeof d.name === "string" ? d.name : null);
  return { email, name, first: typeof d.first === "string" && d.first ? d.first : null };
}
