import type { Env } from "../env";
import { all, run } from "../lib/db";
import { nowIso } from "../lib/ids";
import { fmtEur } from "./catalog";
import type { PayMethod } from "./catalog";

/**
 * Aides de l'adhérent (module Croissance, collection records « aids ») déduites de sa facture.
 *
 * Une aide (Pass'Sport, chèques-vacances ou coupons ANCV, CAF, CSE, mairie) n'est PAS une remise : le club est payé
 * en entier, une partie par un tiers. La base de TVA ne change donc pas ; l'aide est enregistrée comme un règlement
 * de la facture (moyen « Pass'Sport », « ANCV » ou « Autre moyen ») et la facture porte une mention claire :
 * « Déjà réglé par des aides : Pass'Sport 50,00 € (payé par l'État)… Reste à payer : 240,00 €. »
 * La remise famille, elle, est une vraie réduction de prix : c'est une ligne négative de la facture (TVA comprise),
 * posée par l'écran d'inscription.
 *
 * Une aide est prise une seule fois : à l'émission, elle reçoit invoice et invoiceNumber (écriture conditionnelle).
 * Seules les aides « deduit » sans facture, d'un type accepté dans Réglages › Aides, et qui tiennent dans le reste
 * à payer sont prises ; les autres attendent la facture suivante.
 */
export const AID_KINDS: Record<string, { label: string; payer: string; method: PayMethod }> = {
  passsport: { label: "Pass'Sport", payer: "payé par l'État", method: "pass_sport" },
  ancv: { label: "Chèques-vacances ANCV", payer: "payés par l'ANCV", method: "ancv" },
  coupon: { label: "Coupons sport ANCV", payer: "payés par l'ANCV", method: "ancv" },
  caf: { label: "Aide CAF aux loisirs", payer: "payée par la CAF", method: "other" },
  cse: { label: "Participation du CSE", payer: "payée par le CSE", method: "other" },
  mairie: { label: "Aide de la mairie", payer: "payée par la commune", method: "other" },
};
export interface Aid { id: string; kind: string; amount: number; code?: string; ref?: string }

const parse = (s: string): any => { try { return JSON.parse(s); } catch { return null; } };

/** Aides en attente d'une facture pour cette fiche (montants en centimes). */
export async function pendingAids(db: D1Database, clubId: string, memberRef: string): Promise<Aid[]> {
  const cfg = await all<{ data: string }>(db, "SELECT data FROM records WHERE club_id = ? AND coll = 'growthCfg' AND id = 'aides' AND deleted = 0", clubId);
  const accept = (cfg[0] && parse(cfg[0].data)?.accept) || {};
  const rows = await all<{ id: string; data: string }>(db,
    "SELECT id, data FROM records WHERE club_id = ? AND coll = 'aids' AND deleted = 0 AND json_extract(data, '$.member') = ? AND json_extract(data, '$.invoice') IS NULL ORDER BY created_at, id",
    clubId, memberRef);
  const out: Aid[] = [];
  for (const r of rows) {
    const d = parse(r.data);
    if (!d || d.status !== "deduit" || !AID_KINDS[d.kind] || accept[d.kind] === false) continue;
    const cents = Math.round(Number(d.amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) continue;
    out.push({ id: r.id, kind: d.kind, amount: cents, code: typeof d.code === "string" ? d.code : undefined, ref: typeof d.ref === "string" ? d.ref : undefined });
  }
  return out;
}

/** Les aides qui tiennent dans le reste à payer, dans l'ordre où elles ont été saisies. */
export function selectAids(list: Aid[], payableCents: number): Aid[] {
  const out: Aid[] = [];
  let left = payableCents;
  for (const a of list) if (a.amount <= left) { out.push(a); left -= a.amount; }
  return out;
}

/** Mention imprimée sur la facture. */
export function aidsMention(list: Aid[], dueCents: number): string {
  const parts = list.map((a) => `${AID_KINDS[a.kind].label} ${fmtEur(a.amount)} (${AID_KINDS[a.kind].payer}${a.code ? ", code " + a.code : ""})`);
  const total = list.reduce((s, a) => s + a.amount, 0);
  return `Déjà réglé par des aides : ${parts.join(", ")}. Reste à payer : ${fmtEur(Math.max(0, dueCents - total))}.`;
}

/** Relie chaque aide à la facture (une seule fois) et l'enregistre comme règlement. */
export async function applyAids(env: Env, clubId: string, invoiceId: string, number: string, list: Aid[], userId: string | null,
  addPayment: (amount: number, method: PayMethod, reference: string, note: string) => Promise<unknown>) {
  for (const a of list) {
    const r = await run(env.DB,
      "UPDATE records SET data = json_set(data, '$.invoice', ?, '$.invoiceNumber', ?), version = version + 1, updated_at = ?, updated_by = ? WHERE club_id = ? AND coll = 'aids' AND id = ? AND deleted = 0 AND json_extract(data, '$.invoice') IS NULL",
      invoiceId, number, nowIso(), userId || "system", clubId, a.id);
    if (!r.meta.changes) continue;   // déjà prise par une autre facture entre-temps
    const k = AID_KINDS[a.kind];
    await addPayment(a.amount, k.method, (k.label + (a.code ? " " + a.code : "")).slice(0, 120), `${k.label}, ${k.payer}${a.ref ? " (" + a.ref + ")" : ""}`);
  }
}
