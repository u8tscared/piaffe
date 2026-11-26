import { describe, expect, it } from "vitest";
import { call, env, seed } from "./helpers";

/* Modules Terrain (45-terrain.js) et Croissance (55-croissance.js) : collections, droits, crédit de séance, annonces publiques. */
const batch = (token: string, ops: unknown[]) => call("/api/records/batch", { method: "POST", token, json: { ops } }).then(async (r) => ({ status: r.status, j: (await r.json()) as any }));
const up = (coll: string, id: string, data: unknown) => ({ op: "upsert", coll, id, data });
const rec = async (club: string, coll: string, id: string) => {
  const r = await env.DB.prepare("SELECT data, version, deleted FROM records WHERE club_id = ? AND coll = ? AND id = ?").bind(club, coll, id).first<any>();
  return r ? { ...JSON.parse(r.data), _v: r.version, _del: r.deleted } : null;
};

async function club() {
  const o = await seed("owner");
  const w = await batch(o.token, [
    up("forfaits", "f1", { name: "Forfait annuel", kind: "annuel", price: 780 }),
    up("forfaits", "f3", { name: "Carte 10 séances", kind: "carte", price: 290 }),
    up("members", "m1", { first: "Léa", last: "Martin", forfait: "f3", fam: "F1" }),
    up("members", "m2", { first: "Hugo", last: "Petit", forfait: "f1", fam: "F2" }),
    up("cards", "k1", { member: "m1", total: 10, left: 3, until: "2099-06-30" }),
    up("horses", "h1", { name: "Ulysse", owner: "m1" }),
    up("horses", "h2", { name: "Quartz" }),
    up("lessons", "l1", { title: "Galop 3", coach: "c1", riders: ["m1", "m2"], cap: 8 }),
    up("coaches", "c1", { first: "Inès", last: "Roux" }),
  ]);
  expect(w.j.results.every((r: any) => r.ok)).toBe(true);
  return o;
}

describe("terrain · collections et droits", () => {
  it("le gérant enregistre les nouvelles collections ; l'employé écrit les sorties et l'appel, pas les prés", async () => {
    const o = await club();
    const st = await seed("staff", { clubId: o.clubId });
    const g = await batch(o.token, [up("pastures", "pr1", { n: 1, name: "Prairie du bas", cap: 8 }), up("pastureRules", "ru1", { a: "h1", b: "h2", k: "apart" }),
      up("horseCues", "cu1", { horse: "h1", text: "Ferrure jeudi" }), up("aids", "ai1", { kind: "passsport", member: "m2", amount: 50, status: "deduit" }),
      up("growthCfg", "aides", { fam2: 10 }), up("gReviews", "gv1", { member: "m1", rating: 5 }), up("surveys", "sv1", { title: "Stage", answers: [{ member: "m1", pending: true }, { member: "m2", global: 4 }] })]);
    expect(g.j.results.map((r: any) => r.ok)).toEqual([true, true, true, true, true, true, true]);
    const s = await batch(st.token, [up("pastureMoves", "mv1", { horse: "h1", pasture: "pr1", date: "2026-11-26", slot: "am", out: "08:30" }),
      up("lessonCalls", "lc1", { lesson: "l1", date: "2026-11-26", present: ["m2"], absent: ["m1"], notes: { m2: { mood: "top" } } }),
      up("pastures", "pr2", { n: 2, name: "Paddock" }), up("aids", "ai2", { kind: "caf", member: "m1", amount: 30 })]);
    expect(s.j.results.map((r: any) => r.ok)).toEqual([true, true, false, false]);
  });

  it("l'adhérent voit les sorties de son cheval, son appel et ses aides, rien de ceux des autres", async () => {
    const o = await club();
    await batch(o.token, [up("pastures", "pr1", { n: 1, name: "Prairie du bas", cap: 8, water: "Abreuvoir" }),
      up("pastureMoves", "mv1", { horse: "h1", pasture: "pr1", date: "2026-11-26", slot: "am", out: "08:30" }),
      up("pastureMoves", "mv2", { horse: "h2", pasture: "pr1", date: "2026-11-26", slot: "am", out: "08:30" }),
      up("lessonCalls", "lc1", { lesson: "l1", date: "2026-11-26", present: ["m2"], absent: ["m1"], notes: { m1: { word: "Bravo" }, m2: { word: "Secret" } } }),
      up("aids", "ai1", { kind: "passsport", member: "m2", amount: 50 }), up("aids", "ai2", { kind: "caf", member: "m1", amount: 30 }),
      up("horseAds", "ad1", { horse: "h2", price: 6500, status: "en ligne", views: 412, seller: "club", fee: 5 }), up("horseAds", "ad2", { horse: "h2", status: "brouillon" }),
      up("horseLeads", "ld1", { ad: "ad1", name: "Sophie", email: "s@exemple.fr" }), up("growthCfg", "aides", { fam2: 10 })]);
    const me = await seed("member", { clubId: o.clubId, personRef: "m1" });
    const b = (await (await call("/api/club/bootstrap", { token: me.token })).json()) as any;
    expect(b.data.pastureMoves.map((x: any) => x.id)).toEqual(["mv1"]);
    expect(b.data.pastures[0]).toEqual({ id: "pr1", n: 1, name: "Prairie du bas" });
    expect(b.data.lessonCalls[0].absent).toEqual(["m1"]);
    expect(b.data.lessonCalls[0].present).toEqual([]);
    expect(JSON.stringify(b.data.lessonCalls)).not.toContain("Secret");
    expect(b.data.aids.map((x: any) => x.id)).toEqual(["ai2"]);
    expect(b.data.horseAds.map((x: any) => x.id)).toEqual(["ad1"]);
    expect(b.data.horseAds[0].views).toBeUndefined();
    expect(b.data.horseLeads || []).toEqual([]);
    expect(b.data.growthCfg || []).toEqual([]);
  });

  it("parrainage et sondage : l'adhérent n'écrit que pour sa famille, le statut reste au club", async () => {
    const o = await club();
    await batch(o.token, [up("surveys", "sv1", { title: "Stage", answers: [{ member: "m1", pending: true }, { member: "m2", global: 4 }] })]);
    const me = await seed("member", { clubId: o.clubId, personRef: "m1" });
    const r = await batch(me.token, [up("referrals", "pr1", { by: "m1", friend: "Julie", status: "recompense", reward: 50 }), up("referrals", "pr2", { by: "m2", friend: "X" }),
      up("surveys", "sv1", { answers: [{ member: "m1", global: 5, coach: 4, again: true, text: "Super" }, { member: "m2", global: 1 }] })]);
    expect(r.j.results.map((x: any) => x.ok)).toEqual([true, false, true]);
    const ref = await rec(o.clubId, "referrals", "pr1");
    expect(ref.status).toBe("invite"); expect(ref.reward).toBeUndefined();
    const sv = await rec(o.clubId, "surveys", "sv1");
    expect(sv.answers[0]).toMatchObject({ member: "m1", global: 5, coach: 4, again: true, text: "Super" });
    expect(sv.answers[1]).toEqual({ member: "m2", global: 4 });
    // une réponse donnée ne se réécrit pas
    await batch(me.token, [up("surveys", "sv1", { answers: [{ member: "m1", global: 1 }] })]);
    expect((await rec(o.clubId, "surveys", "sv1")).answers[0].global).toBe(5);
  });
});

describe("terrain · séance recréditée à un absent", () => {
  it("forfait carte : la carte regagne une séance ; forfait annuel : un rattrapage ; une seule fois ; reprise si présent", async () => {
    const o = await club();
    const st = await seed("staff", { clubId: o.clubId });
    const r = await batch(st.token, [
      up("lessonCredits", "cr1", { member: "m1", lesson: "l1", date: "2026-11-26", kind: "rattrapage", applied: { coll: "cards", id: "pirate" } }),
      up("lessonCredits", "cr2", { member: "m2", lesson: "l1", date: "2026-11-26" }),
    ]);
    expect(r.j.results.map((x: any) => x.ok)).toEqual([true, true]);
    expect((await rec(o.clubId, "cards", "k1")).left).toBe(4);
    expect((await rec(o.clubId, "members", "m2")).makeups).toBe(1);
    const c1 = await rec(o.clubId, "lessonCredits", "cr1");
    expect(c1.kind).toBe("carte"); expect(c1.applied.id).toBe("k1");
    // un autre appareil recrédite le même absent : refusé, rien de crédité en double
    const d = await batch(o.token, [up("lessonCredits", "cr9", { member: "m1", lesson: "l1", date: "2026-11-26" })]);
    expect(d.j.results[0]).toMatchObject({ ok: false, error: { code: "already_credited" } });
    expect((await rec(o.clubId, "cards", "k1")).left).toBe(4);
    // rejeu de la même opération (même op_id) : aucun effet
    const op = { ...up("lessonCredits", "cr3", { member: "m2", lesson: "l2", date: "2026-11-27" }), op_id: "op_credit_rejeu_1" };
    await batch(st.token, [op]); await batch(st.token, [op]);
    expect((await rec(o.clubId, "members", "m2")).makeups).toBe(2);
    // finalement présent : le crédit est retiré et la séance reprise
    const del = await batch(st.token, [{ op: "delete", coll: "lessonCredits", id: "cr1" }]);
    expect(del.j.results[0].ok).toBe(true);
    expect((await rec(o.clubId, "cards", "k1")).left).toBe(3);
  });

  it("carte pleine ou expirée → rattrapage ; cavalier inconnu refusé ; l'adhérent ne se crédite pas lui-même", async () => {
    const o = await club();
    await batch(o.token, [up("cards", "k1", { member: "m1", total: 10, left: 10, until: "2099-06-30" })]);
    await batch(o.token, [up("lessonCredits", "cr1", { member: "m1", lesson: "l1", date: "2026-11-26" })]);
    expect((await rec(o.clubId, "lessonCredits", "cr1")).kind).toBe("rattrapage");
    expect((await rec(o.clubId, "members", "m1")).makeups).toBe(1);
    const u = await batch(o.token, [up("lessonCredits", "cr2", { member: "m404", lesson: "l1" })]);
    expect(u.j.results[0].error.code).toBe("unknown_member");
    const me = await seed("member", { clubId: o.clubId, personRef: "m1" });
    const m = await batch(me.token, [up("lessonCredits", "cr3", { member: "m1", lesson: "l9" })]);
    expect(m.j.results[0].ok).toBe(false);
  });
});

describe("terrain · annonce publique et demande d'essai sans compte", () => {
  it("annonce publiée lisible sans compte, brouillon invisible, demande enregistrée avec anti-robot et limite", async () => {
    const o = await club();
    await batch(o.token, [up("horseAds", "ad1", { horse: "h2", price: 6500, status: "en ligne", views: 412, fee: 5, text: "Hongre régulier" }), up("horseAds", "ad2", { horse: "h2", status: "brouillon" })]);
    const g = await call(`/api/public/horse-ads/${o.clubId}/ad1`);
    expect(g.status).toBe(200);
    const j = (await g.json()) as any;
    expect(j.ad.price).toBe(6500); expect(j.ad.views).toBeUndefined(); expect(j.horse.name).toBe("Quartz");
    expect((await call(`/api/public/horse-ads/${o.clubId}/ad2`)).status).toBe(404);
    const post = (json: unknown, ip = "203.0.113.7") => call(`/api/public/horse-ads/${o.clubId}/ad1/leads`, { method: "POST", headers: { origin: "http://piaffe.test", "cf-connecting-ip": ip }, json });
    const t = Date.now() - 10_000;
    // robot : champ piège rempli → réponse normale, rien d'enregistré
    expect((await post({ name: "Bot", email: "b@exemple.fr", site: "http://spam", t })).status).toBe(200);
    expect((await post({ name: "Bot", email: "b@exemple.fr", t: Date.now() })).status).toBe(200);
    expect((await post({ name: "Sophie Marchand", t })).status).toBe(400);
    expect((await post({ name: "Sophie Marchand", email: "sophie@exemple.fr", level: "Galop 5", msg: "Essai samedi ?", t })).status).toBe(200);
    const leads = await env.DB.prepare("SELECT data FROM records WHERE club_id = ? AND coll = 'horseLeads' AND deleted = 0").bind(o.clubId).all<any>();
    expect(leads.results.length).toBe(1);
    expect(JSON.parse(leads.results[0].data)).toMatchObject({ ad: "ad1", name: "Sophie Marchand", status: "nouvelle" });
    // un site tiers ne peut pas poster (CSRF)
    expect((await call(`/api/public/horse-ads/${o.clubId}/ad1/leads`, { method: "POST", headers: { origin: "https://pirate.example" }, json: {} })).status).toBe(403);
    // limite par adresse IP
    let last = 0;
    for (let i = 0; i < 6; i++) last = (await post({ name: "Paul " + i, email: `p${i}@exemple.fr`, t }, "203.0.113.99")).status;
    expect(last).toBe(429);
  });
});
