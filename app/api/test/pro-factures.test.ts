import { describe, it, expect } from "vitest";
import { env, call, seed } from "./helpers";
import { extractFacturX } from "../src/invoicing/pdf";
import { autoInvoice } from "../src/pro/factures";
import { parisToday } from "../src/invoicing/invoices";

const j = async (r: Response) => (await r.json()) as any;
const put = (clubId: string, coll: string, id: string, data: Record<string, unknown>) =>
  env.DB.prepare("INSERT OR REPLACE INTO records (club_id, coll, id, data) VALUES (?,?,?,?)").bind(clubId, coll, id, JSON.stringify({ id, ...data })).run();
const rec = async (clubId: string, coll: string, id: string) =>
  JSON.parse((await env.DB.prepare("SELECT data FROM records WHERE club_id = ? AND coll = ? AND id = ?").bind(clubId, coll, id).first<{ data: string }>())!.data);
const mails = (to: string) => env.DB.prepare("SELECT template, to_email, from_name, reply_to, attachments FROM email_outbox WHERE to_email = ? ORDER BY created_at").bind(to).all<any>().then((r) => r.results);
const yesterday = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const PROFILE = { name: "Dr Antoine Leclerc", job: "Vétérinaire", siret: "523 418 907 00034", ordre: "21547", address: "4 rue des Vignes, 78120 Rambouillet", iban: "FR76 3000 4000 0312 3456 7890 143", email: "cabinet.leclerc@exemple.fr", auto: "day", bill: "owner" };

async function club(name: string, email: string) {
  const g = await seed("owner");
  await env.DB.prepare("UPDATE clubs SET name = ?, email = ?, siren = ?, address = ? WHERE id = ?").bind(name, email, "812345678", JSON.stringify({ line1: "1 route des Prés", zip: "78120", city: "Rambouillet" }), g.clubId).run();
  await put(g.clubId, "practitioners", "p1", { name: "Dr Antoine Leclerc", short: "Dr Leclerc", job: "Vétérinaire" });
  await put(g.clubId, "members", "m001", { first: "Léa", last: "Martin", email: `lea.${g.clubId.slice(-5)}@exemple.fr`, address: "3 rue Haute, 78120 Rambouillet" });
  await put(g.clubId, "horses", "h01", { name: "Ulysse", owner: "m001" });
  await put(g.clubId, "horses", "h02", { name: "Caramel" });
  return g;
}
async function vet(...clubs: { clubId: string }[]) {
  const v = await seed("provider", { clubId: clubs[0].clubId, personRef: "p1" });
  for (const c of clubs.slice(1)) await env.DB.prepare("INSERT INTO memberships (user_id, club_id, role, person_ref) VALUES (?,?,?,?)").bind(v.userId, c.clubId, "provider", "p1").run();
  return v;
}

describe("factures des praticiens", () => {
  it("profil gardé sur le serveur, refusé tant que le SIRET manque", async () => {
    const a = await club("Écurie A", "a@exemple.fr");
    const v = await vet(a);
    let p = await j(await call("/api/pro/profil", { token: v.token }));
    expect(p.profile).toMatchObject({ name: "Dr Antoine Leclerc", job: "Vétérinaire", auto: "day" });
    expect(p.missing.length).toBeGreaterThan(0);
    await put(a.clubId, "proActs", "a1", { pro: "p1", horse: "h01", kind: "Vétérinaire", date: yesterday(), price: 68 });
    const r = await call("/api/pro/factures", { method: "POST", token: v.token, json: { club: a.clubId } });
    expect(r.status).toBe(422);
    p = await j(await call("/api/pro/profil", { method: "PUT", token: v.token, json: PROFILE }));
    expect(p.missing).toEqual([]);
    expect(p.profile.siret).toBe("52341890700034");
    const m = await seed("member", { clubId: a.clubId, personRef: "m001" });
    expect((await call("/api/pro/profil", { method: "PUT", token: m.token, json: PROFILE })).status).toBe(403);
  });

  it("une facture par client, numérotation unique sur tous ses clubs, envoi au propriétaire et au club, copie au véto, achats du club", async () => {
    const a = await club("Écurie A", "gerant.a@exemple.fr");
    const b = await club("Écurie B", "gerant.b@exemple.fr");
    const v = await vet(a, b);
    await call("/api/pro/profil", { method: "PUT", token: v.token, json: PROFILE });
    await put(a.clubId, "proActs", "a1", { pro: "p1", horse: "h01", kind: "Vétérinaire", date: yesterday(), note: "Abcès de pied", price: 68 });
    await put(a.clubId, "proActs", "a2", { pro: "p1", horse: "h02", kind: "Vaccin", date: yesterday(), price: 58 });
    await put(a.clubId, "proActs", "a3", { pro: "p2", horse: "h02", kind: "Vaccin", date: yesterday(), price: 58 }); // autre praticien
    await put(b.clubId, "proActs", "b1", { pro: "p1", horse: "h02", kind: "Vétérinaire", date: yesterday(), price: 100 });

    const list = await j(await call("/api/pro/factures", { token: v.token }));
    expect(list.todo.map((x: any) => x.id).sort()).toEqual(["a1", "a2", "b1"]);
    expect(list.todo.find((x: any) => x.id === "a1")).toMatchObject({ bill_to: "owner", payer: "Léa Martin", club_name: "Écurie A" });
    expect(list.todo.find((x: any) => x.id === "a2")).toMatchObject({ bill_to: "club" }); // pas de propriétaire

    const r = await j(await call("/api/pro/factures", { method: "POST", token: v.token, json: { club: a.clubId, acts: ["a1", "a2", "a3"] } }));
    expect(r.invoices).toHaveLength(2);
    const y = parisToday().slice(0, 4);
    const owner = r.invoices.find((i: any) => i.bill_to === "owner"), toClub = r.invoices.find((i: any) => i.bill_to === "club");
    expect(owner).toMatchObject({ total_ht: 6800, total_ttc: 8160, customer_name: "Léa Martin", in_club_purchases: false });
    expect(toClub).toMatchObject({ total_ht: 5800, total_ttc: 6960, customer_name: "Écurie A", sent_to: "gerant.a@exemple.fr", in_club_purchases: true });
    expect([owner.number, toClub.number].sort()).toEqual([`PRO-${y}-00001`, `PRO-${y}-00002`]);
    // deuxième club : la série continue
    const rb = await j(await call("/api/pro/factures", { method: "POST", token: v.token, json: { club: b.clubId } }));
    expect(rb.invoices[0].number).toBe(`PRO-${y}-00003`);
    // déjà facturé : rien de plus
    expect((await call("/api/pro/factures", { method: "POST", token: v.token, json: { club: a.clubId, acts: ["a1"] } })).status).toBe(400);

    // e-mails : client (au nom du véto, réponse chez lui) et copie au véto, PDF joint
    const toOwner = await mails(owner.customer_email);
    expect(toOwner[0]).toMatchObject({ template: "pro_invoice", from_name: "Dr Antoine Leclerc via Stabl", reply_to: "cabinet.leclerc@exemple.fr" });
    expect(JSON.parse(toOwner[0].attachments)[0].filename).toBe(owner.number + ".pdf");
    expect((await mails("gerant.a@exemple.fr"))[0].template).toBe("pro_invoice");
    expect((await mails("cabinet.leclerc@exemple.fr")).filter((m: any) => m.template === "pro_invoice_copy")).toHaveLength(3);

    // actes marqués facturés dans les données du club
    expect(await rec(a.clubId, "proActs", "a1")).toMatchObject({ inv: owner.number, invId: owner.id, client: "Léa Martin", billTo: "owner" });
    expect((await rec(a.clubId, "proActs", "a3")).inv).toBeUndefined();

    // PDF Factur-X au nom du véto
    const pdf = await call(`/api/pro/factures/${toClub.id}/pdf`, { token: v.token });
    expect(pdf.status).toBe(200);
    const x = await extractFacturX(new Uint8Array(await pdf.arrayBuffer()));
    expect(x.xml).toContain("<ram:Name>Dr Antoine Leclerc</ram:Name>");
    expect(x.xml).toContain('schemeID="0002">523418907<');
    expect(x.xml).toContain("<ram:Name>Écurie A</ram:Name>");

    // côté club : la facture reçue, et dans ses factures fournisseurs (achats, FEC)
    const cl = await j(await call("/api/club/factures-praticiens", { token: a.token }));
    expect(cl.invoices.map((i: any) => i.number)).toEqual([toClub.number]);
    expect((await call(`/api/club/factures-praticiens/${toClub.id}/pdf`, { token: a.token })).status).toBe(200);
    expect((await call(`/api/club/factures-praticiens/${owner.id}/pdf`, { token: a.token })).status).toBe(404);
    expect((await call(`/api/club/factures-praticiens/${toClub.id}/pdf`, { token: b.token })).status).toBe(404);
    const pur = await j(await call(`/api/accounting/purchases?year=${y}`, { token: a.token }));
    expect(pur.purchases[0]).toMatchObject({ supplier_name: "Dr Antoine Leclerc", total_ttc: 6960, account: "622600", has_pdf: true });

    // payée : visible partout
    await call(`/api/pro/factures/${toClub.id}/payee`, { method: "POST", token: v.token, json: { paid: true } });
    expect((await rec(a.clubId, "proActs", "a2")).paid).toBe(parisToday());
    const pur2 = await j(await call(`/api/accounting/purchases?year=${y}`, { token: a.token }));
    expect(pur2.purchases[0].status).toBe("paid");
    // un autre utilisateur ne voit pas ses factures
    expect((await call(`/api/pro/factures/${toClub.id}/pdf`, { token: a.token })).status).toBe(404);
    // tout son historique, tous clubs
    const all = await j(await call("/api/pro/factures", { token: v.token }));
    expect(all.invoices).toHaveLength(3);
    expect(all.todo).toEqual([]);
  });

  it("le véto ne peut ni poser un numéro de facture ni changer le prix d'un acte facturé", async () => {
    const a = await club("Écurie A", "a@exemple.fr");
    const v = await vet(a);
    await call("/api/pro/profil", { method: "PUT", token: v.token, json: PROFILE });
    let r = await j(await call("/api/records/batch", { method: "POST", token: v.token, json: { ops: [{ op: "upsert", coll: "proActs", id: "a9", data: { id: "a9", horse: "h02", kind: "Vaccin", date: yesterday(), price: 58, inv: "FAUX-1" } }] } }));
    expect(r.results[0].ok).toBe(true);
    expect((await rec(a.clubId, "proActs", "a9")).inv).toBeUndefined();
    await call("/api/pro/factures", { method: "POST", token: v.token, json: { club: a.clubId } });
    r = await j(await call("/api/records/batch", { method: "POST", token: v.token, json: { ops: [{ op: "upsert", coll: "proActs", id: "a9", data: { id: "a9", horse: "h02", kind: "Vaccin", date: yesterday(), price: 5, note: "ok" } }] } }));
    const after = await rec(a.clubId, "proActs", "a9");
    expect(after).toMatchObject({ price: 58, note: "ok" });
    expect(after.inv).toMatch(/^PRO-/);
  });

  it("facturation automatique : chaque matin les actes de la veille, rien en mode manuel", async () => {
    const a = await club("Écurie A", "a@exemple.fr");
    const v = await vet(a);
    await call("/api/pro/profil", { method: "PUT", token: v.token, json: PROFILE });
    await put(a.clubId, "proActs", "a1", { pro: "p1", horse: "h01", kind: "Vétérinaire", date: yesterday(), price: 68 });
    await put(a.clubId, "proActs", "a2", { pro: "p1", horse: "h01", kind: "Vétérinaire", date: parisToday(), price: 68 }); // aujourd'hui : demain matin
    await put(a.clubId, "proActs", "a3", { pro: "p1", horse: "h01", kind: "Vaccin", date: yesterday(), price: 58, bill: "club" });
    const w = await seed("provider", { clubId: a.clubId, personRef: "p9" });
    await call("/api/pro/profil", { method: "PUT", token: w.token, json: { ...PROFILE, name: "Benoît Gautier", auto: "off", email: "benoit@exemple.fr" } });
    await put(a.clubId, "proActs", "w1", { pro: "p9", horse: "h01", kind: "Maréchal", date: yesterday(), price: 95 });
    await autoInvoice(env);
    const l = await j(await call("/api/pro/factures", { token: v.token }));
    expect(l.invoices.map((i: any) => i.bill_to).sort()).toEqual(["club", "owner"]);
    expect(l.invoices.every((i: any) => i.auto)).toBe(true);
    expect(l.todo.map((x: any) => x.id)).toEqual(["a2"]);
    const lw = await j(await call("/api/pro/factures", { token: w.token }));
    expect(lw.invoices).toEqual([]);
    // relancer le cron ne refacture rien
    await autoInvoice(env);
    expect((await j(await call("/api/pro/factures", { token: v.token }))).invoices).toHaveLength(2);
  });
});
