/**
 * Création idempotente du catalogue Piaffe dans le compte Stripe de la plateforme (Marceau Ruis EI) :
 * produits, prix (retrouvés par lookup_key), coupons, et taux de TVA 20 % si le régime passe à « normal ».
 *
 * AUCUN IMPORT À L'EXÉCUTION : ce fichier est utilisé par la route d'administration du Worker ET par
 * scripts/setup-stripe.mjs (Node 22.18+, suppression des types), qui lui passe son propre client HTTP.
 */
import type { catalog as catalogFn } from "./plans";

export type Catalog = ReturnType<typeof catalogFn>;
export type Req = (method: "GET" | "POST", path: string, params?: Record<string, unknown>) => Promise<{ status: number; data: any }>;

export const VAT_TAX_RATE_KEY = "piaffe_fr_vat_20";

export async function ensureCatalog(req: Req, cat: Catalog, opts: { vatRegime?: string } = {}): Promise<string[]> {
  const log: string[] = [];
  const must = (r: { status: number; data: any }, what: string) => {
    if (r.status >= 400) throw new Error(`${what} : ${r.data?.error?.message || "HTTP " + r.status}`);
    return r.data;
  };

  for (const p of cat.products) {
    const got = await req("GET", `/v1/products/${p.product_id}`);
    if (got.status === 404) {
      must(await req("POST", "/v1/products", {
        id: p.product_id, name: p.product_name, description: p.description,
        // Code de taxe Stripe : logiciel en ligne (SaaS) à usage professionnel.
        tax_code: "txcd_10103001", metadata: { piaffe: "1" },
      }), "Création du produit " + p.product_id);
      log.push(`Produit créé : ${p.product_name}`);
    } else {
      must(got, "Lecture du produit " + p.product_id);
      if (got.data.name !== p.product_name || got.data.active === false) {
        must(await req("POST", `/v1/products/${p.product_id}`, { name: p.product_name, description: p.description, active: true }), "Mise à jour du produit");
        log.push(`Produit mis à jour : ${p.product_name}`);
      } else log.push(`Produit déjà présent : ${p.product_name}`);
    }

    for (const pr of p.prices) {
      const list = must(await req("GET", "/v1/prices", { lookup_keys: [pr.lookup_key], active: true, limit: 1 }), "Recherche du prix " + pr.lookup_key);
      const cur = list?.data?.[0];
      const same = cur && cur.unit_amount === pr.amount && cur.currency === cat.currency && cur.recurring?.interval === pr.interval
        && (cur.product === p.product_id || cur.product?.id === p.product_id);
      if (same) { log.push(`Prix déjà présent : ${pr.lookup_key} (${pr.amount / 100} €)`); continue; }
      must(await req("POST", "/v1/prices", {
        product: p.product_id, currency: cat.currency, unit_amount: pr.amount,
        recurring: { interval: pr.interval }, lookup_key: pr.lookup_key, transfer_lookup_key: true,
        tax_behavior: "exclusive", nickname: `${p.product_name} ${pr.interval === "month" ? "mensuel" : "annuel"}`,
        metadata: { piaffe: "1" },
      }), "Création du prix " + pr.lookup_key);
      if (cur) {
        must(await req("POST", `/v1/prices/${cur.id}`, { active: false }), "Archivage de l'ancien prix");
        log.push(`Prix remplacé : ${pr.lookup_key} (${(cur.unit_amount ?? 0) / 100} € → ${pr.amount / 100} €)`);
      } else log.push(`Prix créé : ${pr.lookup_key} (${pr.amount / 100} €)`);
    }
  }

  for (const c of cat.coupons as Record<string, unknown>[]) {
    const got = await req("GET", `/v1/coupons/${c.id}`);
    if (got.status === 404) { must(await req("POST", "/v1/coupons", c), "Création du coupon " + c.id); log.push(`Coupon créé : ${c.name}`); }
    else { must(got, "Lecture du coupon"); log.push(`Coupon déjà présent : ${c.name}`); }
  }

  if (opts.vatRegime === "normal") {
    const id = await findVatRate(req);
    if (id) log.push("Taux de TVA 20 % déjà présent");
    else {
      must(await req("POST", "/v1/tax_rates", {
        display_name: "TVA", percentage: 20, inclusive: false, country: "FR", jurisdiction: "FR",
        tax_type: "vat", description: "TVA française 20 %", metadata: { piaffe_key: VAT_TAX_RATE_KEY },
      }), "Création du taux de TVA");
      log.push("Taux de TVA 20 % créé");
    }
  }
  return log;
}

export async function findVatRate(req: Req): Promise<string | null> {
  const r = await req("GET", "/v1/tax_rates", { active: true, limit: 100 });
  if (r.status >= 400) return null;
  const t = (r.data?.data || []).find((x: any) => x?.metadata?.piaffe_key === VAT_TAX_RATE_KEY);
  return t ? t.id : null;
}
