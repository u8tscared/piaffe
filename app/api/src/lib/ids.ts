const ALPH = "0123456789abcdefghjkmnpqrstvwxyz";
/** Identifiant court et triable approximativement : préfixe_ + 6 car. de temps + 10 aléatoires. */
export function newId(prefix: string): string {
  let t = Date.now(), ts = "";
  for (let i = 0; i < 8; i++) { ts = ALPH[t % 32] + ts; t = Math.floor(t / 32); }
  const r = crypto.getRandomValues(new Uint8Array(10));
  let s = "";
  for (const b of r) s += ALPH[b % 32];
  return `${prefix}_${ts}${s}`;
}
export const nowIso = () => new Date().toISOString();
export function slugify(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "club";
}
