import type { Env } from "../env";
import { ApiError } from "../lib/http";
import { hex, hmacSha256, randomToken, safeEqual } from "../lib/crypto";

/**
 * Client Stripe minimal en fetch direct (pas de SDK) : encodage formulaire, Idempotency-Key,
 * version d'API fixée, en-tête Stripe-Account pour agir sur le compte connecté d'un club.
 */
import { STRIPE_API_VERSION } from "./version";
export { STRIPE_API_VERSION };
export const STRIPE_API = "https://api.stripe.com";

type FetchFn = (input: string, init: RequestInit) => Promise<Response>;
let fetchImpl: FetchFn = (i, init) => fetch(i, init);
/** Remplace fetch (tests). Sans argument, rétablit le fetch réel. */
export function setFetch(f?: FetchFn) { fetchImpl = f || ((i, init) => fetch(i, init)); }

export type Params = Record<string, unknown>;

/** Encode un objet imbriqué au format attendu par Stripe : a[b][0][c]=v. Les valeurs null/undefined sont omises. */
export function formEncode(obj: Params, prefix = ""): string {
  const out: string[] = [];
  const walk = (v: unknown, key: string) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${key}[${i}]`)); return; }
    if (typeof v === "object") { for (const [k, x] of Object.entries(v as object)) walk(x, key ? `${key}[${k}]` : k); return; }
    out.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(v)));
  };
  walk(obj, prefix);
  return out.join("&");
}

export class StripeError extends Error {
  constructor(public status: number, public type: string, public code: string | undefined, message: string, public declineCode?: string) {
    super(message);
  }
}

export interface StripeOpts { account?: string | null; idempotencyKey?: string; }

export function stripeConfigured(env: Env) { return !!env.STRIPE_SECRET_KEY; }

/** Appel brut. Lève StripeError (statut HTTP, type, code) en cas de refus. */
export async function stripeRequest<T = any>(env: Env, method: "GET" | "POST" | "DELETE", path: string, params: Params = {}, opts: StripeOpts = {}): Promise<T> {
  if (!env.STRIPE_SECRET_KEY) throw new ApiError(409, "payments_not_enabled", "Le paiement en ligne n’est pas encore activé sur Stabl. Encaissez par chèque, espèces ou virement en attendant.");
  const headers: Record<string, string> = {
    authorization: "Bearer " + env.STRIPE_SECRET_KEY,
    "stripe-version": STRIPE_API_VERSION,
  };
  if (opts.account) headers["stripe-account"] = opts.account;
  let url = STRIPE_API + path;
  let bodyStr: string | undefined;
  const enc = formEncode(params);
  if (method === "GET" || method === "DELETE") { if (enc) url += (url.includes("?") ? "&" : "?") + enc; }
  else {
    headers["content-type"] = "application/x-www-form-urlencoded";
    headers["idempotency-key"] = opts.idempotencyKey || "pfe_" + randomToken(18);
    bodyStr = enc;
  }
  let res: Response;
  try { res = await fetchImpl(url, { method, headers, body: bodyStr }); }
  catch { throw new StripeError(0, "api_connection_error", undefined, "connexion impossible"); }
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) {
    const e = data?.error || {};
    throw new StripeError(res.status, e.type || "api_error", e.code, e.message || "erreur Stripe", e.decline_code);
  }
  return data as T;
}

/** Appel destiné aux routes : convertit les erreurs Stripe en message français. */
export async function stripe<T = any>(env: Env, method: "GET" | "POST" | "DELETE", path: string, params: Params = {}, opts: StripeOpts = {}): Promise<T> {
  try { return await stripeRequest<T>(env, method, path, params, opts); }
  catch (e) {
    if (e instanceof StripeError) {
      // Pas de journalisation du corps (peut contenir des données personnelles) : type et code seulement.
      console.error("stripe", method, path.split("?")[0], e.status, e.type, e.code || "");
      if (e.type === "card_error") throw new ApiError(402, "payment_refused", "Le paiement a été refusé par la banque. Essayez un autre moyen de paiement.");
      if (e.status === 429) throw new ApiError(503, "stripe_busy", "Le service de paiement est très sollicité. Réessayez dans un instant.");
      throw new ApiError(502, "stripe_error", "Le service de paiement n'a pas pu traiter la demande. Réessayez dans un instant.", { code: e.code });
    }
    throw e;
  }
}

/* ---------- Signature des webhooks ---------- */

export const SIGNATURE_TOLERANCE_SEC = 300;

/**
 * Vérifie l'en-tête Stripe-Signature (t=…,v1=…[,v1=…]) : HMAC-SHA256 de « t.corps » avec le secret
 * du point de terminaison. Accepte plusieurs secrets séparés par des virgules (rotation du secret)
 * et plusieurs signatures v1. Ignore v0 et les entrées inconnues. Comparaison en temps constant.
 */
export async function verifyStripeSignature(payload: string, header: string | null | undefined, secrets: string | undefined, nowSec = Math.floor(Date.now() / 1000), tolerance = SIGNATURE_TOLERANCE_SEC): Promise<boolean> {
  if (!header || !secrets) return false;
  let t = -1;
  const sigs: string[] = [];
  for (const part of header.split(",")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim(), v = part.slice(i + 1).trim();
    if (k === "t") t = /^\d+$/.test(v) ? Number(v) : -1;
    else if (k === "v1") sigs.push(v);
  }
  if (t < 0 || !sigs.length) return false;
  if (Math.abs(nowSec - t) > tolerance) return false;
  let ok = false;
  for (const secret of secrets.split(",").map((s) => s.trim()).filter(Boolean)) {
    const expected = hex(await hmacSha256(secret, `${t}.${payload}`));
    for (const s of sigs) if (safeEqual(expected, s)) ok = true;
  }
  return ok;
}

/** Construit un en-tête signé (tests et outils). */
export async function signPayload(payload: string, secret: string, t = Math.floor(Date.now() / 1000)): Promise<string> {
  return `t=${t},v1=${hex(await hmacSha256(secret, `${t}.${payload}`))}`;
}
