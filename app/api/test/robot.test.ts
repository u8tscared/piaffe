import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { call, env, seed } from "./helpers";
import { newId } from "../src/lib/ids";
import { randomToken, sha256 } from "../src/lib/crypto";
import { setBrowserFactory, setRobotTiming } from "../src/robot/routes";
import { adresseAutorisee, ressourceAutorisee } from "../src/robot/migration";
import type { RobotSession } from "../src/robot/session";

/* ---------- fausse page (interface Puppeteer réduite) ---------- */
class FaussePage {
  adresse = "about:blank";
  connecte = false;
  /** Contrôles qui alternent connecté / pas connecté (pour vérifier qu'un seul contrôle ne suffit pas). */
  clignote = false;
  visites: string[] = [];
  frappes: string[] = [];
  clics: [number, number][] = [];
  touches: string[] = [];
  molette: number[] = [];
  controles = 0;
  cdp: { handlers: Record<string, (e: any) => void>; envoyes: string[] } | null = null;
  avecScreencast = false;
  async goto(url: string) { this.visites.push(url); this.adresse = url; }
  url() { return this.adresse; }
  async evaluate(fn: (...a: any[]) => any) {
    if (fn.name === "extrairePage") {
      this.controles++;
      const ok = this.clignote ? this.controles % 2 === 1 : this.connecte;
      if (!ok) return { url: this.adresse, titre: "Connexion", tables: [], fiches: [], suivant: null, liens: [], connexion: true };
      return {
        url: this.adresse, titre: "Cavaliers", fiches: [], suivant: null, liens: [], connexion: false,
        tables: [{ titre: "Liste des cavaliers", selecteur: "#cavaliers", details: [],
          entetes: ["Nom", "Prénom", "E-mail", "Téléphone", "Date de naissance"],
          lignes: [["Durand", "Alice", "alice.durand@exemple.fr", "06 01 02 03 04", "12/03/1990"], ["Martin", "Paul", "paul.martin@exemple.fr", "06 05 06 07 08", "02/07/2008"]] }],
      };
    }
    if (fn.name === "empreinte") return this.adresse + "|1";
    return false;
  }
  async screenshot() { return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]); }
  mouse = { click: async (x: number, y: number) => { this.clics.push([x, y]); }, wheel: async (o: { deltaY?: number }) => { this.molette.push(o.deltaY ?? 0); } };
  keyboard = { type: async (t: string) => { this.frappes.push(t); }, press: async (k: string) => { this.touches.push(k); if (k === "Enter") this.connecte = true; } };
}

let pages: FaussePage[] = [];
let fermes = 0;
let orphelins: string[] = [];
let panne = false;
let screencast = false;
function installer() {
  setBrowserFactory({
    async ouvrir() {
      if (panne) throw new Error("429 Too many requests");
      const p = new FaussePage();
      if (screencast) {
        (p as any).createCDPSession = async () => {
          const c = { handlers: {} as Record<string, (e: any) => void>, envoyes: [] as string[],
            on(ev: string, f: (e: any) => void) { c.handlers[ev] = f; },
            async send(m: string) { c.envoyes.push(m); } };
          p.cdp = c; return c;
        };
      }
      pages.push(p);
      return { page: p as any, sessionId: "brs_" + pages.length, fermer: async () => { fermes++; } };
    },
    async fermerOrphelin(_env, id) { orphelins.push(id); },
  });
}
beforeEach(() => {
  pages = []; fermes = 0; orphelins = []; panne = false; screencast = false;
  installer();
  setRobotTiming({ controle: 15, imageConnexion: 15, imageCopie: 15, battement: 50 });
});
afterAll(() => { setBrowserFactory(null); setRobotTiming(null); });

const ADRESSE = "https://app.kavalog.example.fr/connexion";
const stub = (id: string) => env.ROBOT!.get(env.ROBOT!.idFromName(id)) as DurableObjectStub<RobotSession>;
const phase = (id: string) => runInDurableObject(stub(id), (o: RobotSession) => o.etat?.phase ?? null);
async function attendre<T>(f: () => Promise<T> | T, ok: (v: T) => boolean, ms = 4000): Promise<T> {
  const fin = Date.now() + ms;
  for (;;) { const v = await f(); if (ok(v)) return v; if (Date.now() > fin) throw new Error("délai dépassé : " + JSON.stringify(v)); await new Promise((r) => setTimeout(r, 15)); }
}
async function ouvrir(role: "owner" | "manager" = "owner", o: Parameters<typeof seed>[1] = {}, adresse = ADRESSE) {
  const u = await seed(role, o);
  const r = await call("/api/v1/migration/robot", { method: "POST", token: u.token, json: { adresse } });
  const j: any = await r.json();
  return { ...u, r, j, id: j.id as string };
}
/** Lit le flux SSE jusqu'à trouver le motif (ou délai), puis ferme la lecture. */
async function lireFlux(res: Response, motif: RegExp, ms = 3000) {
  const lecteur = res.body!.getReader(); const dec = new TextDecoder(); let txt = "";
  const fin = Date.now() + ms;
  try {
    while (!motif.test(txt) && Date.now() < fin) {
      const r = await Promise.race([lecteur.read(), new Promise<{ done: true; value: undefined }>((ok) => setTimeout(() => ok({ done: true, value: undefined }), Math.max(1, fin - Date.now())))]);
      if (r.done) break;
      txt += dec.decode(r.value, { stream: true });
    }
  } finally { await lecteur.cancel().catch(() => {}); }
  return txt;
}
const evenements = (txt: string) => [...txt.matchAll(/event: (\w+)\ndata: (.*)\n\n/g)].map((m) => ({ type: m[1], data: JSON.parse(m[2]) }));
async function cleApi(clubId: string, scopes = ["import"]) {
  const token = "pk_live_" + randomToken(6) + "_" + randomToken(24);
  await env.DB.prepare("INSERT INTO api_keys (id, club_id, name, prefix, hash, scopes) VALUES (?,?,?,?,?,?)")
    .bind(newId("key"), clubId, "Test", token.slice(0, 14), await sha256(token), JSON.stringify(scopes)).run();
  return token;
}

describe("robot : création et droits", () => {
  it("le gérant ouvre une session : 201 {id, largeur, hauteur} et le navigateur va à l'adresse", async () => {
    const s = await ouvrir();
    expect(s.r.status).toBe(201);
    expect(s.j).toEqual({ id: expect.stringMatching(/^[\w-]{24}$/), largeur: 1280, hauteur: 800 });
    expect(pages[0].visites).toEqual([ADRESSE]);
    expect(await phase(s.id)).toBe("connexion");
    const a = await env.DB.prepare("SELECT data FROM audit_log WHERE action = 'migration.robot.open' AND target = ?").bind(s.id).first<{ data: string }>();
    expect(JSON.parse(a!.data)).toEqual({ origine: "https://app.kavalog.example.fr", logiciel: null });
  });

  it("un manager peut aussi ouvrir une session", async () => {
    expect((await ouvrir("manager")).r.status).toBe(201);
  });

  it("refuse les autres rôles (403), l'anonyme (401) et les clés d'API, même de scope import (403)", async () => {
    for (const role of ["staff", "coach", "member", "accountant"] as const) {
      const u = await seed(role);
      const r = await call("/api/v1/migration/robot", { method: "POST", token: u.token, json: { adresse: ADRESSE } });
      expect(r.status, role).toBe(403);
    }
    expect((await call("/api/v1/migration/robot", { method: "POST", json: { adresse: ADRESSE }, headers: { "x-requested-with": "piaffe" } })).status).toBe(401);
    const g = await seed("owner");
    const k = await cleApi(g.clubId, ["import", "migration"]);
    expect((await call("/api/v1/migration/robot", { method: "POST", token: k, json: { adresse: ADRESSE } })).status).toBe(403);
    expect(pages.length).toBe(0);
  });

  it("refuse les adresses internes ou non https sans ouvrir de navigateur", async () => {
    const u = await seed("owner");
    for (const adresse of ["http://app.kavalog.fr", "https://localhost/", "https://127.0.0.1/", "https://10.1.2.3/", "https://192.168.1.10/", "https://172.16.0.1/",
      "https://169.254.169.254/latest", "https://[::1]/", "https://2130706433/", "https://0x7f.1/", "https://serveur.local/", "https://nas.internal/", "https://intranet/",
      "file:///etc/passwd", "javascript:alert(1)", "https://user:mdp@app.kavalog.fr/", "", 42]) {
      const r = await call("/api/v1/migration/robot", { method: "POST", token: u.token, json: { adresse } });
      expect(r.status, String(adresse)).toBe(400);
      expect(((await r.json()) as any).error.code).toBe("adresse");
    }
    expect(pages.length).toBe(0);
  });

  it("adresseAutorisee et ressourceAutorisee : règles du serveur", () => {
    expect(adresseAutorisee("https://app.equimondo.fr/login?x=1")).toBe(true);
    expect(adresseAutorisee("https://100.64.0.1/")).toBe(false);
    expect(adresseAutorisee("https://box.home/")).toBe(false);
    expect(ressourceAutorisee("http://cdn.exemple.fr/a.css")).toBe(true);
    expect(ressourceAutorisee("data:image/png;base64,AAAA")).toBe(true);
    expect(ressourceAutorisee("http://127.0.0.1:8080/admin")).toBe(false);
    expect(ressourceAutorisee("http://169.254.169.254/latest/meta-data")).toBe(false);
  });

  it("limite à 6 sessions par club et par heure (429)", async () => {
    const u = await seed("owner");
    for (let i = 0; i < 6; i++) expect((await call("/api/v1/migration/robot", { method: "POST", token: u.token, json: { adresse: ADRESSE } })).status).toBe(201);
    const r = await call("/api/v1/migration/robot", { method: "POST", token: u.token, json: { adresse: ADRESSE } });
    expect(r.status).toBe(429);
  });

  it("navigateur indisponible : 503 avec un message clair, rien n'est conservé", async () => {
    panne = true;
    const s = await ouvrir();
    expect(s.r.status).toBe(503);
    expect(s.j.error.code).toBe("navigateur");
    expect(s.j.error.message).toMatch(/Réessayez/);
  });
});

describe("robot : isolation", () => {
  it("un autre club ne voit jamais la session (404), ni un autre gérant du même club", async () => {
    const s = await ouvrir();
    const autreClub = await seed("owner");
    const memeClub = await seed("manager", { clubId: s.clubId });
    for (const t of [autreClub.token, memeClub.token]) {
      expect((await call(`/api/v1/migration/robot/${s.id}/flux`, { token: t })).status).toBe(404);
      expect((await call(`/api/v1/migration/robot/${s.id}/entree`, { method: "POST", token: t, json: { type: "texte", texte: "x" } })).status).toBe(404);
      expect((await call(`/api/v1/migration/robot/${s.id}/demarrer`, { method: "POST", token: t })).status).toBe(404);
      expect((await call(`/api/v1/migration/robot/${s.id}/capture`, { token: t })).status).toBe(404);
      expect((await call(`/api/v1/migration/robot/${s.id}`, { method: "DELETE", token: t })).status).toBe(404);
    }
    expect(pages[0].frappes).toEqual([]);
    expect(await phase(s.id)).toBe("connexion");
    expect(fermes).toBe(0);
    // identifiant malformé ou inconnu
    expect((await call(`/api/v1/migration/robot/abc/flux`, { token: s.token })).status).toBe(404);
    expect((await call(`/api/v1/migration/robot/${"A".repeat(24)}/flux`, { token: s.token })).status).toBe(404);
  });
});

describe("robot : connexion du gérant", () => {
  it("transmet clic, texte, touche et molette, bornés, sans rien stocker ni journaliser", async () => {
    const s = await ouvrir();
    const e = (j: unknown) => call(`/api/v1/migration/robot/${s.id}/entree`, { method: "POST", token: s.token, json: j });
    const secret = "MotDePasse-Tres-Secret-42";
    expect((await e({ type: "clic", x: 5000, y: -3 })).status).toBe(200);
    expect((await e({ type: "texte", texte: secret })).status).toBe(200);
    expect((await e({ type: "texte", texte: "a".repeat(500) })).status).toBe(200);
    expect((await e({ type: "touche", touche: "Tab" })).status).toBe(200);
    expect((await e({ type: "touche", touche: "F12" })).status).toBe(400);
    expect((await e({ type: "defiler", dy: 99999 })).status).toBe(200);
    expect((await e({ type: "inconnu" })).status).toBe(400);
    const p = pages[0];
    expect(p.clics).toEqual([[1280, 0]]);
    expect(p.frappes).toEqual([secret, "a".repeat(200)]);
    expect(p.touches).toEqual(["Tab"]);
    expect(p.molette).toEqual([2000]);
    // ni dans le stockage du Durable Object, ni dans la base
    const stocke = await runInDurableObject(stub(s.id), async (_o: RobotSession, st) => JSON.stringify([...(await st.storage.list()).entries()]));
    expect(stocke).not.toContain(secret);
    expect(stocke).not.toContain(s.token);
    for (const t of ["audit_log", "rate_limits", "import_items", "import_jobs"]) {
      const rows = await env.DB.prepare(`SELECT * FROM ${t}`).all();
      expect(JSON.stringify(rows.results), t).not.toContain(secret);
    }
  });

  it("refuse toute entrée hors de la phase connexion (409)", async () => {
    const s = await ouvrir();
    pages[0].connecte = true;
    expect((await call(`/api/v1/migration/robot/${s.id}/demarrer`, { method: "POST", token: s.token })).status).toBe(202);
    await attendre(() => phase(s.id), (p) => p !== "connexion");
    const r = await call(`/api/v1/migration/robot/${s.id}/entree`, { method: "POST", token: s.token, json: { type: "texte", texte: "trop tard" } });
    expect(r.status).toBe(409);
    expect(((await r.json()) as any).error.code).toBe("phase");
    expect(pages[0].frappes).toEqual([]);
  });

  it("flux SSE : état initial puis images JPEG en base64", async () => {
    const s = await ouvrir();
    const res = await call(`/api/v1/migration/robot/${s.id}/flux`, { token: s.token });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/^text\/event-stream/);
    const ev = evenements(await lireFlux(res, /event: image[\s\S]*event: image/));
    expect(ev[0]).toEqual({ type: "etat", data: { phase: "connexion" } });
    const img = ev.find((x) => x.type === "image")!;
    expect([...atob(img.data)].map((c) => c.charCodeAt(0)).slice(0, 3)).toEqual([0xff, 0xd8, 0xff]);
  });

  it("flux SSE par screencast quand la page le permet (images seulement quand l'écran change)", async () => {
    screencast = true;
    const s = await ouvrir();
    const res = await call(`/api/v1/migration/robot/${s.id}/flux`, { token: s.token });
    await attendre(() => pages[0].cdp?.envoyes.includes("Page.startScreencast") ?? false, (v) => v);
    // l'image arrive par la connexion CDP, donc dans le contexte du Durable Object
    await runInDurableObject(stub(s.id), () => { pages[0].cdp!.handlers["Page.screencastFrame"]({ data: "Q0FEUkU=", sessionId: 7 }); });
    const ev = evenements(await lireFlux(res, /"Q0FEUkU="/));
    expect(ev.some((x) => x.type === "image" && x.data === "Q0FEUkU=")).toBe(true);
    expect(pages[0].cdp!.envoyes).toContain("Page.screencastFrameAck");
  });

  it("un seul contrôle positif ne suffit pas pour démarrer la copie", async () => {
    const s = await ouvrir();
    pages[0].clignote = true;
    await attendre(() => pages[0].controles, (n) => n >= 8);
    expect(await phase(s.id)).toBe("connexion");
  });
});

describe("robot : copie et import", () => {
  it("démarre seul après deux contrôles, envoie un job en simulation, puis la capture ferme la session", async () => {
    const s = await ouvrir();
    const res = await call(`/api/v1/migration/robot/${s.id}/flux`, { token: s.token });
    expect((await call(`/api/v1/migration/robot/${s.id}/capture`, { token: s.token })).status).toBe(409);
    // le gérant valide son mot de passe avec Entrée : la page n'a plus de champ mot de passe
    await call(`/api/v1/migration/robot/${s.id}/entree`, { method: "POST", token: s.token, json: { type: "touche", touche: "Enter" } });
    const txt = await lireFlux(res, /"phase":"termine"/, 6000);
    const ev = evenements(txt).filter((x) => x.type === "etat");
    expect(ev.map((x) => x.data.phase)).toEqual(expect.arrayContaining(["connexion", "copie", "termine"]));
    expect(pages[0].controles).toBeGreaterThanOrEqual(2);
    const fin = ev.find((x) => x.data.phase === "termine")!.data;
    expect(fin.job_id).toMatch(/^imp_/);
    expect(fin.import.objets).toBeGreaterThan(0);
    expect(fin.import.simulation.totals.received).toBeGreaterThan(0);
    expect(fin.confirmer).toEqual({ methode: "POST", chemin: `/api/v1/import/jobs/${fin.job_id}/commit`, corps: { dry_run: false } });
    expect(fermes).toBe(1); // navigateur fermé dès la fin de la copie

    const job = await env.DB.prepare("SELECT * FROM import_jobs WHERE id = ?").bind(fin.job_id).first<any>();
    expect(job).toMatchObject({ club_id: s.clubId, dry_run: 1, status: "simulated", created_by: s.userId });
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM records WHERE club_id = ?").bind(s.clubId).first<any>()).n).toBe(0);

    const cap = await call(`/api/v1/migration/robot/${s.id}/capture`, { token: s.token });
    expect(cap.status).toBe(200);
    const c: any = await cap.json();
    expect(c.format).toBe("piaffe-capture");
    expect(c.tables[0].lignes.length).toBe(2);
    // la capture ferme la session : plus rien en mémoire ni en stockage
    expect((await call(`/api/v1/migration/robot/${s.id}/flux`, { token: s.token })).status).toBe(404);
    expect(await runInDurableObject(stub(s.id), async (_o: RobotSession, st) => (await st.storage.list()).size)).toBe(0);

    // le gérant confirme comme avec la passerelle
    const ok = await call(`/api/v1/import/jobs/${fin.job_id}/commit`, { method: "POST", token: s.token, json: { dry_run: false } });
    expect(ok.status).toBe(200);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM records WHERE club_id = ? AND coll = 'members'").bind(s.clubId).first<any>()).n).toBe(2);
  });

  it("le job d'import appartient au club du gérant : un autre club ne le voit pas", async () => {
    const s = await ouvrir();
    pages[0].connecte = true;
    const fin = await attendre(() => runInDurableObject(stub(s.id), (o: RobotSession) => o.etat?.job_id ?? null), (v) => !!v, 6000);
    const autre = await seed("owner");
    expect((await call(`/api/v1/import/jobs/${fin}`, { token: autre.token })).status).toBe(404);
    expect((await call(`/api/v1/import/jobs/${fin}`, { token: s.token })).status).toBe(200);
  });

  it("DELETE abandonne : navigateur fermé, session effacée", async () => {
    const s = await ouvrir();
    const r = await call(`/api/v1/migration/robot/${s.id}`, { method: "DELETE", token: s.token });
    expect(r.status).toBe(200);
    expect(fermes).toBe(1);
    expect(await phase(s.id)).toBeNull();
    expect((await call(`/api/v1/migration/robot/${s.id}/entree`, { method: "POST", token: s.token, json: { type: "texte", texte: "x" } })).status).toBe(404);
  });
});

describe("robot : alarme du Durable Object", () => {
  it("ferme la session après 20 minutes d'inactivité", async () => {
    const s = await ouvrir();
    const st = stub(s.id);
    // activité récente : l'alarme se réarme et la session reste ouverte
    expect(await runDurableObjectAlarm(st)).toBe(true);
    expect(await phase(s.id)).toBe("connexion");
    expect(await runInDurableObject(st, (_o: RobotSession, x) => x.storage.getAlarm())).not.toBeNull();
    // 21 minutes sans rien
    await runInDurableObject(st, (o: RobotSession) => { o.etat!.vu = Date.now() - 21 * 60_000; });
    expect(await runDurableObjectAlarm(st)).toBe(true);
    expect(fermes).toBe(1);
    expect(await phase(s.id)).toBeNull();
    expect(await runInDurableObject(st, async (_o: RobotSession, x) => [(await x.storage.list()).size, await x.storage.getAlarm()])).toEqual([0, null]);
    expect((await call(`/api/v1/migration/robot/${s.id}/flux`, { token: s.token })).status).toBe(404);
  });

  it("après une éviction (mémoire perdue), l'alarme libère le navigateur Browser Rendering resté ouvert", async () => {
    const s = await ouvrir();
    const st = stub(s.id);
    await runInDurableObject(st, (o: RobotSession) => { const e = o.etat!; e.ouverte = false; o.etat = null; });
    expect(await runDurableObjectAlarm(st)).toBe(true);
    expect(orphelins).toEqual(["brs_1"]);
    expect(await runInDurableObject(st, async (_o: RobotSession, x) => (await x.storage.list()).size)).toBe(0);
  });
});
