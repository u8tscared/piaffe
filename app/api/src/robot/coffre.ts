/*
 * Coffre des identifiants confiés (« Donnez-nous vos codes »).
 * L'identifiant et le mot de passe de l'ancien logiciel sont scellés en AES-GCM 256 dès leur arrivée, avec une clé
 * dérivée (HKDF-SHA-256) du secret du Worker ROBOT_SECRET (à défaut SESSION_SECRET). Le scellé est lié à la session
 * du robot (données associées) : il ne s'ouvre que dans ce Durable Object. Il n'est jamais écrit en base ni journalisé,
 * il est ouvert une seule fois pour remplir le formulaire de connexion, puis effacé.
 */
import type { Env } from "../env";

export type EnvRobot = Env & { ROBOT_SECRET?: string; ANTHROPIC_API_KEY?: string };
export interface Acces { identifiant: string; mot_de_passe: string }

const enc = new TextEncoder();
const dec = new TextDecoder();

async function cle(env: EnvRobot): Promise<CryptoKey> {
  const secret = env.ROBOT_SECRET || env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("secret du robot absent");
  const base = await crypto.subtle.importKey("raw", enc.encode(secret), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: enc.encode("stabl-robot-acces-v1"), info: enc.encode("identifiants ancien logiciel") },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"],
  );
}
const b64 = (u: Uint8Array) => { let s = ""; for (const x of u) s += String.fromCharCode(x); return btoa(s); };
const deB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** Scelle les identifiants pour une session donnée. Rend « v1.<iv>.<chiffré> ». */
export async function sceller(env: EnvRobot, acces: Acces, session: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const clair = enc.encode(JSON.stringify({ i: acces.identifiant, m: acces.mot_de_passe }));
  const c = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: enc.encode(session) }, await cle(env), clair);
  clair.fill(0);
  return "v1." + b64(iv) + "." + b64(new Uint8Array(c));
}

/** Ouvre un scellé ; null s'il a été modifié, s'il vient d'une autre session ou si la clé a changé. */
export async function ouvrirScelle(env: EnvRobot, scelle: string, session: string): Promise<Acces | null> {
  try {
    const [v, iv, c] = scelle.split(".");
    if (v !== "v1" || !iv || !c) return null;
    const clair = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: deB64(iv), additionalData: enc.encode(session) }, await cle(env), deB64(c)));
    const o = JSON.parse(dec.decode(clair)); clair.fill(0);
    return typeof o?.i === "string" && typeof o?.m === "string" ? { identifiant: o.i, mot_de_passe: o.m } : null;
  } catch { return null; }
}

/** Identifiants reçus dans une requête : texte court, rien d'autre. */
export function accesValide(a: unknown): Acces | null {
  const o = a as Record<string, unknown> | null;
  if (!o || typeof o !== "object") return null;
  const i = o.identifiant, m = o.mot_de_passe;
  if (typeof i !== "string" || typeof m !== "string") return null;
  if (!i.trim() || !m || i.length > 200 || m.length > 200) return null;
  return { identifiant: i.trim(), mot_de_passe: m };
}
