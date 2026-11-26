import { all } from "../lib/db";
import { newId } from "../lib/ids";
import { planAccess } from "../billing/access";
import { applyBatch } from "../records/store";
import type { Row } from "../records/policy";
import {
  addDays, ClubData, cents, dayIn, daysBetween, dowFromText, dowOf, euros, findOne, fold, isDay, isManager, JOURS, rowDay,
} from "./data";

/**
 * Les outils du connecteur Stabl. Chaque outil lit les données du club connecté (et seulement lui), filtrées par le rôle
 * de la personne qui a relié l'assistant. Les outils de lecture ne modifient rien. Les trois outils d'écriture ajoutent
 * une seule chose précise, exigent confirme: true (que l'assistant ne pose qu'après le « oui » de la personne),
 * passent par la même politique d'accès que l'appli et sont inscrits au journal d'audit.
 *
 * public : "gerant" (propriétaire et gérant) ou "equipe" (gérant et employés).
 */
export interface Tool {
  name: string;
  title: string;
  description: string;
  public: "gerant" | "equipe";
  write?: boolean;
  inputSchema: Row;
  run(d: ClubData, a: Row): Promise<Row>;
}

const O = (props: Row = {}, required?: string[]) => ({ type: "object", properties: props, ...(required ? { required } : {}), additionalProperties: false });
const S = (description: string, extra: Row = {}) => ({ type: "string", description, ...extra });
const I = (description: string, min: number, max: number) => ({ type: "integer", description, minimum: min, maximum: max });
const B = (description: string) => ({ type: "boolean", description });
const CONFIRME = B("Mettre true seulement après avoir récapitulé l'action à la personne et reçu son accord explicite.");
const vide = (conseil: string) => ({ vide: true, conseil });
const clamp = (n: unknown, min: number, max: number, def: number) => { const v = typeof n === "number" && isFinite(n) ? Math.round(n) : def; return Math.max(min, Math.min(max, v)); };
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

class ToolError extends Error {}
const fail = (msg: string): never => { throw new ToolError(msg); };
export { ToolError };

// ---------- Aides métier ----------
const today = (d: ClubData) => dayIn(d.tz);
async function arenaName(d: ClubData, id: unknown) {
  const c = await d.single("club");
  const a = Array.isArray(c?.arenas) ? c!.arenas.find((x: Row) => x && x.id === id) : null;
  return a?.name || (typeof id === "string" ? id : null);
}
/** Séances des reprises entre deux dates : reprise ponctuelle (date) ou hebdomadaire (dow, ou day « Lun »). */
function occurrences(lessons: Row[], from: string, to: string) {
  const out: { date: string; l: Row }[] = [];
  const n = Math.min(62, daysBetween(from, to));
  for (const l of lessons) {
    if (/annul/i.test(String(l.status || "")) && !l.date) continue;
    if (isDay(l.date)) { if (l.date >= from && l.date <= to) out.push({ date: l.date, l }); continue; }
    const dow = typeof l.dow === "number" ? l.dow : dowFromText(l.day);
    if (dow === null) continue;
    for (let i = 0; i <= n; i++) { const day = addDays(from, i); if (dowOf(day) === dow) out.push({ date: day, l }); }
  }
  return out.sort((a, b) => (a.date + (a.l.start || "")).localeCompare(b.date + (b.l.start || "")));
}
const cap = (l: Row) => (typeof l.cap === "number" ? l.cap : null);
const ridersOf = (l: Row) => arr(l.riders);
const waitOf = (l: Row) => arr(l.waitlist);
async function lessonView(d: ClubData, date: string, l: Row, withRiders = false) {
  const r = ridersOf(l), c = cap(l);
  return {
    id: l.id, date, jour: JOURS[dowOf(date)], heure: l.start || null, duree_min: l.dur ?? null, titre: l.title || null,
    moniteur: await d.nameOf(l.coach), piste: await arenaName(d, l.arena), inscrits: r.length, places: c,
    places_libres: c === null ? null : Math.max(0, c - r.length), liste_attente: waitOf(l).length || (typeof l.wait === "number" ? l.wait : 0),
    statut: l.status || null,
    ...(withRiders ? { cavaliers: await Promise.all(r.map(async (id) => ({ id, nom: await d.nameOf(id), cheval: await d.nameOf(l.horses?.[id]) }))) } : {}),
  };
}
function period(a: Row, d: ClubData, defDays: number, maxDays: number) {
  const t = today(d);
  let from = isDay(a.du) ? a.du : t;
  let to = isDay(a.au) ? a.au : addDays(from, defDays);
  if (to < from) [from, to] = [to, from];
  if (daysBetween(from, to) > maxDays) to = addDays(from, maxDays);
  return { from, to, t };
}
const careDone = (c: Row) => /fait|termin|réalis|realis/i.test(String(c.status || ""));
/** Intervalles usuels entre deux soins, pour estimer une échéance quand rien n'est planifié. */
const ROUTINE: { field: string; kind: string; days: number; label: string }[] = [
  { field: "vacc", kind: "Vaccin", days: 365, label: "rappel de vaccin (annuel)" },
  { field: "worm", kind: "Vermifuge", days: 90, label: "vermifuge (environ tous les 3 mois)" },
  { field: "farrier", kind: "Maréchal", days: 42, label: "maréchal (environ toutes les 6 semaines)" },
  { field: "dentist", kind: "Dentiste", days: 365, label: "dentiste (annuel)" },
];

async function invoiceRows(d: ClubData) {
  return all<any>(d.env.DB,
    `SELECT id, kind, number, status, customer_ref, customer_name, label, issue_date, due_date, total_ttc, total_ht, paid_amount, credited_amount, prepaid_amount, reminders_count, last_reminder_at
     FROM invoices WHERE club_id = ? AND issuer = 'club' AND number IS NOT NULL`, d.caller.clubId);
}
const OPEN_TYPED = new Set(["issued", "sent", "partially_paid", "overdue"]);
const UNPAID_REC = /retard|envoy|impay|relanc|partiel/i;

// ---------- Les outils ----------
export const TOOLS: Tool[] = [
  {
    name: "club", title: "Le club en bref", public: "equipe",
    description: "À appeler en premier. Nom et type du club, date du jour, effectifs (chevaux, adhérents, boxes), ce qui demande de l'attention aujourd'hui (chevaux en alerte, soins en retard, stocks sous le minimum, impayés, contrats à signer, concours de la semaine), le rôle de la personne connectée et la liste des outils qu'elle peut utiliser.",
    inputSchema: O(),
    async run(d) {
      const t = today(d), mgr = isManager(d.caller.role);
      const [horses, members, care, stock, lessons, comps] = await Promise.all(["horses", "members", "care", "stock", "lessons", "competitions"].map((c) => d.rows(c)));
      const c = (await d.single("club")) || {};
      const kinds: Row = {};
      for (const h of horses) kinds[h.kind || "autre"] = (kinds[h.kind || "autre"] || 0) + 1;
      const alert = horses.filter((h) => h.status === "bad" || h.status === "warn" || arr(h.alerts).length);
      const late = care.filter((x) => !careDone(x) && isDay(x.date) && x.date < t);
      const todayCare = care.filter((x) => !careDone(x) && x.date === t);
      const low = stock.filter((s) => typeof s.qty === "number" && typeof s.min === "number" && s.qty < s.min);
      const week = occurrences(lessons, t, addDays(t, 6));
      const out: Row = {
        club: d.club?.name || c.name || null, type: d.club?.kind || null, ville: c.city || null, aujourd_hui: t, jour: JOURS[dowOf(t)],
        vous: { role: { owner: "propriétaire du club", manager: "gérant", staff: "employé" }[d.caller.role as string] || d.caller.role, via: d.caller.apiKeyId ? "clé d'API du club" : d.caller.clientName },
        chevaux: { total: horses.length, par_type: kinds, en_alerte: alert.slice(0, 12).map((h) => ({ id: h.id, nom: h.name, box: h.box || null, alertes: arr(h.alerts) })) },
        boxes: typeof c.boxes === "number" ? { total: c.boxes, occupes: horses.filter((h) => h.box).length } : null,
        adherents: mgr ? members.length : undefined,
        reprises_cette_semaine: week.length,
        soins: { en_retard: late.length, aujourd_hui: todayCare.length },
        stocks_sous_le_minimum: low.map((s) => s.name),
        concours_7_jours: comps.filter((k) => isDay(k.date) && k.date >= t && k.date <= addDays(t, 7)).map((k) => ({ id: k.id, nom: k.name, date: k.date, lieu: k.place || null })),
      };
      if (mgr) {
        const imp = await TOOLS.find((x) => x.name === "facturation_impayes")!.run(d, {});
        out.impayes = imp.vide ? { total: 0, nombre: 0 } : { total: imp.total, nombre: imp.nombre };
        const ct = await d.rows("contracts");
        out.contrats_a_signer = ct.filter((x) => /signer|attente/i.test(String(x.status || ""))).length;
      }
      out.outils = toolsFor(d.caller.role, d.caller.scopes).map((x) => x.name);
      if (!horses.length && !members.length) out.conseil = "Le club est encore vide dans Stabl : ajoutez les chevaux et les adhérents, ou importez-les depuis votre ancien logiciel (Réglages › Reprise de données).";
      return out;
    },
  },
  {
    name: "chevaux", title: "Chevaux", public: "equipe",
    description: "Liste des chevaux avec box, type (club, propriétaire, demi-pension), propriétaire, niveau, état et alertes. Filtrer par nom, box, numéro SIRE, type ou état. Avec « cheval » (id ou nom), renvoie la fiche complète : ration, travail, derniers et prochains soins, notes récentes du carnet.",
    inputSchema: O({ cheval: S("Id (h01) ou nom d'un cheval pour sa fiche complète"), recherche: S("Nom, box ou SIRE, ou une partie"), type: S("Type de cheval", { enum: ["club", "proprietaire", "demi"] }), etat: S("Seulement les chevaux en alerte", { enum: ["alerte", "ok"] }), limite: I("Nombre maximum de chevaux (défaut 60)", 1, 200) }),
    async run(d, a) {
      const horses = await d.rows("horses");
      if (!horses.length) return vide("Aucun cheval dans Stabl. Ajoutez-les dans Chevaux, ou importez-les.");
      if (a.cheval) {
        const { hit, many } = findOne(horses, a.cheval, ["name"]);
        if (!hit) return many.length ? { plusieurs: many.map((h) => ({ id: h.id, nom: h.name, box: h.box })) } : { introuvable: a.cheval };
        const t = today(d);
        const care = (await d.rows("care")).filter((c) => c.horse === hit.id);
        const journal = [...(await d.rows("journal")), ...(await d.rows("journalMore"))].filter((j) => j.horse === hit.id).slice(0, 8);
        const { alerts, color, ...fiche } = hit;
        return {
          ...fiche, alertes: arr(alerts), proprietaire_nom: await d.nameOf(hit.owner),
          prochains_soins: care.filter((c) => !careDone(c) && (!isDay(c.date) || c.date >= t)).sort((x, y) => String(x.date).localeCompare(String(y.date))).slice(0, 10),
          soins_en_retard: care.filter((c) => !careDone(c) && isDay(c.date) && c.date < t),
          derniers_soins: care.filter(careDone).sort((x, y) => String(y.date).localeCompare(String(x.date))).slice(0, 10),
          carnet: await Promise.all(journal.map(async (j) => ({ quand: j.when || rowDay(j), par: (await d.nameOf(j.who)) || j.who, texte: j.text, type: j.kind }))),
        };
      }
      let L = horses;
      if (a.recherche) { const q = fold(a.recherche); L = L.filter((h) => [h.name, h.box, h.sire, h.chip].some((v) => fold(v).includes(q))); }
      if (a.type) L = L.filter((h) => h.kind === a.type);
      if (a.etat === "alerte") L = L.filter((h) => h.status === "bad" || h.status === "warn" || arr(h.alerts).length);
      if (a.etat === "ok") L = L.filter((h) => !(h.status === "bad" || h.status === "warn" || arr(h.alerts).length));
      const lim = clamp(a.limite, 1, 200, 60);
      return {
        total: L.length,
        chevaux: await Promise.all(L.slice(0, lim).map(async (h) => ({ id: h.id, nom: h.name, box: h.box || null, type: h.kind || null, race: h.breed || null, age: h.age ?? null, niveau: h.level || null, proprietaire: await d.nameOf(h.owner), etat: h.status || null, alertes: arr(h.alerts) }))),
        autres: Math.max(0, L.length - lim) || undefined,
      };
    },
  },
  {
    name: "soins_a_venir", title: "Soins à venir et en retard", public: "equipe",
    description: "Soins planifiés des prochains jours (vétérinaire, maréchal, vaccins, vermifuges, dentiste, ostéopathe, surveillance) et soins en retard, pour toute l'écurie ou un cheval. Ajoute les échéances estimées d'après la date du dernier vaccin, vermifuge, maréchal ou dentiste quand rien n'est encore planifié.",
    inputSchema: O({ jours: I("Horizon en jours (défaut 14)", 1, 120), cheval: S("Id ou nom d'un cheval") }),
    async run(d, a) {
      const t = today(d), until = addDays(t, clamp(a.jours, 1, 120, 14));
      let horses = await d.rows("horses");
      let care = await d.rows("care");
      if (a.cheval) {
        const { hit } = findOne(horses, a.cheval, ["name"]);
        if (!hit) return { introuvable: a.cheval };
        horses = [hit]; care = care.filter((c) => c.horse === hit.id);
      }
      const hn = new Map(horses.map((h) => [h.id, h]));
      const view = (c: Row) => ({ id: c.id, cheval: hn.get(c.horse)?.name || c.horse, box: hn.get(c.horse)?.box || null, type: c.kind, date: c.date, heure: c.time || null, intervenant: c.who || null, note: c.note || null, statut: c.status || null });
      const open = care.filter((c) => !careDone(c) && hn.has(c.horse));
      const late = open.filter((c) => isDay(c.date) && c.date < t);
      const next = open.filter((c) => !isDay(c.date) || (c.date >= t && c.date <= until)).sort((x, y) => String(x.date).localeCompare(String(y.date)));
      const estimees: Row[] = [];
      for (const h of horses) for (const r of ROUTINE) {
        if (!isDay(h[r.field])) continue;
        const due = addDays(h[r.field], r.days);
        if (due > until) continue;
        if (open.some((c) => c.horse === h.id && fold(c.kind).startsWith(fold(r.kind).slice(0, 5)))) continue;
        estimees.push({ cheval: h.name, box: h.box || null, soin: r.label, dernier: h[r.field], echeance_estimee: due, en_retard: due < t });
      }
      estimees.sort((x, y) => x.echeance_estimee.localeCompare(y.echeance_estimee));
      if (!care.length && !estimees.length) return vide("Aucun soin dans Stabl. Ajoutez-les dans Soins, ou dans la fiche de chaque cheval.");
      return { du: t, au: until, en_retard: late.map(view), a_venir: next.map(view), echeances_estimees: estimees.slice(0, 60) };
    },
  },
  {
    name: "pensions", title: "Pensions et demi-pensions", public: "gerant",
    description: "Chevaux en pension avec leur propriétaire, box, formule et tarif, contrats de pension, demi-pensions en cours (cavalier, jours, tarif), formules proposées, occupation des boxes et liste d'attente.",
    inputSchema: O(),
    async run(d) {
      const [horses, half, plans, contracts, wait] = await Promise.all(["horses", "halfboard", "pensionPlans", "contracts", "boxWait"].map((c) => d.rows(c)));
      const c = (await d.single("club")) || {};
      const own = horses.filter((h) => h.owner || h.kind === "proprietaire" || h.kind === "demi");
      if (!own.length && !half.length && !plans.length) return vide("Aucune pension dans Stabl : indiquez le propriétaire dans la fiche du cheval et ajoutez vos formules dans Pensions.");
      const planOf = (h: Row) => plans.find((p) => p.id === (h.pension || h.plan || h.formule));
      return {
        chevaux_en_pension: await Promise.all(own.map(async (h) => {
          const p = planOf(h);
          const ct = contracts.find((x) => x.horse === h.id && /pension/i.test(String(x.title || "")));
          return { id: h.id, cheval: h.name, box: h.box || null, proprietaire: await d.nameOf(h.owner), formule: p?.name || h.pension || null, tarif_mensuel: p ? euros(p.price) : null, contrat: ct ? { titre: ct.title, statut: ct.status, montant: euros(ct.amount) } : null };
        })),
        demi_pensions: await Promise.all(half.map(async (x) => ({ id: x.id, cheval: await d.nameOf(x.horse), cavalier: await d.nameOf(x.rider), jours: arr(x.days), tarif_mensuel: euros(x.price), statut: x.status || null, depuis: x.since || null }))),
        formules: plans.map((p) => ({ id: p.id, nom: p.name, tarif_mensuel: euros(p.price), comprend: arr(p.inc) })),
        boxes: typeof c.boxes === "number" ? { total: c.boxes, occupes: horses.filter((h) => h.box).length, libres: Math.max(0, c.boxes - horses.filter((h) => h.box).length) } : null,
        liste_attente: wait.map((w) => ({ nom: w.name, cheval: w.horse, formule: plans.find((p) => p.id === w.plan)?.name || w.plan || null, a_partir_du: w.from || null, inscrit_le: w.since || null })),
        recette_mensuelle_estimee: Math.round(own.reduce((s, h) => s + euros(planOf(h)?.price), 0) + half.filter((x) => !/termin|annul/i.test(String(x.status || ""))).reduce((s, x) => s + euros(x.price), 0)),
      };
    },
  },
  {
    name: "adherents", title: "Adhérents", public: "equipe",
    description: "Adhérents et cavaliers : nombre, recherche par nom, filtres (licence à renouveler, certificat médical manquant, solde négatif, forfait, mineurs). Avec « adherent » (id ou nom), la fiche : famille, forfait, galop, licence, solde, reprises de la semaine. Pour un employé : annuaire réduit (nom, galop, téléphone).",
    inputSchema: O({ adherent: S("Id (m001) ou nom pour la fiche"), recherche: S("Nom ou prénom, ou une partie"), filtre: S("Filtre", { enum: ["licence_a_renouveler", "certificat_manquant", "solde_negatif", "mineurs", "majeurs"] }), forfait: S("Id ou nom de forfait"), limite: I("Nombre maximum (défaut 50)", 1, 200) }),
    async run(d, a) {
      const members = await d.rows("members");
      if (!members.length) return vide("Aucun adhérent dans Stabl. Ajoutez-les dans Adhérents, ou importez-les depuis votre ancien logiciel.");
      const forfaits = await d.rows("forfaits");
      const fName = (id: unknown) => forfaits.find((f) => f.id === id)?.name || id || null;
      const t = today(d);
      if (a.adherent) {
        const { hit, many } = findOne(members, a.adherent, ["first", "last"]);
        if (!hit) return many.length ? { plusieurs: many.map((m) => ({ id: m.id, nom: [m.first, m.last].join(" ") })) } : { introuvable: a.adherent };
        const fam = hit.fam ? members.filter((m) => m.fam === hit.fam && m.id !== hit.id) : [];
        const week = occurrences(await d.rows("lessons"), t, addDays(t, 6)).filter((o) => ridersOf(o.l).includes(hit.id));
        const { color, ...fiche } = hit;
        return { ...fiche, forfait_nom: fName(hit.forfait), famille: fam.map((m) => ({ id: m.id, nom: [m.first, m.last].join(" "), age: m.age ?? null })), reprises_semaine: await Promise.all(week.map((o) => lessonView(d, o.date, o.l))) };
      }
      let L = members;
      if (a.recherche) { const q = fold(a.recherche); L = L.filter((m) => fold([m.first, m.last].join(" ")).includes(q) || fold([m.last, m.first].join(" ")).includes(q)); }
      if (a.filtre === "licence_a_renouveler") L = L.filter((m) => m.licence !== undefined && !/^\d{4}$/.test(String(m.licence)));
      if (a.filtre === "certificat_manquant") L = L.filter((m) => m.cert === false);
      if (a.filtre === "solde_negatif") L = L.filter((m) => typeof m.balance === "number" && m.balance < 0);
      if (a.filtre === "mineurs") L = L.filter((m) => m.minor === true);
      if (a.filtre === "majeurs") L = L.filter((m) => m.minor === false);
      if (a.forfait) { const f = findOne(forfaits, a.forfait, ["name"]).hit; L = L.filter((m) => m.forfait === (f ? f.id : a.forfait)); }
      const lim = clamp(a.limite, 1, 200, 50);
      const mgr = isManager(d.caller.role);
      return {
        total_club: members.length, trouves: L.length,
        ...(mgr && a.filtre === "solde_negatif" ? { total_du: euros(-L.reduce((s, m) => s + euros(m.balance), 0)) } : {}),
        adherents: L.slice(0, lim).map((m) => ({ id: m.id, nom: [m.first, m.last].filter(Boolean).join(" "), age: m.age ?? null, galop: m.galop ?? null, telephone: m.phone || null,
          ...(mgr ? { email: m.email || null, forfait: fName(m.forfait), licence: m.licence ?? null, certificat: m.cert ?? null, solde: m.balance === undefined ? null : euros(m.balance) } : {}) })),
        autres: Math.max(0, L.length - lim) || undefined,
      };
    },
  },
  {
    name: "planning", title: "Planning", public: "equipe",
    description: "Planning jour par jour sur une période (défaut : aujourd'hui et les 6 jours suivants, 31 jours au plus) : reprises avec moniteur, piste, inscrits et places libres, réservations de pistes, soins et concours. Sur un seul jour, donne aussi la liste des cavaliers et leurs chevaux.",
    inputSchema: O({ du: S("Premier jour, AAAA-MM-JJ (défaut : aujourd'hui)"), au: S("Dernier jour, AAAA-MM-JJ") }),
    async run(d, a) {
      const { from, to } = period(a, d, 6, 31);
      const one = from === to;
      const occ = occurrences(await d.rows("lessons"), from, to);
      const tracks = (await d.rows("trackBookings")).filter((b) => isDay(b.date) && b.date >= from && b.date <= to);
      const care = (await d.rows("care")).filter((c) => isDay(c.date) && c.date >= from && c.date <= to && !careDone(c));
      const comps = (await d.rows("competitions")).filter((k) => isDay(k.date) && k.date >= from && k.date <= to);
      if (!occ.length && !tracks.length && !care.length && !comps.length) return { du: from, au: to, ...vide("Rien au planning sur cette période. Les reprises s'ajoutent dans Planning.") };
      const jours: Row[] = [];
      for (let i = 0; i <= daysBetween(from, to); i++) {
        const day = addDays(from, i);
        const L = occ.filter((o) => o.date === day);
        const T = tracks.filter((b) => b.date === day), C = care.filter((c) => c.date === day), K = comps.filter((k) => k.date === day);
        if (!L.length && !T.length && !C.length && !K.length) continue;
        jours.push({
          date: day, jour: JOURS[dowOf(day)],
          reprises: await Promise.all(L.map((o) => lessonView(d, o.date, o.l, one))),
          pistes_reservees: await Promise.all(T.map(async (b) => ({ piste: await arenaName(d, b.arena), de: b.from, a: b.to, qui: await d.nameOf(b.who), cheval: await d.nameOf(b.horse) }))),
          soins: await Promise.all(C.map(async (c) => ({ cheval: await d.nameOf(c.horse), type: c.kind, heure: c.time || null, intervenant: c.who || null }))),
          concours: K.map((k) => ({ id: k.id, nom: k.name, lieu: k.place || null })),
        });
      }
      return { du: from, au: to, jours };
    },
  },
  {
    name: "reservations", title: "Places et réservations", public: "equipe",
    description: "Où reste-t-il de la place ? Reprises de la période avec places libres (filtrer par niveau, discipline ou jour), reprises complètes avec liste d'attente, et réservations de pistes par les propriétaires. Utile avant de proposer un rattrapage ou d'inscrire un cavalier avec l'outil reserver_place.",
    inputSchema: O({ du: S("Premier jour, AAAA-MM-JJ (défaut : aujourd'hui)"), au: S("Dernier jour (défaut : 6 jours après)"), niveau: S("Mot du titre de la reprise : galop 3, baby, CSO, adultes…"), jour: S("Jour de la semaine : lundi, mardi…") }),
    async run(d, a) {
      const { from, to } = period(a, d, 6, 31);
      let occ = occurrences(await d.rows("lessons"), from, to);
      if (!occ.length) return { du: from, au: to, ...vide("Aucune reprise au planning sur cette période.") };
      if (a.niveau) { const q = fold(a.niveau); occ = occ.filter((o) => fold(o.l.title).includes(q) || fold(o.l.level).includes(q)); }
      const dj = dowFromText(a.jour);
      if (dj !== null) occ = occ.filter((o) => dowOf(o.date) === dj);
      const views = await Promise.all(occ.map((o) => lessonView(d, o.date, o.l)));
      const tracks = (await d.rows("trackBookings")).filter((b) => isDay(b.date) && b.date >= from && b.date <= to);
      return {
        du: from, au: to,
        avec_places: views.filter((v) => v.places_libres === null || v.places_libres > 0),
        completes: views.filter((v) => v.places_libres === 0).map((v) => ({ id: v.id, date: v.date, heure: v.heure, titre: v.titre, liste_attente: v.liste_attente })),
        pistes_reservees: await Promise.all(tracks.map(async (b) => ({ date: b.date, piste: await arenaName(d, b.arena), de: b.from, a: b.to, qui: await d.nameOf(b.who), cheval: await d.nameOf(b.horse) }))),
        note: "Les reprises hebdomadaires gardent les mêmes inscrits chaque semaine : une place libre vaut pour toutes les semaines de la période.",
      };
    },
  },
  {
    name: "facturation_impayes", title: "Impayés", public: "gerant",
    description: "Factures échues et non réglées : total dû, nombre, répartition par ancienneté (moins de 30 jours, 31 à 60, plus de 60), et pour chaque facture le client, le reste à payer, l'échéance, les jours de retard et le nombre de relances. Filtrer par ancienneté minimale ou par adhérent.",
    inputSchema: O({ anciennete_min_jours: I("Seulement les factures en retard d'au moins N jours", 0, 3650), adherent: S("Id ou nom d'un adhérent"), limite: I("Nombre maximum de factures listées (défaut 50)", 1, 200) }),
    async run(d, a) {
      const t = today(d), min = clamp(a.anciennete_min_jours, 0, 3650, 0);
      const list: Row[] = [];
      const typed = await invoiceRows(d);
      const numbers = new Set(typed.map((x) => x.number));
      for (const x of typed) {
        if (x.kind === "credit_note" || !OPEN_TYPED.has(x.status)) continue;
        const reste = x.total_ttc - x.paid_amount - x.credited_amount - x.prepaid_amount;
        if (reste <= 0 || !isDay(x.due_date) || x.due_date >= t) continue;
        list.push({ numero: x.number, client: x.customer_name || (await d.nameOf(x.customer_ref)), client_id: x.customer_ref, libelle: x.label, montant: cents(x.total_ttc), reste: cents(reste), echeance: x.due_date, jours_de_retard: daysBetween(x.due_date, t), relances: x.reminders_count, derniere_relance: x.last_reminder_at });
      }
      for (const x of await d.rows("invoices")) {
        if (numbers.has(x.id) || numbers.has(x.number)) continue;
        const due = isDay(x.due) ? x.due : isDay(x.date) ? x.date : null;
        if (!UNPAID_REC.test(String(x.status || "")) || !due || due >= t) continue;
        const reste = euros(x.left ?? (euros(x.amount) - euros(x.paid)));
        if (reste <= 0) continue;
        list.push({ numero: x.number || x.id, client: await d.nameOf(x.member), client_id: x.member || null, libelle: x.label || null, montant: euros(x.amount), reste, echeance: due, jours_de_retard: daysBetween(due, t), relances: x.reminders ?? null, moyen: x.method || null });
      }
      let L = list.filter((x) => x.jours_de_retard >= min);
      if (a.adherent) {
        const { hit } = findOne(await d.rows("members"), a.adherent, ["first", "last"]);
        L = L.filter((x) => (hit ? x.client_id === hit.id : fold(x.client).includes(fold(a.adherent))));
      }
      if (!L.length) return list.length ? { total: 0, nombre: 0, conseil: "Aucune facture ne correspond à ce filtre." } : { total: 0, nombre: 0, vide: true, conseil: "Aucune facture en retard dans Stabl." };
      L.sort((x, y) => y.jours_de_retard - x.jours_de_retard);
      const sum = (f: (x: Row) => boolean) => Math.round(L.filter(f).reduce((s, x) => s + x.reste, 0) * 100) / 100;
      const lim = clamp(a.limite, 1, 200, 50);
      const byClient = new Map<string, number>();
      for (const x of L) byClient.set(x.client || "?", (byClient.get(x.client || "?") || 0) + x.reste);
      return {
        total: sum(() => true), nombre: L.length,
        par_anciennete: { moins_de_30_jours: sum((x) => x.jours_de_retard <= 30), de_31_a_60_jours: sum((x) => x.jours_de_retard > 30 && x.jours_de_retard <= 60), plus_de_60_jours: sum((x) => x.jours_de_retard > 60) },
        plus_gros_debiteurs: [...byClient.entries()].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([client, du]) => ({ client, du: Math.round(du * 100) / 100 })),
        factures: L.slice(0, lim), autres: Math.max(0, L.length - lim) || undefined,
      };
    },
  },
  {
    name: "chiffre_affaires", title: "Chiffre d'affaires", public: "gerant",
    description: "Chiffre d'affaires facturé d'un mois (TTC et HT quand il est connu), comparé au mois précédent et au même mois de l'an dernier, encaissements du mois par moyen de paiement, et l'évolution sur les 12 derniers mois.",
    inputSchema: O({ mois: S("Mois AAAA-MM (défaut : le mois en cours)") }),
    async run(d, a) {
      const t = today(d);
      const mois = typeof a.mois === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(a.mois) ? a.mois : t.slice(0, 7);
      const shift = (m: string, n: number) => { const [y, mo] = m.split("-").map(Number); const x = new Date(Date.UTC(y, mo - 1 + n, 1)); return x.toISOString().slice(0, 7); };
      const typed = (await invoiceRows(d)).filter((x) => x.status !== "draft" && isDay(x.issue_date));
      const recs = typed.length ? [] : (await d.rows("invoices")).filter((x) => isDay(x.date) && !/brouillon|annul|draft/i.test(String(x.status || "")));
      const months = new Map<string, { ttc: number; ht: number | null; n: number }>();
      const add = (m: string, ttc: number, ht: number | null) => { const o = months.get(m) || { ttc: 0, ht: 0, n: 0 }; o.ttc += ttc; o.ht = o.ht === null || ht === null ? null : o.ht + ht; o.n++; months.set(m, o); };
      for (const x of typed) { const sg = x.kind === "credit_note" ? -1 : 1; add(x.issue_date.slice(0, 7), sg * cents(x.total_ttc), sg * cents(x.total_ht)); }
      for (const x of recs) { const ttc = euros(x.amount); const vat = typeof x.vat === "number" ? x.vat : null; add(x.date.slice(0, 7), ttc, vat === null ? null : ttc / (1 + vat / 100)); }
      if (!months.size) return vide("Aucune facture émise dans Stabl pour le moment.");
      const r2 = (n: number | null) => (n === null ? null : Math.round(n * 100) / 100);
      const get = (m: string) => { const o = months.get(m); return o ? { mois: m, ttc: r2(o.ttc), ht: r2(o.ht), factures: o.n } : { mois: m, ttc: 0, ht: 0, factures: 0 }; };
      const cur = get(mois), prev = get(shift(mois, -1)), ly = get(shift(mois, -12));
      const pct = (a2: number | null, b: number | null) => (a2 !== null && b ? Math.round(((a2 - b) / b) * 1000) / 10 : null);
      const pays = await all<{ method: string; total: number; n: number }>(d.env.DB,
        "SELECT method, SUM(amount) AS total, COUNT(*) AS n FROM invoice_payments WHERE club_id = ? AND substr(paid_at, 1, 7) = ? GROUP BY method", d.caller.clubId, mois);
      const MOYENS: Row = { card: "carte", sepa: "prélèvement SEPA", transfer: "virement", check: "chèque", cash: "espèces", ancv: "chèques-vacances ANCV", pass_sport: "Pass'Sport", other: "autre" };
      return {
        mois: cur, mois_precedent: { ...prev, evolution_pct: pct(cur.ttc, prev.ttc) }, meme_mois_an_dernier: { ...ly, evolution_pct: pct(cur.ttc, ly.ttc) },
        encaissements_du_mois: pays.length ? { total: r2(pays.reduce((s, p) => s + cents(p.total), 0)), par_moyen: pays.map((p) => ({ moyen: MOYENS[p.method] || p.method, montant: cents(p.total), nombre: p.n })) } : null,
        douze_mois: Array.from({ length: 12 }, (_, i) => get(shift(mois, i - 11))),
        source: typed.length ? "factures émises dans Stabl" : "factures saisies ou importées dans Stabl",
        en_cours: mois === t.slice(0, 7) ? "Le mois n'est pas terminé : comparez avec prudence." : undefined,
      };
    },
  },
  {
    name: "presences", title: "Présences", public: "equipe",
    description: "Qui est là aujourd'hui dans l'équipe (arrivée, poste, absences), et pour un jour donné les reprises avec les cavaliers inscrits, présents et absents quand l'appel a été fait.",
    inputSchema: O({ date: S("Jour AAAA-MM-JJ (défaut : aujourd'hui)") }),
    async run(d, a) {
      const t = today(d), day = isDay(a.date) ? a.date : t;
      const pres = day === t ? await d.rows("empPresence") : [];
      const ST: Row = { in: "présent", later: "arrive plus tard", off: "absent", out: "parti" };
      const occ = occurrences(await d.rows("lessons"), day, day);
      const reprises = await Promise.all(occ.map(async (o) => {
        const l = o.l, r = ridersOf(l);
        const presentList = Array.isArray(l.present) ? arr(l.present) : l.attendance && typeof l.attendance === "object" ? Object.keys(l.attendance).filter((k) => l.attendance[k]) : null;
        return { ...(await lessonView(d, day, l)), appel_fait: presentList !== null,
          presents: presentList ? await Promise.all(presentList.map((id) => d.nameOf(id))) : undefined,
          absents: presentList ? await Promise.all(r.filter((x) => !presentList.includes(x)).map((id) => d.nameOf(id))) : undefined };
      }));
      if (!pres.length && !reprises.length) return { date: day, ...vide("Aucune présence enregistrée pour ce jour.") };
      return { date: day, equipe: await Promise.all(pres.map(async (p) => ({ nom: await d.nameOf(p.id), etat: ST[p.st] || p.st || null, detail: p.txt || null }))), reprises };
    },
  },
  {
    name: "stocks", title: "Stocks", public: "equipe",
    description: "Foin, paille, litière, aliments, produits de soin : quantité, minimum, consommation par jour, nombre de jours restants, produits sous le minimum et quantité à commander pour tenir 30 jours, avec le fournisseur et le coût estimé.",
    inputSchema: O({ produit: S("Nom du produit, ou une partie") }),
    async run(d, a) {
      let L = await d.rows("stock");
      if (!L.length) return vide("Aucun stock suivi dans Stabl. Ajoutez vos produits dans Stocks.");
      if (a.produit) { const q = fold(a.produit); L = L.filter((s) => fold(s.name).includes(q)); if (!L.length) return { introuvable: a.produit }; }
      const rows = L.map((s) => {
        const qty = typeof s.qty === "number" ? s.qty : null, min = typeof s.min === "number" ? s.min : null, daily = typeof s.daily === "number" ? s.daily : null;
        const jours = qty !== null && daily ? Math.floor(qty / daily) : null;
        const need = qty !== null ? Math.max(0, Math.ceil((daily || 0) * 30 + (min || 0) - qty)) : null;
        return { produit: s.name, unite: s.unit || null, quantite: qty, minimum: min, par_jour: daily, jours_restants: jours, sous_le_minimum: qty !== null && min !== null && qty < min,
          a_commander_pour_30_jours: need, fournisseur: s.supplier || null, prix_unitaire: s.price === undefined ? null : euros(s.price), cout_commande: need && typeof s.price === "number" ? Math.round(need * s.price * 100) / 100 : null };
      });
      rows.sort((x, y) => (x.jours_restants ?? 1e9) - (y.jours_restants ?? 1e9));
      return { sous_le_minimum: rows.filter((r) => r.sous_le_minimum).map((r) => r.produit), produits: rows };
    },
  },
  {
    name: "equipe", title: "L'équipe", public: "equipe",
    description: "Les salariés et moniteurs : prénom, nom, poste, diplômes, contrat et heures hebdomadaires (pour le gérant), coachs extérieurs, et congés à venir. Sans salaire ni donnée personnelle.",
    inputSchema: O(),
    async run(d) {
      const [staff, coaches, leaves, empLeaves] = await Promise.all(["staff", "coaches", "leaves", "empLeaves"].map((c) => d.rows(c)));
      if (!staff.length && !coaches.length) return vide("Aucune fiche d'équipe dans Stabl. Ajoutez vos salariés dans Équipe.");
      const t = today(d), mgr = isManager(d.caller.role);
      const conges = [...leaves, ...empLeaves].filter((l) => { const dd = rowDay(l) || (isDay(l.to) ? l.to : null); return !dd || dd >= t || (isDay(l.to) && l.to >= t); }).slice(0, 30);
      return {
        salaries: staff.map((s) => ({ id: s.id, nom: [s.first, s.last].filter(Boolean).join(" "), poste: s.role || null, diplomes: s.dip || null, ...(mgr ? { contrat: s.contract || null, heures_semaine: s.hours ?? null } : {}) })),
        coachs_exterieurs: coaches.filter((c) => c.ext).map((c) => ({ id: c.id, nom: [c.first, c.last].join(" "), specialite: c.spec || null, tarif_heure: c.rate === undefined ? null : euros(c.rate) })),
        conges_a_venir: await Promise.all(conges.map(async (l) => ({ qui: (await d.nameOf(l.who || l.staff || l.id)) || l.name || null, du: l.from || l.start || rowDay(l), au: l.to || l.end || null, motif: l.kind || l.type || l.reason || null, statut: l.status || null }))),
      };
    },
  },
  {
    name: "competitions", title: "Concours", public: "equipe",
    description: "Concours à venir et récents : date, lieu, discipline, niveau, clôture des engagements, couples engagés (cavalier, cheval, épreuve, coach, transport), frais d'engagement à refacturer et résultats. Avec « concours » (id ou nom), le détail d'un seul concours.",
    inputSchema: O({ concours: S("Id (k1) ou nom d'un concours"), passes_jours: I("Inclure les concours terminés depuis N jours (défaut 30)", 0, 365) }),
    async run(d, a) {
      let comps = await d.rows("competitions");
      if (!comps.length) return vide("Aucun concours dans Stabl. Ajoutez-les dans Concours.");
      const entries = [...(await d.rows("entries")), ...(await d.rows("entriesMore"))];
      const t = today(d);
      if (a.concours) { const { hit } = findOne(comps, a.concours, ["name", "place"]); if (!hit) return { introuvable: a.concours }; comps = [hit]; }
      else { const since = addDays(t, -clamp(a.passes_jours, 0, 365, 30)); comps = comps.filter((k) => !isDay(k.date) || k.date >= since); }
      comps.sort((x, y) => String(x.date).localeCompare(String(y.date)));
      const mgr = isManager(d.caller.role);
      return {
        concours: await Promise.all(comps.map(async (k) => {
          const E = entries.filter((e) => e.comp === k.id);
          return { id: k.id, nom: k.name, date: k.date, lieu: k.place || null, km: k.km ?? null, discipline: k.disc || null, niveau: k.level || null, cloture_engagements: k.closes || null, statut: k.status || null, a_venir: isDay(k.date) ? k.date >= t : null,
            engages: await Promise.all(E.map(async (e) => ({ cavalier: await d.nameOf(e.rider), cheval: await d.nameOf(e.horse), epreuve: e.class || null, coach: await d.nameOf(e.coach), transport: e.transport || null, ...(mgr ? { frais: e.fee === undefined ? null : euros(e.fee) } : {}) }))),
            nombre_engages: E.length || k.entries || 0, ...(mgr ? { frais_a_refacturer: Math.round(E.reduce((s, e) => s + euros(e.fee), 0) * 100) / 100 } : {}), resultats: k.results || null };
        })),
      };
    },
  },
  {
    name: "contrats", title: "Contrats", public: "gerant",
    description: "Contrats du club (pension, demi-pension, inscription, autorisation parentale, travail) : ceux qui attendent une signature et qui doit encore signer, brouillons, et contrats signés récents.",
    inputSchema: O({ statut: S("Filtre", { enum: ["a_signer", "brouillon", "signe", "tous"] }) }),
    async run(d, a) {
      const L = await d.rows("contracts");
      if (!L.length) return vide("Aucun contrat dans Stabl. Créez-les depuis Contrats, à partir des modèles.");
      const st = a.statut || "a_signer";
      const match = (c: Row) => st === "tous" || (st === "a_signer" ? /signer|attente/i.test(String(c.status || "")) : st === "brouillon" ? /brouillon/i.test(String(c.status || "")) : /^sign/i.test(String(c.status || "")));
      return {
        filtre: st,
        contrats: await Promise.all(L.filter(match).map(async (c) => {
          const need = arr(c.signers).length ? arr(c.signers) : [c.party].filter(Boolean);
          const signed = arr(c.signed);
          return { id: c.id, titre: c.title, pour: await d.nameOf(c.party), cheval: await d.nameOf(c.horse), statut: c.status || null, date: c.date || null, montant: c.amount === undefined ? null : euros(c.amount),
            reste_a_signer: /^sign/i.test(String(c.status || "")) ? [] : await Promise.all(need.filter((x) => !signed.includes(x)).map((x) => d.nameOf(x))) };
        })),
      };
    },
  },
  {
    name: "taches", title: "Tâches du jour", public: "equipe",
    description: "Tâches de l'écurie (distribution, curage, paddocks, soins, entretien) : faites, à faire, urgentes, avec la personne chargée et l'heure. Filtrer par personne.",
    inputSchema: O({ qui: S("Id ou nom d'un salarié") }),
    async run(d, a) {
      let L = await d.rows("tasks");
      if (!L.length) return vide("Aucune tâche dans Stabl. Ajoutez-les dans Tâches.");
      if (a.qui) { const { hit } = findOne(await d.rows("staff"), a.qui, ["first", "last"]); L = L.filter((x) => (hit ? x.who === hit.id : false)); }
      const v = async (x: Row) => ({ id: x.id, tache: x.title, lieu: x.zone || null, heure: x.time || null, qui: await d.nameOf(x.who), type: x.kind || null, urgent: !!x.urgent, faite: !!x.done });
      const all2 = await Promise.all(L.map(v));
      return { a_faire: all2.filter((x) => !x.faite), faites: all2.filter((x) => x.faite), urgentes: all2.filter((x) => x.urgent && !x.faite).map((x) => x.tache) };
    },
  },

  // ---------- Écriture (sûre et explicite) ----------
  {
    name: "ajouter_soin", title: "Ajouter un soin", public: "equipe", write: true,
    description: "Ajoute UN soin au registre d'un cheval (vétérinaire, maréchal, vaccin, vermifuge, dentiste, ostéopathe, surveillance ou autre), planifié ou déjà fait. Écrit dans Stabl : avant d'appeler, récapitule à la personne le cheval, le soin, la date et l'intervenant, attends son accord explicite, puis appelle avec confirme: true. Ne supprime et ne modifie rien d'autre.",
    inputSchema: O({ cheval: S("Id (h01) ou nom exact du cheval"), type: S("Type de soin", { enum: ["Vétérinaire", "Maréchal", "Vaccin", "Vermifuge", "Dentiste", "Ostéopathe", "Surveillance", "Autre"] }), date: S("Jour AAAA-MM-JJ (défaut : aujourd'hui)"), heure: S("Heure, ex. 14:00"), intervenant: S("Qui fait le soin : Dr Leclerc, Benoît Gautier, l'équipe…"), note: S("Détail : produit, motif, consigne"), statut: S("planifié ou fait (défaut : planifié, ou fait pour une date passée)", { enum: ["planifié", "fait"] }), confirme: CONFIRME }, ["cheval", "type", "confirme"]),
    async run(d, a) {
      if (a.confirme !== true) fail("Rien n'a été enregistré : récapitulez le soin à la personne, attendez son accord, puis rappelez l'outil avec confirme: true.");
      const { hit, many } = findOne(await d.rows("horses"), a.cheval, ["name"]);
      if (!hit) fail(many.length ? "Plusieurs chevaux correspondent : " + many.map((h) => `${h.name} (${h.id})`).join(", ") + ". Précisez l'id." : `Aucun cheval « ${str(a.cheval, 60)} » dans le club.`);
      const t = today(d), date = isDay(a.date) ? a.date : t;
      const soin: Row = { horse: hit!.id, kind: str(a.type, 40) || "Autre", who: str(a.intervenant, 80) || "Équipe", date, time: str(a.heure, 20) || "", note: str(a.note, 400), status: a.statut === "fait" || (a.statut !== "planifié" && date < t) ? "fait" : "planifié", source: "assistant" };
      const id = newId("soin");
      await write(d, [{ op: "upsert", coll: "care", id, data: soin }]);
      return { enregistre: true, soin: { id, cheval: hit!.name, box: hit!.box || null, type: soin.kind, date, heure: soin.time || null, intervenant: soin.who, note: soin.note || null, statut: soin.status } };
    },
  },
  {
    name: "reserver_place", title: "Réserver une place", public: "equipe", write: true,
    description: "Inscrit UN adhérent dans une reprise qui a de la place (ou sur sa liste d'attente si elle est complète et que liste_attente vaut true). L'adhérent reçoit l'e-mail de confirmation habituel. Écrit dans Stabl : avant d'appeler, récapitule l'adhérent, la reprise, le jour et l'heure, attends l'accord explicite, puis appelle avec confirme: true. Trouve d'abord la reprise avec l'outil reservations.",
    inputSchema: O({ reprise: S("Id de la reprise (l05), donné par les outils planning ou reservations"), adherent: S("Id (m044) ou nom exact de l'adhérent"), liste_attente: B("Si la reprise est complète, inscrire sur la liste d'attente (défaut : non)"), confirme: CONFIRME }, ["reprise", "adherent", "confirme"]),
    async run(d, a) {
      if (a.confirme !== true) fail("Rien n'a été enregistré : récapitulez la réservation à la personne, attendez son accord, puis rappelez l'outil avec confirme: true.");
      const lessons = await d.rows("lessons");
      const l = lessons.find((x) => x.id === str(a.reprise, 64));
      if (!l) fail(`Aucune reprise « ${str(a.reprise, 64)} ». Cherchez-la avec l'outil reservations.`);
      if (/annul/i.test(String(l!.status || ""))) fail("Cette reprise est annulée.");
      const { hit: m, many } = findOne(await d.rows("members"), a.adherent, ["first", "last"]);
      if (!m) fail(many.length ? "Plusieurs adhérents correspondent : " + many.map((x) => `${x.first} ${x.last} (${x.id})`).join(", ") + ". Précisez l'id." : `Aucun adhérent « ${str(a.adherent, 60)} » dans le club.`);
      const cur = await d.version("lessons", l!.id);
      if (!cur) fail("Cette reprise n'existe plus.");
      const data = { ...cur!.data };
      const riders = arr(data.riders), wl = arr(data.waitlist);
      const who = `${m!.first || ""} ${m!.last || ""}`.trim();
      if (riders.includes(m!.id)) return { deja_inscrit: true, message: `${who} est déjà inscrit(e) à cette reprise.` };
      const c = typeof data.cap === "number" ? data.cap : Infinity;
      let where: "reprise" | "liste_attente";
      if (riders.length < c) { data.riders = [...riders, m!.id]; data.waitlist = wl.filter((x) => x !== m!.id); if (!wl.length && cur!.data.waitlist === undefined) delete data.waitlist; where = "reprise"; }
      else if (a.liste_attente === true) {
        if (wl.includes(m!.id)) return { deja_en_attente: true, message: `${who} est déjà sur la liste d'attente.` };
        data.waitlist = [...wl, m!.id]; where = "liste_attente";
      } else {
        const t = today(d);
        const alt = (await Promise.all(occurrences(lessons.filter((x) => x.id !== l!.id && fold(x.title) === fold(l!.title)), t, addDays(t, 13)).map((o) => lessonView(d, o.date, o.l)))).filter((v) => v.places_libres === null || v.places_libres > 0).slice(0, 5);
        fail(`La reprise « ${l!.title} » est complète (${riders.length}/${c}). ` + (alt.length ? "Autres créneaux du même niveau avec de la place : " + alt.map((v) => `${v.jour} ${v.date} à ${v.heure} (${v.id})`).join(", ") + ". " : "") + "Pour la liste d'attente, rappelez avec liste_attente: true.");
      }
      await write(d, [{ op: "upsert", coll: "lessons", id: l!.id, data, version: cur!.version }]);
      return { enregistre: true, inscrit_sur: where!, adherent: who, reprise: { id: l!.id, titre: l!.title, jour: typeof l!.dow === "number" ? JOURS[l!.dow] : l!.day || null, heure: l!.start || null, date: l!.date || null },
        places_restantes: where! === "reprise" && c !== Infinity ? c - arr(data.riders).length : undefined, rang_liste_attente: where! === "liste_attente" ? arr(data.waitlist).length : undefined };
    },
  },
  {
    name: "cocher_tache", title: "Cocher une tâche", public: "equipe", write: true,
    description: "Marque UNE tâche de l'écurie comme faite (ou la remet à faire). Écrit dans Stabl : avant d'appeler, dis à la personne quelle tâche sera cochée et attends son accord explicite, puis appelle avec confirme: true.",
    inputSchema: O({ tache: S("Id (t3) ou intitulé de la tâche, donné par l'outil taches"), faite: B("true : faite (défaut) ; false : à refaire"), confirme: CONFIRME }, ["tache", "confirme"]),
    async run(d, a) {
      if (a.confirme !== true) fail("Rien n'a été enregistré : dites à la personne quelle tâche sera cochée, attendez son accord, puis rappelez l'outil avec confirme: true.");
      const { hit, many } = findOne(await d.rows("tasks"), a.tache, ["title"]);
      if (!hit) fail(many.length ? "Plusieurs tâches correspondent : " + many.map((x) => `${x.title} (${x.id})`).join(", ") + ". Précisez l'id." : `Aucune tâche « ${str(a.tache, 80)} ».`);
      const cur = await d.version("tasks", hit!.id);
      if (!cur) fail("Cette tâche n'existe plus.");
      const done = a.faite !== false;
      await write(d, [{ op: "upsert", coll: "tasks", id: hit!.id, data: { ...cur!.data, done, ...(done ? { doneAt: new Date().toISOString(), doneBy: d.caller.personRef || null } : { doneAt: null }) }, version: cur!.version }]);
      return { enregistre: true, tache: hit!.title, faite: done };
    },
  },
];

/** Écrit par la même porte que l'appli (politique d'accès, versions, audit, déclencheurs comme l'e-mail de réservation). */
async function write(d: ClubData, ops: Row[]) {
  const acc = await planAccess(d.env.DB, d.caller.clubId);
  if (!acc.write) fail("L'abonnement Stabl du club ne permet plus de modifier les données (elles restent consultables). Le gérant le règle dans Réglages › Abonnement.");
  const res = await applyBatch(d.env, null, d.principal(), ops);
  const bad = res.find((r) => !r.ok);
  if (bad) fail(bad.conflict ? "Quelqu'un vient de modifier ces données dans Stabl. Relisez-les puis réessayez." : bad.error?.message || "L'enregistrement a été refusé.");
}

/** Outils visibles pour ce rôle et ces droits. */
export function toolsFor(role: string, scopes: string[]): Tool[] {
  const mgr = role === "owner" || role === "manager";
  return TOOLS.filter((t) => (t.public === "equipe" || mgr) && (!t.write || scopes.includes("ecriture")));
}

export function listTools(role: string, scopes: string[]) {
  return toolsFor(role, scopes).map((t) => ({
    name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema,
    annotations: { title: t.title, readOnlyHint: !t.write, destructiveHint: false, idempotentHint: !t.write, openWorldHint: false },
  }));
}
