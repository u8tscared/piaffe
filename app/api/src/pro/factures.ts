/**
 * Factures des praticiens (vétérinaire, maréchal, dentiste, ostéopathe) · rôle « provider ».
 *
 * Le praticien est le VENDEUR : ses factures sont à son nom (SIRET, n° d'Ordre, IBAN), avec SA numérotation
 * PRO-AAAA-00001, unique pour lui et continue, quel que soit le club. Le client est soit le club, soit le
 * propriétaire du cheval (fiche members). Même PDF Factur-X que les factures des clubs (src/invoicing).
 *
 * À l'émission, sans rien faire de plus :
 *   1. le PDF part par e-mail au client (expéditeur « Dr Leclerc via Stabl », réponse chez le praticien) ;
 *   2. le praticien en reçoit une copie ;
 *   3. si le client est le club, la facture est rangée dans ses factures fournisseurs (compte 622600, honoraires),
 *      donc visible par le gérant et son comptable, et reprise dans le FEC des achats ;
 *   4. les actes passent « facturés » dans les données du club (proActs : inv, invId, invAt, client).
 *
 * Facturation automatique (réglage du profil, auto) : « day » chaque matin pour les actes de la veille et d'avant,
 * « month » le 1er du mois pour le mois écoulé, « off » à la main. Cron quotidien de 6 h UTC.
 *
 *   GET  /api/pro/profil                         son profil de facturation (gardé sur le serveur, tous appareils)
 *   PUT  /api/pro/profil
 *   GET  /api/pro/factures                       ses factures et ses actes à facturer, dans toutes ses écuries
 *   POST /api/pro/factures                       { club?, acts?: [ids], bill_to?: "club"|"owner" } fait et envoie
 *   GET  /api/pro/factures/:id/pdf
 *   POST /api/pro/factures/:id/payee             { paid: true|false }
 *   POST /api/pro/factures/:id/renvoyer          renvoie l'e-mail au client
 *   GET  /api/club/factures-praticiens           côté club (gérant, co-gérant, comptable) : factures reçues
 *   GET  /api/club/factures-praticiens/:id/pdf
 */
import { Hono } from "hono";
import type { AppEnv, Env } from "../env";
import { requireRole, requireUser } from "../lib/auth";
import { all, json, one, run, audit } from "../lib/db";
import { newId, nowIso } from "../lib/ids";
import { ApiError, bad, notFound } from "../lib/http";
import { sendMail } from "../mail/send";
import { computeTotals, type LineInput } from "../invoicing/money";
import { REGIME_MENTION } from "../invoicing/catalog";
import { frVatNumber, parseAddress, type Address, type Seller } from "../invoicing/settings";
import type { Snapshot } from "../invoicing/snapshot";
import { buildCii } from "../invoicing/cii";
import { renderInvoicePdf } from "../invoicing/pdf";
import { addDays, b64, memberAddress, parisToday } from "../invoicing/invoices";
import { storeIncoming } from "../invoicing/einvoice";

type Row = Record<string, any>;
const parse = (s: string): Row => { try { return JSON.parse(s) || {}; } catch { return {}; } };
const clean = (v: unknown, max = 200) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "");
const frDate = (iso: string) => iso.split("-").reverse().join("/");

// ---------- Profil ----------
export interface ProProfile {
  name: string; job: string; ordre: string; siret: string; address: string; phone: string; email: string;
  iban: string; bic: string; tva: "20" | "0"; auto: "day" | "month" | "off"; bill: "owner" | "club"; terms_days: number;
}
const AUTO = ["day", "month", "off"] as const;

async function providerClubs(db: D1Database, userId: string) {
  return all<{ club_id: string; person_ref: string | null; name: string }>(db,
    `SELECT m.club_id, m.person_ref, cl.name FROM memberships m JOIN clubs cl ON cl.id = m.club_id
     WHERE m.user_id = ? AND m.role = 'provider' AND m.status = 'active' ORDER BY cl.name`, userId);
}
const refsOf = (personRef: string | null) => new Set((personRef || "").split(",").map((s) => s.trim()).filter(Boolean));

export async function loadProfile(db: D1Database, userId: string): Promise<ProProfile> {
  const row = await one<{ data: string }>(db, "SELECT data FROM pro_profiles WHERE user_id = ?", userId);
  const saved = row ? parse(row.data) : {};
  const u = await one<{ email: string; first: string | null; last: string | null }>(db, "SELECT email, first, last FROM users WHERE id = ?", userId);
  // valeurs de départ : la fiche praticien du premier club
  let fiche: Row = {};
  const m = (await providerClubs(db, userId))[0];
  if (m) {
    const ref = [...refsOf(m.person_ref)][0];
    const r = ref ? await one<{ data: string }>(db, "SELECT data FROM records WHERE club_id = ? AND coll = 'practitioners' AND id = ? AND deleted = 0", m.club_id, ref) : null;
    if (r) fiche = parse(r.data);
  }
  const base: ProProfile = {
    name: fiche.name || [u?.first, u?.last].filter(Boolean).join(" ") || "", job: fiche.job || "", ordre: "", siret: "", address: "",
    phone: fiche.phone || "", email: u?.email || "", iban: "", bic: "", tva: "20", auto: "day", bill: "owner", terms_days: 30,
  };
  return normProfile({ ...base, ...saved });
}

function normProfile(p: Row): ProProfile {
  const n = Number(p.terms_days);
  return {
    name: clean(p.name, 120), job: clean(p.job, 60), ordre: clean(p.ordre, 20), siret: digits(p.siret).slice(0, 14), address: clean(p.address, 200),
    phone: clean(p.phone, 30), email: clean(p.email, 160).toLowerCase(), iban: String(p.iban || "").replace(/\s/g, "").toUpperCase().slice(0, 34),
    bic: String(p.bic || "").replace(/\s/g, "").toUpperCase().slice(0, 11), tva: p.tva === "0" ? "0" : "20",
    auto: (AUTO as readonly string[]).includes(p.auto) ? p.auto : "day", bill: p.bill === "club" ? "club" : "owner",
    terms_days: Number.isFinite(n) ? Math.min(60, Math.max(0, Math.round(n))) : 30,
  };
}

function parseFrAddress(a: string): Address {
  const m = /^(.*?),?\s*(\d{5})\s+([^,]+?)(?:,\s*(.*))?$/.exec(a.trim());
  return m ? { line1: m[1] || undefined, zip: m[2], city: m[3], country: "FR" } : { line1: a.trim(), country: "FR" };
}

/** Ce qu'il manque au profil pour émettre une facture valable (mentions obligatoires du vendeur). */
export function missingFields(p: ProProfile): string[] {
  const miss: string[] = [];
  if (!p.name) miss.push("votre nom");
  if (p.siret.length !== 14) miss.push("votre SIRET (14 chiffres)");
  if (!parseFrAddress(p.address).city) miss.push("votre adresse avec code postal et ville");
  return miss;
}

function sellerOf(p: ProProfile): Seller {
  const siren = p.siret.slice(0, 9);
  const regime = p.tva === "0" ? "franchise" : "normal";
  const vat = regime === "normal" ? frVatNumber(siren) : null;
  const legal = [p.job || "Praticien", "SIRET " + p.siret];
  if (p.ordre) legal.push((/v[ée]t/i.test(p.job) ? "Ordre des vétérinaires n° " : "N° d'inscription ") + p.ordre);
  if (vat) legal.push("TVA intracommunautaire " + vat);
  return { name: p.name, siren, siret: p.siret, vat, address: parseFrAddress(p.address), email: p.email || null, phone: p.phone || null, legal_lines: legal, regime };
}

// ---------- Actes à facturer ----------
interface Payer { bill_to: "club" | "owner"; ref: string | null; name: string; email: string | null; type: Snapshot["buyer"]["type"]; siren: string | null; vat: string | null; address: Address }
interface ClubData {
  club: { id: string; name: string; person_ref: string | null }; me: Set<string>;
  acts: Row[]; horses: Map<string, Row>; members: Map<string, Row>; clubRow: Row | null;
}

async function clubData(db: D1Database, m: { club_id: string; person_ref: string | null; name: string }): Promise<ClubData> {
  const me = refsOf(m.person_ref);
  const rows = await all<{ coll: string; id: string; data: string }>(db,
    "SELECT coll, id, data FROM records WHERE club_id = ? AND deleted = 0 AND coll IN ('proActs','horses')", m.club_id);
  const billed = new Set((await all<{ act_id: string }>(db, "SELECT act_id FROM pro_invoice_acts WHERE club_id = ?", m.club_id)).map((r) => r.act_id));
  const acts = rows.filter((r) => r.coll === "proActs").map((r) => ({ ...parse(r.data), id: r.id }) as Row)
    .filter((a) => me.has(a.pro) && !billed.has(a.id) && !a.inv && a.kind !== "Certificat" && (Number(a.price) || 0) > 0);
  const horses = new Map(rows.filter((r) => r.coll === "horses").map((r) => { const h = { ...parse(r.data), id: r.id } as Row; return [h.id, h] as [string, Row]; }));
  const ownerIds = [...new Set(acts.map((a) => horses.get(a.horse)?.owner).filter((x): x is string => typeof x === "string" && !!x))];
  const members = new Map<string, Row>();
  for (const id of ownerIds) {
    const r = await one<{ data: string }>(db, "SELECT data FROM records WHERE club_id = ? AND coll = 'members' AND id = ? AND deleted = 0", m.club_id, id);
    if (r) members.set(id, { ...parse(r.data), id });
  }
  const clubRow = await one<Row>(db, "SELECT id, name, legal_form, siren, siret, vat_number, address, email FROM clubs WHERE id = ?", m.club_id);
  return { club: { id: m.club_id, name: m.name, person_ref: m.person_ref }, me, acts, horses, members, clubRow };
}

function clubPayer(cd: ClubData): Payer {
  const c = cd.clubRow || {};
  const siren = c.siren || (c.siret ? String(c.siret).slice(0, 9) : null);
  return {
    bill_to: "club", ref: null, name: c.name || cd.club.name, email: c.email || null,
    type: c.legal_form === "association" ? "association" : "business", siren: siren || null, vat: c.vat_number || null,
    address: Object.keys(parseAddress(c.address)).length ? { country: "FR", ...parseAddress(c.address) } : { country: "FR" },
  };
}

/** Qui paie cet acte : son choix sur l'acte, sinon le réglage du profil ; le club si le cheval n'a pas de propriétaire connu. */
function payerOf(a: Row, cd: ClubData, p: ProProfile, force?: "club" | "owner"): Payer {
  const want = force || (a.bill === "club" || a.bill === "owner" ? a.bill : p.bill);
  const h = cd.horses.get(a.horse);
  const o = want === "owner" && h?.owner ? cd.members.get(h.owner) : null;
  if (!o) return clubPayer(cd);
  return {
    bill_to: "owner", ref: o.id, name: [o.first, o.last].filter(Boolean).join(" ").trim() || o.name || "Propriétaire",
    email: o.email ? String(o.email).trim().toLowerCase() : null, type: "individual", siren: null, vat: null,
    address: memberAddress(o) || { country: "FR" },
  };
}

// ---------- Émission ----------
function buildSnapshot(p: ProProfile, payer: Payer, acts: Row[], cd: ClubData, issueDate: string, dueDate: string | null): Snapshot {
  const seller = sellerOf(p);
  const input: LineInput[] = acts.map((a) => {
    const h = cd.horses.get(a.horse);
    return {
      label: `${a.kind || "Acte"} · ${h?.name || a.person || "Cheval"} · ${frDate(String(a.date || issueDate))}`,
      description: a.note ? clean(a.note, 300) : null, category: "service", quantity: 1, unit: "C62",
      unit_price: Math.round((Number(a.price) || 0) * 100), vat_rate_bp: 2000,
    };
  });
  const t = computeTotals(input, "ht", seller.regime);
  const b2b = payer.type !== "individual";
  const mentions: string[] = [];
  const notes: Snapshot["notes"] = [];
  const rm = REGIME_MENTION[seller.regime];
  if (rm) mentions.push(rm + ".");
  if (b2b) {
    mentions.push("En cas de retard de paiement, des pénalités au taux de trois fois le taux d'intérêt légal sont exigibles dès le lendemain de l'échéance, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 € (art. L441-10 et D441-5 du code de commerce).", "Pas d'escompte pour paiement anticipé.");
    notes.push({ code: "PMD", text: "Pénalités de retard : trois fois le taux d'intérêt légal" }, { code: "PMT", text: "Indemnité forfaitaire pour frais de recouvrement : 40 EUR" }, { code: "AAB", text: "Pas d'escompte pour paiement anticipé" });
  }
  const horses = [...new Set(acts.map((a) => cd.horses.get(a.horse)?.name).filter(Boolean))];
  const dates = acts.map((a) => String(a.date || issueDate)).sort();
  const terms = dueDate && dueDate > issueDate ? `Paiement au plus tard le ${frDate(dueDate)}.` : "Paiement à réception.";
  return {
    v: 1, issuer: "pro", kind: "invoice", type_code: "380", number: "__NUMBER__", issue_date: issueDate, due_date: dueDate,
    label: `${p.job || "Soins"}${horses.length ? " · " + horses.join(", ") : ""}${payer.bill_to === "club" ? "" : " · " + cd.club.name}`.slice(0, 160),
    seller, buyer: { type: payer.type, name: payer.name, siren: payer.siren, vat: payer.vat, address: payer.address, email: payer.email, ref: payer.ref },
    delivery_address: null, buyer_reference: null, service_date: dates.length === 1 ? dates[0] : null,
    period: dates.length > 1 ? { start: dates[0], end: dates[dates.length - 1] } : null,
    lines: t.lines, groups: t.groups, totals: { ht: t.total_ht, vat: t.total_vat, ttc: t.total_ttc, prepaid: 0, due: t.total_ttc },
    regime: seller.regime, operation_category: t.operation_category, vat_on_debits: false, business_process: "S1",
    payment: { method: p.iban ? "transfer" : null, method_label: p.iban ? "Virement" : null, means_code: p.iban ? "58" : "1", iban: p.iban || null, bic: p.bic || null, terms },
    notes, mentions, original: null, deposits: [], footer: `Facture établie par ${p.name} avec Stabl, pour des actes réalisés à ${cd.club.name}.`,
  };
}

export interface ProInvoiceRow {
  id: string; user_id: string; club_id: string; pro_ref: string | null; series: string; seq: number; number: string; bill_to: "club" | "owner";
  customer_ref: string | null; customer_name: string | null; customer_email: string | null; issue_date: string; due_date: string | null;
  total_ht: number; total_vat: number; total_ttc: number; acts: string; snapshot: string; pdf_key: string | null; xml_key: string | null;
  auto: number; sent_at: string | null; sent_to: string | null; incoming_id: string | null; paid_at: string | null; created_at: string;
}

async function documents(env: Env, i: ProInvoiceRow): Promise<{ pdf: Uint8Array; xml: string }> {
  if (i.pdf_key && i.xml_key) {
    const [pf, xf] = await Promise.all([env.FILES.get(i.pdf_key), env.FILES.get(i.xml_key)]);
    if (pf && xf) return { pdf: new Uint8Array(await pf.arrayBuffer()), xml: await xf.text() };
  }
  const snap = json<Snapshot>(i.snapshot, null as any);
  const xml = buildCii(snap);
  const pdf = await renderInvoicePdf(snap, xml, { createdAt: new Date(i.created_at || i.issue_date + "T12:00:00Z") });
  const base = `pro-invoices/${i.user_id.replace(/[^A-Za-z0-9_-]/g, "_")}/${i.issue_date.slice(0, 4)}/${i.number}`;
  await env.FILES.put(base + ".pdf", pdf, { httpMetadata: { contentType: "application/pdf" }, customMetadata: { number: i.number } });
  await env.FILES.put(base + ".xml", xml, { httpMetadata: { contentType: "application/xml; charset=utf-8" }, customMetadata: { number: i.number } });
  await run(env.DB, "UPDATE pro_invoices SET pdf_key = ?, xml_key = ? WHERE id = ?", base + ".pdf", base + ".xml", i.id);
  return { pdf, xml };
}

async function mailCustomer(env: Env, i: ProInvoiceRow, p: ProProfile, pdf: Uint8Array): Promise<string | null> {
  if (!i.customer_email) return null;
  const snap = json<Snapshot>(i.snapshot, null as any);
  const club = await one<{ name: string }>(env.DB, "SELECT name FROM clubs WHERE id = ?", i.club_id);
  const horses = [...new Set((snap?.lines || []).map((l) => String(l.label).split(" · ")[1]).filter(Boolean))].join(", ");
  const first = i.bill_to === "owner" && i.customer_ref
    ? parse((await one<{ data: string }>(env.DB, "SELECT data FROM records WHERE club_id = ? AND coll = 'members' AND id = ?", i.club_id, i.customer_ref))?.data || "{}").first : null;
  await sendMail(env, {
    to: i.customer_email, template: "pro_invoice", club_id: null, from_name: p.name, reply_to: p.email || undefined,
    data: { first: first || undefined, pro_name: p.name, pro_job: p.job, number: i.number, amount_cents: i.total_ttc, due_date: i.due_date && i.due_date > i.issue_date ? i.due_date : null,
      horses, club_name: club?.name || "", iban: p.iban ? p.iban.replace(/(.{4})/g, "$1 ").trim() : undefined, to_club: i.bill_to === "club" },
    attachments: [{ filename: `${i.number}.pdf`, content_b64: b64(pdf), type: "application/pdf" }],
  });
  return i.customer_email;
}

/**
 * Fait les factures des actes donnés (ou de tous ses actes à facturer dans ce club), une par client,
 * et les envoie. Renvoie les factures créées.
 */
export async function invoiceActs(env: Env, userId: string, clubId: string, o: { acts?: string[] | null; bill_to?: "club" | "owner"; auto?: boolean; before?: string } = {}): Promise<ProInvoiceRow[]> {
  const db = env.DB;
  const m = (await providerClubs(db, userId)).find((x) => x.club_id === clubId);
  if (!m) throw new ApiError(403, "forbidden", "Vous n'êtes pas praticien de ce club.");
  const p = await loadProfile(db, userId);
  const miss = missingFields(p);
  if (miss.length) throw new ApiError(422, "missing_profile", `Complétez « Mon profil » avant de facturer : ${miss.join(", ")}.`, { missing: miss });
  const cd = await clubData(db, m);
  let acts = cd.acts;
  if (o.acts) { const want = new Set(o.acts); acts = acts.filter((a) => want.has(a.id)); }
  if (o.before) acts = acts.filter((a) => String(a.date || "") < o.before!);
  if (!acts.length) return [];
  // un groupe par client
  const groups = new Map<string, { payer: Payer; acts: Row[] }>();
  for (const a of acts.sort((x, y) => String(x.date).localeCompare(String(y.date)))) {
    const payer = payerOf(a, cd, p, o.bill_to);
    const k = payer.bill_to + ":" + (payer.ref || "");
    if (!groups.has(k)) groups.set(k, { payer, acts: [] });
    groups.get(k)!.acts.push(a);
  }
  const out: ProInvoiceRow[] = [];
  for (const g of groups.values()) {
    const inv = await issue(env, userId, p, cd, g.payer, g.acts, !!o.auto).catch((e) => {
      if (/UNIQUE|constraint/i.test(String(e?.message))) return null; // actes facturés entre-temps (double clic, cron)
      throw e;
    });
    if (inv) out.push(inv);
  }
  return out;
}

async function issue(env: Env, userId: string, p: ProProfile, cd: ClubData, payer: Payer, acts: Row[], auto: boolean): Promise<ProInvoiceRow> {
  const db = env.DB;
  const issueDate = parisToday();
  const due = payer.bill_to === "club" ? addDays(issueDate, Math.min(60, p.terms_days)) : p.terms_days > 0 ? addDays(issueDate, Math.min(30, p.terms_days)) : null;
  const snap = buildSnapshot(p, payer, acts, cd, issueDate, due);
  const series = `PRO-${issueDate.slice(0, 4)}`;
  const id = newId("pin");
  const seqQ = "(SELECT value FROM pro_invoice_counters WHERE user_id = ? AND series = ?)";
  const numQ = `? || '-' || printf('%05d', ${seqQ})`;
  const stmts: D1PreparedStatement[] = [
    db.prepare("INSERT OR IGNORE INTO pro_invoice_counters (user_id, series, value) VALUES (?, ?, 0)").bind(userId, series),
    db.prepare("UPDATE pro_invoice_counters SET value = value + 1 WHERE user_id = ? AND series = ?").bind(userId, series),
    db.prepare(`INSERT INTO pro_invoices (id, user_id, club_id, pro_ref, series, seq, number, bill_to, customer_ref, customer_name, customer_email,
        issue_date, due_date, total_ht, total_vat, total_ttc, acts, snapshot, auto)
      VALUES (?, ?, ?, ?, ?, ${seqQ}, ${numQ}, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, replace(?, '"__NUMBER__"', '"' || ${numQ} || '"'), ?)`)
      .bind(id, userId, cd.club.id, [...cd.me][0] || null, series, userId, series, series, userId, series,
        payer.bill_to, payer.ref, payer.name, payer.email, issueDate, due, snap.totals.ht, snap.totals.vat, snap.totals.ttc,
        JSON.stringify(acts.map((a) => a.id)), JSON.stringify(snap), series, userId, series, auto ? 1 : 0),
    ...acts.map((a) => db.prepare("INSERT INTO pro_invoice_acts (club_id, act_id, invoice_id) VALUES (?, ?, ?)").bind(cd.club.id, a.id, id)),
  ];
  await db.batch(stmts);
  let inv = (await one<ProInvoiceRow>(db, "SELECT * FROM pro_invoices WHERE id = ?", id))!;
  await audit(db, { club_id: cd.club.id, user_id: userId, action: "pro_invoice.issue", target: id, data: { number: inv.number, total_ttc: inv.total_ttc, bill_to: inv.bill_to, auto } });

  // les actes passent « facturés » dans les données du club (synchronisées vers l'appli)
  const patch = JSON.stringify({ inv: inv.number, invId: inv.id, invAt: issueDate, client: payer.name, billTo: payer.bill_to });
  const now = nowIso();
  await db.batch(acts.map((a) => db.prepare("UPDATE records SET data = json_patch(data, ?), version = version + 1, updated_by = 'pro-invoicing', updated_at = ? WHERE club_id = ? AND coll = 'proActs' AND id = ?")
    .bind(patch, now, cd.club.id, a.id)));

  let pdf: Uint8Array | null = null, xml = "";
  try { ({ pdf, xml } = await documents(env, inv)); } catch (e) { console.error("PDF de la facture praticien", (e as Error)?.message); }
  let incoming: string | null = null;
  if (payer.bill_to === "club" && xml) {
    try { incoming = await storeIncoming(env, cd.club.id, { source: "piaffe", provider: "praticien", provider_ref: inv.id, xml, pdf, account: "622600" }); }
    catch (e) { console.error("Facture praticien vers les achats du club", (e as Error)?.message); }
  }
  let sentTo: string | null = null;
  if (pdf) {
    sentTo = await mailCustomer(env, inv, p, pdf);
    const copyTo = p.email || (await one<{ email: string }>(db, "SELECT email FROM users WHERE id = ?", userId))?.email;
    if (copyTo) {
      await sendMail(env, {
        to: copyTo, template: "pro_invoice_copy", club_id: null,
        data: { first: p.name.replace(/^Dr\.?\s+/i, "").split(/\s+/)[0], number: inv.number, amount_cents: inv.total_ttc, customer_name: payer.name, sent_to: sentTo || "", club_name: cd.club.name, auto, invoices_url: env.APP_URL },
        attachments: [{ filename: `${inv.number}.pdf`, content_b64: b64(pdf), type: "application/pdf" }],
      });
    }
  }
  await run(db, "UPDATE pro_invoices SET sent_at = ?, sent_to = ?, incoming_id = ? WHERE id = ?", sentTo ? nowIso() : null, sentTo, incoming, inv.id);
  inv = (await one<ProInvoiceRow>(db, "SELECT * FROM pro_invoices WHERE id = ?", id))!;
  return inv;
}

// ---------- Vues ----------
function view(i: ProInvoiceRow, clubName?: string) {
  const s = json<Snapshot>(i.snapshot, null as any);
  return {
    id: i.id, number: i.number, club: i.club_id, club_name: clubName || "", bill_to: i.bill_to, customer_name: i.customer_name, customer_email: i.customer_email,
    issue_date: i.issue_date, due_date: i.due_date, total_ht: i.total_ht, total_vat: i.total_vat, total_ttc: i.total_ttc,
    acts: json<string[]>(i.acts, []), lines: (s?.lines || []).map((l) => ({ label: l.label, ht: l.line_ht })), auto: !!i.auto,
    sent_at: i.sent_at, sent_to: i.sent_to, in_club_purchases: !!i.incoming_id, paid_at: i.paid_at, has_pdf: !!i.pdf_key,
    pro_name: s?.seller?.name || "",
  };
}

/** Tâche quotidienne (6 h UTC) : facturation automatique des praticiens. */
export async function autoInvoice(env: Env, now = new Date()): Promise<number> {
  const today = parisToday(now);
  const firstOfMonth = today.slice(0, 8) + "01";
  const rows = await all<{ user_id: string; data: string }>(env.DB, "SELECT user_id, data FROM pro_profiles LIMIT 2000");
  let n = 0;
  for (const r of rows) {
    const auto = parse(r.data).auto || "day";
    if (auto === "off" || (auto === "month" && today !== firstOfMonth)) continue;
    const before = auto === "month" ? firstOfMonth : today;
    for (const m of await providerClubs(env.DB, r.user_id)) {
      try { n += (await invoiceActs(env, r.user_id, m.club_id, { auto: true, before })).length; }
      catch (e) { if (!(e instanceof ApiError)) console.error("facturation automatique", r.user_id, (e as Error)?.message); }
    }
  }
  return n;
}

// ---------- Routes ----------
const app = new Hono<AppEnv>();

app.get("/api/pro/profil", requireUser, async (c) => {
  const p = await loadProfile(c.env.DB, c.get("user")!.id);
  return c.json({ profile: p, missing: missingFields(p) });
});

app.put("/api/pro/profil", requireUser, async (c) => {
  const user = c.get("user")!;
  if (!(await providerClubs(c.env.DB, user.id)).length) throw new ApiError(403, "forbidden", "Réservé aux praticiens invités par un club.");
  const b = await c.req.json<Row>().catch(() => ({} as Row));
  const cur = await loadProfile(c.env.DB, user.id);
  const p = normProfile({ ...cur, ...b });
  if (p.siret && p.siret.length !== 14) throw bad("invalid_field", "Le SIRET compte 14 chiffres.", { field: "siret" });
  await run(c.env.DB, `INSERT INTO pro_profiles (user_id, data, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`, user.id, JSON.stringify(p), nowIso());
  return c.json({ profile: p, missing: missingFields(p) });
});

app.get("/api/pro/factures", requireUser, async (c) => {
  const user = c.get("user")!;
  const db = c.env.DB;
  const p = await loadProfile(db, user.id);
  const clubs = await providerClubs(db, user.id);
  const names = new Map(clubs.map((m) => [m.club_id, m.name]));
  const todo: Row[] = [];
  for (const m of clubs) {
    const cd = await clubData(db, m);
    for (const a of cd.acts) {
      const payer = payerOf(a, cd, p);
      const h = cd.horses.get(a.horse);
      todo.push({ id: a.id, club: m.club_id, club_name: m.name, date: a.date || "", kind: a.kind || "", note: a.note || "", price: Number(a.price) || 0,
        horse: h ? { id: h.id, name: h.name } : { id: a.horse || null, name: a.person || "Cheval" }, bill_to: payer.bill_to, payer: payer.name, payer_email: payer.email });
    }
  }
  todo.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const rows = await all<ProInvoiceRow>(db, "SELECT * FROM pro_invoices WHERE user_id = ? ORDER BY issue_date DESC, seq DESC LIMIT 500", user.id);
  return c.json({ profile: p, missing: missingFields(p), clubs: clubs.map((m) => ({ id: m.club_id, name: m.name })), todo, invoices: rows.map((i) => view(i, names.get(i.club_id))) });
});

app.post("/api/pro/factures", requireUser, async (c) => {
  const user = c.get("user")!;
  const b = await c.req.json<Row>().catch(() => ({} as Row));
  const clubId = String(b.club || c.get("club")?.id || "");
  if (!clubId) throw bad("missing_club", "Indiquez le club.");
  const acts = Array.isArray(b.acts) ? b.acts.map(String).slice(0, 200) : null;
  if (acts && !acts.length) throw bad("empty_invoice", "Cochez au moins un acte.");
  const bill = b.bill_to === "club" || b.bill_to === "owner" ? b.bill_to : undefined;
  const made = await invoiceActs(c.env, user.id, clubId, { acts, bill_to: bill });
  if (!made.length) throw bad("nothing_to_invoice", "Ces actes sont déjà facturés ou n'ont pas de prix.");
  const name = (await one<{ name: string }>(c.env.DB, "SELECT name FROM clubs WHERE id = ?", clubId))?.name;
  return c.json({ invoices: made.map((i) => view(i, name)) }, 201);
});

async function mine(c: any): Promise<ProInvoiceRow> {
  const i = await one<ProInvoiceRow>(c.env.DB, "SELECT * FROM pro_invoices WHERE id = ? AND user_id = ?", c.req.param("id"), c.get("user")!.id);
  if (!i) throw notFound("Facture introuvable.");
  return i;
}
const pdfResponse = (pdf: Uint8Array, number: string) => new Response(pdf, { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${number}.pdf"`, "cache-control": "private, no-store" } });

app.get("/api/pro/factures/:id/pdf", requireUser, async (c) => {
  const i = await mine(c);
  const { pdf } = await documents(c.env, i);
  return pdfResponse(pdf, i.number);
});

app.post("/api/pro/factures/:id/payee", requireUser, async (c) => {
  const i = await mine(c);
  const b = await c.req.json<Row>().catch(() => ({} as Row));
  const paid = b.paid === false ? null : (typeof b.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : parisToday());
  await run(c.env.DB, "UPDATE pro_invoices SET paid_at = ? WHERE id = ?", paid, i.id);
  const patch = JSON.stringify({ paid: paid });
  const now = nowIso();
  for (const a of json<string[]>(i.acts, [])) {
    await run(c.env.DB, "UPDATE records SET data = json_patch(data, ?), version = version + 1, updated_by = 'pro-invoicing', updated_at = ? WHERE club_id = ? AND coll = 'proActs' AND id = ?", patch, now, i.club_id, a);
  }
  if (i.incoming_id) await run(c.env.DB, "UPDATE incoming_invoices SET status = ?, updated_at = ? WHERE id = ? AND club_id = ?", paid ? "paid" : "received", now, i.incoming_id, i.club_id);
  return c.json({ invoice: view((await one<ProInvoiceRow>(c.env.DB, "SELECT * FROM pro_invoices WHERE id = ?", i.id))!) });
});

app.post("/api/pro/factures/:id/renvoyer", requireUser, async (c) => {
  const i = await mine(c);
  if (!i.customer_email) throw bad("missing_email", "Ce client n'a pas d'adresse e-mail : téléchargez le PDF pour le lui remettre.");
  const p = await loadProfile(c.env.DB, i.user_id);
  const { pdf } = await documents(c.env, i);
  await mailCustomer(c.env, i, p, pdf);
  await run(c.env.DB, "UPDATE pro_invoices SET sent_at = ?, sent_to = ? WHERE id = ?", nowIso(), i.customer_email, i.id);
  return c.json({ ok: true, sent_to: i.customer_email });
});

// côté club : les factures que ses praticiens lui ont adressées (les factures aux propriétaires restent entre eux)
const BOOKS = requireRole("owner", "manager", "accountant");
app.get("/api/club/factures-praticiens", BOOKS, async (c) => {
  const rows = await all<ProInvoiceRow>(c.env.DB, "SELECT * FROM pro_invoices WHERE club_id = ? AND bill_to = 'club' ORDER BY issue_date DESC, created_at DESC LIMIT 300", c.get("club")!.id);
  return c.json({ invoices: rows.map((i) => view(i)) });
});
app.get("/api/club/factures-praticiens/:id/pdf", BOOKS, async (c) => {
  const i = await one<ProInvoiceRow>(c.env.DB, "SELECT * FROM pro_invoices WHERE id = ? AND club_id = ? AND bill_to = 'club'", c.req.param("id"), c.get("club")!.id);
  if (!i) throw notFound("Facture introuvable.");
  const { pdf } = await documents(c.env, i);
  return pdfResponse(pdf, i.number);
});

export default app;
