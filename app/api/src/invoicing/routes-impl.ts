import { Hono, type Context } from "hono";
import type { AppEnv, Env } from "../env";
import { requireRole, requireUser } from "../lib/auth";
import { all, audit, json, one, rateLimit, run } from "../lib/db";
import { ApiError, bad, body, forbidden, notFound } from "../lib/http";
import { nowIso } from "../lib/ids";
import { sendMail } from "../mail/send";
import { ACCOUNTS, CATEGORIES, LIFECYCLE, PAY_METHODS, STATUS_FR, normMethod } from "./catalog";
import {
  addPayment, balance, createCreditNote, createDraft, daysBetween, deleteDraft, ensureDocuments, familyRefs, getInvoice, getLines, getPayments,
  issueInvoice, parisToday, PLATFORM_CLUB, recompute, sendInvoice, updateDraft, view, type InvoiceRow,
} from "./invoices";
import { getSettings, mergeSettings, saveSettings } from "./settings";
import { buildEntries, entriesCsv, fecFilename, fecText, latin9, paymentsCsv, salesCsv } from "./exports";
import { zip } from "./zip";
import { completeConnect, connectClub, einvoiceTick, submitPending, pullStatuses, pullIncoming, pushPaymentStatuses, runEreporting } from "./einvoice";
import { provider, sandbox } from "./pa";
import { PaError } from "./pa/types";

const app = new Hono<AppEnv>();
const READERS = requireRole("owner", "manager", "accountant", "member");
const MANAGERS = requireRole("owner", "manager");
const BOOKS = requireRole("owner", "manager", "accountant");

const clubId = (c: Context<AppEnv>) => c.get("club")!.id;
const userId = (c: Context<AppEnv>) => c.get("user")?.id ?? null;
const role = (c: Context<AppEnv>) => c.get("membership")!.role;

/** Charge une facture du club courant en vérifiant le droit de lecture (adhérent : la sienne ou celle de sa famille). */
async function readable(c: Context<AppEnv>, id: string): Promise<InvoiceRow> {
  const inv = await getInvoice(c.env.DB, clubId(c), id);
  if (!inv) throw notFound("Facture introuvable.");
  if (role(c) === "member") {
    const refs = await familyRefs(c.env.DB, clubId(c), c.get("membership")!.person_ref);
    if (!inv.customer_ref || !refs.includes(inv.customer_ref) || inv.status === "draft") throw notFound("Facture introuvable.");
  }
  return inv;
}

function monthRange(m: string | undefined): { from: string; to: string } | null {
  if (!m) return null;
  if (!/^\d{4}-\d{2}$/.test(m)) throw bad("invalid_field", "Le mois doit être au format AAAA-MM.", { field: "month" });
  const [y, mm] = m.split("-").map(Number);
  const last = new Date(Date.UTC(y, mm, 0)).getUTCDate();
  return { from: `${m}-01`, to: `${m}-${String(last).padStart(2, "0")}` };
}
function range(c: Context<AppEnv>): { from: string; to: string } {
  const q = c.req.query();
  const mr = monthRange(q.month);
  if (mr) return mr;
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (q.year && /^\d{4}$/.test(q.year)) return { from: `${q.year}-01-01`, to: `${q.year}-12-31` };
  const from = q.from && re.test(q.from) ? q.from : `${parisToday().slice(0, 4)}-01-01`;
  const to = q.to && re.test(q.to) ? q.to : `${parisToday().slice(0, 4)}-12-31`;
  if (to < from) throw bad("invalid_field", "La date de fin doit être après la date de début.");
  return { from, to };
}
function file(c: Context<AppEnv>, data: Uint8Array | string, type: string, name: string, inline = false) {
  return c.body(typeof data === "string" ? data : (data as any), 200, {
    "content-type": type, "content-disposition": `${inline ? "inline" : "attachment"}; filename="${name.replace(/[^A-Za-z0-9._-]/g, "_")}"`,
    "cache-control": "private, no-store",
  });
}

/* ================= Factures ================= */

app.get("/api/invoices", READERS, async (c) => {
  const q = c.req.query(); const db = c.env.DB; const cid = clubId(c);
  const where = ["club_id = ?"]; const args: unknown[] = [cid];
  if (role(c) === "member") {
    const refs = await familyRefs(db, cid, c.get("membership")!.person_ref);
    if (!refs.length) return c.json({ invoices: [], total: 0 });
    where.push(`customer_ref IN (${refs.map(() => "?").join(",")})`, "status != 'draft'"); args.push(...refs);
  } else if (role(c) === "accountant") where.push("status != 'draft'");
  if (q.status) {
    const sts = q.status.split(",").filter((s) => /^[a-z_]+$/.test(s)).slice(0, 8);
    if (sts.length) { where.push(`status IN (${sts.map(() => "?").join(",")})`); args.push(...sts); }
  }
  if (q.kind && ["invoice", "deposit", "credit_note"].includes(q.kind)) { where.push("kind = ?"); args.push(q.kind); }
  if (q.member) { where.push("customer_ref = ?"); args.push(q.member); }
  if (q.from && /^\d{4}-\d{2}-\d{2}$/.test(q.from)) { where.push("COALESCE(issue_date, substr(created_at,1,10)) >= ?"); args.push(q.from); }
  if (q.to && /^\d{4}-\d{2}-\d{2}$/.test(q.to)) { where.push("COALESCE(issue_date, substr(created_at,1,10)) <= ?"); args.push(q.to); }
  if (q.q) { where.push("(number LIKE ? OR customer_name LIKE ? OR label LIKE ?)"); const like = "%" + q.q.slice(0, 50).replace(/[%_]/g, "") + "%"; args.push(like, like, like); }
  const limit = Math.min(500, Math.max(1, Number(q.limit) || 100)); const offset = Math.max(0, Number(q.offset) || 0);
  const w = where.join(" AND ");
  const rows = await all<InvoiceRow>(db, `SELECT * FROM invoices WHERE ${w} ORDER BY COALESCE(issue_date, '9999') DESC, COALESCE(seq, 0) DESC, created_at DESC LIMIT ? OFFSET ?`, ...args, limit, offset);
  const total = await one<{ n: number }>(db, `SELECT COUNT(*) AS n FROM invoices WHERE ${w}`, ...args);
  return c.json({ invoices: rows.map((r) => view(r)), total: total?.n || 0 });
});

app.get("/api/invoices/summary", BOOKS, async (c) => {
  const db = c.env.DB; const cid = clubId(c); const today = parisToday();
  const open = await one<any>(db, `SELECT COUNT(*) AS n, COALESCE(SUM(total_ttc - prepaid_amount - credited_amount - paid_amount), 0) AS due,
    COALESCE(SUM(CASE WHEN status = 'overdue' THEN total_ttc - prepaid_amount - credited_amount - paid_amount ELSE 0 END), 0) AS overdue,
    SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS n_overdue
    FROM invoices WHERE club_id = ? AND kind != 'credit_note' AND status IN ('issued','sent','partially_paid','overdue')`, cid);
  const month = await one<any>(db, `SELECT COALESCE(SUM(CASE WHEN kind = 'credit_note' THEN -total_ht ELSE total_ht END), 0) AS ht, COALESCE(SUM(CASE WHEN kind = 'credit_note' THEN -total_ttc ELSE total_ttc END), 0) AS ttc
    FROM invoices WHERE club_id = ? AND number IS NOT NULL AND issue_date >= ?`, cid, today.slice(0, 7) + "-01");
  const cashed = await one<any>(db, "SELECT COALESCE(SUM(amount), 0) AS s FROM invoice_payments WHERE club_id = ? AND paid_at >= ?", cid, today.slice(0, 7) + "-01");
  const drafts = await one<any>(db, "SELECT COUNT(*) AS n FROM invoices WHERE club_id = ? AND status = 'draft'", cid);
  const einv = await one<any>(db, "SELECT SUM(CASE WHEN einvoice_status IN ('pending','error') THEN 1 ELSE 0 END) AS pending, SUM(CASE WHEN einvoice_status = 'rejected' THEN 1 ELSE 0 END) AS rejected FROM invoices WHERE club_id = ? AND einvoice_channel = 'b2b'", cid);
  return c.json({ open_count: open?.n || 0, amount_due: open?.due || 0, overdue_amount: open?.overdue || 0, overdue_count: open?.n_overdue || 0,
    month_sales_ht: month?.ht || 0, month_sales_ttc: month?.ttc || 0, month_cashed: cashed?.s || 0, drafts: drafts?.n || 0,
    einvoice_pending: einv?.pending || 0, einvoice_rejected: einv?.rejected || 0 });
});

app.post("/api/invoices", MANAGERS, async (c) => {
  const b = await body(c);
  let inv = await createDraft(c.env, clubId(c), userId(c), b);
  await audit(c.env.DB, { club_id: clubId(c), user_id: userId(c), action: "invoice.draft", target: inv.id });
  if (b.issue === true) inv = await issueInvoice(c.env, clubId(c), inv.id, userId(c), { send: b.send as boolean | undefined });
  return c.json({ invoice: view(inv, { lines: await getLines(c.env.DB, inv.id) }) }, 201);
});

app.get("/api/invoices/:id", READERS, async (c) => {
  const inv = await readable(c, c.req.param("id"));
  const db = c.env.DB;
  const credits = await all<InvoiceRow>(db, "SELECT * FROM invoices WHERE club_id = ? AND original_id = ? AND number IS NOT NULL ORDER BY issue_date", inv.club_id, inv.id);
  const events = role(c) === "member" ? [] : await all(db, "SELECT code, label, reason, at FROM einvoice_events WHERE club_id = ? AND invoice_id = ? ORDER BY at", inv.club_id, inv.id);
  const reminders = role(c) === "member" ? [] : await all(db, "SELECT level, to_email, manual, sent_at FROM invoice_reminders WHERE club_id = ? AND invoice_id = ? ORDER BY sent_at", inv.club_id, inv.id);
  return c.json({ invoice: view(inv, {
    lines: (await getLines(db, inv.id)).map(({ club_id, invoice_id, ...l }) => l), payments: await getPayments(db, inv.club_id, inv.id),
    credit_notes: credits.map((x) => ({ id: x.id, number: x.number, total_ttc: x.total_ttc, issue_date: x.issue_date })), einvoice_events: events, reminders,
  }) });
});

app.patch("/api/invoices/:id", MANAGERS, async (c) => {
  const inv = await updateDraft(c.env, clubId(c), c.req.param("id"), await body(c));
  return c.json({ invoice: view(inv, { lines: await getLines(c.env.DB, inv.id) }) });
});

app.delete("/api/invoices/:id", MANAGERS, async (c) => {
  await deleteDraft(c.env.DB, clubId(c), c.req.param("id"));
  return c.json({ ok: true });
});

app.post("/api/invoices/:id/issue", MANAGERS, async (c) => {
  const b = await c.req.json().catch(() => ({})) as any;
  const inv = await issueInvoice(c.env, clubId(c), c.req.param("id"), userId(c), { send: typeof b?.send === "boolean" ? b.send : undefined });
  return c.json({ invoice: view(inv) });
});

app.post("/api/invoices/:id/send", MANAGERS, async (c) => {
  const inv = await getInvoice(c.env.DB, clubId(c), c.req.param("id"));
  if (!inv) throw notFound("Facture introuvable.");
  if (!inv.number) throw new ApiError(409, "not_issued", "Émettez la facture avant de l'envoyer.");
  return c.json({ invoice: view(await sendInvoice(c.env, inv)) });
});

app.post("/api/invoices/:id/credit-note", MANAGERS, async (c) => {
  const cn = await createCreditNote(c.env, clubId(c), c.req.param("id"), userId(c), await body(c));
  const original = await getInvoice(c.env.DB, clubId(c), c.req.param("id"));
  return c.json({ credit_note: view(cn), invoice: original ? view(original) : null }, 201);
});

app.post("/api/invoices/:id/payments", MANAGERS, async (c) => {
  const b = await body(c);
  const method = normMethod(b.method);
  if (!b.method || !(String(b.method) in PAY_METHODS)) throw bad("invalid_field", "Le moyen de paiement doit être : " + Object.keys(PAY_METHODS).join(", ") + ".", { field: "method" });
  const r = await addPayment(c.env, clubId(c), c.req.param("id"), {
    amount: Number(b.amount), method, paid_at: (b.paid_at as string) || null, reference: b.reference ? String(b.reference).slice(0, 80) : null,
    note: b.note ? String(b.note).slice(0, 300) : null, user_id: userId(c),
  });
  const inv = r.invoice;
  if (b.receipt !== false && inv.customer_email && Number(b.amount) > 0) {
    await sendMail(c.env, { to: inv.customer_email, template: "payment_receipt", club_id: inv.club_id, data: {
      amount_cents: Number(b.amount), paid_at: (b.paid_at as string) || parisToday(), method: PAY_METHODS[method].label, number: inv.number,
      balance_cents: Math.max(0, balance(inv)), invoice_url: `${c.env.APP_URL}/factures/${inv.id}`,
    } });
  }
  return c.json({ invoice: view(inv, { payments: await getPayments(c.env.DB, inv.club_id, inv.id) }), payment_id: r.payment_id }, 201);
});

app.delete("/api/invoices/:id/payments/:pid", MANAGERS, async (c) => {
  const db = c.env.DB; const cid = clubId(c);
  const p = await one<any>(db, "SELECT * FROM invoice_payments WHERE id = ? AND club_id = ? AND invoice_id = ?", c.req.param("pid"), cid, c.req.param("id"));
  if (!p) throw notFound("Paiement introuvable.");
  if (p.stripe_ref) throw new ApiError(409, "online_payment", "Un paiement en ligne ne peut pas être supprimé : remboursez-le depuis Stripe.");
  if (p.pa_reported_at) throw new ApiError(409, "reported", "Ce paiement a déjà été déclaré à la plateforme de facturation électronique.");
  await run(db, "DELETE FROM invoice_payments WHERE id = ? AND club_id = ?", p.id, cid);
  await audit(db, { club_id: cid, user_id: userId(c), action: "invoice.payment.delete", target: p.invoice_id, data: { amount: p.amount, method: p.method } });
  return c.json({ invoice: view(await recompute(c.env, cid, p.invoice_id)) });
});

app.post("/api/invoices/:id/remind", MANAGERS, async (c) => {
  const inv = await getInvoice(c.env.DB, clubId(c), c.req.param("id"));
  if (!inv) throw notFound("Facture introuvable.");
  if (!inv.number || inv.kind === "credit_note" || balance(inv) <= 0) throw bad("not_due", "Cette facture n'a rien à relancer.");
  if (!inv.customer_email) throw bad("missing_email", "Ce client n'a pas d'adresse e-mail.");
  await remind(c.env, inv, true);
  return c.json({ invoice: view((await getInvoice(c.env.DB, clubId(c), inv.id))!) });
});

app.get("/api/invoices/:id/pdf", READERS, async (c) => {
  const inv = await readable(c, c.req.param("id"));
  if (!inv.number) throw new ApiError(409, "not_issued", "Le PDF est disponible une fois la facture émise.");
  const { pdf } = await ensureDocuments(c.env, inv);
  return file(c, pdf, "application/pdf", `${inv.number}.pdf`, c.req.query("download") !== "1");
});
app.get("/api/invoices/:id/facturx.xml", READERS, async (c) => {
  const inv = await readable(c, c.req.param("id"));
  if (!inv.number) throw new ApiError(409, "not_issued", "Le XML est disponible une fois la facture émise.");
  const { xml } = await ensureDocuments(c.env, inv);
  return file(c, xml, "application/xml; charset=utf-8", `${inv.number}-factur-x.xml`);
});

/* ================= Réglages et référentiels ================= */

app.get("/api/invoicing/catalog", requireUser, (c) => c.json({
  categories: Object.entries(CATEGORIES).map(([k, v]) => ({ key: k, label: v.label, vat_rate_bp: v.rate_bp, account: v.account, kind: v.kind, exempt: v.exempt || null })),
  methods: Object.entries(PAY_METHODS).map(([k, v]) => ({ key: k, label: v.label })),
  statuses: STATUS_FR, accounts: ACCOUNTS, lifecycle: LIFECYCLE,
}));
app.get("/api/invoicing/settings", BOOKS, async (c) => {
  const club = await one<any>(c.env.DB, "SELECT vat_regime, siren, siret, vat_number, legal_form FROM clubs WHERE id = ?", clubId(c));
  return c.json({ settings: await getSettings(c.env.DB, clubId(c)), club, ready: !!(club?.siren || club?.siret) });
});
app.put("/api/invoicing/settings", MANAGERS, async (c) => {
  const cur = await getSettings(c.env.DB, clubId(c));
  let next;
  try { next = mergeSettings(cur, await body(c)); } catch (e) { if (e instanceof ApiError) throw e; throw bad("invalid_settings", (e as Error).message); }
  await saveSettings(c.env.DB, clubId(c), next);
  await audit(c.env.DB, { club_id: clubId(c), user_id: userId(c), action: "invoicing.settings" });
  return c.json({ settings: next });
});

/* ================= Facture électronique ================= */

app.get("/api/einvoicing", BOOKS, async (c) => {
  const db = c.env.DB; const cid = clubId(c);
  const acc = await one<any>(db, "SELECT provider, status, external_id, error, connected_at, last_sync_at FROM einvoice_accounts WHERE club_id = ?", cid);
  const counts = await all<any>(db, "SELECT einvoice_channel AS channel, einvoice_status AS status, COUNT(*) AS n FROM invoices WHERE club_id = ? AND number IS NOT NULL GROUP BY 1, 2", cid);
  const reports = await all<any>(db, "SELECT kind, period_start, period_end, status, provider_ref, error, submitted_at FROM einvoice_reports WHERE club_id = ? ORDER BY period_start DESC LIMIT 24", cid);
  return c.json({ provider: provider(c.env).name, sandbox: provider(c.env).name === "sandbox", account: acc, counts, reports });
});

app.post("/api/einvoicing/connect", requireRole("owner"), async (c) => {
  try {
    const r = await connectClub(c.env, clubId(c), `${c.env.APP_URL}/api/einvoicing/callback`);
    await audit(c.env.DB, { club_id: clubId(c), user_id: userId(c), action: "einvoice.connect", data: { provider: r.provider, status: r.status } });
    return c.json({ provider: r.provider, status: r.status, authorize_url: r.authorize_url });
  } catch (e) {
    if (e instanceof PaError) throw new ApiError(e.code === "auth" ? 503 : 422, "einvoice_" + e.code, e.message);
    throw e;
  }
});

app.get("/api/einvoicing/callback", async (c) => {
  const code = c.req.query("code"); const state = c.req.query("state");
  const ip = c.req.header("cf-connecting-ip") || "local";
  if (!(await rateLimit(c.env.DB, "einv-cb:" + ip, 20, 900))) throw new ApiError(429, "rate_limited", "Trop de tentatives. Réessayez dans quelques minutes.");
  if (!code || !state || state.length > 200) return c.redirect(`${c.env.APP_URL}/reglages/facture-electronique?erreur=autorisation`, 302);
  try {
    await completeConnect(c.env, state, code, `${c.env.APP_URL}/api/einvoicing/callback`);
    return c.redirect(`${c.env.APP_URL}/reglages/facture-electronique?ok=1`, 302);
  } catch { return c.redirect(`${c.env.APP_URL}/reglages/facture-electronique?erreur=autorisation`, 302); }
});

app.delete("/api/einvoicing/connect", requireRole("owner"), async (c) => {
  await run(c.env.DB, "UPDATE einvoice_accounts SET status = 'disconnected', credentials = NULL WHERE club_id = ?", clubId(c));
  await audit(c.env.DB, { club_id: clubId(c), user_id: userId(c), action: "einvoice.disconnect" });
  return c.json({ ok: true });
});

/** Synchronisation immédiate (sinon toutes les 10 minutes) : envoi, statuts, factures reçues. */
app.post("/api/einvoicing/sync", MANAGERS, async (c) => {
  const ok = await one(c.env.DB, "SELECT 1 FROM einvoice_accounts WHERE club_id = ? AND status = 'connected'", clubId(c));
  if (!ok) throw new ApiError(409, "not_connected", "Raccordez d'abord votre structure à la plateforme de facturation électronique.");
  await einvoiceTick(c.env);
  await pullIncoming(c.env);
  return c.json({ ok: true });
});

/** Mode test uniquement : simule la réception d'une facture fournisseur. */
app.post("/api/einvoicing/sandbox/incoming", MANAGERS, async (c) => {
  if (provider(c.env).name !== "sandbox") throw forbidden("Disponible uniquement en mode test.");
  const b = await c.req.json().catch(() => ({})) as any;
  const xml = typeof b?.xml === "string" && b.xml.length < 500_000 ? b.xml : sampleSupplierXml();
  const ref = await sandbox.inject(c.env, clubId(c), xml);
  return c.json({ ref }, 201);
});

/* ================= Comptabilité ================= */

app.get("/api/accounting/exports/fec", BOOKS, async (c) => {
  const q = c.req.query();
  const year = /^\d{4}$/.test(q.year || "") ? q.year : parisToday().slice(0, 4);
  const end = /^\d{4}-\d{2}-\d{2}$/.test(q.end || "") ? q.end : `${year}-12-31`;
  const startD = new Date(end + "T00:00:00Z"); startD.setUTCFullYear(startD.getUTCFullYear() - 1); startD.setUTCDate(startD.getUTCDate() + 1);
  const start = /^\d{4}-\d{2}-\d{2}$/.test(q.start || "") ? q.start : startD.toISOString().slice(0, 10);
  const entries = await buildEntries(c.env, clubId(c), start, end);
  const txt = fecText(entries, q.sep === "pipe" ? "|" : "\t");
  await audit(c.env.DB, { club_id: clubId(c), user_id: userId(c), action: "accounting.export.fec", data: { start, end } });
  const name = await fecFilename(c.env, clubId(c), end);
  return q.encoding === "utf8" ? file(c, txt, "text/plain; charset=utf-8", name) : file(c, latin9(txt), "text/plain; charset=iso-8859-15", name);
});
app.get("/api/accounting/exports/entries.csv", BOOKS, async (c) => {
  const { from, to } = range(c);
  return file(c, entriesCsv(await buildEntries(c.env, clubId(c), from, to)), "text/csv; charset=utf-8", `ecritures-${from}-${to}.csv`);
});
app.get("/api/accounting/exports/sales.csv", BOOKS, async (c) => {
  const { from, to } = range(c);
  return file(c, await salesCsv(c.env, clubId(c), from, to), "text/csv; charset=utf-8", `journal-des-ventes-${from}-${to}.csv`);
});
app.get("/api/accounting/exports/payments.csv", BOOKS, async (c) => {
  const { from, to } = range(c);
  return file(c, await paymentsCsv(c.env, clubId(c), from, to), "text/csv; charset=utf-8", `encaissements-${from}-${to}.csv`);
});
app.get("/api/accounting/exports/pdfs.zip", BOOKS, async (c) => {
  const m = c.req.query("month") || parisToday().slice(0, 7);
  const r = monthRange(m)!;
  const rows = await all<InvoiceRow>(c.env.DB, "SELECT * FROM invoices WHERE club_id = ? AND number IS NOT NULL AND issue_date BETWEEN ? AND ? ORDER BY series, seq LIMIT 400", clubId(c), r.from, r.to);
  const entries = [];
  for (const inv of rows) {
    const { pdf } = await ensureDocuments(c.env, inv);
    entries.push({ name: `${inv.number}.pdf`, data: pdf, date: new Date(inv.issued_at || inv.created_at) });
  }
  const inc = await all<any>(c.env.DB, "SELECT * FROM incoming_invoices WHERE club_id = ? AND issue_date BETWEEN ? AND ? LIMIT 400", clubId(c), r.from, r.to);
  for (const f of inc) {
    const key = f.pdf_key || f.xml_key; if (!key) continue;
    const o = await c.env.FILES.get(key); if (!o) continue;
    entries.push({ name: `achats/${(f.supplier_name || "fournisseur").replace(/[^A-Za-z0-9-]+/g, "-").slice(0, 40)}-${String(f.number || f.id).replace(/[^A-Za-z0-9-]/g, "_")}.${f.pdf_key ? "pdf" : "xml"}`, data: new Uint8Array(await o.arrayBuffer()) });
  }
  await audit(c.env.DB, { club_id: clubId(c), user_id: userId(c), action: "accounting.export.zip", data: { month: m, count: entries.length } });
  return file(c, zip(entries), "application/zip", `factures-${m}.zip`);
});

/** Ventilation de la TVA collectée et déductible sur une période (aide à la déclaration CA3 ou CA12). */
app.get("/api/accounting/vat", BOOKS, async (c) => {
  const { from, to } = range(c);
  const entries = await buildEntries(c.env, clubId(c), from, to);
  const by: Record<string, { account: string; label: string; debit: number; credit: number }> = {};
  for (const e of entries) if (e.account.startsWith("4457") || e.account === "445660") {
    const x = by[e.account] ||= { account: e.account, label: e.account_label, debit: 0, credit: 0 };
    x.debit += e.debit; x.credit += e.credit;
  }
  return c.json({ from, to, accounts: Object.values(by), note: "Montants par date de facture. Pour les prestations de services sans option sur les débits, la TVA est exigible à l'encaissement : utilisez le journal des encaissements." });
});

app.get("/api/accounting/purchases", BOOKS, async (c) => {
  const { from, to } = range(c);
  const rows = await all<any>(c.env.DB, "SELECT id, source, supplier_name, supplier_siren, supplier_vat, number, type_code, issue_date, due_date, total_ht, total_vat, total_ttc, currency, vat_breakdown, account, status, received_at, (pdf_key IS NOT NULL) AS has_pdf FROM incoming_invoices WHERE club_id = ? AND COALESCE(issue_date, substr(received_at,1,10)) BETWEEN ? AND ? ORDER BY COALESCE(issue_date, received_at) DESC LIMIT 500", clubId(c), from, to);
  return c.json({ purchases: rows.map((r) => ({ ...r, has_pdf: !!r.has_pdf, vat_breakdown: json(r.vat_breakdown, []) })) });
});
app.get("/api/accounting/purchases/:id/:fmt{pdf|xml}", BOOKS, async (c) => {
  const f = await one<any>(c.env.DB, "SELECT * FROM incoming_invoices WHERE id = ? AND club_id = ?", c.req.param("id"), clubId(c));
  if (!f) throw notFound("Facture fournisseur introuvable.");
  const key = c.req.param("fmt") === "pdf" ? f.pdf_key : f.xml_key;
  const o = key ? await c.env.FILES.get(key) : null;
  if (!o) throw notFound(c.req.param("fmt") === "pdf" ? "Cette facture a été reçue sans PDF : téléchargez le XML." : "Fichier introuvable.");
  return file(c, new Uint8Array(await o.arrayBuffer()), c.req.param("fmt") === "pdf" ? "application/pdf" : "application/xml; charset=utf-8", `${(f.number || f.id).replace(/[^A-Za-z0-9-]/g, "_")}.${c.req.param("fmt")}`);
});
app.patch("/api/accounting/purchases/:id", MANAGERS, async (c) => {
  const b = await body(c); const db = c.env.DB;
  const f = await one<any>(db, "SELECT id FROM incoming_invoices WHERE id = ? AND club_id = ?", c.req.param("id"), clubId(c));
  if (!f) throw notFound("Facture fournisseur introuvable.");
  if (b.status != null && !["received", "approved", "disputed", "refused", "paid"].includes(String(b.status))) throw bad("invalid_field", "Statut inconnu.", { field: "status" });
  if (b.account != null && !/^[0-9]{3,10}$/.test(String(b.account))) throw bad("invalid_field", "Le compte doit contenir de 3 à 10 chiffres.", { field: "account" });
  await run(db, "UPDATE incoming_invoices SET status = COALESCE(?, status), account = COALESCE(?, account), updated_at = ? WHERE id = ? AND club_id = ?", b.status ?? null, b.account ?? null, nowIso(), f.id, clubId(c));
  return c.json({ purchase: await one(db, "SELECT * FROM incoming_invoices WHERE id = ?", f.id) });
});

/* ================= Factures Piaffe (abonnement du club) ================= */

app.get("/api/invoicing/piaffe-invoices", BOOKS, async (c) => {
  const rows = await all<InvoiceRow>(c.env.DB, "SELECT * FROM invoices WHERE club_id = ? AND buyer_club_id = ? AND number IS NOT NULL ORDER BY issue_date DESC, seq DESC LIMIT 200", PLATFORM_CLUB, clubId(c));
  return c.json({ invoices: rows.map((r) => ({ id: r.id, number: r.number, issue_date: r.issue_date, label: r.label, total_ht: r.total_ht, total_vat: r.total_vat, total_ttc: r.total_ttc, status: r.status, period_start: r.period_start, period_end: r.period_end })) });
});
app.get("/api/invoicing/piaffe-invoices/:id/pdf", BOOKS, async (c) => {
  const inv = await one<InvoiceRow>(c.env.DB, "SELECT * FROM invoices WHERE id = ? AND club_id = ? AND buyer_club_id = ?", c.req.param("id"), PLATFORM_CLUB, clubId(c));
  if (!inv?.number) throw notFound("Facture introuvable.");
  const { pdf } = await ensureDocuments(c.env, inv);
  return file(c, pdf, "application/pdf", `${inv.number}.pdf`, true);
});

/* ================= Relances et tâches planifiées ================= */

export async function remind(env: Env, inv: InvoiceRow, manual: boolean) {
  const level = Math.min(3, inv.reminders_count + 1);
  const first = inv.customer_ref ? json<any>((await one<{ data: string }>(env.DB, "SELECT data FROM records WHERE club_id = ? AND coll = 'members' AND id = ?", inv.club_id, inv.customer_ref))?.data, {})?.first : null;
  await sendMail(env, { to: inv.customer_email!, template: "payment_reminder", club_id: inv.club_id, data: {
    level, first: first || undefined, number: inv.number, amount_cents: Math.max(0, balance(inv)), due_date: inv.due_date,
    days_late: inv.due_date ? Math.max(0, daysBetween(inv.due_date, parisToday())) : 0, pay_url: `${env.APP_URL}/payer/${inv.id}`,
  } });
  const now = nowIso();
  await run(env.DB, "INSERT INTO invoice_reminders (id, club_id, invoice_id, level, to_email, manual, sent_at) VALUES (?,?,?,?,?,?,?)", "rem_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16), inv.club_id, inv.id, level, inv.customer_email, manual ? 1 : 0, now);
  await run(env.DB, "UPDATE invoices SET reminders_count = reminders_count + 1, last_reminder_at = ? WHERE id = ? AND club_id = ?", now, inv.id, inv.club_id);
}

/** Passe en retard les factures échues, puis envoie les relances automatiques selon les réglages de chaque club. */
export async function dailyInvoices(env: Env, today = parisToday()) {
  const late = await all<InvoiceRow>(env.DB, "SELECT * FROM invoices WHERE status IN ('issued','sent','partially_paid') AND kind != 'credit_note' AND due_date < ? LIMIT 2000", today);
  for (const i of late) await recompute(env, i.club_id, i.id, today);
  const overdue = await all<InvoiceRow>(env.DB, "SELECT * FROM invoices WHERE status = 'overdue' AND club_id != ? AND customer_email IS NOT NULL AND reminders_count < 3 ORDER BY due_date LIMIT 300", PLATFORM_CLUB, );
  const settings = new Map<string, Awaited<ReturnType<typeof getSettings>>>();
  let sent = 0;
  for (const i of overdue) {
    let st = settings.get(i.club_id); if (!st) { st = await getSettings(env.DB, i.club_id); settings.set(i.club_id, st); }
    if (!st.reminders.enabled || !i.due_date) continue;
    const threshold = st.reminders.days[i.reminders_count];
    if (threshold == null || daysBetween(i.due_date, today) < threshold) continue;
    if (i.last_reminder_at && i.last_reminder_at.slice(0, 10) === today) continue;
    await remind(env, i, false); sent++;
  }
  return { overdue: late.length, reminders: sent };
}

function sampleSupplierXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?><rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"><rsm:ExchangedDocumentContext><ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:cen.eu:en16931:2017</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter></rsm:ExchangedDocumentContext><rsm:ExchangedDocument><ram:ID>FO-${Date.now().toString().slice(-6)}</ram:ID><ram:TypeCode>380</ram:TypeCode><ram:IssueDateTime><udt:DateTimeString format="102">${parisToday().replace(/-/g, "")}</udt:DateTimeString></ram:IssueDateTime></rsm:ExchangedDocument><rsm:SupplyChainTradeTransaction><ram:ApplicableHeaderTradeAgreement><ram:SellerTradeParty><ram:Name>Fourrages du Val (exemple)</ram:Name><ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">552100554</ram:ID></ram:SpecifiedLegalOrganization><ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">FR40552100554</ram:ID></ram:SpecifiedTaxRegistration></ram:SellerTradeParty></ram:ApplicableHeaderTradeAgreement><ram:ApplicableHeaderTradeSettlement><ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode><ram:ApplicableTradeTax><ram:CalculatedAmount>64.00</ram:CalculatedAmount><ram:TypeCode>VAT</ram:TypeCode><ram:BasisAmount>320.00</ram:BasisAmount><ram:CategoryCode>S</ram:CategoryCode><ram:RateApplicablePercent>20.00</ram:RateApplicablePercent></ram:ApplicableTradeTax><ram:SpecifiedTradeSettlementHeaderMonetarySummation><ram:TaxBasisTotalAmount>320.00</ram:TaxBasisTotalAmount><ram:TaxTotalAmount currencyID="EUR">64.00</ram:TaxTotalAmount><ram:GrandTotalAmount>384.00</ram:GrandTotalAmount><ram:DuePayableAmount>384.00</ram:DuePayableAmount></ram:SpecifiedTradeSettlementHeaderMonetarySummation></ram:ApplicableHeaderTradeSettlement></rsm:SupplyChainTradeTransaction></rsm:CrossIndustryInvoice>`;
}

export async function cronImpl(env: Env, expr: string) {
  if (expr === "0 6 * * *") {
    await dailyInvoices(env);
    await runEreporting(env);
    await pullIncoming(env);
  } else {
    await submitPending(env);
    await pullStatuses(env);
    await pushPaymentStatuses(env);
  }
}


export default app;
