#!/usr/bin/env node
/**
 * Crée ou met à jour le catalogue Piaffe dans VOTRE compte Stripe (plateforme, Marceau Ruis EI) :
 * produits Essentiel, Club, Domaine et Fondateur, prix mensuels et annuels (lookup_key piaffe_<offre>_<month|year>),
 * coupons de parrainage et de lancement, et le taux de TVA 20 % si PLATFORM_VAT_REGIME=normal.
 * Idempotent : relancez-le après chaque changement de prix dans src/billing/plans.ts.
 *
 * Usage (Node 22.18 ou plus récent, depuis app/api) :
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/setup-stripe.mjs
 *   STRIPE_SECRET_KEY=sk_live_... PLATFORM_VAT_REGIME=franchise node scripts/setup-stripe.mjs
 * (Node 22.6 à 22.17 : ajoutez --experimental-strip-types.)
 */
const key = process.env.STRIPE_SECRET_KEY;
if (!key || !/^(sk|rk)_(test|live)_/.test(key)) {
  console.error("Indiquez votre clé secrète : STRIPE_SECRET_KEY=sk_test_... node scripts/setup-stripe.mjs");
  process.exit(1);
}
const { catalog } = await import("../src/billing/plans.ts");
const { ensureCatalog } = await import("../src/billing/setup-stripe.ts");
const { STRIPE_API_VERSION } = await import("../src/billing/version.ts");

function encode(obj, prefix = "") {
  const out = [];
  const walk = (v, k) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${k}[${i}]`));
    if (typeof v === "object") return Object.entries(v).forEach(([kk, x]) => walk(x, k ? `${k}[${kk}]` : kk));
    out.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(v)));
  };
  walk(obj, prefix);
  return out.join("&");
}

const req = async (method, path, params = {}) => {
  const enc = encode(params);
  const url = "https://api.stripe.com" + path + (method === "GET" && enc ? "?" + enc : "");
  const headers = { authorization: "Bearer " + key, "stripe-version": STRIPE_API_VERSION };
  if (method === "POST") { headers["content-type"] = "application/x-www-form-urlencoded"; headers["idempotency-key"] = "piaffe_setup_" + crypto.randomUUID(); }
  const r = await fetch(url, { method, headers, body: method === "POST" ? enc : undefined });
  return { status: r.status, data: await r.json().catch(() => null) };
};

const mode = key.includes("_live_") ? "PRODUCTION" : "test";
console.log(`Catalogue Piaffe, compte Stripe en mode ${mode}, API ${STRIPE_API_VERSION}`);
try {
  const log = await ensureCatalog(req, catalog(), { vatRegime: process.env.PLATFORM_VAT_REGIME || "franchise" });
  for (const l of log) console.log(" - " + l);
  console.log("Terminé.");
} catch (e) {
  console.error("Échec : " + e.message);
  process.exit(1);
}
