import { describe, it, expect } from "vitest";
import { post, putRecords, env, uniq } from "./auth-kit";
import { seed } from "./helpers";
import { PLANS } from "../src/billing/plans";

/** Limites des formules (grille du 28/11/2026) : Essentiel 25 chevaux et 2 comptes d'équipe, Club et Domaine illimités. */
const setPlan = (clubId: string, plan: string, status = "active") =>
  env.DB.prepare("UPDATE clubs SET plan = ?, plan_status = ? WHERE id = ?").bind(plan, status, clubId).run();
const horses = (n: number, from = 0) => Array.from({ length: n }, (_, i) => ({ id: "h" + (from + i), name: "Cheval " + (from + i) }));
const batch = async (token: string, ops: unknown[]) => (await (await post("/api/records/batch", { ops }, { token })).json()) as any;
const newHorse = (id: string) => ({ op: "upsert", coll: "horses", id, data: { name: id } });

describe("grille des formules", () => {
  it("Essentiel est limitée, Club et Domaine non, Domaine a 3 sites", () => {
    const [e, c, d] = PLANS;
    expect([e.key, c.key, d.key]).toEqual(["essentiel", "club", "domaine"]);
    expect([e.month_cents, c.month_cents, d.month_cents]).toEqual([5900, 14900, 28900]);
    expect(e.limits).toEqual({ horses: 25, users: 2, sites: 1 });
    expect(c.limits).toEqual({ horses: null, users: null, sites: 1 });
    expect(d.limits).toEqual({ horses: null, users: null, sites: 3 });
    expect(c.highlighted).toBe(true);
  });
});

describe("limite de chevaux", () => {
  it("Essentiel : le 26e cheval est refusé, la modification d'un cheval existant passe", async () => {
    const o = await seed("owner");
    await setPlan(o.clubId, "essentiel");
    await putRecords(o.clubId, "horses", horses(24));
    const r = await batch(o.token, [newHorse("h24"), newHorse("h25"), { op: "upsert", coll: "horses", id: "h0", data: { name: "Renommé" } }]);
    expect(r.results[0].ok).toBe(true);
    expect(r.results[1].ok).toBe(false);
    expect(r.results[1].error.code).toBe("plan_limit");
    expect(r.results[1].error.message).toContain("Club");
    expect(r.results[2].ok).toBe(true);
  });
  it("Club, Domaine et essai : pas de limite", async () => {
    for (const [plan, status] of [["club", "active"], ["domaine", "active"], ["essentiel", "trialing"], ["trial", "trialing"]]) {
      const o = await seed("owner");
      await setPlan(o.clubId, plan, status);
      await putRecords(o.clubId, "horses", horses(25));
      const r = await batch(o.token, [newHorse("h99")]);
      expect(r.results[0].ok, plan + " " + status).toBe(true);
    }
  });
});

describe("limite des comptes de l'équipe", () => {
  it("Essentiel : titulaire + 1, puis refus ; les cavaliers ne comptent pas", async () => {
    const o = await seed("owner");
    await setPlan(o.clubId, "essentiel");
    const a = await post("/api/invitations", { email: uniq("staff"), role: "staff" }, { token: o.token });
    expect(a.status).toBe(201);
    const b = await post("/api/invitations", { email: uniq("coach"), role: "coach" }, { token: o.token });
    expect(b.status).toBe(403);
    expect(((await b.json()) as any).error.code).toBe("plan_limit");
    const m = await post("/api/invitations", { email: uniq("cavalier"), role: "member" }, { token: o.token });
    expect(m.status).toBe(201);
  });
  it("Club : équipe illimitée", async () => {
    const o = await seed("owner");
    await setPlan(o.clubId, "club");
    for (let i = 0; i < 4; i++) {
      const r = await post("/api/invitations", { email: uniq("staff" + i), role: "staff" }, { token: o.token });
      expect(r.status).toBe(201);
    }
  });
});
