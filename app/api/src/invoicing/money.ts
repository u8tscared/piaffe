import { CATEGORIES, REGIME_MENTION, REGIME_VATEX, type VatRegime, type OpKind } from "./catalog";

/**
 * Calcul des montants, tout en centimes entiers (jamais de flottant stocké).
 * Règle EN 16931 : la TVA se calcule par taux sur la base HT cumulée (BR-CO-17), pas ligne à ligne.
 * - Prix saisis HT : base = somme des lignes HT, TVA = arrondi(base × taux).
 * - Prix saisis TTC (cas des particuliers) : le TTC saisi est conservé au centime ; base = arrondi(TTC ÷ (1 + taux)),
 *   TVA = TTC − base. L'écart avec arrondi(base × taux) ne dépasse jamais 1 centime, ce que tolère BR-CO-17.
 *   La base est ensuite répartie sur les lignes (méthode du plus fort reste) pour que la somme des lignes HT
 *   égale exactement la base du taux (BR-CO-10, BR-S-08).
 */

export interface LineInput {
  label: string; description?: string | null; category?: string; quantity?: number; unit?: string;
  unit_price: number; vat_rate_bp?: number | null;
}
export interface ComputedLine {
  position: number; label: string; description: string | null; category: string; quantity: number; unit: string;
  unit_price: number; vat_rate_bp: number; vat_category: "S" | "E"; exemption_reason: string | null; exemption_code: string | null;
  line_ht: number; line_ttc: number; account: string; kind: OpKind;
}
export interface VatGroup { category: "S" | "E"; rate_bp: number; base: number; vat: number; reason: string | null; code: string | null }
export interface Totals {
  lines: ComputedLine[]; groups: VatGroup[]; total_ht: number; total_vat: number; total_ttc: number;
  operation_category: "goods" | "services" | "mixed";
}

/** Arrondi commercial au centime, demi vers le haut en valeur absolue (pas d'arrondi bancaire). */
export function roundHalfUp(x: number): number {
  const s = Math.sign(x); const a = Math.abs(x);
  return s * Math.floor(a + 0.5 + 1e-9);
}
export function vatOf(base: number, rate_bp: number): number { return roundHalfUp((base * rate_bp) / 10000); }
/** Quantité avec 3 décimales au plus. */
export function normQty(q: unknown): number {
  const n = typeof q === "number" ? q : Number(q ?? 1);
  if (!Number.isFinite(n) || n <= 0 || n > 1e6) throw new RangeError("quantity");
  return Math.round(n * 1000) / 1000;
}

export function computeTotals(input: LineInput[], mode: "ht" | "ttc", regime: VatRegime): Totals {
  const lines: ComputedLine[] = input.map((l, i) => {
    const cat = CATEGORIES[l.category || "other"] ? (l.category || "other") : "other";
    const def = CATEGORIES[cat];
    const qty = normQty(l.quantity ?? 1);
    let rate = l.vat_rate_bp ?? def.rate_bp;
    let vcat: "S" | "E" = "S"; let reason: string | null = null; let code: string | null = null;
    if (def.exempt) { vcat = "E"; rate = 0; reason = def.exempt; code = cat === "disbursement" ? "VATEX-EU-79-C" : "VATEX-EU-O"; }
    else if (regime !== "normal") { vcat = "E"; rate = 0; reason = REGIME_MENTION[regime]; code = REGIME_VATEX[regime]; }
    else if (rate === 0) { vcat = "E"; reason = "Exonération de TVA"; code = "VATEX-EU-132"; }
    const gross = roundHalfUp(qty * l.unit_price);
    return {
      position: i + 1, label: l.label, description: l.description ?? null, category: cat, quantity: qty, unit: l.unit || "C62",
      unit_price: l.unit_price, vat_rate_bp: rate, vat_category: vcat, exemption_reason: reason, exemption_code: code,
      line_ht: mode === "ht" ? gross : 0, line_ttc: mode === "ttc" ? gross : 0, account: def.account, kind: def.kind,
    };
  });

  const keyOf = (l: ComputedLine) => l.vat_category + ":" + l.vat_rate_bp + ":" + (l.exemption_reason || "");
  const byKey = new Map<string, ComputedLine[]>();
  for (const l of lines) { const k = keyOf(l); (byKey.get(k) || byKey.set(k, []).get(k)!).push(l); }

  const groups: VatGroup[] = [];
  for (const ls of byKey.values()) {
    const r = ls[0].vat_rate_bp;
    let base: number, vat: number;
    if (mode === "ht") {
      base = ls.reduce((s, l) => s + l.line_ht, 0);
      vat = vatOf(base, r);
    } else {
      const ttc = ls.reduce((s, l) => s + l.line_ttc, 0);
      base = roundHalfUp((ttc * 10000) / (10000 + r));
      vat = ttc - base;
      // Répartition de la base sur les lignes (plus fort reste).
      const exact = ls.map((l) => (l.line_ttc * 10000) / (10000 + r));
      const floor = exact.map((x) => Math.floor(x + 1e-9));
      let rest = base - floor.reduce((s, x) => s + x, 0);
      const order = exact.map((x, i) => [x - floor[i], i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
      for (const [, i] of order) { if (rest <= 0) break; floor[i]++; rest--; }
      ls.forEach((l, i) => { l.line_ht = floor[i]; });
    }
    for (const l of ls) if (mode === "ht") l.line_ttc = l.line_ht; // provisoire, corrigé ci-dessous
    groups.push({ category: ls[0].vat_category, rate_bp: r, base, vat, reason: ls[0].exemption_reason, code: ls[0].exemption_code });
  }
  if (mode === "ht") {
    // TTC indicatif par ligne (affichage) : la TVA du groupe est répartie au prorata, plus fort reste.
    for (const ls of byKey.values()) {
      const g = groups.find((g) => g.category === ls[0].vat_category && g.rate_bp === ls[0].vat_rate_bp && g.reason === ls[0].exemption_reason)!;
      const exact = ls.map((l) => (g.base ? (l.line_ht * g.vat) / g.base : 0));
      const fl = exact.map((x) => Math.floor(x + 1e-9));
      let rest = g.vat - fl.reduce((s, x) => s + x, 0);
      const order = exact.map((x, i) => [x - fl[i], i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
      for (const [, i] of order) { if (rest <= 0) break; fl[i]++; rest--; }
      ls.forEach((l, i) => { l.line_ttc = l.line_ht + fl[i]; });
    }
  }
  groups.sort((a, b) => b.rate_bp - a.rate_bp || a.category.localeCompare(b.category));
  const total_ht = groups.reduce((s, g) => s + g.base, 0);
  const total_vat = groups.reduce((s, g) => s + g.vat, 0);
  const kinds = new Set(lines.map((l) => l.kind));
  const operation_category = kinds.size > 1 ? "mixed" : kinds.has("goods") ? "goods" : "services";
  return { lines, groups, total_ht, total_vat, total_ttc: total_ht + total_vat, operation_category };
}

/** Montant décimal pour XML / CSV : 1234 → "12.34". */
export function dec(cents: number): string {
  const neg = cents < 0; const a = Math.abs(Math.round(cents));
  return (neg ? "-" : "") + Math.floor(a / 100) + "." + String(a % 100).padStart(2, "0");
}
/** Montant pour le FEC et les CSV français : 1234 → "12,34". */
export function decFr(cents: number): string { return dec(cents).replace(".", ","); }
