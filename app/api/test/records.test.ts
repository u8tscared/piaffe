import { describe, it, expect, beforeAll } from "vitest";
import { api, post, putRecords, env, lastMail, mails, waitFor, uniq } from "./auth-kit";
import { seed } from "./helpers";
import { on } from "../src/lib/events";

const saved: any[] = [];
on("record.saved", (_e, ev) => { saved.push(ev); });

/** Club de démonstration minimal : familles, chevaux, reprises, factures, contrats, messages. */
async function fixture() {
  const o = await seed("owner");
  const c = o.clubId;
  await putRecords(c, "members", [
    { id: "m001", first: "Léa", last: "Martin", fam: "F1", balance: -410, forfait: "f5", phone: "06 00 00 00 01", email: "lea@exemple.fr", lic: "123A" },
    { id: "m002", first: "Zoé", last: "Martin", fam: "F1", minor: true, balance: 0, phone: "06 00 00 00 02" },
    { id: "m003", first: "Hugo", last: "Petit", fam: "F3", balance: -50, phone: "06 00 00 00 03", email: "hugo@exemple.fr" },
    { id: "m004", first: "Inès", last: "Roux", fam: "F4", balance: 0, phone: "06 00 00 00 04" },
    { id: "m010", first: "Jade", last: "Simon", fam: "F10", minor: true },
    { id: "m011", first: "Tom", last: "Simon", fam: "F10", minor: true },
  ]);
  await putRecords(c, "horses", [
    { id: "h01", name: "Ulysse", owner: "m001", kind: "proprietaire", costMonth: 520, box: "B01" },
    { id: "h02", name: "Quiétude", kind: "club", costMonth: 300 },
    { id: "h03", name: "Vanille", owner: "m004", kind: "proprietaire", costMonth: 480 },
  ]);
  await putRecords(c, "halfboard", [{ id: "dp1", horse: "h03", rider: "m003", price: 180, status: "Actif" }]);
  await putRecords(c, "staff", [{ id: "s02", first: "Hugo", last: "Lefèvre", role: "Moniteur", contract: "CDI 35 h", hours: 35 }, { id: "s05", first: "Sami", last: "Diallo", role: "Palefrenier", contract: "CDI 39 h" }]);
  await putRecords(c, "coaches", [{ id: "c05", first: "Hugo", last: "Lefèvre", staff: "s02", rate: 38 }, { id: "c01", first: "Pauline", last: "Arnaud", rate: 55 }]);
  await putRecords(c, "lessons", [
    { id: "l01", title: "Galop 3-4", day: "Mar", start: "17:00", coach: "s02", cap: 3, riders: ["m002", "m003"], horses: { m002: "h02", m003: "h02" }, notes: "Zoé a peur du galop" },
    { id: "l02", title: "Galop 6", day: "Mer", start: "18:00", coach: "c01", cap: 2, riders: ["m004", "m010"], horses: {}, waitlist: ["m003"] },
  ]);
  await putRecords(c, "invoices", [
    { id: "F-1", member: "m001", amount: 520, vat: 20, status: "en retard", label: "Pension" },
    { id: "F-2", member: "m003", amount: 95, vat: 20, status: "payée" },
    { id: "F-3", member: "m002", amount: 290, vat: 20, status: "brouillon" },
  ]);
  await putRecords(c, "contracts", [
    { id: "ct1", title: "Pension", party: "m001", status: "signé" },
    { id: "ct2", title: "Demi-pension", party: "m003", horse: "h03", status: "à signer", signers: ["m004", "m003", "s01"], signed: ["s01"] },
  ]);
  await putRecords(c, "threads", [{ id: "th1", with: "m001", title: "Léa Martin" }, { id: "th2", with: "m003", title: "Hugo Petit" }]);
  await putRecords(c, "care", [{ id: "s1", horse: "h01", kind: "Maréchal" }, { id: "s2", horse: "h02", kind: "Vermifuge" }]);
  await putRecords(c, "bank", [{ id: "b1", label: "URSSAF", amount: -5120 }]);
  await putRecords(c, "club", [{ id: "_", name: "Écurie Test", arenas: [{ id: "a1", name: "Grand manège" }] }]);
  const member = await seed("member", { clubId: c, personRef: "m001" });
  const parent = await seed("member", { clubId: c, personRef: "m010,m011" });
  const rider = await seed("member", { clubId: c, personRef: "m003" });
  const staff = await seed("staff", { clubId: c, personRef: "s05" });
  const coach = await seed("coach", { clubId: c, personRef: "c05" });
  const accountant = await seed("accountant", { clubId: c });
  return { o, c, member, parent, rider, staff, coach, accountant };
}
type F = Awaited<ReturnType<typeof fixture>>;
const boot = async (token: string) => (await (await api("/api/club/bootstrap", { token })).json()) as any;
const batch = async (token: string, ops: unknown[]) => {
  const r = await post("/api/records/batch", { ops }, { token });
  return { status: r.status, body: (await r.json()) as any };
};
const ids = (a: any[] | undefined) => (a || []).map((x) => x.id).sort();

let f: F;
beforeAll(async () => { f = await fixture(); });

describe("bootstrap", () => {
  it("gérant : toutes les collections au format de la démo, versions, club", async () => {
    const b = await boot(f.o.token);
    expect(b.club).toMatchObject({ id: f.c, plan: "trial" });
    expect(b.me).toMatchObject({ role: "owner" });
    expect(ids(b.data.members)).toEqual(["m001", "m002", "m003", "m004", "m010", "m011"]);
    expect(b.data.members.find((m: any) => m.id === "m001").balance).toBe(-410);
    expect(b.data.bank.length).toBe(1);
    expect(b.data.club).toMatchObject({ name: "Écurie Test" });
    expect(Array.isArray(b.data.club)).toBe(false);
    expect(b.versions["members/m001"]).toBe(1);
    expect(b.singletons).toContain("club");
    expect(typeof b.server_time).toBe("string");
  });

  it("adhérent : sa fiche et sa famille, ses chevaux, ses factures, ses contrats, ses messages", async () => {
    const b = await boot(f.member.token);
    expect(b.me).toMatchObject({ role: "member", person_ref: "m001", person_ids: ["m001"] });
    expect(ids(b.data.members)).toEqual(["m001", "m002", "m003"]); // m003 : cavalier de la même reprise que Zoé
    const peer = b.data.members.find((m: any) => m.id === "m003");
    expect(peer).not.toHaveProperty("phone");
    expect(peer).not.toHaveProperty("email");
    expect(peer).not.toHaveProperty("balance");
    expect(b.data.members.find((m: any) => m.id === "m002").phone).toBe("06 00 00 00 02");
    expect(b.data.horses.find((h: any) => h.id === "h01").costMonth).toBe(520);
    expect(b.data.horses.find((h: any) => h.id === "h03")).not.toHaveProperty("costMonth");
    expect(b.data.horses.find((h: any) => h.id === "h03")).not.toHaveProperty("owner");
    expect(ids(b.data.invoices)).toEqual(["F-1", "F-3"]);
    expect(ids(b.data.contracts)).toEqual(["ct1"]);
    expect(ids(b.data.threads)).toEqual(["th1"]);
    expect(ids(b.data.care)).toEqual(["s1"]);
    expect(ids(b.data.lessons)).toEqual(["l01", "l02"]);
    expect(b.data.bank).toBeUndefined();
    expect(b.data.halfboard).toBeUndefined();
    expect(b.data.staff[0]).not.toHaveProperty("contract");
  });

  it("parent lié à deux fiches (person_ref « m010,m011 ») voit ses deux enfants", async () => {
    const b = await boot(f.parent.token);
    expect(ids(b.data.members)).toEqual(["m004", "m010", "m011"]);
    expect(b.data.members.find((m: any) => m.id === "m004")).not.toHaveProperty("phone");
  });

  it("demi-pensionnaire : le cheval en demi-pension, le contrat à signer, la demi-pension", async () => {
    const b = await boot(f.rider.token);
    expect(b.data.horses.find((h: any) => h.id === "h03").owner).toBe("m004");
    expect(ids(b.data.halfboard)).toEqual(["dp1"]);
    expect(ids(b.data.contracts)).toEqual(["ct2"]);
    expect(ids(b.data.invoices)).toEqual(["F-2"]);
  });

  it("employé : le terrain, un annuaire réduit, rien de financier", async () => {
    const b = await boot(f.staff.token);
    expect(ids(b.data.horses)).toEqual(["h01", "h02", "h03"]);
    expect(b.data.horses[0]).not.toHaveProperty("costMonth");
    expect(ids(b.data.care)).toEqual(["s1", "s2"]);
    expect(b.data.members[0]).not.toHaveProperty("balance");
    expect(b.data.members[0]).not.toHaveProperty("email");
    expect(b.data.members[0]).toHaveProperty("phone");
    expect(b.data.invoices).toBeUndefined();
    expect(b.data.bank).toBeUndefined();
    expect(b.data.contracts).toBeUndefined();
    expect(b.data.staff.find((s: any) => s.id === "s05").contract).toBe("CDI 39 h");
    expect(b.data.staff.find((s: any) => s.id === "s02")).not.toHaveProperty("contract");
  });

  it("coach : ses reprises en entier, les autres sans cavaliers, ses élèves avec coordonnées", async () => {
    const b = await boot(f.coach.token);
    const l01 = b.data.lessons.find((l: any) => l.id === "l01"), l02 = b.data.lessons.find((l: any) => l.id === "l02");
    expect(l01.riders).toEqual(["m002", "m003"]);
    expect(l02).not.toHaveProperty("riders");
    expect(ids(b.data.members)).toEqual(["m002", "m003"]);
    expect(b.data.members.find((m: any) => m.id === "m003").email).toBe("hugo@exemple.fr");
    expect(b.data.members[0]).not.toHaveProperty("balance");
    expect(b.data.invoices).toBeUndefined();
  });

  it("comptable : rien dans les données du club", async () => {
    const b = await boot(f.accountant.token);
    expect(b.data).toMatchObject({ club: { name: expect.any(String) } });
    expect(Object.keys(b.data)).toEqual(["club"]);
  });

  it("isolation : un autre club ne voit aucune donnée, l'en-tête X-Piaffe-Club d'un club étranger est ignoré", async () => {
    const other = await seed("owner");
    const b = await boot(other.token);
    expect(b.data.members).toBeUndefined();
    const r = await api("/api/club/bootstrap", { token: other.token, club: f.c });
    expect(r.status).toBe(403);
    expect((await api("/api/club/bootstrap")).status).toBe(401);
  });
});

describe("lot d'écritures", () => {
  it("crée, met à jour avec version, détecte le conflit, supprime ; émet record.saved", async () => {
    const r1 = await batch(f.o.token, [{ op: "upsert", coll: "tasks", id: "t1", data: { title: "Curer les boxes", done: false } }]);
    expect(r1.body.results[0]).toMatchObject({ coll: "tasks", id: "t1", ok: true, version: 1 });
    expect(r1.body.results[0].data).toEqual({ id: "t1", title: "Curer les boxes", done: false });
    await waitFor(() => saved.find((e) => e.coll === "tasks" && e.id === "t1" && e.previous === null && e.via === "app"));
    const r2 = await batch(f.o.token, [{ op: "upsert", coll: "tasks", id: "t1", version: 1, data: { title: "Curer les boxes", done: true } }]);
    expect(r2.body.results[0]).toMatchObject({ ok: true, version: 2 });
    const r3 = await batch(f.o.token, [{ op: "upsert", coll: "tasks", id: "t1", version: 1, data: { title: "Écrasement", done: false } }]);
    expect(r3.body.results[0]).toMatchObject({ ok: false, conflict: true, version: 2, data: { done: true } });
    const r4 = await batch(f.o.token, [{ op: "delete", coll: "tasks", id: "t1", version: 2 }]);
    expect(r4.body.results[0]).toMatchObject({ ok: true, deleted: true, version: 3 });
    const again = await batch(f.o.token, [{ op: "delete", coll: "tasks", id: "t1" }]);
    expect(again.body.results[0].ok).toBe(true);
    const b = await boot(f.o.token);
    expect(b.data.tasks).toBeUndefined();
    const audit = await env.DB.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE club_id = ? AND action = 'records.batch'").bind(f.c).first<any>();
    expect(audit.n).toBeGreaterThanOrEqual(3);
  });

  it("plusieurs opérations sur le même objet dans un lot s'enchaînent", async () => {
    const r = await batch(f.o.token, [
      { op: "upsert", coll: "stock", id: "k9", data: { name: "Foin", qty: 10 } },
      { op: "upsert", coll: "stock", id: "k9", version: 1, data: { name: "Foin", qty: 8 } },
    ]);
    expect(r.body.results.map((x: any) => x.version)).toEqual([1, 2]);
  });

  it("valide : collection inconnue, id dangereux, objet trop gros, singleton, lot trop long", async () => {
    const big = "x".repeat(70 * 1024);
    const r = await batch(f.o.token, [
      { op: "upsert", coll: "users", id: "x", data: {} },
      { op: "upsert", coll: "tasks", id: "../etc", data: {} },
      { op: "upsert", coll: "tasks", id: "t-big", data: { note: big } },
      { op: "upsert", coll: "club", id: "autre", data: {} },
      { op: "upsert", coll: "tasks", id: "t-ok", data: "pas un objet" },
      { op: "remplacer", coll: "tasks", id: "t-ok" },
    ]);
    expect(r.body.results.map((x: any) => x.error?.code)).toEqual(["unknown_collection", "invalid_id", "too_large", "invalid_id", "invalid_data", "invalid_op"]);
    const many = Array.from({ length: 201 }, (_, i) => ({ op: "upsert", coll: "tasks", id: "t" + i, data: {} }));
    expect((await batch(f.o.token, many)).status).toBe(400);
    expect((await batch(f.o.token, { nope: 1 } as any)).status).toBe(400);
  });

  it("un lot de 200 opérations passe d'un seul tenant", async () => {
    const ops = Array.from({ length: 200 }, (_, i) => ({ op: "upsert", coll: "journal", id: "j" + i, data: { horse: "h02", text: "Séance " + i } }));
    const r = await batch(f.o.token, ops);
    expect(r.body.results.every((x: any) => x.ok)).toBe(true);
  });

  it("facture émise figée pour tous, y compris le gérant ; brouillon modifiable", async () => {
    const r = await batch(f.o.token, [
      { op: "upsert", coll: "invoices", id: "F-1", data: { id: "F-1", member: "m001", amount: 1, vat: 20, status: "payée", label: "Pension" } },
      { op: "delete", coll: "invoices", id: "F-2" },
      { op: "upsert", coll: "invoices", id: "F-3", data: { member: "m002", amount: 300, vat: 20, status: "brouillon" } },
    ]);
    expect(r.body.results[0].data).toMatchObject({ amount: 520, status: "payée" });
    expect(r.body.results[1].error.code).toBe("invoice_locked");
    expect(r.body.results[2].data.amount).toBe(300);
  });

  it("isolation : écrire avec le même id dans un autre club ne touche pas ce club", async () => {
    const other = await seed("owner");
    await batch(other.token, [{ op: "upsert", coll: "members", id: "m001", data: { first: "Intrus", balance: 0 } }]);
    const b = await boot(f.o.token);
    expect(b.data.members.find((m: any) => m.id === "m001").first).toBe("Léa");
  });
});

describe("droits d'écriture", () => {
  it("adhérent : modifie son téléphone mais ni son solde ni son forfait ; pas la fiche d'un autre", async () => {
    const r = await batch(f.member.token, [
      { op: "upsert", coll: "members", id: "m001", data: { id: "m001", first: "Léa", phone: "07 11 22 33 44", balance: 0, forfait: "f1" } },
      { op: "upsert", coll: "members", id: "m004", data: { phone: "00" } },
      { op: "upsert", coll: "members", id: "m999", data: { first: "Nouveau" } },
      { op: "delete", coll: "members", id: "m002" },
    ]);
    expect(r.body.results[0].ok).toBe(true);
    expect(r.body.results[0].data).toMatchObject({ phone: "07 11 22 33 44", balance: -410, forfait: "f5" });
    expect(r.body.results.slice(1).map((x: any) => x.error.code)).toEqual(["forbidden", "forbidden", "forbidden"]);
  });

  it("adhérent : ne peut ni changer le prix d'une facture ni en créer", async () => {
    const r = await batch(f.member.token, [
      { op: "upsert", coll: "invoices", id: "F-3", data: { member: "m002", amount: 1, status: "payée" } },
      { op: "upsert", coll: "invoices", id: "F-9", data: { member: "m001", amount: 1 } },
      { op: "upsert", coll: "bank", id: "b2", data: { amount: 1000 } },
    ]);
    expect(r.body.results.every((x: any) => x.error?.code === "forbidden")).toBe(true);
  });

  it("adhérent : inscrit son enfant à une reprise, ne peut pas désinscrire un autre cavalier ni dépasser la capacité", async () => {
    const lesson = (await boot(f.member.token)).data.lessons.find((l: any) => l.id === "l01");
    const r = await batch(f.member.token, [{ op: "upsert", coll: "lessons", id: "l01", data: { ...lesson, riders: ["m002"], title: "Piraté" } }]);
    expect(r.body.results[0].error.code).toBe("forbidden");
    const ok = await batch(f.member.token, [{ op: "upsert", coll: "lessons", id: "l01", data: { ...lesson, riders: [...lesson.riders, "m001"], cap: 99, title: "Piraté" } }]);
    expect(ok.body.results[0].ok).toBe(true);
    expect(ok.body.results[0].data).toMatchObject({ title: "Galop 3-4", cap: 3, riders: ["m002", "m003", "m001"] });
    const full = await batch(f.parent.token, [{ op: "upsert", coll: "lessons", id: "l01", data: { riders: ["m002", "m003", "m001", "m011"] } }]);
    expect(full.body.results[0].error.code).toBe("lesson_full");
  });

  it("adhérent : signe un contrat pour lui seulement, le statut passe à signé quand tout le monde a signé", async () => {
    let r = await batch(f.rider.token, [{ op: "upsert", coll: "contracts", id: "ct2", data: { signed: ["s01", "m003", "m004"] } }]);
    expect(r.body.results[0].error.code).toBe("forbidden");
    r = await batch(f.rider.token, [{ op: "upsert", coll: "contracts", id: "ct2", data: { signed: ["s01", "m003"], status: "signé", title: "Autre" } }]);
    expect(r.body.results[0].data).toMatchObject({ signed: ["s01", "m003"], status: "à signer", title: "Demi-pension" });
    r = await batch(f.o.token, [{ op: "upsert", coll: "contracts", id: "ct2", data: { ...r.body.results[0].data, signers: ["m003", "s01"] } }]);
    expect(r.body.results[0].ok).toBe(true);
  });

  it("adhérent : réserve une piste pour son cheval, déclare un cheval (statut forcé en attente)", async () => {
    const r = await batch(f.member.token, [
      { op: "upsert", coll: "trackBookings", id: "tb9", data: { who: "m001", horse: "h01", arena: "a1", date: "2026-11-20", from: "09:00", to: "10:00" } },
      { op: "upsert", coll: "trackBookings", id: "tb10", data: { who: "m001", horse: "h02", arena: "a1" } },
      { op: "upsert", coll: "trackBookings", id: "tb11", data: { who: "m004", arena: "a1" } },
      { op: "upsert", coll: "declarations", id: "dc9", data: { by: "m001", name: "Quartz", status: "validée" } },
    ]);
    expect(r.body.results.map((x: any) => x.ok)).toEqual([true, false, false, true]);
    expect(r.body.results[3].data.status).toBe("en attente");
  });

  it("employé : soins et tâches oui ; propriétaire d'un cheval, factures, adhérents non", async () => {
    const r = await batch(f.staff.token, [
      { op: "upsert", coll: "care", id: "s9", data: { horse: "h02", kind: "Vermifuge", status: "fait" } },
      { op: "upsert", coll: "horses", id: "h02", data: { name: "Quiétude", owner: "m003", costMonth: 1, weight: 512 } },
      { op: "upsert", coll: "invoices", id: "F-3", data: { amount: 1 } },
      { op: "upsert", coll: "members", id: "m001", data: { balance: 0 } },
      { op: "upsert", coll: "horses", id: "h99", data: { name: "Nouveau" } },
    ]);
    expect(r.body.results.map((x: any) => x.ok)).toEqual([true, true, false, false, false]);
    expect(r.body.results[1].data).toMatchObject({ weight: 512, kind: "club" });
    expect(r.body.results[1].data).not.toHaveProperty("owner");
    expect(r.body.results[1].data).not.toHaveProperty("costMonth"); // projection employé
    const b = await boot(f.o.token);
    expect(b.data.horses.find((h: any) => h.id === "h02")).toMatchObject({ costMonth: 300, weight: 512 });
  });

  it("coach : modifie sa reprise mais ne la donne pas à un autre ; pas celle d'un autre coach", async () => {
    const r = await batch(f.coach.token, [
      { op: "upsert", coll: "lessons", id: "l01", data: { title: "Galop 3-4 CSO", day: "Mar", start: "17:00", coach: "s02", cap: 3, riders: ["m002", "m003", "m001"] } },
      { op: "upsert", coll: "lessons", id: "l02", data: { title: "Pris", coach: "c05" } },
      { op: "upsert", coll: "lessons", id: "l03", data: { title: "Nouvelle", coach: "c01" } },
      { op: "upsert", coll: "lessons", id: "l04", data: { title: "Ma nouvelle reprise", coach: "c05", cap: 4, riders: [] } },
    ]);
    expect(r.body.results.map((x: any) => x.ok)).toEqual([true, false, false, true]);
  });

  it("comptable : aucune écriture", async () => {
    const r = await batch(f.accountant.token, [{ op: "upsert", coll: "tasks", id: "tx", data: { title: "x" } }]);
    expect(r.body.results[0].error.code).toBe("forbidden");
  });

  it("clé d'API avec le droit write : écrit comme le gérant", async () => {
    const k = (await (await post("/api/api-keys", { name: "Intégration", scopes: ["write"] }, { token: f.o.token })).json()) as any;
    const r = await batch(k.token, [{ op: "upsert", coll: "stock", id: "k77", data: { name: "Copeaux", qty: 40 } }]);
    expect(r.body.results[0].ok).toBe(true);
    const row = await env.DB.prepare("SELECT updated_by FROM records WHERE club_id = ? AND coll = 'stock' AND id = 'k77'").bind(f.c).first<any>();
    expect(row.updated_by).toBe("key:" + k.api_key.id);
  });
});

describe("flux de changements", () => {
  it("renvoie les objets modifiés depuis une date, filtrés par rôle, avec les suppressions", async () => {
    const since = new Date(Date.now() - 1000).toISOString();
    await batch(f.o.token, [
      { op: "upsert", coll: "threads", id: "th7", data: { with: "m001", title: "Léa" } },
      { op: "upsert", coll: "threads", id: "th8", data: { with: "m004", title: "Inès" } },
      { op: "upsert", coll: "care", id: "s77", data: { horse: "h01" } },
    ]);
    await batch(f.o.token, [{ op: "delete", coll: "care", id: "s77" }]);
    const m = (await (await api("/api/records/changes?since=" + since, { token: f.member.token })).json()) as any;
    const keys = m.changes.map((x: any) => x.coll + "/" + x.id);
    expect(keys).toContain("threads/th7");
    expect(keys).not.toContain("threads/th8");
    expect(m.changes.find((x: any) => x.id === "s77")).toMatchObject({ deleted: true, version: 2 });
    expect(m.next_since >= since).toBe(true);
    const acc = (await (await api("/api/records/changes?since=" + since, { token: f.accountant.token })).json()) as any;
    expect(acc.changes).toEqual([]);
    expect((await api("/api/records/changes?since=hier", { token: f.o.token })).status).toBe(400);
  });

  it("pagine avec un curseur quand tout un lot partage le même horodatage", async () => {
    const since = new Date().toISOString();
    await batch(f.o.token, Array.from({ length: 5 }, (_, i) => ({ op: "upsert", coll: "pharmacy", id: "p" + i, data: { name: "Produit " + i } })));
    const got: string[] = [];
    let cursor = since;
    for (let i = 0; i < 20; i++) {
      const r = (await (await api(`/api/records/changes?limit=2&since=${encodeURIComponent(cursor)}`, { token: f.o.token })).json()) as any;
      got.push(...r.changes.filter((x: any) => x.coll === "pharmacy").map((x: any) => x.id));
      if (!r.more) break;
      cursor = r.next_since;
    }
    expect([...new Set(got)].sort()).toEqual(["p0", "p1", "p2", "p3", "p4"]);
  });
});

describe("déclencheurs", () => {
  it("nouvel adhérent avec e-mail : invitation et e-mail de bienvenue ; un frère ou une sœur s'ajoute à la même invitation", async () => {
    const email = uniq("famille");
    await batch(f.o.token, [{ op: "upsert", coll: "members", id: "m050", data: { first: "Rose", last: "Blanc", fam: "F50", email } }]);
    const m = await waitFor(() => lastMail("welcome_member", email));
    expect(m.data).toMatchObject({ first: "Rose", club_name: "Écurie Test", member_first: "Rose" });
    expect(String(m.data.action_url)).toMatch(/^http:\/\/piaffe\.test\/invitation\//);
    const n = mails.length;
    await batch(f.o.token, [{ op: "upsert", coll: "members", id: "m051", data: { first: "Paul", last: "Blanc", fam: "F50", email } }]);
    await new Promise((r) => setTimeout(r, 200));
    const inv = await env.DB.prepare("SELECT person_ref, source FROM invitations WHERE email = ? AND revoked_at IS NULL").bind(email).first<any>();
    expect(inv).toMatchObject({ person_ref: "m050,m051", source: "auto" });
    expect(mails.length).toBe(n);
  });

  it("option du club désactivée ou import : pas d'e-mail", async () => {
    await env.DB.prepare("UPDATE clubs SET settings = '{\"welcome_member_email\":false}' WHERE id = ?").bind(f.c).run();
    const email = uniq("off");
    await batch(f.o.token, [{ op: "upsert", coll: "members", id: "m060", data: { first: "Lou", email } }]);
    await new Promise((r) => setTimeout(r, 150));
    expect(lastMail("welcome_member", email)).toBeUndefined();
    await env.DB.prepare("UPDATE clubs SET settings = '{}' WHERE id = ?").bind(f.c).run();
  });

  it("réservation d'une reprise : booking_confirmed ; place libérée : waitlist_spot au premier de la liste", async () => {
    const lesson = (await boot(f.o.token)).data.lessons.find((l: any) => l.id === "l02");
    await batch(f.o.token, [{ op: "upsert", coll: "lessons", id: "l02", data: { ...lesson, riders: ["m004"] } }]);
    const w = await waitFor(() => lastMail("waitlist_spot", "hugo@exemple.fr"));
    expect(w.data).toMatchObject({ first: "Hugo", lesson_title: "Galop 6", day: "mercredi", start: "18:00", coach_name: "Pauline Arnaud" });
    const l1 = (await boot(f.o.token)).data.lessons.find((l: any) => l.id === "l01");
    await batch(f.o.token, [{ op: "upsert", coll: "lessons", id: "l01", data: { ...l1, riders: l1.riders.filter((x: string) => x !== "m003") } }]);
    const l1b = (await boot(f.o.token)).data.lessons.find((l: any) => l.id === "l01");
    await batch(f.o.token, [{ op: "upsert", coll: "lessons", id: "l01", data: { ...l1b, riders: [...l1b.riders, "m003"] } }]);
    const b = await waitFor(() => lastMail("booking_confirmed", "hugo@exemple.fr"));
    expect(b.data).toMatchObject({ lesson_title: expect.any(String), day: "mardi", coach_name: "Hugo Lefèvre", club_name: "Écurie Test" });
  });
});
