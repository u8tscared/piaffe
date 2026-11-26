import { all } from "../lib/db";
import { PolicyError, type Row } from "./policy";
import type { Principal } from "./store";

/**
 * Séance recréditée à un absent (cours en direct, collection lessonCredits).
 * Le serveur décide de la forme du crédit et l'applique vraiment, dans la même transaction que l'écriture du crédit :
 *  - forfait « carte » avec une carte valide (cards : left < total, until non dépassé) → la carte regagne une séance ;
 *  - sinon → un rattrapage à réserver : compteur makeups de la fiche de l'adhérent (+1).
 * Le crédit garde la trace de ce qui a été crédité (applied) ; le supprimer (cavalier finalement présent) le reprend.
 * Un même cavalier n'est recrédité qu'une fois par reprise et par jour, même depuis deux appareils.
 */
export interface CreditInfo {
  members: Map<string, Row>;
  forfaits: Map<string, Row>;
  cards: Row[];
  existing: Row[];          // crédits vivants des cavaliers concernés
  seen: Set<string>;        // crédits créés dans ce lot (member|lesson|date)
}
export interface CreditEffect { coll: "cards" | "members"; id: string; field: "left" | "makeups"; revert?: boolean }

const parse = (s: string): Row | null => { try { const v = JSON.parse(s); return v && typeof v === "object" ? v : null; } catch { return null; } };
const IN = (n: number) => Array.from({ length: n }, () => "?").join(",");

export async function loadCreditInfo(db: D1Database, clubId: string, ops: unknown[]): Promise<CreditInfo> {
  const info: CreditInfo = { members: new Map(), forfaits: new Map(), cards: [], existing: [], seen: new Set() };
  const ids = [...new Set((ops as Row[]).filter((o) => o && o.coll === "lessonCredits" && o.op === "upsert" && o.data && typeof o.data.member === "string").map((o) => o.data.member as string))].slice(0, 90);
  if (!ids.length) return info;
  const mem = await all<{ id: string; data: string }>(db, `SELECT id, data FROM records WHERE club_id = ? AND coll = 'members' AND deleted = 0 AND id IN (${IN(ids.length)})`, clubId, ...ids);
  for (const r of mem) { const d = parse(r.data); if (d) info.members.set(r.id, d); }
  const forf = await all<{ id: string; data: string }>(db, "SELECT id, data FROM records WHERE club_id = ? AND coll = 'forfaits' AND deleted = 0", clubId);
  for (const r of forf) { const d = parse(r.data); if (d) info.forfaits.set(r.id, d); }
  const cards = await all<{ id: string; data: string }>(db, `SELECT id, data FROM records WHERE club_id = ? AND coll = 'cards' AND deleted = 0 AND json_extract(data, '$.member') IN (${IN(ids.length)})`, clubId, ...ids);
  for (const r of cards) { const d = parse(r.data); if (d) info.cards.push({ ...d, id: r.id }); }
  const ex = await all<{ id: string; data: string }>(db, `SELECT id, data FROM records WHERE club_id = ? AND coll = 'lessonCredits' AND deleted = 0 AND json_extract(data, '$.member') IN (${IN(ids.length)})`, clubId, ...ids);
  for (const r of ex) { const d = parse(r.data); if (d) info.existing.push({ ...d, id: r.id }); }
  return info;
}

/** Décide l'effet d'une écriture de crédit (et complète le crédit). Lève PolicyError si le crédit est refusé. */
export function planCredit(info: CreditInfo, id: string, prev: Row | null, next: Row | null, now: string): CreditEffect | null {
  if (!next) {
    const a = prev?.applied;
    return a && (a.coll === "cards" || a.coll === "members") && typeof a.id === "string" ? { coll: a.coll, id: a.id, field: a.coll === "cards" ? "left" : "makeups", revert: true } : null;
  }
  if (prev) {
    // une correction (motif, auteur) ne change ni le cavalier, ni la reprise, ni ce qui a été crédité
    for (const k of ["member", "lesson", "date", "kind", "applied", "label"]) { if (prev[k] === undefined) delete next[k]; else next[k] = prev[k]; }
    return null;
  }
  const member = typeof next.member === "string" ? info.members.get(next.member) : undefined;
  if (!member) throw new PolicyError("unknown_member", "Ce cavalier est introuvable dans le club : la séance ne peut pas lui être recréditée.", 422);
  const lesson = typeof next.lesson === "string" ? next.lesson : "";
  const date = typeof next.date === "string" ? next.date.slice(0, 10) : now.slice(0, 10);
  next.date = date;
  const k = next.member + "|" + lesson + "|" + date;
  if (info.seen.has(k) || info.existing.some((c) => c.id !== id && c.member === next.member && c.lesson === lesson && String(c.date || "").slice(0, 10) === date))
    throw new PolicyError("already_credited", "Cette séance a déjà été recréditée à ce cavalier.", 409);
  info.seen.add(k);
  const forfait = member.forfait ? info.forfaits.get(member.forfait) : undefined;
  const today = now.slice(0, 10);
  if (forfait && forfait.kind === "carte") {
    const card = info.cards
      .filter((c) => c.member === member.id && typeof c.total === "number" && (typeof c.left !== "number" || c.left < c.total) && (!c.until || String(c.until) >= today))
      .sort((a, b) => String(a.until || "9999").localeCompare(String(b.until || "9999")))[0];
    if (card) {
      card.left = (typeof card.left === "number" ? card.left : 0) + 1;   // deux crédits dans le même lot : la carte suivante si celle-ci est pleine
      next.kind = "carte"; next.label = "1 séance recréditée sur sa carte";
      next.applied = { coll: "cards", id: card.id, at: now };
      return { coll: "cards", id: card.id, field: "left" };
    }
  }
  next.kind = "rattrapage"; next.label = "1 rattrapage à réserver sous 30 jours";
  next.applied = { coll: "members", id: member.id, at: now };
  return { coll: "members", id: member.id, field: "makeups" };
}

/**
 * Instruction SQL de l'effet, exécutée dans la même transaction, seulement si l'écriture du crédit a bien eu lieu
 * (le crédit existe à la version attendue). La carte ne dépasse jamais son total ; un compteur ne descend pas sous 0.
 */
export function creditEffect(db: D1Database, p: Principal, e: CreditEffect, creditId: string, creditVersion: number, deleted: boolean, now: string) {
  const path = "$." + e.field;
  const value = e.revert
    ? `MAX(COALESCE(json_extract(data, '${path}'), 0) - 1, 0)`
    : e.field === "left"
      ? `MIN(COALESCE(json_extract(data, '${path}'), 0) + 1, COALESCE(json_extract(data, '$.total'), 1000000000))`
      : `COALESCE(json_extract(data, '${path}'), 0) + 1`;
  return db.prepare(
    `UPDATE records SET data = json_set(data, '${path}', ${value}), version = version + 1, updated_by = ?, updated_at = ?
     WHERE club_id = ? AND coll = ? AND id = ? AND deleted = 0
       AND EXISTS (SELECT 1 FROM records WHERE club_id = ? AND coll = 'lessonCredits' AND id = ? AND deleted = ? AND version = ?)`,
  ).bind(p.actor, now, p.clubId, e.coll, e.id, p.clubId, creditId, deleted ? 1 : 0, creditVersion);
}
