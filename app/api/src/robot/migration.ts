/*
 * Pont typé vers les modules du fil migration (JavaScript, hors du Worker). Wrangler les embarque
 * par chemin relatif ; ce fichier leur donne des types minimaux.
 */
// @ts-ignore : module JavaScript sans déclaration de types
import * as entree from "../../../../migration/robot/entree.mjs";
// @ts-ignore : module JavaScript sans déclaration de types
import * as versApi from "../../../../migration/core/vers-api.mjs";

/** Interface de page commune à Puppeteer et Playwright, réduite à ce dont le robot a besoin. */
export interface PageRobot {
  goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<unknown>;
  url(): string;
  evaluate(fn: (...args: any[]) => any, ...args: unknown[]): Promise<any>;
  screenshot(options?: { type?: "jpeg" | "png"; quality?: number }): Promise<Uint8Array | ArrayBuffer | string>;
  mouse: { click(x: number, y: number): Promise<void>; wheel(o: { deltaX?: number; deltaY?: number }): Promise<void> };
  keyboard: { type(texte: string): Promise<void>; press(touche: string): Promise<void> };
  /** Screencast CDP (facultatif) : sinon captures périodiques. */
  createCDPSession?(): Promise<{ send(m: string, p?: unknown): Promise<unknown>; on(ev: string, f: (e: any) => void): unknown; detach?(): Promise<void> }>;
}

export interface Paquet { controle?: unknown; sources?: { logiciel?: string | null }[]; [k: string]: unknown }
export interface ResultatMigration { capture: Record<string, any>; paquet: Paquet; recette: unknown; incidents: unknown[] }

export const migrerDepuisPage = entree.migrerDepuisPage as (page: PageRobot, o: {
  logiciel?: string | null; recette?: unknown; envoyer?: ((l: { coll: string; items: unknown[] }) => Promise<void>) | null;
  surEtat?: (e: Record<string, unknown>) => void; signal?: { arret: boolean }; fiches?: boolean;
}) => Promise<ResultatMigration>;
export const estConnecte = entree.estConnecte as (page: PageRobot) => Promise<boolean>;
const adresseBase = entree.adresseAutorisee as (adresse: unknown, o?: { local?: boolean }) => boolean;
export const versLots = versApi.versLots as (paquet: Paquet) => { coll: string; items: { external_id: string; data: unknown }[] }[];

/**
 * adresseAutorisee() du fil migration, durcie pour le serveur : jamais d'adresse locale, jamais d'adresse IP
 * écrite en chiffres (contourne trop facilement la liste), nom de domaine obligatoire, longueur raisonnable.
 */
export function adresseAutorisee(adresse: unknown): boolean {
  if (typeof adresse !== "string" || adresse.length > 2000) return false;
  if (!adresseBase(adresse, { local: false })) return false;
  const u = new URL(adresse);
  const h = u.hostname.toLowerCase();
  if (u.username || u.password) return false;
  if (!h.includes(".") || /^[\d.]+$/.test(h) || h.startsWith("[")) return false;
  if (/(^|\.)(localhost|local|internal|intranet|lan|home|corp|localdomain|arpa)$/.test(h)) return false;
  return true;
}

/** Sous-ressource (image, script, style) : on accepte http, mais jamais une machine interne. */
export function ressourceAutorisee(adresse: string): boolean {
  if (/^(data|blob|about):/i.test(adresse)) return true;
  let u: URL; try { u = new URL(adresse); } catch { return false; }
  if (u.protocol === "http:") u = new URL(adresse.replace(/^http:/i, "https:"));
  return adresseAutorisee(u.toString());
}
