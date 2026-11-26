import { all, one } from "../lib/db";

/**
 * CONTRAT avec le lot C (factures). Le lot B ne crée ni ne modifie jamais une facture : il lit le
 * montant restant dû, encaisse, puis émet invoice.paid / payment.failed / payment.refunded.
 *
 * Table attendue « invoices » (centimes) : id, club_id, number, customer_ref (fiche adhérent payeuse),
 * total_ttc, paid_amount, status. Colonnes facultatives lues si présentes : due_date, label, currency, customer_email,
 * prepaid_amount et credited_amount (déduits du total), issuer (seul « club » est payable), kind (« credit_note » exclu).
 * Le lot C peut aussi fournir sa propre implémentation avec setInvoiceLookup().
 */
export interface InvoiceInfo {
  id: string;
  club_id: string;
  number: string | null;
  customer_ref: string | null;
  total_cents: number;
  paid_cents: number;
  status: string;
  due_date: string | null;
  label: string | null;
  currency: string;
  email?: string | null;
}

export interface InvoiceLookup {
  get(db: D1Database, clubId: string, invoiceId: string): Promise<InvoiceInfo | null>;
  /** Factures émises et non soldées d'un payeur (prélèvement automatique). Facultatif. */
  openFor?(db: D1Database, clubId: string, customerRef: string): Promise<InvoiceInfo[]>;
}

/** Statuts pour lesquels une facture ne peut pas être payée en ligne. */
export const NOT_PAYABLE = new Set(["draft", "brouillon", "canceled", "cancelled", "void", "annulee", "annulée", "paid", "payee", "payée", "credited", "avoir"]);

export function remainingCents(inv: InvoiceInfo): number {
  return Math.max(0, Math.round(inv.total_cents) - Math.round(inv.paid_cents || 0));
}

function rowToInfo(r: any): InvoiceInfo {
  return {
    id: r.id, club_id: r.club_id, number: r.number ?? null, customer_ref: r.customer_ref ?? null,
    // Acomptes déduits et avoirs imputés réduisent le montant à encaisser (colonnes du lot C, facultatives).
    total_cents: (Number(r.total_ttc) || 0) - (Number(r.prepaid_amount) || 0) - (Number(r.credited_amount) || 0),
    paid_cents: Number(r.paid_amount) || 0,
    status: String(r.status || "").toLowerCase(), due_date: r.due_date ?? null,
    label: r.label ?? null, currency: (r.currency || "eur").toLowerCase(),
    email: typeof r.customer_email === "string" && r.customer_email.includes("@") ? r.customer_email : null,
  };
}

const known = new Map<string, boolean>();
async function tableExists(db: D1Database, name: string) {
  if (known.get(name)) return true;
  const r = await one(db, "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", name);
  if (r) known.set(name, true);
  return !!r;
}

/** Implémentation par défaut : lit la table du lot C si elle existe (sinon aucune facture). */
export function tableInvoiceLookup(table = "invoices"): InvoiceLookup {
  if (!/^[a-z_][a-z0-9_]*$/.test(table)) throw new Error("nom de table invalide");
  return {
    async get(db, clubId, invoiceId) {
      if (!(await tableExists(db, table))) return null;
      const r = await one<any>(db, `SELECT * FROM ${table} WHERE id = ? AND club_id = ?`, invoiceId, clubId);
      // Seules les factures du club à ses clients se paient ici (pas les factures de Stabl au club, ni les avoirs).
      if (!r || (r.issuer && r.issuer !== "club") || (r.kind && r.kind === "credit_note")) return null;
      return rowToInfo(r);
    },
    async openFor(db, clubId, customerRef) {
      if (!(await tableExists(db, table))) return [];
      const rows = await all<any>(db, `SELECT * FROM ${table} WHERE club_id = ? AND customer_ref = ? AND paid_amount < total_ttc LIMIT 200`, clubId, customerRef);
      return rows.filter((r) => (!r.issuer || r.issuer === "club") && r.kind !== "credit_note").map(rowToInfo).filter((i) => !NOT_PAYABLE.has(i.status) && remainingCents(i) > 0);
    },
  };
}

let lookup: InvoiceLookup = tableInvoiceLookup();
export function setInvoiceLookup(l?: InvoiceLookup) { lookup = l || tableInvoiceLookup(); }
export function invoices(): InvoiceLookup { return lookup; }
