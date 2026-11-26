/*
 * Pont typé vers les modules du fil migration (JavaScript, hors du Worker). Wrangler les embarque
 * par chemin relatif ; ce fichier leur donne des types minimaux.
 */
// @ts-ignore : module JavaScript sans déclaration de types
import * as entree from "../../../../migration/robot/entree.mjs";
// @ts-ignore : module JavaScript sans déclaration de types
import * as versApi from "../../../../migration/core/vers-api.mjs";
// @ts-ignore : module JavaScript sans déclaration de types
import * as pilote from "../../../../migration/robot/pilote.mjs";
// @ts-ignore : module JavaScript sans déclaration de types
import * as logiciels from "../../../../migration/core/logiciels.mjs";

/** Interface de page commune à Puppeteer et Playwright, réduite à ce dont le robot a besoin. */
export interface PageRobot {
  goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<unknown>;
  url(): string;
  evaluate(fn: (...args: any[]) => any, ...args: unknown[]): Promise<any>;
  screenshot(options?: { type?: "jpeg" | "png"; quality?: number }): Promise<Uint8Array | ArrayBuffer | string>;
  mouse: { click(x: number, y: number): Promise<void>; wheel(o: { deltaX?: number; deltaY?: number }): Promise<void> };
  keyboard: { type(texte: string): Promise<void>; press(touche: string): Promise<void> };
  /** Script injecté au début de chaque page (robot de la page, ecoute.mjs) ; facultatif. */
  ajouterScript?(source: string): Promise<void>;
  /** Screencast CDP (facultatif) : sinon captures périodiques. */
  createCDPSession?(): Promise<{ send(m: string, p?: unknown): Promise<unknown>; on(ev: string, f: (e: any) => void): unknown; detach?(): Promise<void> }>;
}

export interface Paquet { controle?: unknown; sources?: { logiciel?: string | null }[]; [k: string]: unknown }
export interface ResultatMigration {
  ok: boolean; capture: Record<string, any>; paquet: Paquet; recette: Record<string, any> | null; incidents: unknown[];
  contrat?: unknown; resume?: unknown[]; manquants?: string[]; questions?: number; trace?: string[];
}
export interface ResultatConnexion { ok: boolean; pourquoi?: string; msg?: string; hotes?: string[] }

export const migrerDepuisPage = entree.migrerDepuisPage as (page: PageRobot, o: {
  logiciel?: string | null; famille?: string | null; recette?: unknown; envoyer?: ((l: { coll: string; items: unknown[] }) => Promise<void>) | null;
  surEtat?: (e: Record<string, unknown>) => void; signal?: { arret: boolean }; fiches?: boolean; hotes?: string[];
  ia?: ((vue: any, o?: { fort?: boolean }) => Promise<unknown>) | null; historiqueJours?: number; limiteMs?: number;
}) => Promise<ResultatMigration>;
export const seConnecter = entree.seConnecter as (page: PageRobot, o: {
  adresse: string; identifiant: string; motDePasse: string; demanderCode?: (() => Promise<string>) | null; journal?: (m: string) => void;
}) => Promise<ResultatConnexion>;
export const scriptRobot = entree.scriptRobot as (o?: { historiqueJours?: number }) => string;
export const POURQUOI = entree.POURQUOI as Record<string, string>;
export const CONSIGNE_PILOTE = pilote.CONSIGNE_PILOTE as string;
export const SCHEMA_PILOTE = pilote.SCHEMA_PILOTE as Record<string, unknown>;
/** Famille d'un logiciel du catalogue (equestre, compta, adhesions…), pour savoir quoi chercher. */
export function familleDe(logiciel: string | null): string | null {
  const l = logiciel ? (logiciels as any).LOGICIELS?.[logiciel] : null;
  return l?.famille || null;
}
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
