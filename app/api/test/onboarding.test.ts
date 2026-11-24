import { describe, it, expect, afterEach } from "vitest";
import { call, seed, env } from "./helpers";
import { buildPlan, sanitize } from "../src/onboarding/plan";
import { setFetch, titleCase } from "../src/onboarding/siret";

const J = (r: Response) => r.json() as Promise<any>;
const ANSWERS = {
  kind: "centre", name: "Centre équestre des Prés", siret: "812 345 678 00021", legal_form: "sarl",
  address: { line1: "12 chemin des Prés", zip: "78730", city: "Saint-Arnoult-en-Yvelines" },
  horses: 30, boxes: 32, members: 180, staff: 4, disciplines: ["CSO", "Dressage", "Inconnue"],
  arenas_indoor: 1, arenas_outdoor: 2, paddocks: 3, round_pen: true,
  activities: ["cours", "pensions", "concours", "stages"], software: "kavalog", migration: "robot",
  accountant: true, accountant_email: "Cabinet@Exemple.fr", accountant_einvoice: "yes", online_payments: true, vat_regime: "normal",
};

describe("onboarding · plan (logique pure)", () => {
  it("nettoie les réponses : bornes, listes autorisées, e-mail", () => {
    const a = sanitize({ ...ANSWERS, horses: -4, boxes: "12", members: 1e9, kind: "fusée", activities: ["cours", "piratage"], accountant_email: "pas-un-mail" });
    expect(a.kind).toBeUndefined();
    expect(a.horses).toBe(0);
    expect(a.boxes).toBe(12);
    expect(a.members).toBe(100000);
    expect(a.activities).toEqual(["cours"]);
    expect(a.accountant_email).toBeUndefined();
    expect(sanitize(ANSWERS).siret).toBe("81234567800021");
    expect(sanitize(ANSWERS).siren).toBe("812345678");
    expect(sanitize(ANSWERS).disciplines).toEqual(["CSO", "Dressage"]);
  });
  it("outils actuels : remplacer ou connecter, tâches et plan de bascule", () => {
    const a = sanitize({ ...ANSWERS, software: undefined, migration: { uses: true, adresse: "https://club.kavalog.com", tools: [
      { id: "kavalog", name: "Kavalog", action: "replace" }, { id: "excel", name: "Excel ou Google Sheets" },
      { id: "pennylane", name: "Pennylane", action: "integrate" }, { id: "google-agenda", name: "Google Agenda" },
      { id: "../etc", name: "x", action: "replace" }, { id: "qonto", name: "Qonto", action: "piratage" }] } });
    expect(a.migration!.tools.map((t) => t.id + ":" + t.action)).toEqual(["kavalog:replace", "excel:replace", "pennylane:integrate", "google-agenda:integrate", "qonto:integrate"]);
    const p = buildPlan(a);
    const ids = p.tasks.map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(["migration", "migration_key", "resiliation", "connect_pennylane", "connect_google-agenda", "connect_qonto", "accountant"]));
    const mig = p.tasks.find((t) => t.id === "migration")!;
    expect(mig.title).toBe("Lancer la migration depuis Kavalog et Excel ou Google Sheets");
    expect(mig.go).toBe("lv-migration");
    expect(mig.params).toEqual({ source: "kavalog", outils: "kavalog,excel" });
    expect(p.tasks.find((t) => t.id === "resiliation")!.title).toBe("Résilier Kavalog");
    expect(p.tasks.find((t) => t.id === "connect_pennylane")!.go).toBe("lv-comptable");
    expect(p.migration!.plan).toEqual({ recuperer: ["kavalog", "excel"], brancher: ["pennylane", "google-agenda", "qonto"], resilier: ["kavalog"] });
    const none = buildPlan(sanitize({ ...ANSWERS, software: undefined, migration: { uses: false, tools: [{ id: "kavalog", name: "Kavalog", action: "replace" }] } }));
    expect(none.tasks.some((t) => t.id === "migration")).toBe(false);
    expect(none.migration).toBeNull();
  });
  it("centre équestre complet : pistes, forfaits, tâches de démarrage", () => {
    const p = buildPlan(sanitize(ANSWERS));
    expect(p.kind).toBe("centre");
    expect((p.club_ui.arenas as any[]).map((a) => a.name)).toEqual(["Manège", "Carrière 1", "Carrière 2", "Rond de longe"]);
    expect(p.club_ui.paddocks).toHaveLength(3);
    expect(p.forfaits.map((f) => f.id)).toEqual(expect.arrayContaining(["f_cours", "f_carte10", "f_annuel", "f_pension_box", "f_stage"]));
    expect(p.modulesOff.gerant).toContain("cameras");
    expect(p.modulesOff.gerant).not.toContain("competitions");
    expect(p.tasks.map((t) => t.id)).toEqual(expect.arrayContaining(["migration", "horses", "members", "lessons", "team", "payments", "accountant", "plan"]));
    expect(p.tasks.find((t) => t.id === "migration")!.title).toContain("Kavalog");
  });
  it("écurie de pension sans cours : masque ce qui ne sert pas", () => {
    const p = buildPlan(sanitize({ kind: "ecurie_pension", activities: ["pensions"], staff: 0, boxes: 20 }));
    expect(p.modulesOff.gerant).toEqual(expect.arrayContaining(["competitions", "boutique", "coachs", "equipe"]));
    expect(p.modulesOff.adherent).toEqual(expect.arrayContaining(["adh-reserver", "adh-concours"]));
    expect(p.forfaits.some((f) => f.id === "f_cours")).toBe(false);
    expect(p.pensionPlans.length).toBe(2);
    expect(p.tasks.some((t) => t.id === "lessons")).toBe(false);
  });
  it("association : TVA exonérée par défaut, coach indépendant : pas de soins ni d'écurie", () => {
    expect(buildPlan(sanitize({ kind: "association" })).vat_regime).toBe("association_exoneree");
    expect(buildPlan(sanitize({ kind: "association", vat_regime: "normal" })).vat_regime).toBe("normal");
    const c = buildPlan(sanitize({ kind: "coach_independant" }));
    expect(c.careRules).toHaveLength(0);
    expect(c.modulesOff.gerant).toEqual(expect.arrayContaining(["ecurie3d", "pensions"]));
    expect(c.tasks.some((t) => t.id === "horses")).toBe(false);
  });
  it("met en forme les noms en capitales du répertoire Sirene", () => {
    expect(titleCase("CENTRE EQUESTRE DE LA FORET")).toBe("Centre Equestre de la Foret");
    expect(titleCase("Déjà propre")).toBe("Déjà propre");
  });
});

describe("onboarding · routes", () => {
  afterEach(() => setFetch(null));

  it("exige une session, puis un club", async () => {
    expect((await call("/api/onboarding")).status).toBe(401);
  });

  it("le gérant enregistre ses réponses ; un adhérent ne peut pas", async () => {
    const o = await seed("owner");
    const r = await call("/api/onboarding", { method: "PUT", token: o.token, json: { answers: { kind: "poney_club", horses: 12 }, step: "sizes" } });
    expect(r.status).toBe(200);
    const g = await J(await call("/api/onboarding", { token: o.token }));
    expect(g.completed).toBe(false);
    expect(g.answers.kind).toBe("poney_club");
    expect(g.step).toBe("sizes");
    const m = await seed("member", { clubId: o.clubId });
    expect((await call("/api/onboarding", { method: "PUT", token: m.token, json: { answers: {} } })).status).toBe(403);
    const gm = await J(await call("/api/onboarding", { token: m.token }));
    expect(gm.answers).toBeUndefined();
    expect(gm.modulesOff).toBeDefined();
  });

  it("refuse une écriture par cookie sans en-tête anti-CSRF", async () => {
    const o = await seed("owner");
    const r = await call("/api/onboarding", { method: "PUT", headers: { cookie: "piaffe_s=" + o.token }, json: { answers: {} } });
    expect(r.status).toBe(403);
    const ok = await call("/api/onboarding", { method: "PUT", headers: { cookie: "piaffe_s=" + o.token, "x-requested-with": "piaffe" }, json: { answers: {} } });
    expect(ok.status).toBe(200);
  });

  it("configure le club à la fin, de façon idempotente", async () => {
    const o = await seed("owner");
    const r1 = await call("/api/onboarding/complete", { method: "POST", token: o.token, json: { answers: ANSWERS } });
    expect(r1.status).toBe(200);
    const j1 = await J(r1);
    expect(j1.person_ref).toMatch(/^s_/);
    expect(j1.tasks.length).toBeGreaterThan(5);
    const club = await env.DB.prepare("SELECT name, kind, vat_regime, siret, siren, legal_form, settings, onboarding FROM clubs WHERE id = ?").bind(o.clubId).first<any>();
    expect(club.name).toBe("Centre équestre des Prés");
    expect(club.kind).toBe("centre");
    expect(club.siret).toBe("81234567800021");
    expect(club.siren).toBe("812345678");
    expect(club.legal_form).toBe("sarl");
    expect(JSON.parse(club.settings).modulesOff.gerant).toContain("cameras");
    expect(JSON.parse(club.onboarding).completed_at).toBeTruthy();
    const count = async () => (await env.DB.prepare("SELECT COUNT(*) AS n FROM records WHERE club_id = ?").bind(o.clubId).first<any>()).n;
    const n1 = await count();
    expect(n1).toBeGreaterThan(5);
    const staff = await env.DB.prepare("SELECT data FROM records WHERE club_id = ? AND coll = 'staff'").bind(o.clubId).first<any>();
    expect(JSON.parse(staff.data).role).toBe("Gérant");
    const mem = await env.DB.prepare("SELECT person_ref FROM memberships WHERE user_id = ?").bind(o.userId).first<any>();
    expect(mem.person_ref).toBe(j1.person_ref);
    const cl = await env.DB.prepare("SELECT data FROM records WHERE club_id = ? AND coll = 'club' AND id = '_'").bind(o.clubId).first<any>();
    expect(JSON.parse(cl.data).arenas).toHaveLength(4);
    /* une modification du club n'est pas écrasée par un second passage */
    await env.DB.prepare("UPDATE records SET data = json_set(data, '$.price', 999) WHERE club_id = ? AND coll = 'forfaits' AND id = 'f_cours'").bind(o.clubId).run();
    const r2 = await call("/api/onboarding/complete", { method: "POST", token: o.token, json: {} });
    expect(r2.status).toBe(200);
    expect((await J(r2)).person_ref).toBe(j1.person_ref);
    expect(await count()).toBe(n1);
    const f = await env.DB.prepare("SELECT data FROM records WHERE club_id = ? AND coll = 'forfaits' AND id = 'f_cours'").bind(o.clubId).first<any>();
    expect(JSON.parse(f.data).price).toBe(999);
  });

  it("isole les clubs : un gérant ne lit ni n'écrit l'onboarding d'un autre club", async () => {
    const a = await seed("owner");
    const b = await seed("owner");
    await call("/api/onboarding", { method: "PUT", token: a.token, json: { answers: { name: "Club A secret" } } });
    const r = await call("/api/onboarding", { token: b.token, club: a.clubId });
    expect(r.status).toBe(403);
    const w = await call("/api/onboarding/complete", { method: "POST", token: b.token, club: a.clubId, json: {} });
    expect(w.status).toBe(403);
    const own = await J(await call("/api/onboarding", { token: b.token }));
    expect(JSON.stringify(own)).not.toContain("Club A secret");
  });

  it("étapes de démarrage : cochées, puis visibles", async () => {
    const o = await seed("owner");
    await call("/api/onboarding/complete", { method: "POST", token: o.token, json: { answers: ANSWERS } });
    expect((await call("/api/onboarding/tasks/horses", { method: "POST", token: o.token, json: { done: true } })).status).toBe(200);
    expect((await call("/api/onboarding/tasks/" + encodeURIComponent("x y"), { method: "POST", token: o.token, json: {} })).status).toBe(400);
    const g = await J(await call("/api/onboarding", { token: o.token }));
    expect(g.tasks.find((t: any) => t.id === "horses").done).toBe(true);
    expect(g.tasks.find((t: any) => t.id === "members").done).toBe(false);
    const s = await seed("staff", { clubId: o.clubId });
    expect((await call("/api/onboarding/tasks/members", { method: "POST", token: s.token, json: {} })).status).toBe(403);
  });

  it("écrans masqués : enregistrés pour tout le club, nettoyés", async () => {
    const o = await seed("manager");
    const r = await call("/api/onboarding/modules", { method: "PUT", token: o.token, json: { modulesOff: { gerant: ["boutique", "<script>", "boutique"], pirate: ["x"], adherent: ["adh-concours"] } } });
    expect(r.status).toBe(200);
    const j = await J(r);
    expect(j.modulesOff.gerant).toEqual(["boutique"]);
    expect(j.modulesOff.pirate).toBeUndefined();
    const m = await seed("member", { clubId: o.clubId });
    expect((await J(await call("/api/onboarding", { token: m.token }))).modulesOff.adherent).toEqual(["adh-concours"]);
  });

  it("fiche légale du club : SIRET vérifié", async () => {
    const o = await seed("owner");
    expect((await call("/api/onboarding/club", { method: "PATCH", token: o.token, json: { siret: "123" } })).status).toBe(400);
    const r = await call("/api/onboarding/club", { method: "PATCH", token: o.token, json: { name: "Les Écuries du Lac", siret: "81234567800021", vat_regime: "franchise", address: { line1: "1 rue du Lac", zip: "74000", city: "Annecy" } } });
    expect(r.status).toBe(200);
    const c = await env.DB.prepare("SELECT name, siret, vat_regime, address FROM clubs WHERE id = ?").bind(o.clubId).first<any>();
    expect(c.name).toBe("Les Écuries du Lac");
    expect(c.vat_regime).toBe("franchise");
    expect(JSON.parse(c.address).city).toBe("Annecy");
    const s = await seed("coach", { clubId: o.clubId });
    expect((await call("/api/onboarding/club", { method: "PATCH", token: s.token, json: { name: "Piraté" } })).status).toBe(403);
  });

  it("recherche d'entreprise : appel côté serveur, mise en forme, cache", async () => {
    const o = await seed("owner");
    let calls = 0;
    setFetch((async (url: string) => {
      calls++;
      expect(String(url)).toContain("recherche-entreprises.api.gouv.fr");
      return new Response(JSON.stringify({ results: [
        { siren: "111111111", nom_complet: "BOULANGERIE DU COIN", nature_juridique: "5499", siege: { siret: "11111111100011", activite_principale: "10.71C", code_postal: "75001", libelle_commune: "PARIS" } },
        { siren: "812345678", nom_complet: "CENTRE EQUESTRE DES PRES", nature_juridique: "5710", siege: { siret: "81234567800021", numero_voie: "12", type_voie: "CHEMIN", libelle_voie: "DES PRES", code_postal: "78730", libelle_commune: "SAINT-ARNOULT-EN-YVELINES", latitude: "48.57", longitude: "1.94", activite_principale: "93.12Z" } },
      ] }), { headers: { "content-type": "application/json" } });
    }) as any);
    const r = await call("/api/onboarding/siret?q=centre%20equestre%20des%20pres", { token: o.token });
    expect(r.status).toBe(200);
    const j = await J(r);
    expect(j.results[0].siren).toBe("812345678");
    expect(j.results[0].name).toBe("Centre Equestre des Pres");
    expect(j.results[0].legal_form).toBe("sas");
    expect(j.results[0].address.zip).toBe("78730");
    expect(j.results[0].lat).toBeCloseTo(48.57);
    await call("/api/onboarding/siret?q=Centre%20equestre%20des%20pres", { token: o.token });
    expect(calls).toBe(1);
    expect((await call("/api/onboarding/siret?q=ab", { token: o.token })).status).toBe(400);
    setFetch((async () => new Response("oups", { status: 500 })) as any);
    expect((await call("/api/onboarding/siret?q=autre%20club", { token: o.token })).status).toBe(502);
    expect((await call("/api/onboarding/siret?q=centre")).status).toBe(401);
  });

  it("club d'exemple : effaçable, un vrai club ne l'est pas", async () => {
    const o = await seed("owner");
    await env.DB.prepare("INSERT INTO records (club_id, coll, id, data) VALUES (?, 'horses', 'h01', '{\"id\":\"h01\"}')").bind(o.clubId).run();
    expect((await call("/api/onboarding/sandbox", { method: "POST", token: o.token, json: {} })).status).toBe(409);
    expect((await call("/api/onboarding/reset", { method: "POST", token: o.token, json: { confirm: "EFFACER" } })).status).toBe(403);
    const s = await seed("owner");
    expect((await call("/api/onboarding/sandbox", { method: "POST", token: s.token, json: {} })).status).toBe(200);
    await env.DB.prepare("INSERT INTO records (club_id, coll, id, data) VALUES (?, 'horses', 'h01', '{\"id\":\"h01\"}')").bind(s.clubId).run();
    expect((await J(await call("/api/onboarding", { token: s.token }))).sandbox).toBe(true);
    expect((await call("/api/onboarding/reset", { method: "POST", token: s.token, json: {} })).status).toBe(400);
    const m = await seed("manager", { clubId: s.clubId });
    expect((await call("/api/onboarding/reset", { method: "POST", token: m.token, json: { confirm: "EFFACER" } })).status).toBe(403);
    expect((await call("/api/onboarding/reset", { method: "POST", token: s.token, json: { confirm: "EFFACER" } })).status).toBe(200);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM records WHERE club_id = ?").bind(s.clubId).first<any>()).n).toBe(0);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM records WHERE club_id = ?").bind(o.clubId).first<any>()).n).toBe(1);
    const g = await J(await call("/api/onboarding", { token: s.token }));
    expect(g.sandbox).toBe(false);
    expect(g.completed).toBe(false);
  });
});
