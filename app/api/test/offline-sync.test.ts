import { describe, expect, it } from "vitest";
import { call, env, seed } from "./helpers";
import { merge3 } from "../src/records/merge";

/* Mode hors connexion : rejeu idempotent (op_id), fusion champ par champ des modifications concurrentes. */
const batch = (token: string, ops: unknown[]) =>
  call("/api/records/batch", { method: "POST", token, json: { ops } }).then(async (r: Response) => ({ status: r.status, body: (await r.json()) as any }));

describe("fusion à trois voies (merge3)", () => {
  it("garde les champs changés de chaque côté", () => {
    const base = { name: "Ulysse", box: "B1", paddock: "" };
    const m = merge3(base, { ...base, box: "B7" }, { ...base, paddock: "Pré du bas" }, true);
    expect(m).toEqual({ name: "Ulysse", box: "B7", paddock: "Pré du bas" });
  });
  it("deux réservations hors ligne dans la même reprise : les deux cavaliers sont gardés", () => {
    const base = { riders: ["m1"], horses: { m1: "h1" } };
    const srv = { riders: ["m1", "m2"], horses: { m1: "h1", m2: "h2" } };
    const loc = { riders: ["m1", "m3"], horses: { m1: "h1", m3: "h3" } };
    expect(merge3(base, srv, loc, true)).toEqual({ riders: ["m1", "m2", "m3"], horses: { m1: "h1", m2: "h2", m3: "h3" } });
  });
  it("un désistement d'un côté et une réservation de l'autre sont tous deux respectés", () => {
    expect(merge3({ riders: ["a", "b"] }, { riders: ["a", "b", "c"] }, { riders: ["a"] }, true)).toEqual({ riders: ["a", "c"] });
  });
  it("même champ changé des deux côtés : le plus récent gagne et le conflit est signalé", () => {
    const c1: any[] = [], c2: any[] = [];
    expect(merge3({ note: "x" }, { note: "serveur" }, { note: "local" }, true, "", c1)).toEqual({ note: "local" });
    expect(c1).toEqual([{ field: "note", kept: "yours" }]);
    expect(merge3({ note: "x" }, { note: "serveur" }, { note: "local" }, false, "", c2)).toEqual({ note: "serveur" });
    expect(c2[0].kept).toBe("theirs");
  });
  it("listes d'objets à id fusionnées par id", () => {
    const base = { items: [{ id: "a", q: 1 }] };
    const m = merge3(base, { items: [{ id: "a", q: 2 }] }, { items: [{ id: "a", q: 1 }, { id: "b", q: 5 }] }, true);
    expect(m).toEqual({ items: [{ id: "a", q: 2 }, { id: "b", q: 5 }] });
  });
});

describe("records/batch · rejeu et conflits", () => {
  it("une opération rejouée avec le même op_id n'est appliquée qu'une fois", async () => {
    const s = await seed("owner");
    const op = { op: "upsert", coll: "care", id: "soin_rejeu_1", data: { horse: "h1", kind: "Vermifuge" }, op_id: "op_rejeu_0001", at: new Date().toISOString() };
    const a = await batch(s.token, [op]);
    expect(a.body.results[0]).toMatchObject({ ok: true, version: 1 });
    const b = await batch(s.token, [op]); // la réponse s'est perdue, l'appareil renvoie
    expect(b.body.results[0]).toMatchObject({ ok: true, duplicate: true, version: 1 });
    const n = await env.DB.prepare("SELECT version FROM records WHERE club_id = ? AND coll = 'care' AND id = 'soin_rejeu_1'").bind(s.clubId).first<any>();
    expect(n.version).toBe(1);
  });
  it("op_id en double dans un même lot : une seule écriture", async () => {
    const s = await seed("owner");
    const op = { op: "upsert", coll: "tasks", id: "t_double", data: { title: "Curer" }, op_id: "op_double_001" };
    const r = await batch(s.token, [op, op]);
    expect(r.body.results[0].ok).toBe(true);
    expect(r.body.results[1]).toMatchObject({ ok: true, duplicate: true });
  });
  it("un conflit d'écriture n'enregistre pas l'op_id (l'opération pourra être rejouée)", async () => {
    const s = await seed("owner");
    await batch(s.token, [{ op: "upsert", coll: "tasks", id: "t_c", data: { title: "A" } }]);
    const r = await batch(s.token, [{ op: "upsert", coll: "tasks", id: "t_c", data: { title: "B" }, version: 7, op_id: "op_conflit_01" }]);
    expect(r.body.results[0].conflict).toBe(true);
    const row = await env.DB.prepare("SELECT 1 AS x FROM record_ops WHERE op_id = 'op_conflit_01'").first();
    expect(row).toBeNull();
  });
  it("modifications concurrentes de deux appareils sur des champs différents : fusionnées", async () => {
    const s = await seed("owner");
    await batch(s.token, [{ op: "upsert", coll: "horses", id: "h_fus", data: { name: "Quartz", box: "B2", paddock: "" } }]);
    const base = { id: "h_fus", name: "Quartz", box: "B2", paddock: "" };
    // appareil 1 (en ligne) change le box
    const a = await batch(s.token, [{ op: "upsert", coll: "horses", id: "h_fus", data: { ...base, box: "B9" }, version: 1, base, op_id: "op_fus_00001", at: new Date().toISOString() }]);
    expect(a.body.results[0]).toMatchObject({ ok: true, version: 2 });
    // appareil 2 (hors ligne, version 1) change le paddock
    const b = await batch(s.token, [{ op: "upsert", coll: "horses", id: "h_fus", data: { ...base, paddock: "Pré du bas" }, version: 1, base, op_id: "op_fus_00002", at: new Date().toISOString() }]);
    expect(b.body.results[0]).toMatchObject({ ok: true, version: 3, merged: true, conflicts: [] });
    expect(b.body.results[0].data).toMatchObject({ box: "B9", paddock: "Pré du bas" });
  });
  it("même champ modifié des deux côtés : la modification la plus récente gagne, avec signalement", async () => {
    const s = await seed("owner");
    await batch(s.token, [{ op: "upsert", coll: "horses", id: "h_lww", data: { name: "Tornade", note: "" } }]);
    const base = { id: "h_lww", name: "Tornade", note: "" };
    const old = new Date(Date.now() - 3600e3).toISOString(); // modifiée hors ligne il y a une heure
    await batch(s.token, [{ op: "upsert", coll: "horses", id: "h_lww", data: { ...base, note: "en ligne" }, version: 1, base, op_id: "op_lww_00001", at: new Date().toISOString() }]);
    const r = await batch(s.token, [{ op: "upsert", coll: "horses", id: "h_lww", data: { ...base, note: "hors ligne" }, version: 1, base, op_id: "op_lww_00002", at: old }]);
    expect(r.body.results[0]).toMatchObject({ ok: true, merged: true, conflicts: [{ field: "note", kept: "theirs" }] });
    expect(r.body.results[0].data.note).toBe("en ligne");
  });
  it("sans base (ancien client) : le conflit reste signalé comme avant", async () => {
    const s = await seed("owner");
    await batch(s.token, [{ op: "upsert", coll: "tasks", id: "t_old", data: { title: "A" } }]);
    await batch(s.token, [{ op: "upsert", coll: "tasks", id: "t_old", data: { title: "B" }, version: 1 }]);
    const r = await batch(s.token, [{ op: "upsert", coll: "tasks", id: "t_old", data: { title: "C" }, version: 1 }]);
    expect(r.body.results[0]).toMatchObject({ ok: false, conflict: true, version: 2 });
  });
});
