import { b64url, b64urlDecode, safeEqual } from "../lib/crypto";
import { bad } from "../lib/http";

/**
 * Coût du hachage. Workers limite PBKDF2 à 100 000 itérations (plafond, et valeur conseillée sur Workers Paid).
 * Sur le palier gratuit (10 ms de CPU par requête), 100 000 itérations prennent environ 19 ms : la connexion
 * échouerait par moments (erreur 1102). Par défaut 30 000 (environ 5 ms) ; la variable PASSWORD_ITERATIONS
 * (wrangler.jsonc) permet de remonter à 100 000 en passant au plan payant : chaque mot de passe est alors
 * re-haché au nouveau coût à la connexion suivante (needsRehash), sans rien demander aux utilisateurs.
 */
export const PBKDF2_MAX = 100_000;
export const PBKDF2_DEFAULT = 30_000;
export let PBKDF2_ITER = PBKDF2_DEFAULT;
/** Appelé à chaque requête avec la variable d'environnement (bornée entre 10 000 et 100 000). */
export function setPasswordIterations(v: unknown) {
  const n = parseInt(String(v ?? ""), 10);
  PBKDF2_ITER = Number.isFinite(n) ? Math.min(PBKDF2_MAX, Math.max(10_000, n)) : PBKDF2_DEFAULT;
}
const SALT_BYTES = 16;
const HASH_BITS = 256;
const enc = new TextEncoder();

async function derive(password: string, salt: Uint8Array, iter: number, bits = HASH_BITS): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password.normalize("NFKC")), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iter }, key, bits));
}

/** Format : pbkdf2$sha256$<itérations>$<sel b64url>$<hachage b64url>. */
export async function hashPassword(password: string, iter = PBKDF2_ITER): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  return `pbkdf2$sha256$${iter}$${b64url(salt)}$${b64url(await derive(password, salt, iter))}`;
}

/** Vérifie en temps constant. needsRehash vaut true si les paramètres stockés ne sont plus ceux d'aujourd'hui. */
export async function verifyPassword(password: string, stored: string | null | undefined): Promise<{ ok: boolean; needsRehash: boolean }> {
  const parts = (stored || "").split("$");
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") {
    // Hachage absent ou illisible : on calcule quand même pour ne pas révéler l'existence du compte par le temps de réponse.
    await derive(password, new Uint8Array(SALT_BYTES), PBKDF2_ITER);
    return { ok: false, needsRehash: false };
  }
  const iter = parseInt(parts[2], 10);
  if (!Number.isFinite(iter) || iter < 1000 || iter > PBKDF2_MAX) return { ok: false, needsRehash: false };
  let salt: Uint8Array, expected: Uint8Array;
  try { salt = b64urlDecode(parts[3]); expected = b64urlDecode(parts[4]); } catch { return { ok: false, needsRehash: false }; }
  const got = await derive(password, salt, iter, expected.length * 8);
  const ok = safeEqual(b64url(got), b64url(expected));
  return { ok, needsRehash: ok && (iter !== PBKDF2_ITER || salt.length !== SALT_BYTES || expected.length * 8 !== HASH_BITS) };
}

/** Faux calcul pour égaliser le temps de réponse quand l'utilisateur n'existe pas. */
export async function dummyVerify(password: string) { await derive(password, new Uint8Array(SALT_BYTES), PBKDF2_ITER); }

// Mots de passe les plus courants (listes publiques de fuites), comparés en minuscules et sans espaces.
const COMMON = new Set(`123456789 1234567890 12345678910 0123456789 1234567891 9876543210 0987654321 1111111111
0000000000 1234512345 1122334455 1q2w3e4r5t 1qaz2wsx3edc qwertyuiop azertyuiop azertyuiop1 qwertyuiop1 azerty1234
azerty12345 azerty123456 qwerty1234 qwerty12345 qwerty123456 password12 password123 password1234 motdepasse
motdepasse1 motdepasse123 mot2passe1 mot2passe123 iloveyou12 jetaime123 jetaime1234 doudou1234 soleil1234
loulou1234 chouchou12 chouchou123 marseille13 marseille1 bonjour123 bonjour1234 football12 football123 princesse1
princesse123 nicolas123 julien1234 vacances12 vacances2024 vacances2025 vacances2026 cheval1234 chevaux123 cheval123
equitation equitation1 equitation123 poney12345 poneyclub1 piaffe1234 piaffe12345 piaffe2026 galop12345
1234567890a a123456789 abcdef1234 abc1234567 abcd123456 aaaaaaaaaa zzzzzzzzzz qazwsxedcr letmein123 welcome123
welcome1234 admin12345 administrateur administrator changeme12 sunshine12 monkey1234 dragon1234 master1234
trustno1234 passw0rd12 p@ssw0rd12 p@ssword123 superman12 starwars12 baseball12 football1 1234qwer azertyui12
`.split(/\s+/).filter(Boolean));

/** Règles : 10 caractères au moins, 200 au plus, pas dans la liste des plus courants, pas l'adresse e-mail. */
export function checkPasswordPolicy(pw: unknown, email?: string): string {
  if (typeof pw !== "string" || !pw) throw bad("missing_field", "Le champ « password » est obligatoire.", { field: "password" });
  if (pw.length < 10) throw bad("weak_password", "Choisissez un mot de passe d'au moins 10 caractères.", { field: "password" });
  if (pw.length > 200) throw bad("weak_password", "Ce mot de passe est trop long (200 caractères au plus).", { field: "password" });
  const norm = pw.toLowerCase().replace(/\s+/g, "");
  const local = (email || "").toLowerCase().split("@")[0];
  if (COMMON.has(norm) || /^(.)\1+$/.test(norm) || (local.length >= 4 && norm.includes(local) && norm.length - local.length < 4)) {
    throw bad("weak_password", "Ce mot de passe est trop courant ou trop proche de votre adresse. Choisissez-en un autre, une courte phrase par exemple.", { field: "password" });
  }
  return pw;
}
