/*
 * Description des collections importables : identifiants au format de la démo, champs normalisés,
 * références (ext:) attendues, champs obligatoires, clés de doublon, valeurs par défaut.
 */
import { ageFrom, DAY_SHORT, key, normAmount, normBool, normChip, normDate, normDow, normEmail, normGalop, normHorseSex, normPhone, normSex, normSire, normTime } from "./normalize";

export const COLLS = ["members", "horses", "staff", "coaches", "forfaits", "lessons", "halfboard", "care", "contracts", "competitions", "invoices", "payments", "stock"] as const;
export type Coll = (typeof COLLS)[number];
/** Ordre d'application : ce qui est référencé avant ce qui référence. */
export const ORDER: Coll[] = ["staff", "coaches", "forfaits", "members", "horses", "lessons", "halfboard", "care", "contracts", "competitions", "invoices", "payments", "stock"];

/** Préfixe et largeur des identifiants (m001, h01, s01, c01, f1, l01, dp1, s1, ct1, k1, F-IMP-0001, rg001, k1). */
export const ID_FORMAT: Record<Coll, [string, number]> = {
  members: ["m", 3], horses: ["h", 2], staff: ["s", 2], coaches: ["c", 2], forfaits: ["f", 1], lessons: ["l", 2], halfboard: ["dp", 1],
  care: ["s", 1], contracts: ["ct", 1], competitions: ["k", 1], invoices: ["F-IMP-", 4], payments: ["rg", 3], stock: ["k", 1],
};

/** Collection visée par un champ de référence, par ordre de préférence. */
export const REF_HINTS: Partial<Record<Coll, Record<string, Coll[]>>> = {
  members: { guardians: ["members"], forfait: ["forfaits"] },
  horses: { owner: ["members", "staff", "coaches"] },
  staff: {},
  coaches: { staff: ["staff"] },
  lessons: { riders: ["members"], coach: ["staff", "coaches"], horses: ["horses"] },
  halfboard: { horse: ["horses"], rider: ["members"] },
  care: { horse: ["horses"] },
  contracts: { party: ["members", "staff", "coaches"], horse: ["horses"], signers: ["members", "staff", "coaches"], signed: ["members", "staff", "coaches"] },
  invoices: { member: ["members"] },
  payments: { member: ["members"], invoice: ["invoices"] },
};
/** Pour lessons.horses (objet cavalier → cheval), les clés sont des cavaliers. */
export const KEY_HINTS: Record<string, Coll[]> = { "lessons.horses": ["members"] };

export interface Issue { code: string; message: string; field?: string }
export interface Normalized { data: Record<string, any>; errors: Issue[]; warnings: Issue[] }

const COLORS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)", "var(--c7)"];
const colorFor = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return COLORS[h % COLORS.length]; };

const DATE_FIELDS: Partial<Record<Coll, string[]>> = {
  members: ["birth", "certDate"], horses: ["since", "vacc", "worm", "farrier", "dentist", "osteo"], staff: ["since"], halfboard: ["since"],
  care: ["date", "next"], contracts: ["date"], competitions: ["date", "closes"], invoices: ["date", "due"], payments: ["date"],
};
const AMOUNT_FIELDS: Partial<Record<Coll, string[]>> = {
  members: ["balance"], horses: ["costMonth"], forfaits: ["price", "vat"], coaches: ["rate"], halfboard: ["price"], care: ["cost"],
  contracts: ["amount"], competitions: [], invoices: ["amount", "paid", "rest", "vat"], payments: ["amount"], stock: ["price", "qty", "min", "daily"],
};
const LABEL: Record<string, string> = { birth: "date de naissance", date: "date", due: "échéance", amount: "montant", price: "prix", balance: "solde" };

function fix(d: Record<string, any>, c: Coll, w: Issue[], e: Issue[]) {
  for (const f of DATE_FIELDS[c] || []) {
    if (d[f] == null || d[f] === "") continue;
    const r = normDate(d[f]);
    if (!r.ok) { w.push({ code: "invalid_date", field: f, message: `Date illisible pour « ${LABEL[f] || f} » : ${String(d[f]).slice(0, 40)}. Valeur ignorée.` }); delete d[f]; }
    else d[f] = r.value;
  }
  for (const f of AMOUNT_FIELDS[c] || []) {
    if (d[f] == null || d[f] === "") continue;
    const r = normAmount(d[f]);
    if (!r.ok) { w.push({ code: "invalid_amount", field: f, message: `Montant illisible pour « ${LABEL[f] || f} » : ${String(d[f]).slice(0, 40)}. Valeur ignorée.` }); delete d[f]; }
    else d[f] = r.value;
  }
  for (const f of ["phone", "phone2"]) {
    if (d[f] == null || d[f] === "") continue;
    const r = normPhone(d[f]);
    if (!r.ok) w.push({ code: "invalid_phone", field: f, message: `Numéro de téléphone inhabituel conservé tel quel : ${String(d[f]).slice(0, 30)}.` });
    d[f] = r.value;
  }
  if (d.email != null && d.email !== "") {
    const r = normEmail(d.email);
    if (!r.ok) { w.push({ code: "invalid_email", field: "email", message: `Adresse e-mail invalide ignorée : ${String(d.email).slice(0, 60)}.` }); delete d.email; }
    else d.email = r.value;
  }
  void e;
}

export function normalizeItem(c: Coll, input: Record<string, any>, today = new Date()): Normalized {
  const d: Record<string, any> = JSON.parse(JSON.stringify(input ?? {}));
  delete d.id;
  const w: Issue[] = [], e: Issue[] = [];
  for (const k of Object.keys(d)) { if (typeof d[k] === "string") { d[k] = d[k].trim(); if (d[k] === "") delete d[k]; } }
  fix(d, c, w, e);
  const need = (cond: boolean, field: string, msg: string) => { if (!cond) e.push({ code: "missing_field", field, message: msg }); };
  const person = () => {
    need(!!(d.first || d.last), "last", "Le nom ou le prénom est obligatoire.");
    if (d.first) d.first = String(d.first); if (d.last) d.last = String(d.last);
    if (!d.color) d.color = colorFor(String(d.first || "") + String(d.last || ""));
  };
  switch (c) {
    case "members":
      person();
      if (d.sex != null) d.sex = normSex(d.sex);
      if (d.birth && d.age == null) d.age = ageFrom(d.birth, today);
      if (d.age != null && d.minor == null) d.minor = Number(d.age) < 18;
      if (d.galop != null && typeof d.galop !== "number") d.galop = normGalop(d.galop);
      if (d.lic != null) d.lic = String(d.lic).replace(/\s+/g, "").toUpperCase();
      for (const b of ["cert", "photo", "minor"]) if (d[b] != null && typeof d[b] !== "boolean") d[b] = normBool(d[b]);
      if (d.balance == null) d.balance = 0;
      if (d.address && typeof d.address === "object") for (const k of Object.keys(d.address)) if (d.address[k] == null || d.address[k] === "") delete d.address[k];
      break;
    case "staff": case "coaches": person(); break;
    case "horses": {
      need(!!d.name, "name", "Le nom du cheval est obligatoire.");
      if (d.sire != null) { const r = normSire(d.sire); d.sire = r.value; if (!r.ok) w.push({ code: "invalid_sire", field: "sire", message: `Numéro SIRE ou UELN inhabituel : ${r.value}.` }); }
      if (d.chip != null) { const r = normChip(d.chip); d.chip = r.value; if (!r.ok) w.push({ code: "invalid_chip", field: "chip", message: `Numéro de puce inhabituel (15 chiffres attendus) : ${r.value}.` }); }
      if (d.sex != null) d.sex = normHorseSex(d.sex);
      for (const f of ["born", "height", "age", "weight"]) if (d[f] != null && typeof d[f] !== "number") { const n = parseInt(String(d[f]).replace(/\D/g, ""), 10); if (isFinite(n)) d[f] = n; else delete d[f]; }
      if (d.born && d.age == null) d.age = today.getUTCFullYear() - Number(d.born);
      if (d.pony == null && d.height) d.pony = Number(d.height) <= 148;
      d.kind ||= d.owner ? "proprietaire" : "club";
      d.status ||= "ok"; if (!Array.isArray(d.alerts)) d.alerts = [];
      d.color ||= colorFor(String(d.name || ""));
      break;
    }
    case "forfaits":
      need(!!d.name, "name", "Le nom du forfait est obligatoire.");
      if (d.price == null) w.push({ code: "missing_price", field: "price", message: "Forfait sans tarif : à compléter dans Réglages." });
      break;
    case "lessons": {
      need(!!d.title, "title", "L'intitulé de la reprise est obligatoire.");
      const dow = d.dow != null ? normDow(d.dow) : d.day != null ? normDow(d.day) : null;
      need(dow != null, "dow", "Le jour de la semaine est obligatoire (dow : 0 = dimanche à 6 = samedi).");
      if (dow != null) { d.dow = dow; d.day = DAY_SHORT[dow]; }
      const st = normTime(d.start);
      need(!!st, "start", "L'heure de début est obligatoire au format HH:MM.");
      if (st) d.start = st;
      d.dur = Number(d.dur) > 0 ? Math.round(Number(d.dur)) : 60;
      if (!Array.isArray(d.riders)) d.riders = [];
      if (!d.horses || typeof d.horses !== "object") d.horses = {};
      d.cap = Number(d.cap) > 0 ? Math.round(Number(d.cap)) : Math.max(8, d.riders.length);
      d.wait ??= 0; d.status ||= "prévue";
      break;
    }
    case "halfboard": need(!!d.horse, "horse", "Le cheval est obligatoire."); need(!!d.rider, "rider", "Le cavalier est obligatoire."); d.status ||= "Actif"; break;
    case "care":
      need(!!d.horse, "horse", "Le cheval est obligatoire.");
      need(!!d.kind, "kind", "Le type de soin est obligatoire.");
      need(!!(d.date || d.next), "date", "La date du soin est obligatoire.");
      if (d.time != null) d.time = normTime(d.time) || d.time;
      d.status ||= d.date && d.date > today.toISOString().slice(0, 10) ? "planifié" : "fait";
      break;
    case "contracts": need(!!d.title, "title", "Le titre du contrat est obligatoire."); d.status ||= "signé"; break;
    case "competitions": need(!!d.name, "name", "Le nom du concours est obligatoire."); need(!!d.date, "date", "La date du concours est obligatoire."); break;
    case "invoices":
      need(d.amount != null, "amount", "Le montant de la facture est obligatoire.");
      need(!!d.date, "date", "La date de la facture est obligatoire.");
      if (Array.isArray(d.lines)) for (const l of d.lines) for (const f of ["prix_unitaire_ttc", "total_ttc", "quantite", "tva"]) if (l && typeof l[f] === "string") { const r = normAmount(l[f]); if (r.ok) l[f] = r.value; }
      d.number ||= input?.id || input?.number || null; if (!d.number) delete d.number;
      d.due ||= d.date;
      d.imported = true; d.readonly = true;
      break;
    case "payments":
      need(d.amount != null, "amount", "Le montant du règlement est obligatoire.");
      need(!!d.date, "date", "La date du règlement est obligatoire.");
      d.imported = true; d.readonly = true;
      break;
    case "stock": need(!!d.name, "name", "Le nom de l'article est obligatoire."); break;
  }
  return { data: d, errors: e, warnings: w };
}

/** Clés de doublon (après normalisation) : même e-mail, même nom + naissance ; même SIRE, même puce. */
export function dedupeKeys(c: Coll, d: Record<string, any>): string[] {
  const k: string[] = [];
  if (c === "members" || c === "staff" || c === "coaches") {
    if (d.email) k.push("email:" + d.email);
    if (d.birth && (d.first || d.last)) k.push("nb:" + key(d.last) + "|" + key(d.first) + "|" + d.birth);
    if (c === "members" && d.lic) k.push("lic:" + d.lic);
    if (c !== "members" && !d.email && (d.first || d.last)) k.push("n:" + key(d.last) + "|" + key(d.first));
  } else if (c === "horses") {
    if (d.sire) k.push("sire:" + d.sire);
    if (d.chip) k.push("chip:" + d.chip);
  } else if (c === "forfaits") {
    if (d.name) k.push("name:" + key(d.name));
  } else if (c === "invoices" && d.number) k.push("num:" + key(d.number));
  return k;
}
