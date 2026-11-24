import { describe, it, expect } from "vitest";
import { call, seed } from "./helpers";

describe("objets uniques et notes de coach", () => {
  it("enregistre et relit un objet unique sous l'id « _ »", async () => {
    const s = await seed("owner");
    const w = await call("/api/records/batch", { method: "POST", token: s.token, headers: { "x-requested-with": "piaffe" },
      json: { ops: [{ op: "upsert", coll: "shifts", id: "_", data: { s01: { lun: "08:00-12:00" } } }] } });
    const r = await w.json() as any;
    expect(w.status).toBe(200);
    expect(r.results[0].ok).toBe(true);
    const b = await (await call("/api/club/bootstrap", { token: s.token })).json() as any;
    expect(b.data.shifts).toEqual({ s01: { lun: "08:00-12:00" } });
  });
  it("refuse l'id « _ » pour une collection ordinaire", async () => {
    const s = await seed("owner");
    const r = await (await call("/api/records/batch", { method: "POST", token: s.token, headers: { "x-requested-with": "piaffe" },
      json: { ops: [{ op: "upsert", coll: "horses", id: "_", data: { name: "X" } }] } })).json() as any;
    expect(r.results[0].ok).toBe(false);
    expect(r.results[0].error.code).toBe("invalid_id");
  });
  it("accepte la collection coachNotes pour le gérant", async () => {
    const s = await seed("owner");
    const r = await (await call("/api/records/batch", { method: "POST", token: s.token, headers: { "x-requested-with": "piaffe" },
      json: { ops: [{ op: "upsert", coll: "coachNotes", id: "n1", data: { coach: "c01", text: "Bonne séance" } }] } })).json() as any;
    expect(r.results[0].ok).toBe(true);
  });
});
