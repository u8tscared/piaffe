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

describe("qa · en-têtes et limites", () => {
  it("CSP, HSTS, nosniff et anti-cadre sur les réponses de l'API", async () => {
    const r = await call("/api/health");
    expect(r.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(r.headers.get("strict-transport-security")).toMatch(/max-age=\d+/);
    expect(r.headers.get("x-content-type-options")).toBe("nosniff");
    expect(r.headers.get("x-frame-options")).toBeTruthy();
  });
  it("refuse un JSON de plus de 1 Mo (413)", async () => {
    const s = await seed("owner");
    const big = "x".repeat(1_100_000);
    const r = await call("/api/me", { method: "PATCH", token: s.token, json: { first: big } });
    expect(r.status).toBe(413);
  });
  it("hachage : coût réglable, borné, et mis à niveau à la connexion", async () => {
    const pw = await import("../src/auth/password");
    pw.setPasswordIterations("999999"); expect(pw.PBKDF2_ITER).toBe(100000);
    pw.setPasswordIterations("12"); expect(pw.PBKDF2_ITER).toBe(10000);
    pw.setPasswordIterations(undefined); expect(pw.PBKDF2_ITER).toBe(30000);
    const h = await pw.hashPassword("Cheval-Bai-2026!", 100000);
    expect(await pw.verifyPassword("Cheval-Bai-2026!", h)).toEqual({ ok: true, needsRehash: true });
  });
});

describe("qa · isolation stricte entre clubs", () => {
  it("un gérant ne lit ni n'écrit rien d'un autre club, même en forçant l'en-tête du club", async () => {
    const a = await seed("owner"), b = await seed("owner");
    const w = await call("/api/records/batch", { method: "POST", token: a.token, json: { ops: [{ op: "upsert", coll: "horses", id: "h_secret", data: { name: "Secret" } }] } });
    expect(w.status).toBe(200);
    // B force le club de A
    for (const [m, p] of [["GET", "/api/club/bootstrap"], ["GET", "/api/records/changes?since=2000-01-01T00:00:00.000Z"], ["GET", "/api/invoices"], ["GET", "/api/club/users"],
      ["GET", "/api/invitations"], ["GET", "/api/accounting/exports/fec?year=2026"], ["GET", "/api/onboarding"], ["GET", "/api/calendars"]] as const) {
      const r = await call(p, { method: m, token: b.token, club: a.clubId });
      const txt = await r.text();
      expect(txt, p).not.toContain("Secret");
      if (r.status === 200 && p.includes("bootstrap")) expect(JSON.parse(txt).club.id).toBe(b.clubId);
    }
    const r = await call("/api/records/batch", { method: "POST", token: b.token, club: a.clubId, json: { ops: [{ op: "upsert", coll: "horses", id: "h_secret", data: { name: "Piraté" } }] } });
    expect(r.status).toBe(403);
    // B écrit le même id dans SON club : objet distinct, celui de A intact
    await call("/api/records/batch", { method: "POST", token: b.token, json: { ops: [{ op: "upsert", coll: "horses", id: "h_secret", data: { name: "Autre" } }] } });
    const boot = await (await call("/api/club/bootstrap", { token: a.token })).json() as any;
    expect(boot.data.horses.find((h: any) => h.id === "h_secret").name).toBe("Secret");
  });
  it("les rôles limitent l'accès : employé et adhérent sans factures du club ni équipe", async () => {
    const o = await seed("owner");
    const st = await seed("staff", { clubId: o.clubId }), me = await seed("member", { clubId: o.clubId });
    expect((await call("/api/club/users", { token: st.token })).status).toBe(403);
    expect((await call("/api/accounting/exports/fec?year=2026", { token: me.token })).status).toBe(403);
    expect((await call("/api/invitations", { method: "POST", token: me.token, json: { email: "x@exemple.fr", role: "manager" } })).status).toBe(403);
  });
});
