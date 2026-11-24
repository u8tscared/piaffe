const enc = new TextEncoder();

export function randomToken(bytes = 32): string {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return b64url(a);
}
export function b64url(a: ArrayBuffer | Uint8Array): string {
  const u = a instanceof Uint8Array ? a : new Uint8Array(a);
  let s = "";
  for (const c of u) s += String.fromCharCode(c);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function b64urlDecode(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}
export function hex(a: ArrayBuffer | Uint8Array): string {
  return [...(a instanceof Uint8Array ? a : new Uint8Array(a))].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function sha256(s: string | Uint8Array): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", typeof s === "string" ? enc.encode(s) : s));
}
export async function hmacSha256(key: string | Uint8Array, msg: string): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey("raw", typeof key === "string" ? enc.encode(key) : key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}
/** Comparaison en temps constant. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
