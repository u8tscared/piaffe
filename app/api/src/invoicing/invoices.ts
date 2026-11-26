import { aidsMention, applyAids, pendingAids, selectAids, type Aid } from "./aids";
import type { Env } from "../env";
import { all, json, one, run, audit } from "../lib/db";
import { newId, nowIso } from "../lib/ids";
import { ApiError, bad, notFound } from "../lib/http";
import { emit } from "../lib/events";
import { sendMail } from "../mail/send";
import { computeTotals, type LineInput, type ComputedLine } from "./money";
import { ALLOWED_RATES_BP, CATEGORIES, PAY_METHODS, REGIME_MENTION, STATUS_FR, normMethod, type PayMethod } from "./catalog";
import { clubSeller, getSettings, parseAddress, platformSeller, validSiren, type Address, type InvoicingSettings, type Seller } from "./settings";
import type { Snapshot } from "./snapshot";
import { buildCii } from "./cii";
import { renderInvoicePdf } from "./pdf";
import { autopayFor } from "../billing/connect";

export const PLATFORM_CLUB = "platform";

export interface InvoiceRow {
  id: string; club_id: string; issuer: "club" | "platform"; kind: "invoice" | "deposit" | "credit_note";
  series: string | null; seq: number | null; number: string | null; status: string;
  customer_ref: string | null; customer_type: "individual" | "business" | "association" | "public";
  customer_name: string | null; customer_email: string | null; customer_siren: string | null; customer_vat: string | null;
  customer_address: string | null; delivery_address: string | null; buyer_reference: string | null; label: string | null;
  issue_date: string | null; service_date: string | null; period_start: string | null; period_end: string | null; due_date: string | null;
  currency: string; price_mode: "ht" | "ttc"; total_ht: number; total_vat: number; total_ttc: number;
  prepaid_amount: number; credited_amount: number; paid_amount: number; payment_method: string | null;
  operation_category: string | null; vat_on_debits: number; notes: string | null; original_id: string | null; deposit_ids: string;
  snapshot: string | null; pdf_key: string | null; xml_key: string | null; pdf_sha256: string | null;
  einvoice_channel: "b2b" | "b2c" | "none"; einvoice_status: string | null; einvoice_ref: string | null; einvoice_error: string | null;
  einvoice_attempts: number; reminders_count: number; last_reminder_at: string | null; buyer_club_id: string | null;
  stripe_invoice_id: string | null; created_by: string | null; issued_by: string | null; issued_at: string | null; sent_at: string | null;
  paid_at: string | null; cancelled_at: string | null; created_at: string; updated_at: string;
}

// ---------- Dates (Europe/Paris) ----------
const PARIS = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
export function parisToday(d = new Date()): string { return PARIS.format(d); }
export function addDays(iso: string, n: number): string {
  const d = new Date(iso.slice(0, 10) + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b.slice(0, 10) + "T00:00:00Z") - Date.parse(a.slice(0, 10) + "T00:00:00Z")) / 864e5);
}
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function isDate(s: unknown): s is string { return typeof s === "string" && DATE_RE.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z")); }

/** Montant à encaisser sur la facture (TTC − acomptes déduits − avoirs). */
export function payable(i: Pick<InvoiceRow, "total_ttc" | "prepaid_amount" | "credited_amount">): number {
  return i.total_ttc - i.prepaid_amount - i.credited_amount;
}
export function balance(i: InvoiceRow): number { return payable(i) - i.paid_amount; }

// ---------- Entrée d'une facture (brouillon) ----------
export interface DraftInput {
  kind: "invoice" | "deposit";
  customer_ref: string | null; customer_type: InvoiceRow["customer_type"]; customer_name: string | null; customer_email: string | null;
  customer_siren: string | null; customer_vat: string | null; customer_address: Address | null; delivery_address: Address | null;
  buyer_reference: string | null; label: string | null; service_date: string | null; period_start: string | null; period_end: string | null;
  due_date: string | null; price_mode: "ht" | "ttc"; payment_method: PayMethod | null; notes: string | null;
  deposit_ids: string[]; lines: LineInput[];
}

const s = (v: unknown, max = 300) => (v == null || v === "" ? null : String(v).trim().slice(0, max) || null);

function parseAddr(v: unknown, field: string): Address | null {
  if (v == null || v === "") return null;
  if (typeof v !== "object" || Array.isArray(v)) throw bad("invalid_field", `Le champ « ${field} » doit être une adresse {line1, zip, city, country}.`, { field });
  const a = v as any;
  const out: Address = { line1: s(a.line1, 200) || undefined, line2: s(a.line2, 200) || undefined, zip: s(a.zip, 12) || undefined, city: s(a.city, 100) || undefined, country: (s(a.country, 2) || "FR").toUpperCase() };
  return out;
}

export function parseDraft(b: Record<string, any>, base?: DraftInput): DraftInput {
  const d: DraftInput = base ? structuredClone(base) : {
    kind: "invoice", customer_ref: null, customer_type: "individual", customer_name: null, customer_email: null, customer_siren: null,
    customer_vat: null, customer_address: null, delivery_address: null, buyer_reference: null, label: null, service_date: null,
    period_start: null, period_end: null, due_date: null, price_mode: "ttc", payment_method: null, notes: null, deposit_ids: [], lines: [],
  };
  const has = (k: string) => k in b;
  if (has("kind")) { if (!["invoice", "deposit"].includes(b.kind)) throw bad("invalid_field", "Le type doit être « invoice » (facture) ou « deposit » (acompte). Pour un avoir, utilisez la route dédiée.", { field: "kind" }); d.kind = b.kind; }
  if (has("customer_ref")) d.customer_ref = s(b.customer_ref, 64);
  if (has("customer_type")) { if (!["individual", "business", "association", "public"].includes(b.customer_type)) throw bad("invalid_field", "Le type de client doit être individual, business, association ou public.", { field: "customer_type" }); d.customer_type = b.customer_type; }
  if (has("customer_name")) d.customer_name = s(b.customer_name, 200);
  if (has("customer_email")) { const e = s(b.customer_email, 200); if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) throw bad("invalid_field", "L'adresse e-mail du client n'est pas valide.", { field: "customer_email" }); d.customer_email = e; }
  if (has("customer_siren")) {
    const v = s(b.customer_siren, 20)?.replace(/\s/g, "") || null;
    const siren = v ? v.slice(0, 9) : null;
    if (siren && !validSiren(siren)) throw bad("invalid_field", "Le SIREN du client n'est pas valide (9 chiffres).", { field: "customer_siren" });
    d.customer_siren = siren;
  }
  if (has("customer_vat")) d.customer_vat = s(b.customer_vat, 20)?.replace(/\s/g, "").toUpperCase() || null;
  if (has("customer_address")) d.customer_address = parseAddr(b.customer_address, "customer_address");
  if (has("delivery_address")) d.delivery_address = parseAddr(b.delivery_address, "delivery_address");
  if (has("buyer_reference")) d.buyer_reference = s(b.buyer_reference, 100);
  if (has("label")) d.label = s(b.label, 200);
  for (const k of ["service_date", "period_start", "period_end", "due_date"] as const) if (has(k)) {
    if (b[k] == null || b[k] === "") d[k] = null;
    else if (!isDate(b[k])) throw bad("invalid_field", `Le champ « ${k} » doit être une date AAAA-MM-JJ.`, { field: k });
    else d[k] = b[k];
  }
  if ((d.period_start && !d.period_end) || (!d.period_start && d.period_end)) throw bad("invalid_field", "Indiquez le début et la fin de la période facturée.", { field: "period_start" });
  if (d.period_start && d.period_end && d.period_end < d.period_start) throw bad("invalid_field", "La fin de la période doit être après son début.", { field: "period_end" });
  if (has("price_mode")) { if (!["ht", "ttc"].includes(b.price_mode)) throw bad("invalid_field", "Le mode de prix doit être « ht » ou « ttc ».", { field: "price_mode" }); d.price_mode = b.price_mode; }
  if (has("payment_method")) d.payment_method = b.payment_method ? normMethod(b.payment_method) : null;
  if (has("notes")) d.notes = s(b.notes, 1000);
  if (has("deposit_ids")) {
    if (!Array.isArray(b.deposit_ids) || b.deposit_ids.length > 20) throw bad("invalid_field", "Les acomptes doivent être une liste d'identifiants.", { field: "deposit_ids" });
    d.deposit_ids = [...new Set<string>(b.deposit_ids.map((x: any) => String(x)))];
  }
  if (has("lines")) {
    if (!Array.isArray(b.lines) || b.lines.length > 200) throw bad("invalid_field", "Les lignes doivent être une liste (200 au plus).", { field: "lines" });
    d.lines = b.lines.map((l: any, i: number) => {
      const where = { field: `lines[${i}]` };
      if (!l || typeof l !== "object") throw bad("invalid_field", `La ligne ${i + 1} est invalide.`, where);
      const label = s(l.label, 300); if (!label) throw bad("missing_field", `La ligne ${i + 1} doit avoir un libellé.`, where);
      const up = Number(l.unit_price);
      if (!Number.isInteger(up) || Math.abs(up) > 1e9) throw bad("invalid_field", `Le prix de la ligne ${i + 1} doit être un nombre entier de centimes.`, where);
      const q = l.quantity == null ? 1 : Number(l.quantity);
      if (!Number.isFinite(q) || q <= 0 || q > 1e6) throw bad("invalid_field", `La quantité de la ligne ${i + 1} doit être positive.`, where);
      if (l.category != null && !CATEGORIES[l.category]) throw bad("invalid_field", `La catégorie de la ligne ${i + 1} est inconnue.`, { ...where, allowed: Object.keys(CATEGORIES) });
      let rate: number | null = null;
      if (l.vat_rate_bp != null) rate = Number(l.vat_rate_bp);
      else if (l.vat_rate != null) rate = Math.round(Number(l.vat_rate) * 100);
      if (rate != null && !ALLOWED_RATES_BP.includes(rate)) throw bad("invalid_field", `Le taux de TVA de la ligne ${i + 1} doit être 0, 2,1, 5,5, 10 ou 20 %.`, where);
      const unit = l.unit ? String(l.unit).toUpperCase().slice(0, 3) : "C62";
      return { label, description: s(l.description, 500), category: l.category || "other", quantity: q, unit: /^[A-Z0-9]{2,3}$/.test(unit) ? unit : "C62", unit_price: up, vat_rate_bp: rate };
    });
  }
  return d;
}

// ---------- Client (fiche adhérent) ----------
export async function memberRecord(db: D1Database, clubId: string, ref: string): Promise<Record<string, any> | null> {
  const r = await one<{ data: string }>(db, "SELECT data FROM records WHERE club_id = ? AND coll = 'members' AND id = ? AND deleted = 0", clubId, ref);
  return r ? json<Record<string, any>>(r.data, {}) : null;
}
/** Fiches visibles par un adhérent : la sienne et celles de sa famille (même champ fam). */
export async function familyRefs(db: D1Database, clubId: string, personRef: string | null): Promise<string[]> {
  if (!personRef) return [];
  const me = await memberRecord(db, clubId, personRef);
  if (!me?.fam) return [personRef];
  const rows = await all<{ id: string }>(db, "SELECT id FROM records WHERE club_id = ? AND coll = 'members' AND deleted = 0 AND json_extract(data, '$.fam') = ? LIMIT 50", clubId, String(me.fam));
  return [...new Set([personRef, ...rows.map((r) => r.id)])];
}
function memberAddress(m: Record<string, any>): Address | null {
  const a = m.address ?? m.addr;
  if (a && typeof a === "object") {
    // Formats rencontrés : {line1, zip, city} (Stabl) ou {ligne1, code_postal, ville} (import).
    return { line1: a.line1 ?? a.ligne1 ?? a.street, line2: a.line2 ?? a.ligne2, zip: a.zip ?? a.code_postal ?? a.cp, city: a.city ?? a.ville, country: a.country ?? a.pays ?? "FR" };
  }
  if (typeof a === "string" && a.trim()) {
    const mm = /^(.*?),?\s*(\d{5})\s+(.+)$/.exec(a.trim());
    return mm ? { line1: mm[1], zip: mm[2], city: mm[3], country: "FR" } : { line1: a.trim(), country: "FR" };
  }
  if (m.city || m.zip) return { line1: m.street || undefined, zip: m.zip || undefined, city: m.city || undefined, country: "FR" };
  return null;
}

// ---------- Lecture ----------
export async function getInvoice(db: D1Database, clubId: string, id: string): Promise<InvoiceRow | null> {
  return one<InvoiceRow>(db, "SELECT * FROM invoices WHERE id = ? AND club_id = ?", id, clubId);
}
export async function getLines(db: D1Database, invoiceId: string): Promise<any[]> {
  return all(db, "SELECT * FROM invoice_lines WHERE invoice_id = ? ORDER BY position", invoiceId);
}
export async function getPayments(db: D1Database, clubId: string, invoiceId: string): Promise<any[]> {
  return all(db, "SELECT id, amount, method, paid_at, reference, note, created_at FROM invoice_payments WHERE club_id = ? AND invoice_id = ? ORDER BY paid_at, created_at", clubId, invoiceId);
}

/** Vue publique d'une facture (API). */
export function view(i: InvoiceRow, extra: Record<string, unknown> = {}) {
  return {
    id: i.id, kind: i.kind, number: i.number, status: i.status, status_label: i.kind === "credit_note" ? "avoir" : STATUS_FR[i.status] || i.status,
    customer: { ref: i.customer_ref, type: i.customer_type, name: i.customer_name, email: i.customer_email, siren: i.customer_siren, vat: i.customer_vat, address: json(i.customer_address, null) },
    delivery_address: json(i.delivery_address, null), buyer_reference: i.buyer_reference, label: i.label,
    issue_date: i.issue_date, service_date: i.service_date, period_start: i.period_start, period_end: i.period_end, due_date: i.due_date,
    currency: i.currency, price_mode: i.price_mode,
    total_ht: i.total_ht, total_vat: i.total_vat, total_ttc: i.total_ttc, prepaid_amount: i.prepaid_amount, credited_amount: i.credited_amount,
    paid_amount: i.paid_amount, amount_due: i.kind === "credit_note" ? 0 : Math.max(0, balance(i)), payment_method: i.payment_method,
    operation_category: i.operation_category, original_id: i.original_id, deposit_ids: json<string[]>(i.deposit_ids, []), notes: i.notes,
    einvoice: { channel: i.einvoice_channel, status: i.einvoice_status, ref: i.einvoice_ref, error: i.einvoice_error },
    reminders_count: i.reminders_count, last_reminder_at: i.last_reminder_at,
    issued_at: i.issued_at, sent_at: i.sent_at, paid_at: i.paid_at, cancelled_at: i.cancelled_at, created_at: i.created_at, updated_at: i.updated_at,
    has_pdf: !!i.number,
    ...extra,
  };
}

// ---------- Brouillons ----------
function rowToDraft(i: InvoiceRow, lines: any[]): DraftInput {
  return {
    kind: i.kind === "deposit" ? "deposit" : "invoice", customer_ref: i.customer_ref, customer_type: i.customer_type, customer_name: i.customer_name,
    customer_email: i.customer_email, customer_siren: i.customer_siren, customer_vat: i.customer_vat,
    customer_address: json(i.customer_address, null), delivery_address: json(i.delivery_address, null), buyer_reference: i.buyer_reference,
    label: i.label, service_date: i.service_date, period_start: i.period_start, period_end: i.period_end, due_date: i.due_date,
    price_mode: i.price_mode, payment_method: (i.payment_method as PayMethod) || null, notes: i.notes, deposit_ids: json(i.deposit_ids, []),
    lines: lines.map((l) => ({ label: l.label, description: l.description, category: l.category, quantity: l.quantity, unit: l.unit, unit_price: l.unit_price, vat_rate_bp: l.vat_rate_bp })),
  };
}

async function regimeOf(db: D1Database, clubId: string, env?: Env): Promise<Seller["regime"]> {
  if (clubId === PLATFORM_CLUB && env) return platformSeller(env).regime;
  const c = await one<{ vat_regime: string }>(db, "SELECT vat_regime FROM clubs WHERE id = ?", clubId);
  return (["normal", "franchise", "association_exoneree"].includes(c?.vat_regime || "") ? c!.vat_regime : "normal") as Seller["regime"];
}

async function resolveDeposits(db: D1Database, clubId: string, d: DraftInput, selfId: string | null): Promise<number> {
  if (!d.deposit_ids.length) return 0;
  if (d.kind === "deposit") throw bad("invalid_field", "Une facture d'acompte ne peut pas déduire d'autres acomptes.", { field: "deposit_ids" });
  let sum = 0;
  for (const id of d.deposit_ids) {
    const dep = await getInvoice(db, clubId, id);
    if (!dep || dep.kind !== "deposit" || !dep.number || dep.status === "cancelled") throw bad("invalid_deposit", "Un acompte indiqué n'existe pas, n'est pas émis ou a été annulé.", { id });
    if ((dep.customer_ref || null) !== (d.customer_ref || null)) throw bad("invalid_deposit", "Un acompte indiqué concerne un autre client.", { id });
    const used = await one<{ id: string }>(db, "SELECT id FROM invoices WHERE club_id = ? AND kind = 'invoice' AND status != 'draft' AND id != ? AND EXISTS (SELECT 1 FROM json_each(invoices.deposit_ids) WHERE value = ?)", clubId, selfId || "", id);
    if (used) throw bad("invalid_deposit", "Un acompte indiqué a déjà été déduit d'une autre facture.", { id });
    sum += dep.total_ttc - dep.credited_amount;
  }
  return sum;
}

async function fillCustomer(db: D1Database, clubId: string, d: DraftInput) {
  if (!d.customer_ref) return;
  const m = await memberRecord(db, clubId, d.customer_ref);
  if (!m) throw bad("unknown_customer", "La fiche client indiquée est introuvable dans ce club.", { field: "customer_ref" });
  if (!d.customer_name) d.customer_name = [m.first, m.last].filter(Boolean).join(" ").trim() || m.name || null;
  if (!d.customer_email && m.email) d.customer_email = String(m.email);
  if (!d.customer_address) d.customer_address = memberAddress(m);
}

async function writeDraft(env: Env, clubId: string, id: string, d: DraftInput, userId: string | null, isNew: boolean, extra: Partial<InvoiceRow> = {}) {
  const db = env.DB;
  const regime = await regimeOf(db, clubId, env);
  let t;
  try { t = computeTotals(d.lines, d.price_mode, regime); } catch { throw bad("invalid_field", "Une quantité est invalide.", { field: "lines" }); }
  if (t.total_ttc < 0) throw bad("negative_total", "Le total d'une facture ne peut pas être négatif : établissez un avoir.");
  const prepaid = await resolveDeposits(db, clubId, d, isNew ? null : id);
  if (prepaid > t.total_ttc) throw bad("invalid_deposit", "Les acomptes déduits dépassent le total de la facture.");
  const now = nowIso();
  const cols = {
    kind: d.kind, customer_ref: d.customer_ref, customer_type: d.customer_type, customer_name: d.customer_name, customer_email: d.customer_email,
    customer_siren: d.customer_siren, customer_vat: d.customer_vat, customer_address: d.customer_address ? JSON.stringify(d.customer_address) : null,
    delivery_address: d.delivery_address ? JSON.stringify(d.delivery_address) : null, buyer_reference: d.buyer_reference, label: d.label,
    service_date: d.service_date, period_start: d.period_start, period_end: d.period_end, due_date: d.due_date, price_mode: d.price_mode,
    total_ht: t.total_ht, total_vat: t.total_vat, total_ttc: t.total_ttc, prepaid_amount: prepaid, payment_method: d.payment_method,
    operation_category: t.operation_category, notes: d.notes, deposit_ids: JSON.stringify(d.deposit_ids), updated_at: now, ...extra,
  };
  const stmts: D1PreparedStatement[] = [];
  if (isNew) {
    const all = { id, club_id: clubId, created_by: userId, created_at: now, status: "draft", ...cols };
    const keys = Object.keys(all);
    stmts.push(db.prepare(`INSERT INTO invoices (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`).bind(...Object.values(all)));
  } else {
    const keys = Object.keys(cols);
    stmts.push(db.prepare(`UPDATE invoices SET ${keys.map((k) => k + " = ?").join(", ")} WHERE id = ? AND club_id = ? AND status = 'draft' AND number IS NULL`).bind(...Object.values(cols), id, clubId));
    stmts.push(db.prepare("DELETE FROM invoice_lines WHERE invoice_id = ? AND club_id = ?").bind(id, clubId));
  }
  for (const l of t.lines) {
    stmts.push(db.prepare(`INSERT INTO invoice_lines (id, invoice_id, club_id, position, label, description, category, quantity, unit, unit_price, vat_rate_bp, vat_category, exemption_reason, line_ht, line_ttc, account)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId("inl"), id, clubId, l.position, l.label, l.description, l.category, l.quantity, l.unit, l.unit_price,
      l.vat_rate_bp, l.vat_category, l.exemption_reason, l.line_ht, l.line_ttc, l.account));
  }
  const res = await db.batch(stmts);
  if (!isNew && !res[0].meta.changes) throw new ApiError(409, "invoice_frozen", "Cette facture a déjà été émise : elle ne peut plus être modifiée. Établissez un avoir pour la corriger.");
}

export async function createDraft(env: Env, clubId: string, userId: string | null, body: Record<string, any>, extra: Partial<InvoiceRow> = {}): Promise<InvoiceRow> {
  const d = parseDraft(body);
  await fillCustomer(env.DB, clubId, d);
  const id = newId("inv");
  await writeDraft(env, clubId, id, d, userId, true, extra);
  return (await getInvoice(env.DB, clubId, id))!;
}

export async function updateDraft(env: Env, clubId: string, id: string, body: Record<string, any>): Promise<InvoiceRow> {
  const cur = await getInvoice(env.DB, clubId, id);
  if (!cur) throw notFound("Facture introuvable.");
  if (cur.status !== "draft" || cur.number) throw new ApiError(409, "invoice_frozen", "Cette facture a déjà été émise : elle ne peut plus être modifiée. Établissez un avoir pour la corriger.");
  const d = parseDraft(body, rowToDraft(cur, await getLines(env.DB, id)));
  if ("customer_ref" in body && body.customer_ref !== cur.customer_ref) {
    for (const k of ["customer_name", "customer_email", "customer_address"] as const) if (!(k in body)) d[k] = null;
  }
  await fillCustomer(env.DB, clubId, d);
  await writeDraft(env, clubId, id, d, null, false);
  return (await getInvoice(env.DB, clubId, id))!;
}

export async function deleteDraft(db: D1Database, clubId: string, id: string) {
  const r = await run(db, "DELETE FROM invoices WHERE id = ? AND club_id = ? AND status = 'draft' AND number IS NULL", id, clubId);
  if (!r.meta.changes) {
    const cur = await getInvoice(db, clubId, id);
    if (!cur) throw notFound("Facture introuvable.");
    throw new ApiError(409, "invoice_frozen", "Une facture émise ne peut pas être supprimée. Établissez un avoir pour l'annuler.");
  }
}

// ---------- Émission ----------
function channelFor(i: InvoiceRow, regime: Seller["regime"], st: InvoicingSettings): InvoiceRow["einvoice_channel"] {
  if (!st.einvoicing_enabled || regime === "association_exoneree") return "none";
  const addr = json<Address | null>(i.customer_address, null);
  const foreign = addr?.country && addr.country !== "FR";
  if (!foreign && i.customer_siren && (i.customer_type === "business" || i.customer_type === "public" || i.customer_type === "association")) return "b2b";
  return "b2c";
}

function businessProcess(kind: string, cat: string, hasDeposits: boolean): string {
  const letter = cat === "goods" ? "B" : cat === "mixed" ? "M" : "S";
  return letter + (hasDeposits ? "4" : "1");
}

export async function buildSnapshot(env: Env, i: InvoiceRow, number: string, issueDate: string, dueDate: string | null, lines: any[], aids: Aid[] = []): Promise<Snapshot> {
  const db = env.DB;
  const isPlatform = i.club_id === PLATFORM_CLUB;
  const st = isPlatform ? { ...(await getSettings(db, PLATFORM_CLUB)) } : await getSettings(db, i.club_id);
  const seller = isPlatform ? platformSeller(env) : await clubSeller(db, i.club_id, st);
  if (!seller) throw notFound("Club introuvable.");
  if (!seller.siren && !isPlatform) throw new ApiError(422, "missing_siren", "Renseignez le SIREN de votre structure dans les réglages avant d'émettre une facture.");
  const pro = i.customer_type !== "individual";
  const computed: ComputedLine[] = lines.map((l) => ({
    position: l.position, label: l.label, description: l.description, category: l.category, quantity: l.quantity, unit: l.unit,
    unit_price: l.unit_price, vat_rate_bp: l.vat_rate_bp, vat_category: l.vat_category, exemption_reason: l.exemption_reason,
    exemption_code: null, line_ht: l.line_ht, line_ttc: l.line_ttc, account: l.account, kind: CATEGORIES[l.category]?.kind || "services",
  }));
  // Recalcul complet pour les groupes de TVA (identique au brouillon, mais garantit la cohérence du gel).
  const t = computeTotals(computed.map((l) => ({ label: l.label, description: l.description, category: l.category, quantity: l.quantity, unit: l.unit, unit_price: l.unit_price, vat_rate_bp: l.vat_rate_bp })), i.price_mode, seller.regime);
  const deposits: Snapshot["deposits"] = [];
  for (const id of json<string[]>(i.deposit_ids, [])) {
    const d = await getInvoice(db, i.club_id, id);
    if (d?.number) deposits.push({ number: d.number, date: d.issue_date!, amount: d.total_ttc - d.credited_amount });
  }
  let original: Snapshot["original"] = null;
  if (i.original_id) { const o = await getInvoice(db, i.club_id, i.original_id); if (o?.number) original = { number: o.number, date: o.issue_date! }; }
  const prepaid = deposits.reduce((a, d) => a + d.amount, 0);
  const due = i.kind === "credit_note" ? t.total_ttc : t.total_ttc - prepaid;
  const method = (i.payment_method as PayMethod) || null;
  const iban = st.iban;
  let means = method ? PAY_METHODS[method].untdid : iban ? "58" : "1";
  if ((means === "58" || means === "30") && !iban) means = "1";
  const aidTotal = i.kind === "invoice" ? aids.reduce((a, x) => a + x.amount, 0) : 0;
  const terms = i.kind === "credit_note" ? "Avoir à déduire de votre prochaine facture ou remboursé selon le moyen de paiement initial."
    : due - aidTotal <= 0 ? "Facture réglée." : dueDate && dueDate > issueDate ? `Paiement au plus tard le ${dueDate.split("-").reverse().join("/")}.` : "Paiement à réception.";
  const notes: Snapshot["notes"] = [];
  const mentions: string[] = [];
  const regimeMention = REGIME_MENTION[seller.regime];
  if (regimeMention) mentions.push(regimeMention + ".");
  const reasons = [...new Set(t.groups.filter((g) => g.category === "E" && g.reason && g.reason !== regimeMention).map((g) => g.reason!))];
  for (const r of reasons) mentions.push(r + ".");
  if (st.vat_on_debits && seller.regime === "normal") { mentions.push("Option pour le paiement de la taxe d'après les débits."); notes.push({ code: "TXD", text: "Option pour le paiement de la taxe d'après les débits" }); }
  if (pro && i.kind !== "credit_note") {
    const pen = `En cas de retard de paiement, des pénalités au taux de ${st.late_penalty_text} sont exigibles dès le lendemain de l'échéance, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 € (art. L441-10 et D441-5 du code de commerce).`;
    mentions.push(pen, "Pas d'escompte pour paiement anticipé.");
    notes.push({ code: "PMD", text: `Pénalités de retard : ${st.late_penalty_text}` }, { code: "PMT", text: "Indemnité forfaitaire pour frais de recouvrement : 40 EUR" }, { code: "AAB", text: "Pas d'escompte pour paiement anticipé" });
  }
  if (i.kind === "deposit") mentions.push("Facture d'acompte : le solde fera l'objet d'une facture définitive qui déduira cet acompte.");
  if (aidTotal) { const txt = aidsMention(aids, due); mentions.push(txt); notes.push({ code: "AAI", text: txt }); }
  if (deposits.length) { const txt = "Acomptes déduits : " + deposits.map((d) => `${d.number} du ${d.date.split("-").reverse().join("/")}`).join(", ") + "."; mentions.push(txt); notes.push({ code: "AAI", text: txt }); }
  if (original) mentions.push(`Avoir sur la facture ${original.number} du ${original.date.split("-").reverse().join("/")}.${i.notes ? " Motif : " + i.notes : ""}`);
  else if (i.notes) notes.push({ code: "AAI", text: i.notes });
  if (i.notes && !original) mentions.push(i.notes);
  return {
    v: 1, issuer: isPlatform ? "platform" : "club", kind: i.kind, type_code: i.kind === "credit_note" ? "381" : i.kind === "deposit" ? "386" : "380",
    number, issue_date: issueDate, due_date: i.kind === "credit_note" ? null : dueDate, label: i.label, seller,
    buyer: { type: i.customer_type, name: i.customer_name || "Client", siren: i.customer_siren, vat: i.customer_vat, address: json<Address>(i.customer_address, {}) || {}, email: i.customer_email, ref: i.customer_ref },
    delivery_address: json<Address | null>(i.delivery_address, null), buyer_reference: i.buyer_reference, service_date: i.service_date,
    period: i.period_start && i.period_end ? { start: i.period_start, end: i.period_end } : null,
    lines: t.lines, groups: t.groups, totals: { ht: t.total_ht, vat: t.total_vat, ttc: t.total_ttc, prepaid: i.kind === "credit_note" ? 0 : prepaid, due },
    regime: seller.regime, operation_category: t.operation_category, vat_on_debits: !!st.vat_on_debits && seller.regime === "normal",
    business_process: businessProcess(i.kind, t.operation_category, deposits.length > 0),
    payment: { method, method_label: method ? PAY_METHODS[method].label : null, means_code: means, iban: i.kind === "credit_note" ? null : iban, bic: st.bic, terms },
    notes, mentions, original, deposits, footer: st.footer,
  };
}

/**
 * Émission : numéro définitif continu (compteur incrémenté dans la même transaction que le gel), contenu figé
 * (snapshot), PDF Factur-X et XML dans R2, copie dans records, événement invoice.issued, envoi par e-mail.
 */
export async function issueInvoice(env: Env, clubId: string, id: string, userId: string | null, opts: { send?: boolean; ctx?: ExecutionContext | null } = {}): Promise<InvoiceRow> {
  const db = env.DB;
  const cur = await getInvoice(db, clubId, id);
  if (!cur) throw notFound("Facture introuvable.");
  if (cur.status !== "draft" || cur.number) throw new ApiError(409, "already_issued", "Cette facture est déjà émise.");
  const lines = await getLines(db, id);
  if (!lines.length) throw bad("empty_invoice", "Ajoutez au moins une ligne avant d'émettre la facture.");
  if (!cur.customer_name) throw bad("missing_customer", "Indiquez le client (fiche adhérent ou nom) avant d'émettre la facture.");
  const strict = cur.issuer !== "platform";
  if (strict && cur.customer_type !== "individual" && (!cur.customer_address || !json<Address>(cur.customer_address, {}).city)) throw bad("missing_address", "L'adresse du client professionnel est obligatoire sur la facture.");
  const addr = json<Address | null>(cur.customer_address, null);
  if (strict && (cur.customer_type === "business" || cur.customer_type === "public") && (!addr?.country || addr.country === "FR") && !cur.customer_siren)
    throw bad("missing_siren", "Le SIREN du client professionnel est obligatoire depuis la réforme de la facture électronique.");
  if (cur.kind !== "credit_note") await resolveDeposits(db, clubId, rowToDraft(cur, lines), id);

  const st = await getSettings(db, clubId);
  const regime = await regimeOf(db, clubId, env);
  const issueDate = parisToday();
  const year = issueDate.slice(0, 4);
  const prefix = clubId === PLATFORM_CLUB ? (cur.kind === "credit_note" ? "PAV" : "PIA") : cur.kind === "credit_note" ? st.prefix_credit : st.prefix_invoice;
  const series = `${prefix}-${year}`;
  const terms = cur.customer_type === "individual" ? st.payment_terms_days : st.b2b_terms_days;
  let dueDate = cur.kind === "credit_note" ? null : cur.due_date && cur.due_date >= issueDate ? cur.due_date : addDays(issueDate, terms);
  if (dueDate && cur.customer_type !== "individual" && daysBetween(issueDate, dueDate) > 60) dueDate = addDays(issueDate, 60);

  // Numéro provisoire pour construire le snapshot : il est remplacé par le vrai dans la même requête SQL.
  const probe = await one<{ value: number }>(db, "SELECT value FROM invoice_counters WHERE club_id = ? AND series = ?", clubId, series);
  const draftNumber = `${series}-${String((probe?.value || 0) + 1).padStart(5, "0")}`;
  // aides de l'adhérent (Pass'Sport, ANCV, CAF, CSE, mairie) : réglées par un tiers, déduites du reste à payer
  const aids = cur.kind === "invoice" && cur.customer_ref && clubId !== PLATFORM_CLUB ? selectAids(await pendingAids(db, clubId, cur.customer_ref), payable(cur)) : [];
  const snap = await buildSnapshot(env, cur, draftNumber, issueDate, dueDate, lines, aids);
  const channel = cur.issuer === "platform" ? (cur.customer_siren ? "b2b" : "none") : channelFor(cur, regime, st);
  const einvStatus = channel === "b2b" ? "pending" : channel === "b2c" ? "ereporting" : "not_required";
  const now = nowIso();
  const snapJson = JSON.stringify(snap).replace(JSON.stringify(draftNumber), '"__NUMBER__"');

  const counterSel = "(SELECT value FROM invoice_counters WHERE club_id = ?1 AND series = ?2)";
  const numberExpr = `?2 || '-' || printf('%05d', ${counterSel})`;
  const stmts = [
    db.prepare("INSERT OR IGNORE INTO invoice_counters (club_id, series, value) VALUES (?, ?, 0)").bind(clubId, series),
    db.prepare("UPDATE invoice_counters SET value = value + 1 WHERE club_id = ? AND series = ? AND EXISTS (SELECT 1 FROM invoices WHERE id = ? AND club_id = ? AND status = 'draft' AND number IS NULL AND updated_at = ?)")
      .bind(clubId, series, id, clubId, cur.updated_at),
    db.prepare(`UPDATE invoices SET series = ?2, seq = ${counterSel}, number = ${numberExpr},
        status = 'issued', issue_date = ?5, due_date = ?6, snapshot = replace(?7, '"__NUMBER__"', '"' || ${numberExpr} || '"'),
        issued_at = ?8, issued_by = ?9, updated_at = ?8, einvoice_channel = ?10, einvoice_status = ?11, operation_category = ?12,
        prepaid_amount = ?13, total_ht = ?14, total_vat = ?15, total_ttc = ?16, vat_on_debits = ?17
      WHERE id = ?3 AND club_id = ?1 AND status = 'draft' AND number IS NULL AND updated_at = ?4`)
      .bind(clubId, series, id, cur.updated_at, issueDate, dueDate, snapJson, now, userId, channel, einvStatus, snap.operation_category,
        snap.totals.prepaid, snap.totals.ht, snap.totals.vat, snap.totals.ttc, snap.vat_on_debits ? 1 : 0),
  ];
  if (cur.kind === "credit_note" && cur.original_id) {
    stmts.push(db.prepare("UPDATE invoices SET credited_amount = credited_amount + ?, updated_at = ? WHERE id = ? AND club_id = ? AND EXISTS (SELECT 1 FROM invoices WHERE id = ? AND club_id = ? AND status = 'issued' AND issued_at = ?)")
      .bind(snap.totals.ttc, now, cur.original_id, clubId, id, clubId, now));
  }
  let res;
  try { res = await db.batch(stmts); } catch (e: any) {
    if (/UNIQUE|invoice_frozen/.test(String(e?.message))) throw new ApiError(409, "already_issued", "Cette facture vient d'être émise ou modifiée par quelqu'un d'autre. Rechargez la page.");
    throw e;
  }
  if (!res[2].meta.changes) throw new ApiError(409, "already_issued", "Cette facture vient d'être émise ou modifiée par quelqu'un d'autre. Rechargez la page.");

  let inv = (await getInvoice(db, clubId, id))!;
  await audit(db, { club_id: clubId === PLATFORM_CLUB ? inv.buyer_club_id : clubId, user_id: userId, action: "invoice.issue", target: id, data: { number: inv.number, total_ttc: inv.total_ttc } });
  try { await ensureDocuments(env, inv); } catch (e) { console.error("Génération du PDF", (e as Error)?.message); }
  if (cur.kind === "credit_note" && cur.original_id) await recompute(env, clubId, cur.original_id);
  inv = await recompute(env, clubId, id);
  if (aids.length) {
    await applyAids(env, clubId, id, inv.number!, aids, userId, (amount, method, reference, note) =>
      addPayment(env, clubId, id, { amount, method, reference, note, user_id: userId, paid_at: issueDate }).catch((e) => console.error("Aide non enregistrée", (e as Error)?.message)));
    inv = await recompute(env, clubId, id);
  }
  await emit(env, null, { type: "invoice.issued", club_id: clubId, invoice_id: id, number: inv.number, kind: inv.kind });
  const send = opts.send ?? st.send_on_issue;
  if (send && inv.customer_email) inv = await sendInvoice(env, inv);
  return inv;
}

export function snapshotOf(i: InvoiceRow): Snapshot {
  return json<Snapshot>(i.snapshot, null as any);
}
const safeKey = (s: string) => s.replace(/[^A-Za-z0-9-]/g, "_");
export function docKeys(i: InvoiceRow) {
  const base = `invoices/${safeKey(i.club_id)}/${(i.issue_date || "").slice(0, 4)}/${safeKey(i.number || i.id)}`;
  return { pdf: base + ".pdf", xml: base + ".xml" };
}

/** Génère (ou régénère à l'identique) PDF et XML d'une facture émise, et les range dans R2. */
export async function ensureDocuments(env: Env, i: InvoiceRow): Promise<{ pdf: Uint8Array; xml: string }> {
  if (!i.number || !i.snapshot) throw new ApiError(409, "not_issued", "Le PDF n'existe qu'une fois la facture émise.");
  const keys = docKeys(i);
  if (i.pdf_key && i.xml_key) {
    const [p, x] = await Promise.all([env.FILES.get(i.pdf_key), env.FILES.get(i.xml_key)]);
    if (p && x) return { pdf: new Uint8Array(await p.arrayBuffer()), xml: await x.text() };
  }
  const snap = snapshotOf(i);
  const xml = buildCii(snap);
  let logo: { bytes: Uint8Array; type: "png" | "jpg" } | null = null;
  if (snap.seller.logo_key) {
    try {
      const o = await env.FILES.get(snap.seller.logo_key);
      if (o && o.size < 2_000_000) { const b = new Uint8Array(await o.arrayBuffer()); logo = { bytes: b, type: b[0] === 0x89 ? "png" : "jpg" }; }
    } catch { logo = null; }
  }
  const pdf = await renderInvoicePdf(snap, xml, { logo, createdAt: new Date(i.issued_at || i.issue_date + "T12:00:00Z") });
  const sha = [...new Uint8Array(await crypto.subtle.digest("SHA-256", pdf))].map((b) => b.toString(16).padStart(2, "0")).join("");
  await env.FILES.put(keys.pdf, pdf, { httpMetadata: { contentType: "application/pdf" }, customMetadata: { club: i.club_id, number: i.number } });
  await env.FILES.put(keys.xml, xml, { httpMetadata: { contentType: "application/xml; charset=utf-8" }, customMetadata: { club: i.club_id, number: i.number } });
  await run(env.DB, "UPDATE invoices SET pdf_key = ?, xml_key = ?, pdf_sha256 = ? WHERE id = ? AND club_id = ?", keys.pdf, keys.xml, sha, i.id, i.club_id);
  return { pdf, xml };
}

export function b64(bytes: Uint8Array): string {
  let s = ""; const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode(...bytes.subarray(i, i + CH));
  return btoa(s);
}

export async function sendInvoice(env: Env, i: InvoiceRow): Promise<InvoiceRow> {
  if (!i.customer_email) throw bad("missing_email", "Ce client n'a pas d'adresse e-mail : téléchargez le PDF pour le lui remettre.");
  const { pdf } = await ensureDocuments(env, i);
  const first = i.customer_ref ? (await memberRecord(env.DB, i.club_id, i.customer_ref))?.first : null;
  const isPlatform = i.club_id === PLATFORM_CLUB;
  // Pré-notification SEPA : le payeur a un mandat actif avec prélèvement automatique (lot Stripe).
  let sepa = false;
  if (!isPlatform && i.kind !== "credit_note") { try { sepa = !!(await autopayFor(env.DB, i.club_id, i.customer_ref)); } catch { sepa = false; } }
  await sendMail(env, {
    to: i.customer_email, template: isPlatform ? "subscription_receipt" : "invoice_issued", club_id: isPlatform ? null : i.club_id,
    data: {
      first: first || undefined, number: i.number, invoice_number: i.number, amount_cents: i.kind === "credit_note" ? i.total_ttc : Math.max(0, balance(i)),
      due_date: i.due_date, label: i.label, invoice_url: `${env.APP_URL}/factures/${i.id}`, sepa,
      pay_url: !isPlatform && i.kind !== "credit_note" && balance(i) > 0 ? `${env.APP_URL}/payer/${i.id}` : undefined,
      club_name: i.customer_name, period_start: i.period_start, period_end: i.period_end, plan: i.label,
    },
    attachments: [{ filename: `${i.number}.pdf`, content_b64: b64(pdf), type: "application/pdf" }],
  });
  const now = nowIso();
  await run(env.DB, "UPDATE invoices SET sent_at = ?, updated_at = ? WHERE id = ? AND club_id = ?", now, now, i.id, i.club_id);
  return recompute(env, i.club_id, i.id);
}

// ---------- Statuts et copie records ----------
export function computeStatus(i: InvoiceRow, today = parisToday()): string {
  if (i.status === "draft") return "draft";
  if (i.kind === "credit_note") return i.sent_at ? "sent" : "issued";
  const due = payable(i);
  if (i.credited_amount > 0 && i.credited_amount >= i.total_ttc - i.prepaid_amount) return "cancelled";
  if (due - i.paid_amount <= 0) return "paid";
  if (i.due_date && i.due_date < today) return "overdue";
  if (i.paid_amount > 0) return "partially_paid";
  return i.sent_at ? "sent" : "issued";
}

export async function recompute(env: Env, clubId: string, id: string, today = parisToday()): Promise<InvoiceRow> {
  const db = env.DB;
  const sum = await one<{ s: number }>(db, "SELECT COALESCE(SUM(amount), 0) AS s FROM invoice_payments WHERE club_id = ? AND invoice_id = ?", clubId, id);
  await run(db, "UPDATE invoices SET paid_amount = ? WHERE id = ? AND club_id = ? AND paid_amount != ?", sum?.s || 0, id, clubId, sum?.s || 0);
  const i = (await getInvoice(db, clubId, id))!;
  const st = computeStatus(i, today);
  if (st !== i.status) {
    const now = nowIso();
    await run(db, `UPDATE invoices SET status = ?, updated_at = ?, paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, ?) ELSE NULL END,
      cancelled_at = CASE WHEN ? = 'cancelled' THEN COALESCE(cancelled_at, ?) ELSE NULL END WHERE id = ? AND club_id = ?`, st, now, st, now, st, now, id, clubId);
  }
  const fresh = (await getInvoice(db, clubId, id))!;
  await syncRecord(db, fresh);
  return fresh;
}

/**
 * Copie simplifiée dans records (coll invoices ou creditNotes) au format de la démo, pour les écrans existants.
 * Seule écriture directe autorisée dans records (montants en euros, comme la démo).
 */
export async function syncRecord(db: D1Database, i: InvoiceRow) {
  if (i.club_id === PLATFORM_CLUB || !i.number) return;
  const snap = snapshotOf(i);
  const main = snap?.groups?.slice().sort((a, b) => b.base - a.base)[0];
  const lastPay = await one<{ method: string }>(db, "SELECT method FROM invoice_payments WHERE club_id = ? AND invoice_id = ? AND amount > 0 ORDER BY paid_at DESC, created_at DESC LIMIT 1", i.club_id, i.id);
  const m = (lastPay?.method || i.payment_method) as PayMethod | null;
  const isCredit = i.kind === "credit_note";
  let ref: string | null = null;
  if (isCredit && i.original_id) ref = (await one<{ number: string }>(db, "SELECT number FROM invoices WHERE id = ? AND club_id = ?", i.original_id, i.club_id))?.number || null;
  const data: Record<string, unknown> = {
    id: i.number, member: i.customer_ref, label: i.label || snap?.lines?.[0]?.label || (isCredit ? "Avoir" : "Facture"),
    amount: (isCredit ? -i.total_ttc : i.total_ttc) / 100, vat: main ? main.rate_bp / 100 : 0, date: i.issue_date, due: i.due_date || i.issue_date,
    status: isCredit ? "avoir" : STATUS_FR[i.status] || i.status,
    method: isCredit ? "Avoir" : m ? PAY_METHODS[m]?.label || m : "",
    paid: i.paid_amount / 100, inv: i.id, kind: i.kind,
  };
  if (ref) data.ref = ref;
  if (i.prepaid_amount) data.pre = [[ "Acomptes", i.prepaid_amount / 100 ]];
  const coll = isCredit ? "creditNotes" : "invoices";
  await run(db, `INSERT INTO records (club_id, coll, id, data, version, deleted, updated_by, updated_at) VALUES (?,?,?,?,1,0,'invoicing',?)
    ON CONFLICT(club_id, coll, id) DO UPDATE SET data = excluded.data, version = records.version + 1, deleted = 0, updated_by = 'invoicing', updated_at = excluded.updated_at
    WHERE records.data != excluded.data`, i.club_id, coll, i.number, JSON.stringify(data), nowIso());
}

// ---------- Avoirs ----------
export async function createCreditNote(env: Env, clubId: string, originalId: string, userId: string | null, b: Record<string, any>): Promise<InvoiceRow> {
  const db = env.DB;
  const o = await getInvoice(db, clubId, originalId);
  if (!o) throw notFound("Facture introuvable.");
  if (!o.number || o.kind === "credit_note") throw bad("not_creditable", "Seule une facture émise peut faire l'objet d'un avoir.");
  const remaining = o.total_ttc - o.credited_amount;
  if (remaining <= 0) throw new ApiError(409, "already_credited", "Cette facture est déjà entièrement annulée par avoir.");
  const reason = s(b.reason, 300);
  if (!reason) throw bad("missing_field", "Indiquez le motif de l'avoir.", { field: "reason" });
  const oLines = await getLines(db, originalId);
  let lines: LineInput[];
  let mode = o.price_mode;
  if (Array.isArray(b.lines) && b.lines.length) {
    lines = parseDraft({ lines: b.lines }).lines;
  } else if (b.amount != null) {
    const amount = Number(b.amount);
    if (!Number.isInteger(amount) || amount <= 0) throw bad("invalid_field", "Le montant de l'avoir doit être un nombre entier de centimes, positif.", { field: "amount" });
    if (amount > remaining) throw bad("too_much", "Le montant de l'avoir dépasse le montant restant de la facture.", { remaining });
    if (amount === remaining) lines = oLines.map((l) => ({ label: l.label, description: l.description, category: l.category, quantity: l.quantity, unit: l.unit, unit_price: l.unit_price, vat_rate_bp: l.vat_rate_bp }));
    else {
      // Avoir partiel en montant TTC : réparti au prorata des groupes de TVA de la facture d'origine.
      mode = "ttc";
      const snap = snapshotOf(o);
      const total = snap.groups.reduce((a, g) => a + g.base + g.vat, 0) || 1;
      let left = amount;
      lines = snap.groups.map((g, k) => {
        const part = k === snap.groups.length - 1 ? left : Math.round((amount * (g.base + g.vat)) / total);
        left -= part;
        const lineOfGroup = snap.lines.find((l) => l.vat_rate_bp === g.rate_bp && l.vat_category === g.category);
        return { label: `Avoir partiel, ${reason}`, category: lineOfGroup?.category || "other", quantity: 1, unit: "C62", unit_price: part, vat_rate_bp: g.rate_bp };
      }).filter((l) => l.unit_price > 0);
    }
  } else {
    lines = oLines.map((l) => ({ label: l.label, description: l.description, category: l.category, quantity: l.quantity, unit: l.unit, unit_price: l.unit_price, vat_rate_bp: l.vat_rate_bp }));
    if (o.credited_amount > 0) throw bad("partial_exists", "Un avoir partiel existe déjà : indiquez le montant ou les lignes de ce nouvel avoir.", { remaining });
  }
  const regime = await regimeOf(db, clubId, env);
  const t = computeTotals(lines, mode, regime);
  if (t.total_ttc <= 0) throw bad("invalid_field", "Le montant de l'avoir doit être positif.");
  if (t.total_ttc > remaining) throw bad("too_much", "Le montant de l'avoir dépasse le montant restant de la facture.", { remaining });
  const draft = await createDraft(env, clubId, userId, {
    customer_ref: o.customer_ref, customer_type: o.customer_type, customer_name: o.customer_name, customer_email: o.customer_email,
    customer_siren: o.customer_siren, customer_vat: o.customer_vat, customer_address: json(o.customer_address, null),
    label: `Avoir, ${o.label || o.number}`.slice(0, 200), price_mode: mode, payment_method: o.payment_method, lines, notes: reason,
  }, { kind: "credit_note", original_id: o.id, issuer: o.issuer, buyer_club_id: o.buyer_club_id } as any);
  return issueInvoice(env, clubId, draft.id, userId, { send: b.send });
}

// ---------- Paiements ----------
export async function addPayment(env: Env, clubId: string, invoiceId: string, p: { amount: number; method: PayMethod; paid_at?: string | null; reference?: string | null; note?: string | null; stripe_ref?: string | null; user_id?: string | null; allowOver?: boolean }): Promise<{ invoice: InvoiceRow; duplicate: boolean; payment_id: string | null }> {
  const db = env.DB;
  const i = await getInvoice(db, clubId, invoiceId);
  if (!i) throw notFound("Facture introuvable.");
  if (!i.number || i.kind === "credit_note") throw bad("not_payable", "Seule une facture émise peut recevoir un paiement.");
  if (!Number.isInteger(p.amount) || p.amount === 0 || Math.abs(p.amount) > 1e9) throw bad("invalid_field", "Le montant doit être un nombre entier de centimes, non nul.", { field: "amount" });
  if (p.amount > 0 && !p.allowOver && p.amount > balance(i)) throw bad("overpayment", `Le paiement dépasse le reste à payer (${(Math.max(0, balance(i)) / 100).toFixed(2).replace(".", ",")} €).`, { remaining: Math.max(0, balance(i)) });
  if (p.amount < 0 && -p.amount > i.paid_amount) throw bad("invalid_field", "Le remboursement dépasse ce qui a été encaissé.");
  const paidAt = p.paid_at && isDate(p.paid_at) ? p.paid_at : parisToday();
  if (paidAt > addDays(parisToday(), 1)) throw bad("invalid_field", "La date du paiement ne peut pas être dans le futur.", { field: "paid_at" });
  const id = newId("ipm");
  try {
    await run(db, "INSERT INTO invoice_payments (id, club_id, invoice_id, amount, method, paid_at, reference, stripe_ref, note, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)",
      id, clubId, invoiceId, p.amount, p.method, paidAt, p.reference ?? null, p.stripe_ref ?? null, p.note ?? null, p.user_id ?? null);
  } catch (e: any) {
    if (p.stripe_ref && /UNIQUE/.test(String(e?.message))) return { invoice: i, duplicate: true, payment_id: null };
    throw e;
  }
  await audit(db, { club_id: clubId, user_id: p.user_id ?? null, action: p.amount > 0 ? "invoice.payment" : "invoice.refund", target: invoiceId, data: { amount: p.amount, method: p.method } });
  const inv = await recompute(env, clubId, invoiceId);
  return { invoice: inv, duplicate: false, payment_id: id };
}
