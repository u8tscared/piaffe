import { describe, it, expect } from "vitest";
import { call, seed } from "./helpers";

describe("socle", () => {
  it("répond sur /api/health", async () => {
    const r = await call("/api/health");
    expect(r.status).toBe(200);
    expect((await r.json() as any).ok).toBe(true);
  });
  it("renvoie 404 JSON sur une route inconnue", async () => {
    const r = await call("/api/nope");
    expect(r.status).toBe(404);
  });
  it("seed crée une session utilisable", async () => {
    const s = await seed("owner");
    expect(s.token.length).toBeGreaterThan(20);
  });
});
