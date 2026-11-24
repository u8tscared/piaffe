import type { Env } from "../env";
import { all, json, one, run } from "../lib/db";
import { newId, nowIso } from "../lib/ids";
import { b64url, b64urlDecode, sha256 } from "../lib/crypto";
import { provider } from "./pa";
import { PaError, type EreportingPayload, type PaAccount, type PaProvider } from "./pa/types";
import { LIFECYCLE } from "./catalog";
import { ensureDocuments, getInvoice, parisToday, addDays, snapshotOf, PLATFORM_CLUB, type InvoiceRow } from "./invoices";
import { parseIncomingXml } from "./cii";
import { extractFacturX } from "./pdf";
import { getSettings, clubSeller, platformSeller } from "./settings";

/* ---------- Chiffrement des jetons de la plateforme (AES-GCM, clé dérivée de SESSION_SECRET) ---------- */
async function key(env: Env) {
  const raw = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("piaffe-einvoice|" + env.SESSION_SECRET)));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function seal(env: Env, v: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(env), new TextEncoder().encode(JSON.stringify(v))));
  return "v1." + b64url(iv) + "." + b64url(ct);
}
export async function unseal(env: Env, s: string | null): Promise<Record<string, any>> {
  if (!s) return {};
  const [, iv, ct] = s.split(".");
  try {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64urlDecode(iv) }, await key(env), b64urlDecode(ct));
    return JSON.parse(new TextDecoder().decode(pt));
  } catch { return {}; }
}

export interface AccountRow { club_id: string; provider: string; status: string; external_id: string | null; credentials: string | null; cursor_in: string | null; cursor_events: string | null; error: string | null; connected_at: string | null; last_sync_at: string | null }

export async function accountFor(env: Env, clubId: string): Promise<{ row: AccountRow; acc: PaAccount } | null> {
  const row = await one<AccountRow>(env.DB, "SELECT * FROM einvoice_accounts WHERE club_id = ?", clubId);
  if (!row || row.status !== "connected") return null;
  return { row, acc: { club_id: clubId, external_id: row.external_id, credentials: await unseal(env, row.credentials) } };
}
async function persistRefreshed(env: Env, p: PaProvider) {
  if (!p.refreshed?.size) return;
  for (const [club, cred] of p.refreshed) await run(env.DB, "UPDATE einvoice_accounts SET credentials = ? WHERE club_id = ?", await seal(env, cred), club);
  p.refreshed.clear();
}
async function accountError(env: Env, clubId: string, e: unknown) {
  if (e instanceof PaError && e.code === "auth") await run(env.DB, "UPDATE einvoice_accounts SET status = 'error', error = ? WHERE club_id = ?", e.message, clubId);
}

/* ---------- Raccordement ---------- */
export async function connectClub(env: Env, clubId: string, redirectUri: string) {
  const p = provider(env);
  const club = clubId === PLATFORM_CLUB ? { id: PLATFORM_CLUB, siren: platformSeller(env).siren, name: platformSeller(env).name }
    : await one<{ id: string; siren: string | null; name: string; siret: string | null }>(env.DB, "SELECT id, siren, siret, name FROM clubs WHERE id = ?", clubId);
  if (!club) throw new PaError("rejected", "Club introuvable.");
  const siren = club.siren || ((club as any).siret ? String((club as any).siret).slice(0, 9) : null);
  const r = await p.connect(env, { id: club.id, siren, name: club.name }, redirectUri);
  const now = nowIso();
  await run(env.DB, `INSERT INTO einvoice_accounts (club_id, provider, status, external_id, credentials, connected_at, error) VALUES (?,?,?,?,?,?,NULL)
    ON CONFLICT(club_id) DO UPDATE SET provider = excluded.provider, status = excluded.status, external_id = excluded.external_id, credentials = excluded.credentials,
    connected_at = excluded.connected_at, error = NULL, cursor_in = CASE WHEN einvoice_accounts.provider = excluded.provider THEN einvoice_accounts.cursor_in END,
    cursor_events = CASE WHEN einvoice_accounts.provider = excluded.provider THEN einvoice_accounts.cursor_events END`,
    clubId, p.name, r.status, r.external_id || null, await seal(env, r.credentials || {}), r.status === "connected" ? now : null);
  return { provider: p.name, status: r.status, authorize_url: r.authorize_url || null, state: r.credentials?.state || null };
}

export async function completeConnect(env: Env, state: string, code: string, redirectUri: string): Promise<string> {
  const p = provider(env);
  if (!p.completeConnect) throw new PaError("not_supported", "Cette plateforme ne passe pas par une autorisation.");
  const rows = await all<AccountRow>(env.DB, "SELECT * FROM einvoice_accounts WHERE status = 'pending' AND provider = ?", p.name);
  for (const row of rows) {
    const cred = await unseal(env, row.credentials);
    if (cred.state && cred.state.length === state.length && (await sha256(cred.state)) === (await sha256(state))) {
      const r = await p.completeConnect(env, code, redirectUri);
      await run(env.DB, "UPDATE einvoice_accounts SET status = 'connected', external_id = ?, credentials = ?, connected_at = ?, error = NULL WHERE club_id = ?",
        r.external_id, await seal(env, r.credentials), nowIso(), row.club_id);
      return row.club_id;
    }
  }
  throw new PaError("auth", "Lien d'autorisation expiré ou invalide : recommencez le raccordement.");
}

/* ---------- Envoi des factures B2B ---------- */
export async function submitPending(env: Env, limit = 25): Promise<number> {
  const rows = await all<InvoiceRow>(env.DB, `SELECT i.* FROM invoices i JOIN einvoice_accounts a ON a.club_id = i.club_id AND a.status = 'connected'
    WHERE i.einvoice_channel = 'b2b' AND i.einvoice_status IN ('pending','error') AND i.einvoice_attempts < 8 AND i.number IS NOT NULL
    ORDER BY i.issued_at LIMIT ?`, limit);
  const p = provider(env); let n = 0;
  for (const inv of rows) {
    const a = await accountFor(env, inv.club_id); if (!a) continue;
    try {
      const { pdf, xml } = await ensureDocuments(env, inv);
      const r = await p.submitInvoice(env, a.acc, { number: inv.number!, xml, pdf, external_id: inv.id });
      const st = r.code === "213" || r.code === "210" ? "rejected" : "submitted";
      await run(env.DB, "UPDATE invoices SET einvoice_status = ?, einvoice_ref = ?, einvoice_error = NULL, einvoice_attempts = einvoice_attempts + 1 WHERE id = ? AND club_id = ?", st, r.ref, inv.id, inv.club_id);
      n++; // l'événement « Déposée » arrive par le flux des statuts (pullStatuses)
    } catch (e) {
      const rejected = e instanceof PaError && e.code === "rejected";
      await run(env.DB, "UPDATE invoices SET einvoice_status = ?, einvoice_error = ?, einvoice_attempts = einvoice_attempts + 1 WHERE id = ? AND club_id = ?",
        rejected ? "rejected" : "error", String((e as Error).message || e).slice(0, 500), inv.id, inv.club_id);
      await accountError(env, inv.club_id, e);
    }
  }
  await persistRefreshed(env, p);
  return n;
}

async function addEvent(env: Env, clubId: string, e: { invoice_id?: string | null; incoming_id?: string | null; code: string; reason?: string | null; provider_event_id: string | null; at?: string }) {
  await run(env.DB, "INSERT OR IGNORE INTO einvoice_events (id, club_id, invoice_id, incoming_id, code, label, reason, provider_event_id, at) VALUES (?,?,?,?,?,?,?,?,?)",
    newId("eev"), clubId, e.invoice_id ?? null, e.incoming_id ?? null, e.code, LIFECYCLE[e.code] || e.code, e.reason ?? null, e.provider_event_id, e.at || nowIso());
}

/* ---------- Statuts du cycle de vie ---------- */
export async function pullStatuses(env: Env, limit = 20): Promise<number> {
  const accounts = await all<AccountRow>(env.DB, "SELECT * FROM einvoice_accounts WHERE status = 'connected' ORDER BY COALESCE(last_sync_at, '') LIMIT ?", limit);
  const p = provider(env); let n = 0;
  for (const row of accounts) {
    const acc: PaAccount = { club_id: row.club_id, external_id: row.external_id, credentials: await unseal(env, row.credentials) };
    try {
      const { events, cursor } = await p.getStatus(env, acc, row.cursor_events);
      for (const ev of events) {
        const inv = await one<{ id: string }>(env.DB, "SELECT id FROM invoices WHERE club_id = ? AND einvoice_ref = ?", row.club_id, ev.invoice_ref);
        const inc = inv ? null : await one<{ id: string }>(env.DB, "SELECT id FROM incoming_invoices WHERE club_id = ? AND provider_ref = ?", row.club_id, ev.invoice_ref);
        await addEvent(env, row.club_id, { invoice_id: inv?.id, incoming_id: inc?.id, code: ev.code, reason: ev.reason, provider_event_id: ev.provider_event_id, at: ev.at });
        if (inv) {
          const st = ev.code === "213" || ev.code === "210" ? "rejected" : ev.code;
          await run(env.DB, "UPDATE invoices SET einvoice_status = ?, einvoice_error = ? WHERE id = ? AND club_id = ?", st, ev.code === "213" || ev.code === "210" || ev.code === "207" ? ev.reason || LIFECYCLE[ev.code] : null, inv.id, row.club_id);
          n++;
        }
      }
      await run(env.DB, "UPDATE einvoice_accounts SET cursor_events = ?, last_sync_at = ? WHERE club_id = ?", cursor, nowIso(), row.club_id);
    } catch (e) { await accountError(env, row.club_id, e); await run(env.DB, "UPDATE einvoice_accounts SET last_sync_at = ? WHERE club_id = ?", nowIso(), row.club_id); }
  }
  await persistRefreshed(env, p);
  return n;
}

/** Statut 212 « Encaissée » pour les prestations de services B2B (TVA exigible à l'encaissement). */
export async function pushPaymentStatuses(env: Env, limit = 50): Promise<number> {
  const rows = await all<any>(env.DB, `SELECT p.id, p.amount, p.club_id, i.id AS invoice_id, i.einvoice_ref, i.snapshot, i.total_ttc FROM invoice_payments p
    JOIN invoices i ON i.id = p.invoice_id JOIN einvoice_accounts a ON a.club_id = p.club_id AND a.status = 'connected'
    WHERE p.pa_reported_at IS NULL AND p.amount > 0 AND i.einvoice_channel = 'b2b' AND i.einvoice_ref IS NOT NULL AND i.operation_category != 'goods' AND i.vat_on_debits = 0
    LIMIT ?`, limit);
  const p = provider(env); let n = 0;
  for (const r of rows) {
    if (!p.sendStatus) break;
    const a = await accountFor(env, r.club_id); if (!a) continue;
    const snap = json<any>(r.snapshot, { groups: [] });
    const details = splitByRate(r.amount, snap.groups, r.total_ttc);
    try {
      await p.sendStatus(env, a.acc, r.einvoice_ref, "212", details);
      await run(env.DB, "UPDATE invoice_payments SET pa_reported_at = ? WHERE id = ?", nowIso(), r.id);
      await addEvent(env, r.club_id, { invoice_id: r.invoice_id, code: "212", provider_event_id: null });
      n++;
    } catch (e) { await accountError(env, r.club_id, e); }
  }
  await persistRefreshed(env, p);
  return n;
}

/** Ventile un encaissement TTC entre les taux de la facture (au prorata, plus fort reste), montants HT par taux. */
export function splitByRate(amount: number, groups: { rate_bp: number; base: number; vat: number; category: string }[], totalTtc: number): { rate_bp: number; amount: number }[] {
  if (!groups?.length || !totalTtc) return [{ rate_bp: 0, amount }];
  const parts = groups.map((g) => ({ rate_bp: g.category === "E" ? 0 : g.rate_bp, ttc: Math.floor((amount * (g.base + g.vat)) / totalTtc) }));
  let rest = amount - parts.reduce((a, x) => a + x.ttc, 0);
  for (const x of parts) { if (rest <= 0) break; x.ttc++; rest--; }
  return parts.filter((x) => x.ttc).map((x) => ({ rate_bp: x.rate_bp, amount: Math.round((x.ttc * 10000) / (10000 + x.rate_bp)) }));
}

/* ---------- E-reporting ---------- */
/** Périodes de déclaration (bornes incluses) qui contiennent la date donnée. */
export function periodOf(date: string, periodicity: "decade" | "monthly" | "bimonthly"): { start: string; end: string } {
  const y = date.slice(0, 4), m = Number(date.slice(5, 7)), d = Number(date.slice(8, 10));
  const last = (yy: number, mm: number) => new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  if (periodicity === "decade") {
    const startDay = d <= 10 ? 1 : d <= 20 ? 11 : 21;
    const endDay = d <= 10 ? 10 : d <= 20 ? 20 : last(+y, m);
    return { start: `${y}-${pad(m)}-${pad(startDay)}`, end: `${y}-${pad(m)}-${pad(endDay)}` };
  }
  if (periodicity === "bimonthly") {
    const m0 = m % 2 === 1 ? m : m - 1;
    return { start: `${y}-${pad(m0)}-01`, end: `${y}-${pad(m0 + 1)}-${pad(last(+y, m0 + 1))}` };
  }
  return { start: `${y}-${pad(m)}-01`, end: `${y}-${pad(m)}-${pad(last(+y, m))}` };
}

export async function buildEreporting(env: Env, clubId: string, kind: "transactions" | "payments", start: string, end: string, siren: string): Promise<EreportingPayload> {
  const payload: EreportingPayload = { kind, period_start: start, period_end: end, seller_siren: siren, currency: "EUR" };
  if (kind === "transactions") {
    const rows = await all<InvoiceRow>(env.DB, "SELECT * FROM invoices WHERE club_id = ? AND einvoice_channel = 'b2c' AND number IS NOT NULL AND issue_date BETWEEN ? AND ?", clubId, start, end);
    const agg = new Map<string, { date: string; category: any; rate_bp: number; base: number; vat: number; count: number }>();
    for (const inv of rows) {
      const snap = snapshotOf(inv); const sign = inv.kind === "credit_note" ? -1 : 1;
      // Facture finale : les acomptes ont déjà été déclarés à leur émission, seul le solde l'est ici (au prorata).
      for (const g of snap.groups) {
        const lines = snap.lines.filter((l) => l.vat_rate_bp === g.rate_bp && l.vat_category === g.category);
        const cat = g.category === "E" ? "TNT1" : lines.every((l) => l.kind === "goods") ? "TLB1" : "TPS1";
        const ratio = inv.kind === "invoice" && inv.prepaid_amount && inv.total_ttc ? (inv.total_ttc - inv.prepaid_amount) / inv.total_ttc : 1;
        const k = `${inv.issue_date}|${cat}|${g.rate_bp}`;
        const cur = agg.get(k) || { date: inv.issue_date!, category: cat, rate_bp: g.rate_bp, base: 0, vat: 0, count: 0 };
        cur.base += sign * Math.round(g.base * ratio); cur.vat += sign * Math.round(g.vat * ratio); cur.count++;
        agg.set(k, cur);
      }
    }
    payload.transactions = [...agg.values()].sort((a, b) => a.date.localeCompare(b.date) || a.category.localeCompare(b.category) || a.rate_bp - b.rate_bp);
  } else {
    const rows = await all<any>(env.DB, `SELECT p.paid_at, p.amount, i.snapshot, i.total_ttc FROM invoice_payments p JOIN invoices i ON i.id = p.invoice_id
      WHERE p.club_id = ? AND i.einvoice_channel = 'b2c' AND i.operation_category != 'goods' AND i.vat_on_debits = 0 AND p.paid_at BETWEEN ? AND ?`, clubId, start, end);
    const agg = new Map<string, { date: string; rate_bp: number; amount: number }>();
    for (const r of rows) {
      const snap = json<any>(r.snapshot, { groups: [] });
      for (const part of splitByRate(r.amount, snap.groups, r.total_ttc)) {
        const k = `${r.paid_at}|${part.rate_bp}`;
        const cur = agg.get(k) || { date: r.paid_at, rate_bp: part.rate_bp, amount: 0 };
        cur.amount += part.amount; agg.set(k, cur);
      }
    }
    payload.payments = [...agg.values()].sort((a, b) => a.date.localeCompare(b.date) || a.rate_bp - b.rate_bp);
  }
  return payload;
}

/** Déclare chaque période terminée et pas encore transmise (3 dernières périodes au plus, rattrapage compris). */
export async function runEreporting(env: Env, today = parisToday(), limit = 20): Promise<number> {
  const accounts = await all<AccountRow>(env.DB, "SELECT * FROM einvoice_accounts WHERE status = 'connected' AND club_id != ? LIMIT ?", PLATFORM_CLUB, limit);
  const p = provider(env); let n = 0;
  for (const row of accounts) {
    const st = await getSettings(env.DB, row.club_id);
    const seller = await clubSeller(env.DB, row.club_id, st);
    if (!seller?.siren || !st.einvoicing_enabled || seller.regime === "association_exoneree") continue;
    const periodicity = seller.regime === "franchise" ? "bimonthly" : st.vat_periodicity;
    const periods: { start: string; end: string }[] = [];
    let cur = periodOf(addDays(periodOf(today, periodicity).start, -1), periodicity);
    for (let k = 0; k < 3; k++) { periods.unshift(cur); cur = periodOf(addDays(cur.start, -1), periodicity); }
    const since = (row.connected_at || "").slice(0, 10);
    const acc: PaAccount = { club_id: row.club_id, external_id: row.external_id, credentials: await unseal(env, row.credentials) };
    for (const per of periods) {
      if (since && per.end < since) continue;
      for (const kind of ["transactions", "payments"] as const) {
        const ex = await one<{ status: string; attempts: number }>(env.DB, "SELECT status, attempts FROM einvoice_reports WHERE club_id = ? AND kind = ? AND period_start = ?", row.club_id, kind, per.start);
        if (ex && (ex.status !== "error" || ex.attempts >= 5)) continue;
        const payload = await buildEreporting(env, row.club_id, kind, per.start, per.end, seller.siren);
        const empty = !(payload.transactions?.length || payload.payments?.length);
        let status = "empty", ref: string | null = null, error: string | null = null;
        if (!empty) {
          try { ref = (await p.submitEreporting(env, acc, payload)).ref; status = "submitted"; }
          catch (e) { status = e instanceof PaError && e.code === "rejected" ? "rejected" : "error"; error = String((e as Error).message).slice(0, 500); await accountError(env, row.club_id, e); }
        }
        await run(env.DB, `INSERT INTO einvoice_reports (id, club_id, kind, period_start, period_end, status, payload, provider_ref, error, attempts, submitted_at) VALUES (?,?,?,?,?,?,?,?,?,1,?)
          ON CONFLICT(club_id, kind, period_start) DO UPDATE SET status = excluded.status, payload = excluded.payload, provider_ref = excluded.provider_ref, error = excluded.error, attempts = einvoice_reports.attempts + 1, submitted_at = excluded.submitted_at`,
          newId("erp"), row.club_id, kind, per.start, per.end, status, JSON.stringify(payload), ref, error, status === "submitted" ? nowIso() : null);
        if (status === "submitted") n++;
      }
    }
  }
  await persistRefreshed(env, p);
  return n;
}

/* ---------- Factures fournisseurs reçues ---------- */
export async function pullIncoming(env: Env, limit = 20): Promise<number> {
  const accounts = await all<AccountRow>(env.DB, "SELECT * FROM einvoice_accounts WHERE status = 'connected' ORDER BY COALESCE(last_sync_at, '') LIMIT ?", limit);
  const p = provider(env); let n = 0;
  for (const row of accounts) {
    const acc: PaAccount = { club_id: row.club_id, external_id: row.external_id, credentials: await unseal(env, row.credentials) };
    try {
      const { items, cursor } = await p.listIncoming(env, acc, row.cursor_in);
      for (const it of items.slice(0, 50)) {
        const exists = await one(env.DB, "SELECT id FROM incoming_invoices WHERE club_id = ? AND source = 'pa' AND provider_ref = ?", row.club_id, it.ref);
        if (exists) continue;
        const doc = await p.fetchIncoming(env, acc, it.ref);
        let xml = doc.xml;
        if (!xml && doc.pdf) xml = (await extractFacturX(doc.pdf).catch(() => ({ xml: null }))).xml;
        if (!xml) continue;
        await storeIncoming(env, row.club_id, { source: "pa", provider: p.name, provider_ref: it.ref, xml, pdf: doc.pdf });
        n++;
      }
      await run(env.DB, "UPDATE einvoice_accounts SET cursor_in = ? WHERE club_id = ?", cursor, row.club_id);
    } catch (e) { await accountError(env, row.club_id, e); }
  }
  await persistRefreshed(env, p);
  return n;
}

export async function storeIncoming(env: Env, clubId: string, d: { source: "pa" | "piaffe" | "upload"; provider?: string | null; provider_ref: string; xml: string; pdf?: Uint8Array | null; account?: string }): Promise<string> {
  const f = parseIncomingXml(d.xml);
  const id = newId("inc");
  const base = `incoming/${clubId.replace(/[^A-Za-z0-9_-]/g, "_")}/${id}`;
  await env.FILES.put(base + ".xml", d.xml, { httpMetadata: { contentType: "application/xml; charset=utf-8" } });
  if (d.pdf) await env.FILES.put(base + ".pdf", d.pdf, { httpMetadata: { contentType: "application/pdf" } });
  await run(env.DB, `INSERT OR IGNORE INTO incoming_invoices (id, club_id, source, provider, provider_ref, supplier_name, supplier_siren, supplier_vat, number, type_code, issue_date, due_date,
    total_ht, total_vat, total_ttc, currency, vat_breakdown, account, xml_key, pdf_key) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    id, clubId, d.source, d.provider ?? null, d.provider_ref, f.supplier_name, f.supplier_siren, f.supplier_vat, f.number, f.type_code, f.issue_date, f.due_date,
    f.total_ht, f.total_vat, f.total_ttc, f.currency, JSON.stringify(f.vat_breakdown), d.account || "606000", base + ".xml", d.pdf ? base + ".pdf" : null);
  return id;
}

/** Tâche du cron toutes les 10 minutes. */
export async function einvoiceTick(env: Env) {
  await submitPending(env);
  await pullStatuses(env);
  await pushPaymentStatuses(env);
}
/** Tâche quotidienne. */
export async function einvoiceDaily(env: Env) {
  await runEreporting(env);
  await pullIncoming(env);
}
export { getInvoice };
