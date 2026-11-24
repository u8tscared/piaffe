/*
 * Ouverture d'un navigateur Cloudflare Browser Rendering (@cloudflare/puppeteer) pour une session du robot.
 * Les tests remplacent la fabrique par une fausse page avec setBrowserFactory().
 */
import type { Env } from "../env";
import { HAUTEUR, KEEP_ALIVE_MS, LARGEUR } from "./reglages";
import { adresseAutorisee, ressourceAutorisee, type PageRobot } from "./migration";

export interface NavigateurOuvert {
  page: PageRobot;
  /** Identifiant de la session Browser Rendering (pour la fermer si le Durable Object a été évincé). */
  sessionId?: string | null;
  fermer(): Promise<void>;
}
export interface FabriqueNavigateur {
  ouvrir(env: Env): Promise<NavigateurOuvert>;
  /** Ferme une session restée ouverte après une éviction du Durable Object. */
  fermerOrphelin?(env: Env, sessionId: string): Promise<void>;
}

export class NavigateurIndisponible extends Error {}

/**
 * Les fonctions passées à page.evaluate() sont envoyées au navigateur sous forme de texte. L'empaqueteur
 * de Wrangler (option keepNames) y insère des appels à __name() qui n'existent pas dans la page : on les définit.
 */
function evaluerTexte(fn: (...a: any[]) => any, args: unknown[]) {
  return `(async () => { const __name = (f) => f; return (${fn.toString()})(...${JSON.stringify(args)}); })()`;
}

const fabriqueCloudflare: FabriqueNavigateur = {
  async ouvrir(env) {
    if (!env.BROWSER) throw new NavigateurIndisponible("binding BROWSER absent");
    const puppeteer = (await import("@cloudflare/puppeteer")).default;
    let browser;
    try { browser = await puppeteer.launch(env.BROWSER as any, { keep_alive: KEEP_ALIVE_MS }); }
    catch (e) { throw new NavigateurIndisponible(String((e as Error)?.message || e)); }
    try {
      const p = await browser.newPage();
      await p.setViewport({ width: LARGEUR, height: HAUTEUR });
      await p.setExtraHTTPHeaders({ "accept-language": "fr-FR,fr;q=0.9" });
      p.on("dialog", (d) => { d.dismiss().catch(() => {}); });
      // Garde réseau : aucune navigation hors https public, aucune ressource vers une machine interne.
      await p.setRequestInterception(true);
      p.on("request", (r) => {
        if (r.isInterceptResolutionHandled()) return;
        const u = r.url();
        const ok = r.isNavigationRequest() ? adresseAutorisee(u) || /^(about|data):/i.test(u) : ressourceAutorisee(u);
        (ok ? r.continue() : r.abort("blockedbyclient")).catch(() => {});
      });
      const page: PageRobot = {
        goto: (url, o) => p.goto(url, o as any),
        url: () => p.url(),
        evaluate: (fn, ...args) => p.evaluate(evaluerTexte(fn, args)),
        screenshot: (o) => p.screenshot({ type: o?.type || "jpeg", quality: o?.quality, encoding: "binary" }) as Promise<Uint8Array>,
        mouse: { click: (x, y) => p.mouse.click(x, y), wheel: (o) => p.mouse.wheel(o) },
        keyboard: { type: (t) => p.keyboard.type(t), press: (k) => p.keyboard.press(k as any) },
        createCDPSession: () => p.createCDPSession() as any,
      };
      return { page, sessionId: browser.sessionId?.() ?? null, fermer: () => browser.close().catch(() => {}) };
    } catch (e) {
      await browser.close().catch(() => {});
      throw e;
    }
  },
  async fermerOrphelin(env, sessionId) {
    if (!env.BROWSER) return;
    const puppeteer = (await import("@cloudflare/puppeteer")).default;
    const b = await puppeteer.connect(env.BROWSER as any, sessionId).catch(() => null);
    await b?.close().catch(() => {});
  },
};

let fabrique: FabriqueNavigateur = fabriqueCloudflare;
/** Pour les tests : remplace l'ouverture du navigateur (null rétablit Browser Rendering). */
export function setBrowserFactory(f: FabriqueNavigateur | null) { fabrique = f || fabriqueCloudflare; }
export const navigateur = () => fabrique;
