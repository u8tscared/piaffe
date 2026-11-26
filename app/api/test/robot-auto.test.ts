import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { runInDurableObject } from "cloudflare:test";
import { call, env, seed } from "./helpers";
import { setBrowserFactory, setRobotTiming } from "../src/robot/routes";
import { sceller, ouvrirScelle, accesValide } from "../src/robot/coffre";
import { creerPilote, vueCompacte, MODELE_FORT, MODELE_RAPIDE } from "../src/robot/ia";
import type { RobotSession } from "../src/robot/session";

/* Fausse page d'un ancien logiciel avec formulaire de connexion et code de vérification. */
const MDP = "Secret-123-ne-doit-pas-fuiter";
class PageConnexion {
  adresse = "about:blank";
  etape: "login" | "code" | "ok" = "login";
  refus = false;
  deuxEtapes = true;
  recus: any[] = [];
  codes: string[] = [];
  async goto(url: string) { this.adresse = url; }
  url() { return this.adresse; }
  async evaluate(fn: (...a: any[]) => any, arg?: any) {
    switch (fn.name) {
      case "etatConnexion":
        return { pass: this.etape === "login", user: this.etape === "login", code: this.etape === "code", refus: this.refus, msg: this.refus ? "Mot de passe incorrect" : "" };
      case "remplirConnexion":
        this.recus.push(arg);
        if (arg.etape === "identifiant") return "clic";
        if (arg.identifiant === "gerant@club.example" && arg.motDePasse === MDP) { this.etape = this.deuxEtapes ? "code" : "ok"; this.refus = false; }
        else this.refus = true;
        return "clic";
      case "remplirCode":
        this.codes.push(arg);
        if (arg === "246810") this.etape = "ok"; else this.refus = true;
        return "clic";
      case "extrairePage":
        if (this.etape !== "ok") return { url: this.adresse, titre: "Connexion", tables: [], fiches: [], suivant: null, liens: [], connexion: true };
        return {
          url: this.adresse, titre: "Cavaliers", fiches: [], suivant: null, liens: [], connexion: false,
          tables: [{ titre: "Liste des cavaliers", selecteur: "#cavaliers", details: [], entetes: ["Nom", "Prénom", "E-mail"],
            lignes: [["Durand", "Alice", "alice.durand@exemple.fr"], ["Martin", "Paul", "paul.martin@exemple.fr"]] }],
        };
      case "empreinte": return this.adresse + "|1";
      default: return null;
    }
  }
  async screenshot() { return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1]); }
  mouse = { click: async () => {}, wheel: async () => {} };
  keyboard = { type: async () => {}, press: async () => {} };
  scripts: string[] = [];
  async ajouterScript(s: string) { this.scripts.push(s); }
}

let pages: PageConnexion[] = [];
let deuxEtapes = true;
beforeEach(() => {
  pages = []; deuxEtapes = true;
  setBrowserFactory({ async ouvrir() { const p = new PageConnexion(); p.deuxEtapes = deuxEtapes; pages.push(p); return { page: p as any, sessionId: null, fermer: async () => {} }; } });
  setRobotTiming({ controle: 15, imageConnexion: 15, imageCopie: 15, battement: 50, attenteCode: 8000 });
});
afterAll(() => { setBrowserFactory(null); setRobotTiming(null); });

const ADRESSE = "https://app.kavalog.example.fr/connexion";
const ACCES = { identifiant: "gerant@club.example", mot_de_passe: MDP };
const stub = (id: string) => env.ROBOT!.get(env.ROBOT!.idFromName(id)) as DurableObjectStub<RobotSession>;
const etat = (id: string) => runInDurableObject(stub(id), (o: RobotSession) => o.etat ? { phase: o.etat.phase, code: !!o.etat.attenteCode, scelle: o.etat.scelle, progression: o.etat.progression } : null);
async function attendre<T>(f: () => Promise<T> | T, ok: (v: T) => boolean, ms = 15000): Promise<T> {
  const fin = Date.now() + ms;
  for (;;) { const v = await f(); if (ok(v)) return v; if (Date.now() > fin) throw new Error("délai dépassé : " + JSON.stringify(v)); await new Promise((r) => setTimeout(r, 25)); }
}

describe("coffre des identifiants", () => {
  it("scelle et rouvre pour la même session seulement ; rien en clair", async () => {
    const s = await sceller(env as any, ACCES, "session-a");
    expect(s).toMatch(/^v1\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/);
    expect(s).not.toContain(MDP);
    expect(atob(s.split(".")[2])).not.toContain("gerant");
    expect(await ouvrirScelle(env as any, s, "session-a")).toEqual(ACCES);
    expect(await ouvrirScelle(env as any, s, "session-b")).toBeNull();
    const abime = s.slice(0, -4) + (s.endsWith("AAAA") ? "BBBB" : "AAAA");
    expect(await ouvrirScelle(env as any, abime, "session-a")).toBeNull();
    expect(await ouvrirScelle({ ...env, ROBOT_SECRET: "une-autre-cle-du-worker-0123456789" } as any, s, "session-a")).toBeNull();
  });
  it("n'accepte que des identifiants courts et non vides", () => {
    expect(accesValide({ identifiant: " a ", mot_de_passe: "b" })).toEqual({ identifiant: "a", mot_de_passe: "b" });
    for (const x of [null, "x", {}, { identifiant: "", mot_de_passe: "b" }, { identifiant: "a", mot_de_passe: "" }, { identifiant: "a".repeat(201), mot_de_passe: "b" }, { identifiant: 1, mot_de_passe: "b" }]) expect(accesValide(x)).toBeNull();
  });
});

describe("robot : connexion automatique", () => {
  it("refuse des identifiants sans consentement, ou mal formés", async () => {
    const u = await seed("owner");
    const r1 = await call("/api/v1/migration/robot", { method: "POST", token: u.token, json: { adresse: ADRESSE, acces: ACCES } });
    expect(r1.status).toBe(400);
    expect(((await r1.json()) as any).error.code).toBe("consentement");
    const r2 = await call("/api/v1/migration/robot", { method: "POST", token: u.token, json: { adresse: ADRESSE, acces: { identifiant: "x" }, consentement: true } });
    expect(r2.status).toBe(400);
    expect(pages.length).toBe(0);
  });

  it("se connecte seul, demande le code de vérification au gérant, copie, efface les identifiants et apprend la recette", async () => {
    const u = await seed("owner");
    const r = await call("/api/v1/migration/robot", { method: "POST", token: u.token, json: { adresse: ADRESSE, logiciel: "kavalog", acces: ACCES, consentement: true } });
    expect(r.status).toBe(201);
    const j: any = await r.json();
    expect(j.auto).toBe(true);
    // le robot de la page est injecté avant le premier écran
    expect(pages[0].scripts.length).toBe(1);
    expect(pages[0].scripts[0]).toContain("__stablMx");
    // pas encore de code demandé : POST /code refusé
    const e = await attendre(() => etat(j.id), (v) => !!v?.code);
    expect(e!.scelle).toBeNull();
    expect(e!.progression).toMatchObject({ attente: "code" });
    const c = await call(`/api/v1/migration/robot/${j.id}/code`, { method: "POST", token: u.token, json: { code: "246 810" } });
    expect(c.status).toBe(200);
    expect((await call(`/api/v1/migration/robot/${j.id}/code`, { method: "POST", token: u.token, json: { code: "1" } })).status).toBe(409);
    await attendre(() => etat(j.id), (v) => v?.phase === "termine", 20000);
    // le mot de passe n'est allé qu'au formulaire de l'ancien logiciel
    expect(pages[0].recus.some((x) => x.motDePasse === MDP)).toBe(true);
    expect(pages[0].codes).toEqual(["246810"]);
    // rien en base : ni dans le journal d'audit, ni dans la recette apprise
    const audit = await env.DB.prepare("SELECT action, data FROM audit_log WHERE target = ?").bind(j.id).all<{ action: string; data: string }>();
    expect(audit.results.map((x) => x.action)).toContain("migration.robot.acces");
    expect(JSON.parse(audit.results.find((x) => x.action === "migration.robot.acces")!.data)).toEqual({ origine: "https://app.kavalog.example.fr", logiciel: "kavalog", consentement: true });
    const rec = await env.DB.prepare("SELECT software, name, recipe, created_by_club FROM migration_recipes WHERE software = 'kavalog' ORDER BY version DESC").first<any>();
    expect(rec).toMatchObject({ software: "kavalog", name: "app.kavalog.example.fr", created_by_club: u.clubId });
    const recette = JSON.parse(rec.recipe);
    expect(recette.origine).toBe("https://app.kavalog.example.fr");
    expect(recette.etapes[0]).toMatchObject({ chemin: "/connexion", signature: "nom|prénom|e-mail" });
    const tout = JSON.stringify(audit.results) + rec.recipe;
    for (const interdit of [MDP, "gerant@club.example", "Durand", "alice.durand", "246810"]) expect(tout).not.toContain(interdit);
    // la capture est là, sans les identifiants
    const cap = await call(`/api/v1/migration/robot/${j.id}/capture`, { token: u.token });
    const texte = await cap.text();
    expect(cap.status).toBe(200);
    expect(texte).toContain("Durand");
    expect(texte).not.toContain(MDP);
  }, 40000);

  it("identifiants refusés : le gérant est prévenu simplement et peut se connecter lui-même", async () => {
    deuxEtapes = false;
    const u = await seed("owner");
    const r = await call("/api/v1/migration/robot", { method: "POST", token: u.token, json: { adresse: ADRESSE, acces: { identifiant: "gerant@club.example", mot_de_passe: "faux" }, consentement: true } });
    const j: any = await r.json();
    const e = await attendre(() => etat(j.id), (v) => !!(v?.progression as any)?.message, 20000);
    expect(e!.phase).toBe("connexion");
    expect((e!.progression as any).message).toMatch(/refusé.*Connectez-vous vous-même/);
    // le gérant se connecte lui-même dans l'écran : la copie démarre comme en connexion assistée
    pages[0].etape = "ok";
    await attendre(() => etat(j.id), (v) => v?.phase === "termine", 20000);
  }, 40000);
});

describe("pilote facultatif", () => {
  it("sans clé : pas de pilote, le robot fait sans", () => {
    expect(creerPilote({ ...env, ANTHROPIC_API_KEY: undefined } as any)).toBeNull();
  });
  it("petit modèle d'abord, modèle au-dessus ensuite ; réponse JSON lue ; refus = rien", async () => {
    const appels: any[] = [];
    let reponse: any = { stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ action: "stop", why: "fini" }) }] };
    const p = creerPilote({ ...env, ANTHROPIC_API_KEY: "sk-test" } as any, () => ({ messages: { create: async (o: any) => { appels.push(o); return reponse; } } } as any))!;
    expect(await p({ page: { els: [] } })).toEqual({ action: "stop", why: "fini" });
    await p({ page: { els: [] } }, { fort: true });
    expect(appels.map((a) => a.model)).toEqual([MODELE_RAPIDE, MODELE_FORT]);
    expect(appels[0].output_config.format.type).toBe("json_schema");
    expect(appels[0].system[0].text).toMatch(/ne fait que LIRE/);
    reponse = { stop_reason: "refusal", content: [] };
    expect(await p({ page: {} })).toBeNull();
  });
  it("la vue envoyée est raccourcie pour tenir dans la limite", () => {
    const vue = { cherche: [{ type: "cavaliers" }], page: { texte: "x".repeat(5000), els: Array.from({ length: 400 }, (_, i) => ({ i, t: "élément " + i + " ".repeat(80) })), listes: Array.from({ length: 10 }, (_, k) => ({ k, ex: ["y".repeat(2000)] })) } };
    const t = vueCompacte(vue, 30000);
    expect(t.length).toBeLessThan(32000);
    expect(JSON.parse(t).cherche).toEqual([{ type: "cavaliers" }]);
  });
});
