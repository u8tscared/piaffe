import { describe, it, expect } from "vitest";
import { call, seed, env } from "./helpers";
import { sniff } from "../src/media/routes";

const XRW = { "x-requested-with": "piaffe" };
/* plus petit JPEG valide (1 × 1 px), complété pour dépasser le seuil de 100 octets */
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, ...new Array(200).fill(0), 0xff, 0xd9]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, ...new Array(120).fill(1)]);

async function horse(token: string, id: string, data: Record<string, unknown> = {}) {
  const r = await call("/api/records/batch", { method: "POST", token, headers: XRW, json: { ops: [{ op: "upsert", coll: "horses", id, data: { id, name: "Ulysse", ...data } }] } });
  expect(r.status).toBe(200);
}
function form(o: Record<string, string | Blob>) { const f = new FormData(); for (const k in o) f.append(k, o[k]); return f; }
function upload(token: string, o: Record<string, string | Blob>, club?: string) {
  return call("/api/media", { method: "POST", token, club, headers: XRW, body: form(o) });
}
const pid = () => "med_" + Math.random().toString(36).slice(2, 12);

describe("photos des chevaux", () => {
  it("reconnaît le vrai type d'un fichier", () => {
    expect(sniff(JPEG)).toBe("image/jpeg");
    expect(sniff(WEBP)).toBe("image/webp");
    expect(sniff(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });

  it("envoie, liste, sert et supprime une photo", async () => {
    const s = await seed("owner");
    await horse(s.token, "h01");
    const id = pid();
    const r = await upload(s.token, { id, horse: "h01", kind: "profil", w: "1200", h: "1200", file: new Blob([JPEG], { type: "image/jpeg" }), thumb: new Blob([WEBP], { type: "image/webp" }) });
    expect(r.status).toBe(201);
    const m = (await r.json() as any).media;
    expect(m.id).toBe(id);
    expect(m.author.name).toBe("Léa Test");
    expect(m.thumb).toContain("v=thumb");

    const l = await (await call("/api/media?horse=h01", { token: s.token })).json() as any;
    expect(l.media.map((x: any) => x.id)).toEqual([id]);

    const f = await call(m.url, { token: s.token });
    expect(f.status).toBe(200);
    expect(f.headers.get("content-type")).toBe("image/jpeg");
    expect(f.headers.get("cache-control")).toContain("private");
    expect(new Uint8Array(await f.arrayBuffer()).length).toBe(JPEG.length);
    const t = await call(m.thumb, { token: s.token });
    expect(t.headers.get("content-type")).toBe("image/webp");

    const d = await call("/api/media/" + id, { method: "DELETE", token: s.token, headers: XRW });
    expect(d.status).toBe(200);
    expect((await (await call("/api/media?horse=h01", { token: s.token })).json() as any).media).toEqual([]);
    expect(await env.FILES.get(`clubs/${s.clubId}/media/h01/${id}.jpg`)).toBeNull();
    expect((await call(m.url, { token: s.token })).status).toBe(404);
  });

  it("ne crée pas de doublon quand l'envoi est rejoué", async () => {
    const s = await seed("owner");
    await horse(s.token, "h02");
    const id = pid();
    const a = await upload(s.token, { id, horse: "h02", file: new Blob([JPEG]) });
    const b = await upload(s.token, { id, horse: "h02", file: new Blob([JPEG]) });
    expect(a.status).toBe(201);
    expect(b.status).toBe(200);
    expect((await b.json() as any).replay).toBe(true);
    expect((await (await call("/api/media?horse=h02", { token: s.token })).json() as any).media.length).toBe(1);
  });

  it("refuse un fichier qui n'est pas une image, trop lourd ou sans identifiant valide", async () => {
    const s = await seed("owner");
    await horse(s.token, "h03");
    const bad = await upload(s.token, { id: pid(), horse: "h03", file: new Blob([new TextEncoder().encode("<html>" + "x".repeat(200))], { type: "image/jpeg" }) });
    expect(bad.status).toBe(415);
    const big = new Uint8Array(1_600_000); big.set(JPEG.slice(0, 4));
    const tooBig = await upload(s.token, { id: pid(), horse: "h03", file: new Blob([big]) });
    expect(tooBig.status).toBe(413);
    const noId = await upload(s.token, { id: "../../x", horse: "h03", file: new Blob([JPEG]) });
    expect(noId.status).toBe(400);
    const noHorse = await upload(s.token, { id: pid(), horse: "h99", file: new Blob([JPEG]) });
    expect(noHorse.status).toBe(404);
  });

  it("cloisonne les clubs", async () => {
    const a = await seed("owner");
    await horse(a.token, "h04");
    const id = pid();
    const m = (await (await upload(a.token, { id, horse: "h04", file: new Blob([JPEG]) })).json() as any).media;
    const b = await seed("owner");
    expect((await call(m.url, { token: b.token })).status).toBe(404);
    expect((await call("/api/media?horse=h04", { token: b.token })).status).toBe(404);
    expect((await call("/api/media/" + id, { method: "DELETE", token: b.token, headers: XRW })).status).toBe(404);
  });

  it("donne accès à l'adhérent pour son cheval seulement, et refuse le comptable", async () => {
    const o = await seed("owner");
    await call("/api/records/batch", { method: "POST", token: o.token, headers: XRW, json: { ops: [{ op: "upsert", coll: "members", id: "m001", data: { id: "m001", first: "Léa", fam: "F1" } }] } });
    await horse(o.token, "h05", { owner: "m001" });
    await horse(o.token, "h06", { owner: "m777" });
    const mem = await seed("member", { clubId: o.clubId, personRef: "m001" });
    const mine = await upload(mem.token, { id: pid(), horse: "h05", file: new Blob([JPEG]) });
    expect(mine.status).toBe(201);
    const other = await upload(mem.token, { id: pid(), horse: "h06", file: new Blob([JPEG]) });
    expect(other.status).toBe(403);
    /* l'adhérent ne supprime pas la photo d'un autre */
    const staffPic = (await (await upload(o.token, { id: pid(), horse: "h05", file: new Blob([JPEG]) })).json() as any).media;
    expect((await call("/api/media/" + staffPic.id, { method: "DELETE", token: mem.token, headers: XRW })).status).toBe(403);
    const acc = await seed("accountant", { clubId: o.clubId });
    expect((await call("/api/media?horse=h05", { token: acc.token })).status).toBe(403);
    const coach = await seed("coach", { clubId: o.clubId });
    expect((await call("/api/media?horse=h05", { token: coach.token })).status).toBe(200);
    expect((await upload(coach.token, { id: pid(), horse: "h05", file: new Blob([JPEG]) })).status).toBe(403);
  });

  it("exige l'en-tête anti-CSRF et une session", async () => {
    const s = await seed("owner");
    await horse(s.token, "h07");
    const anon = await call("/api/media?horse=h07");
    expect(anon.status).toBe(401);
  });
});
