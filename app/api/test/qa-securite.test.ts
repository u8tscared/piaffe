import { describe, expect, it } from "vitest";
import { call, seed } from "./helpers";

/* QA : protections transverses (CSRF sur toute l'API, en-têtes, isolation entre clubs). */
describe("qa · CSRF sur toutes les routes qui changent l'état", () => {
  const routes = ["/api/billing/checkout", "/api/billing/portal", "/api/connect/onboard", "/api/pay/link", "/api/invoices",
    "/api/invoicing/settings", "/api/einvoicing/sync", "/api/records/batch", "/api/onboarding/complete", "/auth/logout"];
  it("un site tiers (cookie seul, Origin étranger) est refusé partout", async () => {
    for (const r of routes) {
      const res = await call(r, { method: "POST", headers: { origin: "https://pirate.example", cookie: "piaffe_s=x" }, json: {} });
      expect(res.status, r).toBe(403);
      expect((await res.json() as any).error.code, r).toBe("csrf");
    }
  });
  it("la même origine ou l'en-tête de l'appli passent la barrière", async () => {
    const a = await call("/api/invoices", { method: "POST", headers: { origin: "http://piaffe.test" }, json: {} });
    expect(a.status).toBe(401);
    const b = await call("/api/invoices", { method: "POST", headers: { "x-requested-with": "piaffe" }, json: {} });
    expect(b.status).toBe(401);
  });
  it("la désinscription en un clic reste possible sans Origin (jeton signé)", async () => {
    const res = await call("/api/mail/unsubscribe?t=faux", { method: "POST" });
    expect(res.status).toBe(400);
  });
});
