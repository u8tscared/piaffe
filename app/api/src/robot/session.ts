/*
 * Une session du robot de migration = un Durable Object = un navigateur Browser Rendering.
 *
 * Phases : connexion (le gérant voit l'écran et se connecte lui-même) → copie (le robot lit l'ancien logiciel,
 * en lecture seule) → termine | erreur. La copie démarre seule après deux contrôles estConnecte() positifs,
 * ou sur POST /demarrer. Les paquets partent vers l'API d'import (job en simulation, dry_run) ; le gérant
 * confirme ensuite comme avec la passerelle (POST /api/v1/import/jobs/:id/commit {"dry_run": false}).
 *
 * Connexion automatique (« Donnez-nous vos codes ») : l'identifiant et le mot de passe arrivent scellés (coffre.ts,
 * AES-GCM lié à cette session), restent scellés en mémoire, sont ouverts une seule fois pour remplir le formulaire
 * de l'ancien logiciel, puis effacés. Un code de vérification demandé par le logiciel est demandé au gérant dans la
 * page (événement « etat » {attente: "code"}, réponse POST /code). Si la connexion échoue, le gérant se connecte
 * lui-même dans l'écran, comme en connexion assistée.
 *
 * Ce qui n'est JAMAIS conservé : les frappes du gérant (identifiants, mots de passe, codes) vont directement
 * au navigateur distant, sans journal ni stockage. Le jeton de session Stabl du gérant (pour les appels à
 * l'API d'import) et la capture restent en mémoire seulement, et disparaissent à la fermeture.
 * Le stockage du Durable Object ne contient que : club, utilisateur, dates, identifiant du navigateur.
 * Ce que le robot a appris du logiciel (recette, sans aucune donnée du club) est enregistré pour le club suivant.
 */
import { DurableObject } from "cloudflare:workers";
import type { Env } from "../env";
import { CONTROLES_AVANT_COPIE, HAUTEUR, HISTORIQUE_JOURS, LARGEUR, QUALITE_JPEG, T, TEXTE_MAX, TOUCHES } from "./reglages";
import { estConnecte, familleDe, migrerDepuisPage, POURQUOI, scriptRobot, seConnecter, versLots, type PageRobot } from "./migration";
import { ouvrirScelle, type EnvRobot } from "./coffre";
import { creerPilote } from "./ia";
import { one, run } from "../lib/db";
import { newId } from "../lib/ids";
import { navigateur, NavigateurIndisponible, type NavigateurOuvert } from "./navigateur";

export type Phase = "connexion" | "copie" | "termine" | "erreur";
interface Meta { id: string; club_id: string; user_id: string; cree_le: string; browser_session: string | null }
type Ecrivain = WritableStreamDefaultWriter<Uint8Array>;

export interface EtatSession {
  id: string; club: string; user: string; jeton: string; logiciel: string | null;
  nav: NavigateurOuvert | null; phase: Phase; progression: Record<string, unknown>;
  clients: Set<Ecrivain>; signal: { arret: boolean }; vu: number; ouverte: boolean;
  capture: Record<string, unknown> | null; job_id: string | null; screencast: boolean;
  fin: Record<string, unknown> | null;
  /** Identifiants scellés (connexion automatique), effacés dès la tentative de connexion faite. */
  scelle: string | null; adresse: string; hotes: string[];
  /** Code de vérification attendu du gérant. */
  attenteCode: ((code: string) => void) | null;
}

const enc = new TextEncoder();
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MSG = {
  session: "Cette session de connexion assistée est terminée. Relancez-la depuis la page de migration.",
  phase: "Le robot a déjà pris la main : la saisie n'est possible que pendant la connexion.",
  pasFini: "La copie n'est pas encore terminée.",
  pasDeCode: "Aucun code n'est demandé pour l'instant.",
  entree: "Action inconnue : utilisez clic, texte, touche ou defiler.",
  navigateur: "Le navigateur Stabl n'a pas pu démarrer. Réessayez dans une minute ou déposez un export de votre logiciel.",
  copie: "La copie s'est interrompue.",
} as const;

function b64(bin: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bin.length; i += 0x8000) s += String.fromCharCode(...bin.subarray(i, i + 0x8000));
  return btoa(s);
}
function enOctets(x: Uint8Array | ArrayBuffer | string): string {
  if (typeof x === "string") return x;
  return b64(x instanceof Uint8Array ? x : new Uint8Array(x));
}
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const erreur = (status: number, code: string, message: string) => json({ error: { code, message } }, status);
const borne = (v: unknown, min: number, max: number) => { const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : min; };

export class RobotSession extends DurableObject<Env> {
  /** État vivant de la session (en mémoire seulement). Public pour les tests. */
  etat: EtatSession | null = null;

  async fetch(req: Request): Promise<Response> {
    const u = new URL(req.url);
    const action = u.pathname.replace(/^\/+/, "");
    if (action === "creer" && req.method === "POST") return this.creer(await req.json());
    const meta = await this.ctx.storage.get<Meta>("meta");
    const s = this.etat;
    // Un autre club ou un autre utilisateur obtient la même réponse qu'une session inexistante.
    if (!meta || !s || meta.club_id !== req.headers.get("x-robot-club") || meta.user_id !== req.headers.get("x-robot-user"))
      return erreur(404, "session", MSG.session);
    s.vu = Date.now();
    if (action === "flux" && req.method === "GET") return this.flux(s);
    if (action === "entree" && req.method === "POST") {
      let e: any = null; try { e = await req.json(); } catch { /* corps invalide */ }
      return this.entree(s, e);
    }
    if (action === "code" && req.method === "POST") {
      let e: any = null; try { e = await req.json(); } catch { /* corps invalide */ }
      const r = s.attenteCode;
      if (!r) return erreur(409, "pas_de_code", MSG.pasDeCode);
      const code = typeof e?.code === "string" ? e.code.replace(/\s+/g, "").slice(0, 12) : "";
      if (!code) return erreur(400, "code", "Tapez le code reçu.");
      s.attenteCode = null; r(code);
      this.etatConnexion(s, { auto: true, progression: "Code envoyé, connexion…" });
      return json({ ok: true });
    }
    if (action === "demarrer" && req.method === "POST") {
      if (s.phase === "connexion") this.ctx.waitUntil(this.demarrer(s));
      return json({ ok: true, phase: s.phase }, 202);
    }
    if (action === "capture" && req.method === "GET") {
      if (!s.capture) return erreur(409, "pas_fini", MSG.pasFini);
      const c = s.capture;
      await this.fermer();
      return json(c);
    }
    if (action === "fermer" && req.method === "DELETE") { await this.fermer(); return json({ ok: true }); }
    return erreur(404, "not_found", "Route inconnue.");
  }

  /* ---------- création ---------- */
  private async creer(b: { id: string; adresse: string; club_id: string; user_id: string; jeton: string; logiciel?: string | null; scelle?: string | null }) {
    if (this.etat || (await this.ctx.storage.get("meta"))) return erreur(409, "session_existe", "Cette session existe déjà.");
    let nav: NavigateurOuvert;
    try { nav = await navigateur().ouvrir(this.env); }
    catch (e) {
      console.error("robot: navigateur indisponible", e instanceof NavigateurIndisponible ? "lancement" : (e as Error)?.name);
      return erreur(503, "navigateur", MSG.navigateur);
    }
    const s: EtatSession = {
      id: b.id, club: b.club_id, user: b.user_id, jeton: b.jeton, logiciel: b.logiciel || null, nav, phase: "connexion",
      progression: {}, clients: new Set(), signal: { arret: false }, vu: Date.now(), ouverte: true,
      capture: null, job_id: null, screencast: false, fin: null,
      scelle: typeof b.scelle === "string" ? b.scelle : null, adresse: b.adresse, hotes: [], attenteCode: null,
    };
    this.etat = s;
    await this.ctx.storage.put<Meta>("meta", { id: b.id, club_id: b.club_id, user_id: b.user_id, cree_le: new Date().toISOString(), browser_session: nav.sessionId ?? null });
    await this.ctx.storage.setAlarm(Date.now() + T.alarme);
    // Le robot de la page écoute dès le premier écran ce que le logiciel charge (lecture seule, aucun champ secret).
    await nav.page.ajouterScript?.(scriptRobot({ historiqueJours: HISTORIQUE_JOURS })).catch(() => {});
    await nav.page.goto(b.adresse, { waitUntil: "load", timeout: T.chargement }).catch(() => {});
    this.ctx.waitUntil(this.boucleImages(s));
    const auto = !!s.scelle;
    this.ctx.waitUntil(auto ? this.connexionAuto(s) : this.surveillerConnexion(s));
    return json({ id: b.id, largeur: LARGEUR, hauteur: HAUTEUR, ...(auto ? { auto: true } : {}) }, 201);
  }

  /* ---------- flux SSE ---------- */
  private flux(s: EtatSession) {
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const w = writable.getWriter();
    s.clients.add(w);
    w.closed.catch(() => {}).finally(() => s.clients.delete(w));
    this.ecrire(s, w, "etat", { phase: s.phase, ...s.progression, ...(s.fin || {}) });
    if (s.nav && (s.phase === "connexion" || s.phase === "copie")) {
      this.ctx.waitUntil(this.image(s, w));
      if (!s.screencast) this.ctx.waitUntil(this.demarrerScreencast(s));
    }
    return new Response(readable, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
  }
  private ecrire(s: EtatSession, w: Ecrivain, type: string, donnees: unknown, facultatif = false) {
    // Client lent : on saute des images plutôt que d'accumuler de la mémoire.
    if (facultatif && w.desiredSize !== null && w.desiredSize <= 0) return;
    w.write(enc.encode(`event: ${type}\ndata: ${JSON.stringify(donnees)}\n\n`)).catch(() => s.clients.delete(w));
  }
  private diffuser(s: EtatSession, type: string, donnees: unknown) {
    for (const w of s.clients) this.ecrire(s, w, type, donnees, type === "image");
  }
  private async image(s: EtatSession, seul?: Ecrivain) {
    if (!s.nav) return;
    try {
      const img = enOctets(await s.nav.page.screenshot({ type: "jpeg", quality: QUALITE_JPEG }));
      if (seul) this.ecrire(s, seul, "image", img, true); else this.diffuser(s, "image", img);
    } catch { /* page en cours de navigation */ }
  }
  /** Screencast CDP : le navigateur n'envoie une image que quand l'écran change. Sinon, captures périodiques. */
  private async demarrerScreencast(s: EtatSession) {
    const page = s.nav?.page as PageRobot | undefined;
    if (!page?.createCDPSession || s.screencast) return;
    s.screencast = true;
    try {
      const cdp = await page.createCDPSession();
      cdp.on("Page.screencastFrame", (f: { data: string; sessionId: number }) => {
        cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
        if (s.ouverte && s.clients.size && (s.phase === "connexion" || s.phase === "copie")) this.diffuser(s, "image", f.data);
      });
      await cdp.send("Page.startScreencast", { format: "jpeg", quality: QUALITE_JPEG, maxWidth: LARGEUR, maxHeight: HAUTEUR, everyNthFrame: 1 });
    } catch { s.screencast = false; }
  }
  private async boucleImages(s: EtatSession) {
    let battement = Date.now();
    while (s.ouverte && (s.phase === "connexion" || s.phase === "copie")) {
      if (s.clients.size && !s.screencast) await this.image(s);
      if (Date.now() - battement > T.battement) { battement = Date.now(); for (const w of s.clients) w.write(enc.encode(": ping\n\n")).catch(() => s.clients.delete(w)); }
      await dormir(s.phase === "connexion" ? T.imageConnexion : T.imageCopie);
    }
  }

  /* ---------- connexion du gérant ---------- */
  private async entree(s: EtatSession, e: any) {
    if (s.phase !== "connexion" || !s.nav) return erreur(409, "phase", MSG.phase);
    if (!e || typeof e !== "object") return erreur(400, "entree", MSG.entree);
    const p = s.nav.page;
    // Rien de ce qui est tapé n'est journalisé, renvoyé ou stocké : les erreurs sont silencieuses.
    try {
      if (e.type === "clic") await p.mouse.click(borne(e.x, 0, LARGEUR), borne(e.y, 0, HAUTEUR));
      else if (e.type === "texte" && typeof e.texte === "string") await p.keyboard.type(e.texte.slice(0, TEXTE_MAX));
      else if (e.type === "touche" && TOUCHES.has(e.touche)) await p.keyboard.press(e.touche);
      else if (e.type === "defiler") await p.mouse.wheel({ deltaY: borne(e.dy ?? 0, -2000, 2000) });
      else return erreur(400, "entree", MSG.entree);
    } catch { /* page en cours de navigation */ }
    return json({ ok: true });
  }
  private etatConnexion(s: EtatSession, e: Record<string, unknown>) {
    s.progression = e;
    this.diffuser(s, "etat", { phase: "connexion", ...e });
  }
  /** Connexion avec les identifiants confiés ; en cas d'échec, le gérant prend la main dans l'écran. */
  private async connexionAuto(s: EtatSession) {
    const scelle = s.scelle; s.scelle = null;
    this.etatConnexion(s, { auto: true, progression: "Connexion à votre ancien logiciel…" });
    let r: { ok: boolean; pourquoi?: string; hotes?: string[] } = { ok: false, pourquoi: "connexion" };
    const acces = scelle ? await ouvrirScelle(this.env as EnvRobot, scelle, s.id) : null;
    if (acces && s.nav) {
      const demanderCode = () => new Promise<string>((ok) => {
        s.attenteCode = ok;
        this.etatConnexion(s, { auto: true, attente: "code", progression: "Votre logiciel demande un code de vérification." });
        setTimeout(() => { if (s.attenteCode === ok) { s.attenteCode = null; ok(""); } }, T.attenteCode);
      });
      try { r = await seConnecter(s.nav.page, { adresse: s.adresse, identifiant: acces.identifiant, motDePasse: acces.mot_de_passe, demanderCode }); }
      catch { r = { ok: false, pourquoi: "connexion" }; }
      acces.identifiant = ""; acces.mot_de_passe = "";
    }
    s.attenteCode = null;
    if (!s.ouverte) return;
    if (r.ok) { s.hotes = r.hotes || []; return this.demarrer(s); }
    this.etatConnexion(s, { auto: false, message: (POURQUOI[r.pourquoi || "connexion"] || POURQUOI.connexion) + " Connectez-vous vous-même dans l'écran ci-dessous." });
    return this.surveillerConnexion(s);
  }
  private async surveillerConnexion(s: EtatSession) {
    let stable = 0;
    while (s.ouverte && s.phase === "connexion") {
      await dormir(T.controle);
      if (!s.ouverte || s.phase !== "connexion" || !s.nav) return;
      try { stable = (await estConnecte(s.nav.page)) ? stable + 1 : 0; } catch { stable = 0; }
      if (stable >= CONTROLES_AVANT_COPIE) return this.demarrer(s);
    }
  }

  /* ---------- copie puis envoi vers l'API d'import ---------- */
  private async demarrer(s: EtatSession) {
    if (s.phase !== "connexion" || !s.nav) return;
    s.phase = "copie"; s.vu = Date.now();
    this.diffuser(s, "etat", { phase: "copie" });
    try {
      const recette = await this.recette(s);
      const r = await migrerDepuisPage(s.nav.page, {
        logiciel: s.logiciel, famille: familleDe(s.logiciel), recette, signal: s.signal, hotes: s.hotes,
        ia: creerPilote(this.env as EnvRobot), historiqueJours: HISTORIQUE_JOURS, limiteMs: T.copie,
        surEtat: (e) => { s.vu = Date.now(); s.progression = e; this.diffuser(s, "etat", { phase: "copie", ...e }); },
      });
      if (!s.ouverte) return;
      s.capture = r.capture;
      if (r.ok && r.recette) await this.apprendre(s, r.recette).catch(() => {});
      const envoi = await this.envoyerVersImport(s, r.paquet);
      s.phase = "termine";
      s.fin = { controle: r.paquet.controle ?? null, ...envoi };
      this.diffuser(s, "etat", { phase: "termine", ...s.fin });
    } catch (err) {
      if (!s.ouverte) return;
      console.error("robot: copie interrompue", (err as Error)?.name || "Error");
      s.phase = "erreur";
      s.fin = { message: MSG.copie };
      this.diffuser(s, "etat", { phase: "erreur", ...s.fin });
    }
    // Les cookies de l'ancien logiciel ne servent plus : on ferme le navigateur tout de suite.
    const nav = s.nav; s.nav = null;
    await nav?.fermer().catch(() => {});
    s.vu = Date.now();
  }

  /** Logiciel d'une recette : celui du catalogue, sinon l'adresse (logiciel encore inconnu). */
  private logicielDeRecette(s: EtatSession): string | null {
    if (s.logiciel) return s.logiciel;
    try { return ("site-" + new URL(s.adresse).hostname.toLowerCase()).replace(/[^a-z0-9_.-]/g, "-").slice(0, 40); } catch { return null; }
  }
  /** Ce qui a marché devient la recette du logiciel pour le club suivant (nettoyée : aucune donnée du club). */
  private async apprendre(s: EtatSession, recette: Record<string, any>) {
    const logiciel = this.logicielDeRecette(s);
    if (!logiciel || !recette?.origine) return;
    const nom = new URL(recette.origine).hostname.toLowerCase().replace(/[^a-z0-9_.-]/g, "-").slice(0, 60);
    const brut = JSON.stringify(recette);
    if (brut.length > 256 * 1024) return;
    // Même table que POST /api/v1/migration/recettes (réservé aux clés « migration ») : le robot écrit lui-même.
    const v = ((await one<{ v: number | null }>(this.env.DB, "SELECT MAX(version) AS v FROM migration_recipes WHERE software = ? AND name = ?", logiciel, nom))?.v || 0) + 1;
    await run(this.env.DB, "INSERT INTO migration_recipes (id, software, name, version, recipe, notes, created_by_club) VALUES (?,?,?,?,?,?,?)",
      newId("rcp"), logiciel, nom, v, brut, "apprise par le robot", s.club);
  }
  /** Chemin déjà appris pour ce logiciel (recettes partagées, sans aucune donnée de club), s'il vise la même origine. */
  private async recette(s: EtatSession) {
    const logiciel = this.logicielDeRecette(s);
    if (!logiciel || !s.nav) return null;
    try {
      const r = await this.appelApp("GET", "/api/v1/migration/recettes?logiciel=" + encodeURIComponent(logiciel), s);
      if (!r.ok) return null;
      const origine = new URL(s.nav.page.url()).origin;
      const rec = ((await r.json()) as any).recettes?.map((x: any) => x.recette).find((x: any) => x?.origine === origine && Array.isArray(x.etapes));
      return rec || null;
    } catch { return null; }
  }

  /**
   * envoyer() : ouvre un job d'import en simulation, y pousse le paquet par lots de 500, puis le simule.
   * Le gérant vérifie le bilan et confirme (POST /api/v1/import/jobs/:id/commit {"dry_run": false}).
   */
  private async envoyerVersImport(s: EtatSession, paquet: any): Promise<Record<string, unknown>> {
    const lots = versLots(paquet).filter((l) => l.items.length);
    if (!lots.length) return { job_id: null, import: { objets: 0 } };
    const brut = String(paquet.sources?.find((x: any) => x?.logiciel)?.logiciel || s.logiciel || "robot").toLowerCase();
    const source = /^[a-z0-9][a-z0-9_.-]{0,39}$/.test(brut) ? brut : "robot";
    try {
      const j = await this.appelApp("POST", "/api/v1/import/jobs", s, { source, dry_run: true });
      if (!j.ok) return { job_id: null, import: { erreur: await messageDe(j) } };
      const { job_id } = (await j.json()) as { job_id: string };
      s.job_id = job_id;
      let objets = 0; const refus: { coll: string; message: string }[] = [];
      const envoyer = async ({ coll, items }: { coll: string; items: unknown[] }) => {
        s.vu = Date.now();
        const r = await this.appelApp("POST", `/api/v1/import/jobs/${job_id}/items`, s, { coll, items });
        if (r.ok) objets += items.length; else refus.push({ coll, message: await messageDe(r) });
      };
      for (const l of lots) for (let i = 0; i < l.items.length; i += 500) await envoyer({ coll: l.coll, items: l.items.slice(i, i + 500) });
      this.diffuser(s, "etat", { phase: "copie", progression: "Vérification des données par Stabl…" });
      const c = objets ? await this.appelApp("POST", `/api/v1/import/jobs/${job_id}/commit`, s, { dry_run: true }) : null;
      const rapport = c?.ok ? ((await c.json()) as any) : null;
      return {
        job_id, source,
        import: { objets, refus, simulation: rapport ? { totals: rapport.totals, counts: rapport.counts } : null, erreur: c && !c.ok ? await messageDe(c) : undefined },
        confirmer: { methode: "POST", chemin: `/api/v1/import/jobs/${job_id}/commit`, corps: { dry_run: false } },
      };
    } catch {
      return { job_id: s.job_id, import: { erreur: "L'envoi vers Stabl a échoué. La capture reste disponible pour la passerelle." } };
    }
  }

  /** Sous-requête vers l'application, avec la session du gérant (en mémoire seulement). */
  private async appelApp(method: string, chemin: string, s: EtatSession, corps?: unknown): Promise<Response> {
    const { app } = await import("../index");
    const base = (() => { try { return new URL(this.env.APP_URL).origin; } catch { return "https://piaffe.invalid"; } })();
    const req = new Request(base + chemin, {
      method, body: corps === undefined ? undefined : JSON.stringify(corps),
      headers: { authorization: "Bearer " + s.jeton, "x-piaffe-club": s.club, "content-type": "application/json" },
    });
    const ctx = { waitUntil: (p: Promise<unknown>) => this.ctx.waitUntil(p), passThroughOnException() {}, props: {} } as unknown as ExecutionContext;
    return app.fetch(req, this.env, ctx);
  }

  /* ---------- fermeture ---------- */
  async fermer() {
    const s = this.etat;
    this.etat = null;
    if (s) {
      s.ouverte = false; s.signal.arret = true; s.jeton = ""; s.capture = null; s.scelle = null;
      if (s.attenteCode) { const r = s.attenteCode; s.attenteCode = null; r(""); }
      const nav = s.nav; s.nav = null;
      await nav?.fermer().catch(() => {});
      for (const w of s.clients) w.close().catch(() => {});
      s.clients.clear();
    }
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }

  /** Alarme : garde la session en vie, la ferme après 20 minutes d'inactivité, nettoie après une éviction. */
  async alarm() {
    const meta = await this.ctx.storage.get<Meta>("meta");
    if (!meta) return;
    if (!this.etat) {
      // Le Durable Object a redémarré : la mémoire (et donc la session) est perdue, on libère le navigateur.
      if (meta.browser_session) await navigateur().fermerOrphelin?.(this.env, meta.browser_session).catch(() => {});
      await this.ctx.storage.deleteAll();
      return;
    }
    if (Date.now() - this.etat.vu > T.inactivite) { await this.fermer(); return; }
    await this.ctx.storage.setAlarm(Date.now() + T.alarme);
  }
}

async function messageDe(r: Response): Promise<string> {
  try { const j = (await r.json()) as any; return String(j?.error?.message || `Erreur ${r.status}.`); } catch { return `Erreur ${r.status}.`; }
}
