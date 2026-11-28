import { describe, it, expect } from "vitest";
import { post, sessionCookie, uniq, PW, env } from "./auth-kit";
import { LEGAL_VERSION } from "../src/lib/legal";

/* Textes légaux : la version des CGU (utilisateur) et des CGV + accord RGPD (club) acceptée est gardée comme preuve. */
describe("acceptation des textes légaux", () => {
  it("garde la version des CGU acceptée à l'inscription", async () => {
    const email = uniq("cgu");
    const r = await post("/auth/signup", { email, password: PW, first: "Léa", last: "Martin", accept_terms: true, terms_version: LEGAL_VERSION });
    expect(r.status).toBe(201);
    const u = await env.DB.prepare("SELECT terms_version, terms_accepted_at FROM users WHERE email = ?").bind(email).first<any>();
    expect(u.terms_version).toBe(LEGAL_VERSION);
    expect(u.terms_accepted_at).toBeTruthy();
  });
  it("garde la version des CGV et de l'accord de sous-traitance à la création du club", async () => {
    const r = await post("/auth/signup", { email: uniq("cgv"), password: PW, first: "Paul", last: "Durand", accept_terms: true });
    const cookie = sessionCookie(r);
    const c = await post("/api/clubs", { name: "Écurie des Essais", accept_cgv: true, legal_version: "2026-11-28" }, { cookie });
    expect(c.status).toBe(201);
    const id = ((await c.json()) as any).club.id;
    const row = await env.DB.prepare("SELECT legal_version, legal_accepted_at, legal_accepted_by FROM clubs WHERE id = ?").bind(id).first<any>();
    expect(row.legal_version).toBe("2026-11-28");
    expect(row.legal_accepted_at).toBeTruthy();
    expect(row.legal_accepted_by).toMatch(/^usr_/);
  });
});
