import type { Env } from "../env";
import { one } from "../lib/db";
import { parseAddress, platformSeller } from "./settings";
import { createDraft, ensureDocuments, issueInvoice, recompute, PLATFORM_CLUB, type InvoiceRow } from "./invoices";
import { storeIncoming } from "./einvoice";

/**
 * Factures de Stabl aux clubs. Émetteur : Marceau Ruis EI (variables PLATFORM_*), même moteur, même PDF Factur-X.
 * Déclencheur : événement subscription.paid du lot Stripe, une facture par paiement d'abonnement (idempotence par
 * stripe_invoice_id). Série PIA-AAAA, distincte de celles des clubs (club_id technique « platform »).
 * Le montant reçu est le TTC payé : en franchise (PLATFORM_VAT_REGIME = franchise), HT = TTC et la mention
 * « TVA non applicable, art. 293 B du CGI » est imprimée ; en régime normal, la TVA à 20 % est extraite du TTC.
 * La facture est aussi rangée dans les factures fournisseurs du club (compte 651000), visibles par son comptable.
 * Aucun e-mail n'est envoyé ici : le lot Stripe envoie déjà le reçu subscription_receipt.
 */
export const PLAN_LABELS: Record<string, string> = { essentiel: "Essentiel", club: "Club", domaine: "Domaine", founder: "Fondateurs" };

export async function createPlatformInvoice(env: Env, e: { club_id: string; amount_cents: number; period_start: string | null; period_end: string | null; stripe_invoice_id: string; plan: string | null }): Promise<InvoiceRow | null> {
  if (!e.club_id || !e.stripe_invoice_id || !(e.amount_cents > 0)) return null;
  const db = env.DB;
  const existing = await one<InvoiceRow>(db, "SELECT * FROM invoices WHERE club_id = ? AND stripe_invoice_id = ?", PLATFORM_CLUB, e.stripe_invoice_id);
  if (existing?.number) return existing;
  const club = await one<any>(db, "SELECT id, name, legal_form, siren, siret, vat_number, address, email FROM clubs WHERE id = ?", e.club_id);
  if (!club) return null;
  const owner = await one<{ email: string }>(db, "SELECT u.email FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.club_id = ? AND m.role = 'owner' AND m.status = 'active' ORDER BY m.created_at LIMIT 1", e.club_id);
  const siren = club.siren || (club.siret ? String(club.siret).slice(0, 9) : null);
  const ps = e.period_start?.slice(0, 10) || null, pe = e.period_end?.slice(0, 10) || null;
  const plan = PLAN_LABELS[e.plan || ""] || e.plan || "Stabl";
  const period = ps && pe ? ` du ${ps.split("-").reverse().join("/")} au ${pe.split("-").reverse().join("/")}` : "";
  const seller = platformSeller(env);
  let draft = existing;
  if (!draft) {
    try {
      draft = await createDraft(env, PLATFORM_CLUB, null, {
        customer_type: siren ? (club.legal_form === "association" ? "association" : "business") : "individual",
        customer_name: club.name, customer_email: club.email || owner?.email || null, customer_siren: siren,
        customer_vat: club.vat_number || null, customer_address: Object.keys(parseAddress(club.address)).length ? parseAddress(club.address) : null,
        label: `Abonnement ${seller.trade_name || "Stabl"}, formule ${plan}`, price_mode: "ttc", payment_method: "card",
        period_start: ps && pe ? ps : null, period_end: ps && pe ? pe : null,
        lines: [{ label: `Abonnement au logiciel Stabl, formule ${plan}${period}`, category: "service", quantity: 1, unit: "C62", unit_price: e.amount_cents, vat_rate_bp: seller.regime === "normal" ? 2000 : 0 }],
      }, { issuer: "platform", buyer_club_id: e.club_id, stripe_invoice_id: e.stripe_invoice_id } as any);
    } catch (err: any) {
      if (/UNIQUE/.test(String(err?.message))) return one<InvoiceRow>(db, "SELECT * FROM invoices WHERE club_id = ? AND stripe_invoice_id = ?", PLATFORM_CLUB, e.stripe_invoice_id);
      throw err;
    }
  }
  let inv = await issueInvoice(env, PLATFORM_CLUB, draft.id, null, { send: false });
  // Déjà réglée par carte : paiement enregistré, facture soldée.
  await env.DB.prepare("INSERT OR IGNORE INTO invoice_payments (id, club_id, invoice_id, amount, method, paid_at, stripe_ref, note) VALUES (?,?,?,?,?,?,?,?)")
    .bind("ipm_" + inv.id.slice(4), PLATFORM_CLUB, inv.id, inv.total_ttc, "card", inv.issue_date, "sub:" + e.stripe_invoice_id, "Abonnement réglé par carte").run();
  inv = await recompute(env, PLATFORM_CLUB, inv.id);
  try {
    const { pdf, xml } = await ensureDocuments(env, inv);
    await storeIncoming(env, e.club_id, { source: "piaffe", provider: "piaffe", provider_ref: inv.id, xml, pdf, account: "651000" });
  } catch (err) { console.error("Facture Stabl vers les achats du club", (err as Error)?.message); }
  return inv;
}
