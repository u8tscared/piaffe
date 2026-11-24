import { env, seed, call } from "./helpers";
import type { Role } from "../src/env";
import { newId } from "../src/lib/ids";

export { env, call };

export const SIREN_CLUB = "552100554";
export const SIREN_PRO = "732829320";

/** Club prêt à facturer (SIREN, adresse, régime de TVA) avec un gérant et quelques fiches adhérents. */
export async function setupClub(o: { regime?: "normal" | "franchise" | "association_exoneree"; siren?: string | null } = {}) {
  const owner = await seed("owner");
  await env.DB.prepare("UPDATE clubs SET name = ?, siren = ?, siret = ?, vat_regime = ?, legal_form = 'sarl', address = ?, email = ? WHERE id = ?")
    .bind("Écurie des Tilleuls", o.siren === null ? null : o.siren || SIREN_CLUB, o.siren === null ? null : (o.siren || SIREN_CLUB) + "00011", o.regime || "normal",
      JSON.stringify({ line1: "12 chemin des Prés", zip: "78120", city: "Rambouillet", country: "FR" }), "contact@tilleuls.example", owner.clubId).run();
  const members = [
    { id: "m001", first: "Léa", last: "Martin", fam: "F1", email: "lea.martin@exemple.fr", address: "3 rue des Lilas, 78120 Rambouillet" },
    { id: "m002", first: "Hugo", last: "Martin", fam: "F1", email: "hugo.martin@exemple.fr" },
    { id: "m003", first: "Chloé", last: "Bernard", fam: "F3", email: "chloe.bernard@exemple.fr" },
  ];
  for (const m of members) {
    await env.DB.prepare("INSERT INTO records (club_id, coll, id, data) VALUES (?, 'members', ?, ?)").bind(owner.clubId, m.id, JSON.stringify(m)).run();
  }
  return owner;
}

export async function addUser(clubId: string, role: Role, personRef?: string) {
  return seed(role, { clubId, personRef });
}

export const lessonLines = [
  { label: "Forfait annuel, échéance de novembre", category: "lesson", quantity: 1, unit_price: 14500 },
  { label: "Licence FFE 2027", category: "disbursement", quantity: 1, unit_price: 3600 },
  { label: "Tapis de selle", category: "goods", quantity: 2, unit_price: 2990 },
];

export async function draft(token: string, body: Record<string, unknown>) {
  const r = await call("/api/invoices", { method: "POST", token, json: body });
  const j: any = await r.json();
  if (r.status !== 201) throw new Error("draft " + r.status + " " + JSON.stringify(j));
  return j.invoice;
}
export async function issue(token: string, id: string, send = false) {
  const r = await call(`/api/invoices/${id}/issue`, { method: "POST", token, json: { send } });
  return { status: r.status, body: (await r.json()) as any };
}
export async function issued(token: string, body: Record<string, unknown>) {
  const d = await draft(token, body);
  const r = await issue(token, d.id);
  if (r.status !== 200) throw new Error("issue " + r.status + " " + JSON.stringify(r.body));
  return r.body.invoice;
}
export const uid = () => newId("t");
