import { describe, it, expect } from "vitest";
import { env, call, seed } from "./helpers";
import { newId } from "../src/lib/ids";

const j = async (r: Response) => (await r.json()) as any;
const put = (clubId: string, coll: string, id: string, data: Record<string, unknown>) =>
  env.DB.prepare("INSERT OR REPLACE INTO records (club_id, coll, id, data) VALUES (?,?,?,?)").bind(clubId, coll, id, JSON.stringify({ id, ...data })).run();
const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

async function club(name: string) {
  const g = await seed("owner");
  await env.DB.prepare("UPDATE clubs SET name = ? WHERE id = ?").bind(name, g.clubId).run();
  await put(g.clubId, "practitioners", "p1", { name: "Dr Antoine Leclerc", short: "Dr Leclerc", job: "Vétérinaire", kinds: ["Vétérinaire"] });
  await put(g.clubId, "members", "m001", { first: "Léa", last: "Martin", phone: "06 00 00 00 01", email: "lea@exemple.fr", balance: -120, forfait: "f1" });
  await put(g.clubId, "members", "m002", { first: "Hugo", last: "Roux", phone: "06 00 00 00 02" });
  await put(g.clubId, "horses", "h01", { name: "Ulysse", owner: "m001", sire: "250001", costMonth: 640, weight: 560 });
  await put(g.clubId, "invoices", "F-1", { member: "m001", amount: 520 });
  return g;
}

describe("espace praticien (rôle provider)", () => {
  it("voit la santé des chevaux et le contact des propriétaires, rien de financier", async () => {
    const g = await club("Écurie A");
    const v = await seed("provider", { clubId: g.clubId, personRef: "p1" });
    const b = await j(await call("/api/club/bootstrap", { token: v.token }));
    expect(b.data.horses[0]).toMatchObject({ name: "Ulysse", sire: "250001", owner: "m001", weight: 560 });
    expect(b.data.horses[0].costMonth).toBeUndefined();
    expect(b.data.members.map((m: any) => m.id)).toEqual(["m001"]);
    expect(b.data.members[0].phone).toBe("06 00 00 00 01");
    expect(b.data.members[0].balance).toBeUndefined();
    expect(b.data.invoices || []).toEqual([]);
  });

  it("note un acte (signé à son nom), ne supprime rien, ne crée pas de demande à la place du club", async () => {
    const g = await club("Écurie B");
    const v = await seed("provider", { clubId: g.clubId, personRef: "p1" });
    let r = await j(await call("/api/records/batch", { method: "POST", token: v.token, json: { ops: [
      { op: "upsert", coll: "care", id: "s9", data: { id: "s9", horse: "h01", kind: "Vétérinaire", who: "Dr Leclerc", date: today(), status: "fait", pro: "autre" } },
      { op: "upsert", coll: "proActs", id: "a1", data: { id: "a1", horse: "h01", price: 68 } },
      { op: "upsert", coll: "invoices", id: "F-2", data: { id: "F-2", amount: 1 } },
      { op: "upsert", coll: "proRequests", id: "r1", data: { id: "r1", horse: "h01" } },
      { op: "delete", coll: "care", id: "s9" },
    ] } }));
    expect(r.results.map((x: any) => x.ok)).toEqual([true, true, false, false, false]);
    const row = await env.DB.prepare("SELECT data FROM records WHERE club_id = ? AND coll = 'care' AND id = 's9'").bind(g.clubId).first<{ data: string }>();
    expect(JSON.parse(row!.data).pro).toBe("p1");
    // le gérant ne peut plus voir un acte « fait » réécrit par un autre praticien
    await put(g.clubId, "care", "s10", { horse: "h01", status: "fait", pro: "p2" });
    r = await j(await call("/api/records/batch", { method: "POST", token: v.token, json: { ops: [{ op: "upsert", coll: "care", id: "s10", data: { id: "s10", horse: "h01", status: "fait", note: "changé" } }] } }));
    expect(r.results[0].ok).toBe(false);
  });

  it("tournée : ses visites et demandes dans toutes ses écuries", async () => {
    const a = await club("Écurie A");
    const b = await club("Écurie B");
    const v = await seed("provider", { clubId: a.clubId, personRef: "p1" });
    await env.DB.prepare("INSERT INTO memberships (user_id, club_id, role, person_ref) VALUES (?,?,?,?)").bind(v.userId, b.clubId, "provider", "p1").run();
    await put(a.clubId, "care", "c1", { horse: "h01", kind: "Vétérinaire", who: "Dr Leclerc", date: inDays(1), time: "10:00", status: "planifié" });
    await put(a.clubId, "care", "c2", { horse: "h01", kind: "Maréchal", who: "Benoît Gautier", date: inDays(1), status: "planifié" });
    await put(a.clubId, "care", "c3", { horse: "h01", kind: "Vétérinaire", who: "Dr Leclerc", date: inDays(-3), status: "fait" });
    await put(b.clubId, "care", "c4", { horse: "h01", kind: "Vaccin", pro: "p1", date: today(), time: "08:30", status: "planifié" });
    await put(b.clubId, "proRequests", "r1", { horse: "h01", pro: "p1", motive: "Boiterie", urgent: true, status: "nouvelle" });
    await put(b.clubId, "proRequests", "r2", { horse: "h01", pro: "p9", motive: "Autre praticien", status: "nouvelle" });
    const t = await j(await call("/api/pro/tournee", { token: v.token }));
    expect(t.clubs.map((c: any) => c.name).sort()).toEqual(["Écurie A", "Écurie B"]);
    expect(t.visits.map((x: any) => x.id)).toEqual(["c4", "c1"]);
    expect(t.visits[1]).toMatchObject({ club_name: "Écurie A", horse: { name: "Ulysse" } });
    expect(t.requests.map((x: any) => x.id)).toEqual(["r1"]);
    // un adhérent n'a pas de tournée
    const m = await seed("member", { clubId: a.clubId, personRef: "m002" });
    expect((await j(await call("/api/pro/tournee", { token: m.token }))).visits).toEqual([]);
  });

  it("le gérant invite un praticien", async () => {
    const g = await club("Écurie C");
    const r = await call("/api/invitations", { method: "POST", token: g.token, json: { email: "veto@exemple.fr", role: "provider", person_ref: "p1", first: "Antoine", last: "Leclerc" } });
    expect(r.status).toBe(201);
  });
});
