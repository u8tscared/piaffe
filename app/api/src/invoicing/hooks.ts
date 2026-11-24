import type { Env } from "../env";
import { on } from "../lib/events";
import { one } from "../lib/db";
import { setInvoiceLookup, type InvoiceInfo } from "../billing/invoices";
import { addPayment, balance, getInvoice, payable, PLATFORM_CLUB, type InvoiceRow } from "./invoices";
import { normMethod } from "./catalog";
import { createPlatformInvoice } from "./platform";

/**
 * Événements reçus du lot Stripe :
 *  - invoice.paid      {club_id, invoice_id, amount_cents, method: card|sepa_debit, stripe_ref, payment_id}
 *                      → paiement enregistré une seule fois (idempotence par stripe_ref), statut recalculé.
 *                      Le reçu est envoyé par le lot Stripe : rien n'est envoyé ici.
 *  - payment.refunded  {club_id, invoice_id, amount_cents (part nouvellement remboursée), stripe_ref, payment_id}
 *                      → paiement négatif (remboursement) ; la facture redevient due ou partiellement payée.
 *  - subscription.paid {club_id, stripe_invoice_id, number, amount_cents, tax_cents, period_start, period_end, plan, …}
 *                      → facture Factur-X de Piaffe (Marceau Ruis EI) au club, rangée aussi dans ses achats.
 * Événement émis : invoice.issued {club_id, invoice_id, number, kind}.
 */
export function registerHooks() {
  on("invoice.paid", async (env, e) => {
    const clubId = String(e.club_id || ""); const id = String(e.invoice_id || "");
    const amount = Math.round(Number(e.amount_cents));
    if (!clubId || !id || !(amount > 0)) return;
    const ref = String(e.stripe_ref || e.payment_id || "");
    const r = await addPayment(env, clubId, id, {
      amount, method: normMethod(e.method), stripe_ref: ref ? "pi:" + ref : null, reference: e.payment_id ? String(e.payment_id) : null,
      note: "Paiement en ligne", allowOver: true,
    });
    if (r.duplicate) console.log("invoice.paid déjà enregistré", id);
  });

  on("payment.refunded", async (env, e) => {
    const clubId = String(e.club_id || ""); const id = String(e.invoice_id || "");
    const amount = Math.round(Number(e.amount_cents));
    if (!clubId || !id || !(amount > 0)) return;
    const prev = await one<{ s: number }>(env.DB, "SELECT COALESCE(-SUM(amount), 0) AS s FROM invoice_payments WHERE club_id = ? AND invoice_id = ? AND amount < 0 AND stripe_ref LIKE ?", clubId, id, "rf:" + String(e.stripe_ref) + ":%");
    const inv = await getInvoice(env.DB, clubId, id); if (!inv) return;
    const amt = Math.min(amount, inv.paid_amount);
    if (amt <= 0) return;
    await addPayment(env, clubId, id, {
      amount: -amt, method: "card", stripe_ref: `rf:${e.stripe_ref}:${(prev?.s || 0) + amt}`, reference: e.payment_id ? String(e.payment_id) : null, note: "Remboursement en ligne",
    });
  });

  on("subscription.paid", async (env, e) => {
    await createPlatformInvoice(env, {
      club_id: String(e.club_id), amount_cents: Math.round(Number(e.amount_cents) || 0), period_start: (e.period_start as string) || null,
      period_end: (e.period_end as string) || null, stripe_invoice_id: String(e.stripe_invoice_id || ""), plan: (e.plan as string) || null,
    });
  });

  // Le lot Stripe lit nos factures par cette implémentation (reste dû exact, avoirs et acomptes compris).
  setInvoiceLookup({
    async get(db, clubId, invoiceId) {
      const i = await getInvoice(db, clubId, invoiceId);
      return i && i.club_id !== PLATFORM_CLUB ? info(i) : null;
    },
    async openFor(db, clubId, customerRef) {
      const { results } = await db.prepare(`SELECT * FROM invoices WHERE club_id = ? AND customer_ref = ? AND number IS NOT NULL AND kind != 'credit_note'
        AND status IN ('issued','sent','partially_paid','overdue') ORDER BY due_date LIMIT 200`).bind(clubId, customerRef).all<InvoiceRow>();
      return (results || []).map(info).filter((x) => x.total_cents > x.paid_cents);
    },
  });
}

function info(i: InvoiceRow): InvoiceInfo & Record<string, unknown> {
  return {
    id: i.id, club_id: i.club_id, number: i.number, customer_ref: i.customer_ref,
    total_cents: i.kind === "credit_note" ? 0 : payable(i), paid_cents: i.paid_amount,
    status: i.kind === "credit_note" ? "credited" : i.status, due_date: i.due_date, label: i.label, currency: (i.currency || "EUR").toLowerCase(),
    email: i.customer_email, remaining_cents: Math.max(0, balance(i)),
  } as any;
}

export type { Env };
