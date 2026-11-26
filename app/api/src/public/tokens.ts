/* Jetons signés des liens publics (sondage, avis) : rien en base, impossibles à fabriquer sans SESSION_SECRET.
   Forme : <données en base64url>.<signature HMAC-SHA256 tronquée à 128 bits>, assez court pour un SMS. */
import type { Env } from "../env";
import { b64url, b64urlDecode, hmacSha256, safeEqual } from "../lib/crypto";

export type LinkKind = "sv" | "av";
export interface LinkData { k: LinkKind; c: string; s?: string; m?: string }

async function sig(env: Env, data: string) {
  return b64url((await hmacSha256(env.SESSION_SECRET || "", "stabl-public-link:" + data)).slice(0, 16));
}
export async function signLink(env: Env, d: LinkData): Promise<string> {
  const data = b64url(new TextEncoder().encode(JSON.stringify([d.k, d.c, d.s || "", d.m || ""])));
  return data + "." + (await sig(env, data));
}
export async function readLink(env: Env, tok: string, kind: LinkKind): Promise<LinkData | null> {
  if (typeof tok !== "string" || tok.length > 400) return null;
  const [data, s] = tok.split(".");
  if (!data || !s || !safeEqual(s, await sig(env, data))) return null;
  try {
    const a = JSON.parse(new TextDecoder().decode(b64urlDecode(data)));
    if (!Array.isArray(a) || a[0] !== kind || typeof a[1] !== "string") return null;
    return { k: kind, c: a[1], s: a[2] || undefined, m: a[3] || undefined };
  } catch { return null; }
}
