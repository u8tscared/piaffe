import type { Role } from "../env";
import { isSingleton } from "./collections";

/**
 * Politique d'accès aux données du club (records), par rôle et par collection, en lecture ET en écriture,
 * avec filtrage par ligne. Principes :
 *  - owner et manager : tout, sauf les verrous légaux (facture émise figée, pas de suppression).
 *  - accountant : rien dans records (il passe par les factures et les exports du lot C).
 *  - staff (employé) : les collections du terrain (chevaux, soins, tâches, stocks, planning, présences, espace employé),
 *    un annuaire réduit des adhérents (prénom, nom, galop, téléphone pour la sécurité), rien de financier.
 *  - coach : ses reprises et ses élèves (avec leurs coordonnées), le reste du planning sans les cavaliers.
 *  - member (adhérent, parent, propriétaire) : sa fiche et sa famille (champ fam), ses chevaux (owner ou demi-pension),
 *    les reprises (sans les coordonnées des autres cavaliers), ses factures, ses contrats, ses fils de messages.
 *    Il ne modifie que quelques champs de sa fiche et ses propres réservations ; solde, forfait, prix restent au serveur.
 * person_ref d'une appartenance : un ou plusieurs ids de fiches séparés par des virgules (parent de plusieurs enfants).
 */

export type Row = Record<string, any>;
export interface PolicyCtx {
  role: Role;
  personIds: Set<string>;   // fiches liées au compte (person_ref)
  family: Set<string>;      // adhérent : ses fiches et celles de sa famille (même fam)
  horses: Set<string>;      // adhérent : chevaux dont la famille est propriétaire ou demi-pensionnaire
  coRiders: Set<string>;    // adhérent : cavaliers des mêmes reprises que sa famille
  coachIds: Set<string>;    // coach : ses ids (c.. et s.. lié)
  students: Set<string>;    // coach : cavaliers de ses reprises et de coachStudents
}

export class PolicyError extends Error {
  constructor(public code: string, message: string, public status = 403) { super(message); }
}
const deny = (msg = "Vous n'avez pas le droit de modifier ces données.") => new PolicyError("forbidden", msg);

// ---------- Contexte ----------
/** Collections nécessaires pour calculer le contexte d'un rôle. */
export function ctxCollections(role: Role): string[] {
  if (role === "member") return ["members", "horses", "halfboard", "lessons"];
  if (role === "coach") return ["coaches", "lessons", "coachStudents"];
  return [];
}

export function buildCtx(role: Role, personRef: string | null, rows: Record<string, Row[]>): PolicyCtx {
  const personIds = new Set((personRef || "").split(",").map((s) => s.trim()).filter(Boolean));
  const ctx: PolicyCtx = { role, personIds, family: new Set(), horses: new Set(), coRiders: new Set(), coachIds: new Set(), students: new Set() };
  if (role === "member") {
    const members = rows.members || [];
    const fams = new Set(members.filter((m) => personIds.has(m.id) && m.fam).map((m) => m.fam));
    for (const id of personIds) ctx.family.add(id);
    for (const m of members) if (m.fam && fams.has(m.fam)) ctx.family.add(m.id);
    for (const h of rows.horses || []) if (h.owner && ctx.family.has(h.owner)) ctx.horses.add(h.id);
    for (const d of rows.halfboard || []) if (d.rider && ctx.family.has(d.rider) && d.horse && !/termin|annul/i.test(String(d.status || ""))) ctx.horses.add(d.horse);
    for (const l of rows.lessons || []) {
      const riders: string[] = Array.isArray(l.riders) ? l.riders : [];
      if (riders.some((r) => ctx.family.has(r))) for (const r of riders) if (!ctx.family.has(r)) ctx.coRiders.add(r);
    }
  }
  if (role === "coach") {
    for (const id of personIds) ctx.coachIds.add(id);
    for (const c of rows.coaches || []) {
      if (personIds.has(c.id) && c.staff) ctx.coachIds.add(c.staff);
      if (c.staff && personIds.has(c.staff)) ctx.coachIds.add(c.id);
    }
    for (const l of rows.lessons || []) if (ctx.coachIds.has(l.coach)) for (const r of l.riders || []) ctx.students.add(r);
    for (const s of rows.coachStudents || []) {
      if (s.coach && !ctx.coachIds.has(s.coach)) continue;
      for (const k of ["member", "rider", "id"]) if (typeof s[k] === "string" && /^m/.test(s[k])) ctx.students.add(s[k]);
    }
  }
  return ctx;
}

// ---------- Outils ----------
const pick = (r: Row, keys: string[]) => { const o: Row = {}; for (const k of keys) if (r[k] !== undefined) o[k] = r[k]; return o; };
/** Reprend les champs protégés de la version précédente (et retire ceux qui n'y étaient pas). */
const protect = (next: Row, prev: Row | null, keys: string[]) => {
  const o: Row = { ...next };
  for (const k of keys) { if (prev && prev[k] !== undefined) o[k] = prev[k]; else delete o[k]; }
  return o;
};
const omit = (r: Row, keys: string[]) => { const o: Row = { ...r }; for (const k of keys) delete o[k]; return o; };
const vals = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : typeof v === "string" ? [v] : []);
const touches = (r: Row | null | undefined, fields: string[], set: Set<string>) => !!r && fields.some((f) => vals(r[f]).some((x) => set.has(x)));

/** Champs qui désignent une personne dans les collections génériques. */
const PERSON_FIELDS = ["member", "rider", "party", "with", "by", "who", "signers", "members", "student", "owner", "for", "child"];
const hasPersonField = (r: Row) => PERSON_FIELDS.some((f) => r[f] !== undefined);

// Projections
const MEMBER_DIRECTORY = ["id", "first", "last", "minor", "galop", "age", "color", "fam", "phone", "photo"];
const MEMBER_STUDENT = ["id", "first", "last", "minor", "galop", "age", "color", "fam", "phone", "email", "forfait", "licence", "cert"];
const MEMBER_PEER = ["id", "first", "last", "color", "galop"];
const STAFF_DIRECTORY = ["id", "first", "last", "role", "color", "dip"];
const COACH_PUBLIC = ["id", "first", "last", "spec", "level", "rate", "rating", "reviews", "ext", "bio", "slots", "color", "staff"];
const HORSE_PUBLIC = ["id", "name", "breed", "pony", "sex", "age", "born", "coat", "height", "kind", "box", "level", "mood", "color", "status"];
const LESSON_SLOT = ["id", "dow", "day", "start", "dur", "title", "coach", "arena", "cap", "kind", "status", "date"];

/** Champs qu'un adhérent peut modifier sur sa fiche (ou celle d'un enfant de sa famille). */
export const MEMBER_EDITABLE = ["phone", "email", "address", "zip", "city", "emergency", "emergencyPhone", "birth", "allergies", "medical", "photo", "avatar", "prefs", "notifications"];

/** Collections du terrain, lues par l'employé. */
const STAFF_READ = new Set([
  "horses", "care", "journal", "journalMore", "tasks", "stock", "equipment", "cameras", "camEvents", "sensors", "alertRules",
  "pharmacy", "practitioners", "breeding", "boxGuests", "boxWait", "lessons", "trackBookings", "competitions", "entries", "entriesMore",
  "vans", "carpool", "shifts", "empShifts", "empTasks", "empCare", "empConsignes", "empIncidents", "empPresence", "empRegister",
  "empNights", "empNotes", "empThreads", "empDocs", "empLeaves", "empHugo", "planExtras", "planHolidays", "planStages", "planVacations",
  "tours", "schedules", "forfaits", "halfboard", "club", "facts", "pensionPlans", "pensionExtras", "walkins", "declarations", "notifs",
]);
/** Collections que l'employé peut modifier. */
const STAFF_WRITE = new Set([
  "horses", "care", "journal", "journalMore", "tasks", "stock", "equipment", "camEvents", "pharmacy", "boxGuests", "lessons",
  "trackBookings", "empTasks", "empCare", "empConsignes", "empIncidents", "empPresence", "empRegister", "empNotes", "empThreads",
  "empLeaves", "walkins", "tours",
]);
/** Champs d'un cheval que seul le gérant change (propriété, statut économique, coût). */
const HORSE_MANAGER_FIELDS = ["owner", "kind", "costMonth"];

/** Collections publiques au sein du club (offres, tarifs, événements) pour adhérents et coachs. */
const CLUB_PUBLIC = new Set([
  "forfaits", "halfboardOffers", "pensionPlans", "pensionExtras", "shopItems", "adhNews", "adhOffers", "adhStages", "camps",
  "clubEvents", "planStages", "planHolidays", "competitions", "club", "vans", "carpool", "reviews", "coachReviews", "trackBookings",
]);

// ---------- Lecture ----------
/** Renvoie l'objet tel que ce rôle a le droit de le voir, ou null s'il ne doit pas le voir. */
export function projectRead(ctx: PolicyCtx, coll: string, r: Row): Row | null {
  const role = ctx.role;
  if (role === "owner" || role === "manager") return r;
  if (role === "accountant") return null;

  if (role === "staff") {
    if (coll === "members") return pick(r, MEMBER_DIRECTORY);
    if (coll === "staff") return ctx.personIds.has(r.id) ? r : pick(r, STAFF_DIRECTORY);
    if (coll === "coaches") return pick(r, COACH_PUBLIC);
    if (coll === "horses") return omit(r, ["costMonth"]);
    if (coll === "halfboard") return omit(r, ["price"]);
    if (coll === "hr") return null;
    return STAFF_READ.has(coll) ? r : null;
  }

  if (role === "coach") {
    if (coll === "lessons") return ctx.coachIds.has(r.coach) ? r : pick(r, LESSON_SLOT);
    if (coll === "members") return ctx.students.has(r.id) ? pick(r, MEMBER_STUDENT) : null;
    if (coll === "coaches") return ctx.coachIds.has(r.id) ? r : pick(r, COACH_PUBLIC);
    if (coll === "staff") return ctx.coachIds.has(r.id) ? r : pick(r, STAFF_DIRECTORY);
    if (coll === "horses") return omit(r, ["costMonth"]);
    if (coll === "entries" || coll === "entriesMore") return ctx.coachIds.has(r.coach) || touches(r, ["rider"], ctx.students) ? r : null;
    if (coll === "journal" || coll === "journalMore") return r;
    if (coll.startsWith("coach") && !isSingleton(coll)) return r.coach === undefined || ctx.coachIds.has(r.coach) ? r : null;
    if (coll === "coachRules" || coll === "coachDeals") return r;
    if (coll === "facts" || CLUB_PUBLIC.has(coll)) return r;
    return null;
  }

  // member
  const fam = ctx.family;
  switch (coll) {
    case "members":
      if (fam.has(r.id)) return r;
      return ctx.coRiders.has(r.id) ? pick(r, MEMBER_PEER) : null;
    case "horses":
      return ctx.horses.has(r.id) ? r : pick(r, HORSE_PUBLIC);
    case "halfboard":
      return fam.has(r.rider) || ctx.horses.has(r.horse) ? r : null;
    case "lessons":
      return r;
    case "invoices": case "creditNotes": case "receipts": case "cards": case "adhInvoices": case "cheques": case "giftcards":
      return touches(r, ["member", "party", "by", "for"], fam) ? r : null;
    case "contracts":
      return touches(r, ["party", "signers"], fam) ? r : null;
    case "threads":
      return touches(r, ["with", "members"], fam) ? r : null;
    case "care": case "journal": case "journalMore":
      return ctx.horses.has(r.horse) ? r : null;
    case "declarations":
      return touches(r, ["by"], fam) ? r : null;
    case "entries": case "entriesMore": case "coachBookings": case "boxRequests":
      return touches(r, ["rider", "member", "by", "who"], fam) ? r : null;
    case "coaches":
      return pick(r, COACH_PUBLIC);
    case "staff":
      return pick(r, ["id", "first", "last", "role", "color"]);
    case "facts":
      return null; // faits de la démo propres au gérant
    case "adhFamily": case "adhResults": case "adhReviews":
      return !hasPersonField(r) || touches(r, PERSON_FIELDS, fam) ? r : null;
  }
  return CLUB_PUBLIC.has(coll) ? r : null;
}

/** true si ce rôle peut lire au moins une partie de la collection (sert au flux de changements). */
export function canReadColl(role: Role, coll: string): boolean {
  if (role === "owner" || role === "manager") return true;
  if (role === "accountant") return false;
  return true; // le filtrage fin se fait ligne par ligne
}

// ---------- Écriture ----------
/** Statuts d'une facture encore modifiable. */
const INVOICE_OPEN = new Set(["brouillon", "à venir", "draft"]);
const INVOICE_LOCKED_FIELDS = ["id", "member", "amount", "vat", "date", "label", "lines", "number", "total", "seller", "buyer"];

/**
 * Prépare l'écriture : renvoie l'objet final à enregistrer (champs protégés repris de la version précédente),
 * ou lève PolicyError. Pour une suppression, next vaut null et la fonction renvoie null si elle est permise.
 */
export function prepareWrite(ctx: PolicyCtx, coll: string, prev: Row | null, next: Row | null): Row | null {
  const role = ctx.role;
  const del = next === null;

  // Verrous valables pour tous les rôles, gérant compris.
  if (coll === "invoices" && prev && !INVOICE_OPEN.has(String(prev.status || ""))) {
    if (del) throw new PolicyError("invoice_locked", "Une facture émise ne peut pas être supprimée. Établissez un avoir.", 422);
    next = protect(next!, prev, INVOICE_LOCKED_FIELDS);
  }

  if (role === "owner" || role === "manager") return next;
  if (role === "accountant") throw deny();

  if (role === "staff") {
    if (!STAFF_WRITE.has(coll)) throw deny();
    if (coll === "horses") {
      if (del || !prev) throw deny("Seul le gérant ajoute ou retire un cheval.");
      return protect(next!, prev, HORSE_MANAGER_FIELDS);
    }
    return next;
  }

  if (role === "coach") {
    if (coll === "lessons") {
      if (prev && !ctx.coachIds.has(prev.coach)) throw deny("Cette reprise n'est pas la vôtre.");
      if (del) return null;
      if (!ctx.coachIds.has(next!.coach)) throw deny("Vous ne pouvez créer que vos propres reprises.");
      return next;
    }
    if ((coll === "journal" || coll === "journalMore") && !del) {
      if (prev && !touches(prev, ["who"], ctx.coachIds)) throw deny();
      return { ...next!, who: prev?.who ?? [...ctx.personIds][0] };
    }
    if (coll === "entries" || coll === "entriesMore") {
      if ((prev && !ctx.coachIds.has(prev.coach)) || (next && !ctx.coachIds.has(next.coach))) throw deny();
      return next;
    }
    if (coll.startsWith("coach") && !isSingleton(coll) && coll !== "coaches" && coll !== "coachReviews") {
      if (prev && prev.coach !== undefined && !ctx.coachIds.has(prev.coach)) throw deny();
      if (next && next.coach !== undefined && !ctx.coachIds.has(next.coach)) throw deny();
      return next;
    }
    if (coll === "coaches" && prev && ctx.coachIds.has(prev.id) && !del) {
      return protect(next!, prev, ["id", "ext", "staff", "rating", "reviews", "rate"]);
    }
    throw deny();
  }

  // ----- member -----
  const fam = ctx.family;
  const first = [...ctx.personIds][0];
  switch (coll) {
    case "members": {
      if (!prev || del || !fam.has(prev.id)) throw deny("Vous ne pouvez modifier que votre fiche et celles de votre famille.");
      return { ...prev, ...pick(next!, MEMBER_EDITABLE) };
    }
    case "lessons":
      if (!prev || del) throw deny();
      return bookLesson(ctx, prev, next!);
    case "trackBookings": {
      if (prev && !fam.has(prev.who)) throw deny();
      if (del) return null;
      if (!fam.has(next!.who)) throw deny("Réservez au nom d'une personne de votre famille.");
      if (next!.horse && !ctx.horses.has(next!.horse)) throw deny("Ce cheval n'est pas le vôtre.");
      return next;
    }
    case "declarations": {
      if (prev && (!fam.has(prev.by) || prev.status !== "en attente")) throw deny("Cette déclaration a déjà été traitée par le club.");
      if (del) return null;
      if (!fam.has(next!.by)) throw deny();
      return { ...next!, status: "en attente" };
    }
    case "threads": {
      if (prev && !touches(prev, ["with", "members"], fam)) throw deny();
      if (del) throw deny();
      if (!touches(next, ["with", "members"], fam)) throw deny();
      return prev ? { ...next!, with: prev.with } : next;
    }
    case "journal": case "journalMore": {
      if (del) throw deny();
      const horse = prev ? prev.horse : next!.horse;
      if (!ctx.horses.has(horse)) throw deny("Ce cheval n'est pas le vôtre.");
      if (prev && !fam.has(prev.who)) throw deny();
      return { ...next!, horse, who: prev ? prev.who : fam.has(next!.who) ? next!.who : first };
    }
    case "contracts": {
      if (!prev || del || !touches(prev, ["party", "signers"], fam)) throw deny();
      return signContract(ctx, prev, next!);
    }
    case "entries": case "entriesMore": case "coachBookings": case "boxRequests": case "adhReviews": case "reviews": {
      const f = coll === "boxRequests" || coll === "reviews" || coll === "adhReviews" ? (next?.by !== undefined || prev?.by !== undefined ? "by" : "member") : coll === "coachBookings" ? "member" : "rider";
      if (prev && !fam.has(prev[f])) throw deny();
      if (del) return null;
      if (!fam.has(next![f])) throw deny();
      return prev ? protect(next!, prev, ["paid", "price", "amount", "fee", "status"]) : omit(next!, ["paid"]);
    }
  }
  throw deny();
}

/** Réservation d'une reprise par un adhérent : il ne peut ajouter ou retirer que des personnes de sa famille. */
function bookLesson(ctx: PolicyCtx, prev: Row, next: Row): Row {
  const fam = ctx.family;
  const pr: string[] = Array.isArray(prev.riders) ? prev.riders : [];
  const nr: string[] = Array.isArray(next.riders) ? next.riders.filter((x: unknown) => typeof x === "string") : pr;
  const added = nr.filter((x) => !pr.includes(x)), removed = pr.filter((x) => !nr.includes(x));
  if ([...added, ...removed].some((x) => !fam.has(x))) throw deny("Vous ne pouvez inscrire ou désinscrire que les personnes de votre famille.");
  const pw: string[] = Array.isArray(prev.waitlist) ? prev.waitlist : [];
  const nw: string[] = Array.isArray(next.waitlist) ? next.waitlist.filter((x: unknown) => typeof x === "string") : pw;
  const wAdded = nw.filter((x) => !pw.includes(x)), wRemoved = pw.filter((x) => !nw.includes(x));
  if ([...wAdded, ...wRemoved].some((x) => !fam.has(x))) throw deny("Vous ne pouvez gérer la liste d'attente que pour votre famille.");
  if (added.length && /annul/i.test(String(prev.status || ""))) throw new PolicyError("lesson_cancelled", "Cette reprise est annulée.", 409);
  const riders = pr.filter((x) => !removed.includes(x)).concat(added);
  const cap = typeof prev.cap === "number" ? prev.cap : Infinity;
  if (added.length && riders.length > cap) throw new PolicyError("lesson_full", "Cette reprise est complète. Inscrivez-vous sur la liste d'attente.", 409);
  const horses: Row = { ...(prev.horses || {}) };
  for (const r of removed) delete horses[r];
  const waitlist = pw.filter((x) => !wRemoved.includes(x) && !added.includes(x)).concat(wAdded.filter((x) => !riders.includes(x)));
  const out: Row = { ...prev, riders, horses };
  if (waitlist.length || prev.waitlist !== undefined) out.waitlist = waitlist;
  return out;
}

/** Signature d'un contrat par un adhérent : seul le champ signed évolue, et seulement pour sa famille. */
function signContract(ctx: PolicyCtx, prev: Row, next: Row): Row {
  const fam = ctx.family;
  const required: string[] = Array.isArray(prev.signers) && prev.signers.length ? prev.signers : [prev.party].filter(Boolean);
  const before: string[] = Array.isArray(prev.signed) ? prev.signed : [];
  const asked: string[] = Array.isArray(next.signed) ? next.signed : before;
  const add = asked.filter((x) => !before.includes(x));
  if (add.some((x) => !fam.has(x) || !required.includes(x))) throw deny("Vous ne pouvez signer que pour vous ou votre enfant.");
  if (asked.length < before.length || before.some((x) => !asked.includes(x))) throw deny("Une signature ne peut pas être retirée.");
  const signed = before.concat(add);
  const status = required.every((x) => signed.includes(x)) ? "signé" : prev.status;
  return { ...prev, signed, status, ...(add.length ? { signedAt: { ...(prev.signedAt || {}), ...Object.fromEntries(add.map((x) => [x, new Date().toISOString()])) } } : {}) };
}
