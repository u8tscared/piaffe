import { describe, it, expect } from "vitest";
import { call, env, seed } from "./helpers";
import { apiKey, getRecord, putRecord } from "./mail-kit";
import { normAmount, normDate, normPhone, normSire, normChip } from "../src/import/normalize";

const post = (path: string, token: string, json?: unknown) => call(path, { method: "POST", token, json: json ?? {} });

/** Lots tels que les produit la passerelle de migration (migration/core/vers-api.mjs). */
type Lot = { coll: string; items: { external_id: string; data: Record<string, any> }[] };
const LOTS: Lot[] = [
  { coll: "staff", items: [{ external_id: "lic:9000001A", data: { first: "Hugo", last: "Lefèvre", role: "Moniteur", email: "hugo@exemple.fr" } }] },
  { coll: "forfaits", items: [{ external_id: "tarif:forfait-annuel", data: { name: "Forfait annuel 1 h / semaine", price: "780,00 €", vat: 5.5, kind: "annuel", sessions: 33 } }] },
  { coll: "members", items: [
    { external_id: "lic:1234567A", data: { first: "Léa", last: "Martin", birth: "14/03/2012", email: " Lea.Martin@Exemple.FR ", phone: "+33612345678", guardians: ["ext:lic:7654321B"], forfait: "ext:tarif:forfait-annuel", balance: "-195,00 €", address: { ligne1: "12 chemin des Tilleuls", code_postal: "78730", ville: "Saint-Arnoult" }, roles: ["cavalier"] } },
    { external_id: "lic:7654321B", data: { first: "Sophie", last: "Martin", email: "sophie.martin@exemple.fr", phone: "06.98.76.54.32", roles: ["responsable"] } },
  ] },
  { coll: "horses", items: [{ external_id: "sire:15012345K", data: { name: "Ulysse de la Roche", sire: "15012345k", chip: "250 259 600 418 731", owner: "ext:lic:7654321B", sex: "hongre", born: 2015 } }] },
  { coll: "lessons", items: [{ external_id: "reprise:galop-3-4-3-14-00", data: { dow: 3, start: "14:00", dur: 60, title: "Galop 3-4", coachName: "Hugo", arenaName: "Grand manège", riders: ["ext:lic:1234567A"], horses: { "ext:lic:1234567A": "ext:sire:15012345K" } } }] },
  { coll: "care", items: [{ external_id: "soin:sire:15012345K:2026-10-02:vaccin", data: { horse: "ext:sire:15012345K", kind: "Vaccin", date: "02/10/2026", next: "2027-04-02", cost: "65 €", who: "Dr Leroy" } }] },
  { coll: "invoices", items: [{ external_id: "facture:FA2026-0412", data: { id: "FA2026-0412", member: "ext:lic:7654321B", amount: "1 234,56 €", date: "01/09/2026", lines: [{ libelle: "Forfait", total_ttc: 1234.56 }], paid: 1000, rest: 234.56, imported: true } }] },
  { coll: "payments", items: [{ external_id: "reglement:2026-09-05:1000:CHQ1", data: { date: "05/09/2026", member: "ext:lic:7654321B", amount: 1000, method: "Chèque", invoice: "ext:facture:FA2026-0412", ref: "CHQ1" } }] },
];

async function runJob(token: string, o: { source?: string; dry_run?: boolean; lots?: typeof LOTS } = {}) {
  const r = await post("/api/v1/import/jobs", token, { source: o.source || "kavalog", dry_run: o.dry_run });
  expect(r.status).toBe(201);
  const { job_id } = (await r.json()) as any;
  for (const l of o.lots || LOTS) {
    const x = await post(`/api/v1/import/jobs/${job_id}/items`, token, l);
    expect(x.status, await x.clone().text()).toBe(200);
  }
  const c = await post(`/api/v1/import/jobs/${job_id}/commit`, token);
  expect(c.status, await c.clone().text()).toBe(200);
  return { job_id, report: (await c.json()) as any };
}
const count = async (club: string, coll: string) => (await env.DB.prepare("SELECT COUNT(*) AS n FROM records WHERE club_id = ? AND coll = ? AND deleted = 0").bind(club, coll).first<any>()).n;

describe("normalisation", () => {
  it("téléphones, dates françaises, montants, SIRE et puces", () => {
    expect(normPhone("+33612345678").value).toBe("06 12 34 56 78");
    expect(normPhone("612345678").value).toBe("06 12 34 56 78");
    expect(normPhone("0033 1 34 00 00 00").value).toBe("01 34 00 00 00");
    expect(normDate("14/03/2012").value).toBe("2012-03-14");
    expect(normDate("1/9/26").value).toBe("2026-09-01");
    expect(normDate("31/02/2020").ok).toBe(false);
    expect(normDate(45000).value).toBe("2023-03-15");
    expect(normAmount("1 234,56 €").value).toBe(1234.56);
    expect(normAmount("1.234,56").value).toBe(1234.56);
    expect(normAmount("-195,00 €").value).toBe(-195);
    expect(normAmount("(42,50)").value).toBe(-42.5);
    expect(normAmount("abc").ok).toBe(false);
    expect(normSire("15 012 345 k")).toEqual({ value: "15012345K", ok: true });
    expect(normChip("250 259 600 418 731")).toEqual({ value: "250259600418731", ok: true });
    expect(normChip("2,50259E+14").ok).toBe(false);
  });
});

describe("API d'import : jobs", () => {
  it("applique un import complet : ids au format de la démo, références ext: traduites, normalisation", async () => {
    const o = await seed("owner");
    await putRecord(o.clubId, "club", "_", { arenas: [{ id: "a1", name: "Grand manège" }] });
    const key = await apiKey(o.clubId);
    const { report } = await runJob(key);
    expect(report.status).toBe("committed");
    expect(report.counts.members).toMatchObject({ received: 2, created: 2, errors: 0 });
    expect(report.counts.payments).toMatchObject({ received: 1, created: 1 });
    const lea = report.ids.members["lic:1234567A"], sophie = report.ids.members["lic:7654321B"];
    expect(lea).toMatch(/^m\d{3}$/);
    expect(report.ids.horses["sire:15012345K"]).toMatch(/^h\d{2}$/);
    expect(report.ids.forfaits["tarif:forfait-annuel"]).toMatch(/^f\d$/);
    const m = (await getRecord(o.clubId, "members", lea))!.data;
    expect(m).toMatchObject({ id: lea, email: "lea.martin@exemple.fr", phone: "06 12 34 56 78", birth: "2012-03-14", minor: true, balance: -195, guardians: [sophie], forfait: report.ids.forfaits["tarif:forfait-annuel"] });
    expect(m.address.ville).toBe("Saint-Arnoult");
    const h = (await getRecord(o.clubId, "horses", report.ids.horses["sire:15012345K"]))!.data;
    expect(h).toMatchObject({ owner: sophie, sire: "15012345K", chip: "250259600418731", sex: "Hongre", kind: "proprietaire", alerts: [] });
    const l = (await getRecord(o.clubId, "lessons", report.ids.lessons["reprise:galop-3-4-3-14-00"]))!.data;
    expect(l.riders).toEqual([lea]);
    expect(l.horses).toEqual({ [lea]: h.id });
    expect(l.coach).toBe(report.ids.staff["lic:9000001A"]);
    expect(l.arena).toBe("a1");
    expect(l.day).toBe("Mer");
    const inv = (await getRecord(o.clubId, "invoices", report.ids.invoices["facture:FA2026-0412"]))!.data;
    expect(inv).toMatchObject({ number: "FA2026-0412", amount: 1234.56, date: "2026-09-01", readonly: true, imported: true, member: sophie });
    expect(inv.payments).toEqual([expect.objectContaining({ id: report.ids.payments["reglement:2026-09-05:1000:CHQ1"], amount: 1000, date: "2026-09-05", member: sophie })]);
    const care = (await getRecord(o.clubId, "care", report.ids.care["soin:sire:15012345K:2026-10-02:vaccin"]))!.data;
    expect(care).toMatchObject({ date: "2026-10-02", cost: 65, status: "fait" });
  });
  it("idempotent : un second passage ne crée rien, une modification met à jour", async () => {
    const o = await seed("owner");
    const key = await apiKey(o.clubId);
    const first = await runJob(key);
    const before = await count(o.clubId, "members");
    const second = await runJob(key);
    expect(second.report.totals.created).toBe(0);
    expect(second.report.counts.members.unchanged).toBe(2);
    expect(second.report.counts.payments.unchanged).toBe(1);
    expect(second.report.ids).toEqual(first.report.ids);
    expect(await count(o.clubId, "members")).toBe(before);
    const lots = JSON.parse(JSON.stringify(LOTS));
    lots[2].items[0].data.phone = "0700000000";
    const third = await runJob(key, { lots });
    expect(third.report.counts.members).toMatchObject({ updated: 1, unchanged: 1 });
    const m = await getRecord(o.clubId, "members", first.report.ids.members["lic:1234567A"]);
    expect(m!.data.phone).toBe("07 00 00 00 00");
    expect(m!.version).toBe(2);
  });
  it("simulation : même rapport, aucune écriture ; puis application du même job", async () => {
    const o = await seed("owner");
    const key = await apiKey(o.clubId);
    const sim = await runJob(key, { dry_run: true });
    expect(sim.report.dry_run).toBe(true);
    expect(sim.report.status).toBe("simulated");
    expect(await count(o.clubId, "members")).toBe(0);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM import_map WHERE club_id = ?").bind(o.clubId).first<any>()).n).toBe(0);
    const real: any = await (await post(`/api/v1/import/jobs/${sim.job_id}/commit`, key, { dry_run: false })).json();
    expect(real.counts).toEqual(sim.report.counts);
    expect(real.warnings).toEqual(sim.report.warnings);
    expect(await count(o.clubId, "members")).toBe(2);
    expect((await post(`/api/v1/import/jobs/${sim.job_id}/commit`, key)).status).toBe(409);
  });
  it("annulation : supprime ce que le job a créé et restaure ce qu'il a modifié", async () => {
    const o = await seed("owner");
    const key = await apiKey(o.clubId);
    const a = await runJob(key);
    const lots = JSON.parse(JSON.stringify(LOTS));
    lots[2].items[1].data.phone = "0711111111";
    const b = await runJob(key, { lots: [lots[2], { coll: "stock", items: [{ external_id: "foin", data: { name: "Foin de prairie", qty: "34" } }] }] });
    expect(b.report.counts.members.updated).toBe(1);
    const r = await post(`/api/v1/import/jobs/${b.job_id}/rollback`, key);
    expect(r.status).toBe(200);
    const j: any = await r.json();
    expect(j).toMatchObject({ status: "rolled_back", deleted: 1, restored: 1 });
    const sophie = await getRecord(o.clubId, "members", a.report.ids.members["lic:7654321B"]);
    expect(sophie!.data.phone).toBe("06 98 76 54 32");
    expect((await getRecord(o.clubId, "stock", b.report.ids.stock.foin))!.deleted).toBe(1);
    expect((await post(`/api/v1/import/jobs/${b.job_id}/rollback`, key)).status).toBe(409);
    const ra = await post(`/api/v1/import/jobs/${a.job_id}/rollback`, key);
    expect(ra.status).toBe(200);
    expect(await count(o.clubId, "members")).toBe(0);
    const again = await runJob(key);
    expect(again.report.totals.created).toBeGreaterThan(5);
    expect(again.report.ids.members["lic:1234567A"]).not.toBe(a.report.ids.members["lic:1234567A"]);
  });
  it("doublons : même e-mail qu'une fiche existante, même SIRE, ou doublon interne au job", async () => {
    const o = await seed("owner");
    const key = await apiKey(o.clubId);
    await putRecord(o.clubId, "members", "m001", { first: "Léa", last: "Martin", email: "lea.martin@exemple.fr", galop: 5 });
    await putRecord(o.clubId, "horses", "h01", { name: "Ulysse", sire: "15012345K" });
    const { report } = await runJob(key, { lots: [
      { coll: "members", items: [
        { external_id: "A1", data: { first: "Léa", last: "MARTIN", email: "lea.martin@exemple.fr", phone: "0612345678", galop: 7 } },
        { external_id: "A2", data: { first: "Tom", last: "Durand", birth: "2010-05-02" } },
        { external_id: "A3", data: { first: "Tom", last: "Durand", birth: "02/05/2010", email: "tom@exemple.fr" } },
      ] },
      { coll: "horses", items: [{ external_id: "C1", data: { name: "Ulysse de la Roche", sire: "15012345K", breed: "Selle Français" } }] },
    ] });
    expect(report.ids.members.A1).toBe("m001");
    expect(report.ids.members.A3).toBe(report.ids.members.A2);
    expect(report.ids.horses.C1).toBe("h01");
    expect(report.warnings.map((w: any) => w.code)).toEqual(expect.arrayContaining(["duplicate_merged", "duplicate_in_job"]));
    const m = (await getRecord(o.clubId, "members", "m001"))!.data;
    expect(m.galop).toBe(5);              // la fiche existante l'emporte
    expect(m.phone).toBe("06 12 34 56 78"); // champ vide complété
    const tom = (await getRecord(o.clubId, "members", report.ids.members.A2))!.data;
    expect(tom.email).toBe("tom@exemple.fr");
    expect(await count(o.clubId, "members")).toBe(2);
    expect(report.ids.members.A2).toBe("m002");
  });
  it("erreurs claires : objet invalide, référence obligatoire introuvable, appels mal formés", async () => {
    const o = await seed("owner");
    const key = await apiKey(o.clubId);
    const { job_id } = (await (await post("/api/v1/import/jobs", key, { source: "equimondo" })).json()) as any;
    expect((await post(`/api/v1/import/jobs/${job_id}/items`, key, { coll: "chevaux", items: [{ external_id: "x", data: {} }] })).status).toBe(400);
    expect((await post(`/api/v1/import/jobs/${job_id}/items`, key, { coll: "members", items: Array.from({ length: 501 }, (_, i) => ({ external_id: "e" + i, data: { last: "X" } })) })).status).toBe(400);
    const bad = await post(`/api/v1/import/jobs/${job_id}/items`, key, { coll: "members", items: [{ external_id: "", data: {} }, { external_id: "ok", data: [] }] });
    expect(bad.status).toBe(422);
    expect(((await bad.json()) as any).error.details.invalid.length).toBe(2);
    expect((await post("/api/v1/import/jobs", key, { source: "Kava Log!" })).status).toBe(400);
    await post(`/api/v1/import/jobs/${job_id}/items`, key, { coll: "members", items: [{ external_id: "M1", data: { email: "pas-un-mail", first: "" } }, { external_id: "M2", data: { last: "Petit", email: "faux@", phone: "12" } }] });
    await post(`/api/v1/import/jobs/${job_id}/items`, key, { coll: "care", items: [{ external_id: "S1", data: { horse: "ext:inconnu", kind: "Vaccin", date: "2026-01-01" } }] });
    const rep: any = await (await post(`/api/v1/import/jobs/${job_id}/commit`, key)).json();
    expect(rep.counts.members).toMatchObject({ received: 2, created: 1, errors: 1 });
    expect(rep.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ coll: "members", external_id: "M1", code: "missing_field" }),
      expect.objectContaining({ coll: "care", external_id: "S1", code: "unresolved_ref" }),
    ]));
    expect(rep.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ external_id: "M2", code: "invalid_email" }), expect.objectContaining({ external_id: "M2", code: "invalid_phone" })]));
    const job: any = await (await call(`/api/v1/import/jobs/${job_id}`, { token: key })).json();
    expect(job.status).toBe("committed");
    expect(job.report.totals.errors).toBe(2);
  });
  it("droits et isolation : adhérent 403, clé sans le droit 403, autre club 404, gérant par session", async () => {
    const o = await seed("owner");
    const m = await seed("member", { clubId: o.clubId });
    expect((await post("/api/v1/import/jobs", m.token, { source: "csv" })).status).toBe(403);
    const noScope = await apiKey(o.clubId, ["read"]);
    expect((await post("/api/v1/import/jobs", noScope, { source: "csv" })).status).toBe(403);
    expect((await call("/api/v1/import/jobs")).status).toBe(401);
    const r = await post("/api/v1/import/jobs", o.token, { source: "csv" });
    expect(r.status).toBe(201);
    const { job_id } = (await r.json()) as any;
    const other = await seed("owner");
    const otherKey = await apiKey(other.clubId);
    expect((await call(`/api/v1/import/jobs/${job_id}`, { token: otherKey })).status).toBe(404);
    expect((await post(`/api/v1/import/jobs/${job_id}/items`, otherKey, { coll: "members", items: [{ external_id: "x", data: { last: "X" } }] })).status).toBe(404);
  });
  it("un adhérent importé ne déclenche ni invitation ni e-mail de bienvenue", async () => {
    const o = await seed("owner");
    const key = await apiKey(o.clubId);
    await runJob(key);
    await new Promise((r) => setTimeout(r, 50));
    const inv = await env.DB.prepare("SELECT COUNT(*) AS n FROM invitations WHERE club_id = ?").bind(o.clubId).first<any>();
    const mails = await env.DB.prepare("SELECT COUNT(*) AS n FROM email_outbox WHERE club_id = ? AND template IN ('welcome_member','invitation','booking_confirmed')").bind(o.clubId).first<any>();
    expect(inv.n).toBe(0);
    expect(mails.n).toBe(0);
  });
});
