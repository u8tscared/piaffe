/**
 * Onboarding : à partir des réponses du questionnaire, calcule la configuration du club.
 * Logique pure (sans base) : testée directement, appliquée par store.ts.
 */

export type Kind = "centre" | "poney_club" | "ecurie_pension" | "ecurie_proprietaires" | "coach_independant" | "association";
export const KINDS: Kind[] = ["centre", "poney_club", "ecurie_pension", "ecurie_proprietaires", "coach_independant", "association"];
export const ACTIVITIES = ["cours", "particuliers", "pensions", "demi_pensions", "concours", "stages", "location_box", "balades", "baby", "anniversaires", "vente", "elevage"] as const;
export const SOFTWARES = ["kavalog", "equimondo", "pegase", "excel", "papier", "autre", "aucun"] as const;
export const VAT_REGIMES = ["normal", "franchise", "association_exoneree"] as const;
export const DISCIPLINES = ["CSO", "Dressage", "CCE", "Hunter", "Endurance", "Horse-ball", "Pony-games", "Voltige", "Attelage", "Équitation de travail", "Éthologie", "TREC et balade", "Western"] as const;

export interface Answers {
  kind?: Kind;
  name?: string;
  siret?: string; siren?: string; legal_form?: string; naf?: string;
  address?: { line1?: string; zip?: string; city?: string; country?: string };
  lat?: number; lon?: number;
  horses?: number; boxes?: number; members?: number; staff?: number;
  disciplines?: string[];
  arenas_indoor?: number; arenas_outdoor?: number; paddocks?: number; round_pen?: boolean;
  activities?: string[];
  software?: string;
  /** Outils actuels : remplacés par Piaffe (récupération des données) ou gardés et connectés. */
  migration?: MigrationAnswers;
  accountant?: boolean; accountant_email?: string; accountant_einvoice?: "yes" | "no" | "unknown";
  online_payments?: boolean; pay_methods?: string[];
  vat_regime?: string;
  email?: string; phone?: string;
}

export interface MigrationTool { id: string; name: string; action: "replace" | "integrate" }
export interface MigrationAnswers {
  uses?: boolean; tools: MigrationTool[]; other?: string; adresse?: string; when?: "now" | "later";
  job_id?: string; etat?: "termine" | "abandon";
  /** résultat de planDeBascule (migration/core/parcours.mjs) calculé dans le navigateur */
  plan?: { recuperer: string[]; brancher: string[]; resilier: string[] };
  /** ancien format (une seule question « robot, fichier ou plus tard ») */
  legacy?: "robot" | "file" | "later";
}
/** Recommandation par défaut quand le navigateur n'en envoie pas : gestion équestre, tableur, papier → remplacer. */
export const REPLACE_BY_DEFAULT = ["kavalog", "equimondo", "pegase", "excel", "google-sheets", "papier", "autre"];
const TOOL_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;

const clampInt = (v: unknown, max = 100000) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0; };
const strArr = (v: unknown, allowed?: readonly string[], max = 30) =>
  Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === "string" && x.length <= 60 && (!allowed || allowed.includes(x))))].slice(0, max) as string[] : [];
const s = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Nettoie les réponses reçues du navigateur : types, bornes, valeurs autorisées. */
export function sanitize(raw: unknown): Answers {
  const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Answers = {};
  if (KINDS.includes(a.kind as Kind)) out.kind = a.kind as Kind;
  if (s(a.name)) out.name = s(a.name, 120);
  const digits = (x: unknown) => s(x, 40).replace(/\D/g, "");
  if (digits(a.siret).length === 14) out.siret = digits(a.siret);
  if (digits(a.siren).length === 9) out.siren = digits(a.siren);
  if (!out.siren && out.siret) out.siren = out.siret.slice(0, 9);
  if (s(a.legal_form)) out.legal_form = s(a.legal_form, 40);
  if (s(a.naf)) out.naf = s(a.naf, 12);
  if (a.address && typeof a.address === "object") {
    const ad = a.address as Record<string, unknown>;
    out.address = { line1: s(ad.line1, 160), zip: s(ad.zip, 12), city: s(ad.city, 80), country: s(ad.country, 2) || "FR" };
  }
  const lat = Number(a.lat), lon = Number(a.lon);
  if (Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lon) && Math.abs(lon) <= 180 && (lat || lon)) { out.lat = lat; out.lon = lon; }
  for (const k of ["horses", "boxes", "members", "staff"] as const) if (a[k] !== undefined) out[k] = clampInt(a[k]);
  for (const k of ["arenas_indoor", "arenas_outdoor", "paddocks"] as const) if (a[k] !== undefined) out[k] = clampInt(a[k], 50);
  if (a.round_pen !== undefined) out.round_pen = !!a.round_pen;
  if (a.disciplines !== undefined) out.disciplines = strArr(a.disciplines, DISCIPLINES);
  if (a.activities !== undefined) out.activities = strArr(a.activities, ACTIVITIES);
  if (SOFTWARES.includes(a.software as any)) out.software = a.software as string;
  out.migration = sanitizeMigration(a.migration);
  if (!out.migration) delete out.migration;
  if (a.accountant !== undefined) out.accountant = !!a.accountant;
  const em = s(a.accountant_email, 200).toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) out.accountant_email = em;
  if (["yes", "no", "unknown"].includes(a.accountant_einvoice as string)) out.accountant_einvoice = a.accountant_einvoice as Answers["accountant_einvoice"];
  if (a.online_payments !== undefined) out.online_payments = !!a.online_payments;
  if (a.pay_methods !== undefined) out.pay_methods = strArr(a.pay_methods, ["cheque", "especes", "virement", "ancv", "cb", "prelevement"]);
  if (VAT_REGIMES.includes(a.vat_regime as any)) out.vat_regime = a.vat_regime as string;
  const mail = s(a.email, 200).toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) out.email = mail;
  if (s(a.phone)) out.phone = s(a.phone, 30);
  return out;
}

function sanitizeMigration(v: unknown): MigrationAnswers | undefined {
  if (["robot", "file", "later"].includes(v as string)) return { tools: [], legacy: v as MigrationAnswers["legacy"] };
  if (!v || typeof v !== "object") return undefined;
  const m = v as Record<string, unknown>;
  const out: MigrationAnswers = { tools: [] };
  if (typeof m.uses === "boolean") out.uses = m.uses;
  const seen = new Set<string>();
  if (Array.isArray(m.tools)) for (const t of m.tools.slice(0, 30)) {
    if (!t || typeof t !== "object") continue;
    const id = s((t as any).id, 40).toLowerCase(), name = s((t as any).name, 80) || id;
    if (!TOOL_ID.test(id) || seen.has(id + "|" + name)) continue;
    seen.add(id + "|" + name);
    const action = (t as any).action === "integrate" ? "integrate" : (t as any).action === "replace" ? "replace" : (REPLACE_BY_DEFAULT.includes(id) ? "replace" : "integrate");
    out.tools.push({ id, name, action });
  }
  if (out.uses === false) out.tools = [];
  if (s(m.other)) out.other = s(m.other, 120);
  const ad = s(m.adresse, 300);
  if (ad && /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(ad)) out.adresse = ad;
  if (m.when === "now" || m.when === "later") out.when = m.when;
  if (typeof m.job_id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(m.job_id)) out.job_id = m.job_id;
  if (m.etat === "termine" || m.etat === "abandon") out.etat = m.etat;
  const ids = (x: unknown) => strArr(x, undefined, 30).filter((i) => TOOL_ID.test(i));
  if (m.plan && typeof m.plan === "object") { const p = m.plan as Record<string, unknown>; out.plan = { recuperer: ids(p.recuperer), brancher: ids(p.brancher), resilier: ids(p.resilier) }; }
  return out;
}

/** Plan de bascule : celui du navigateur s'il est cohérent avec les outils, sinon recalculé. */
export function switchoverOf(m: MigrationAnswers | undefined) {
  const tools = m?.tools || [];
  const rec = tools.filter((t) => t.action === "replace"), br = tools.filter((t) => t.action === "integrate");
  const local = { recuperer: rec.map((t) => t.id), brancher: br.map((t) => t.id), resilier: rec.filter((t) => !["excel", "google-sheets", "papier"].includes(t.id)).map((t) => t.id) };
  const p = m?.plan;
  if (p && p.recuperer.length + p.brancher.length > 0 && p.recuperer.every((i) => tools.some((t) => t.id === i))) return { ...local, ...p };
  return local;
}

const joinNames = (l: string[]) => (l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " et " + l[l.length - 1]);
/** Où mène « Connecter X » : uniquement des écrans qui existent, avec un texte qui ne promet pas plus qu'eux. */
function connectTask(t: MigrationTool): Task {
  const n = t.name;
  const base = { id: "connect_" + t.id, title: "Connecter " + n, icon: "link" };
  switch (t.id) {
    case "pennylane": case "tiime": case "indy":
      return { ...base, sub: "Vos factures et l’export FEC partent vers " + n + " depuis l’espace comptable.", go: "lv-comptable" };
    case "qonto":
      return { ...base, sub: "Exportez vos factures pour rapprocher les virements reçus sur " + n + ".", go: "lv-comptable" };
    case "sumup": case "helloasso":
      return { ...base, sub: "Vous continuez à encaisser avec " + n + " ; ces paiements se notent sur la facture.", go: "lv-paiements" };
    case "google-agenda":
      return { ...base, title: "Afficher le planning dans Google Agenda", sub: "Un lien d’abonnement, mis à jour automatiquement.", go: "lv-calendriers" };
    case "ffe":
      return { ...base, sub: "Importez la liste de vos licenciés pour rapprocher les licences des fiches adhérents.", go: "import" };
    default:
      return { ...base, sub: "Une clé d’API réservée à " + n + " permet de relier les deux outils.", go: "lv-cles" };
  }
}

export interface Task { id: string; title: string; sub: string; icon: string; go?: string; params?: Record<string, string>; form?: string; done?: boolean }
export interface Plan {
  kind: Kind;
  vat_regime: string;
  legal_form: string | null;
  modulesOff: Record<string, string[]>;
  features: Record<string, boolean>;
  club_ui: Record<string, unknown>;
  forfaits: { id: string; name: string; price: number; kind: string; vat?: number }[];
  pensionPlans: { id: string; name: string; price: number; icon: string; inc: string[] }[];
  templates: string[];
  careRules: { id: string; kind: string; every_days: number; note: string }[];
  tasks: Task[];
  /** outils déclarés et plan de bascule, gardés dans settings.migration */
  migration: { tools: MigrationTool[]; adresse?: string; plan: { recuperer: string[]; brancher: string[]; resilier: string[] }; job_id?: string } | null;
}

/** Forme juridique d'après le code INSEE (catégorie juridique) ou un libellé. */
export function legalFormOf(code: string | undefined): string | null {
  if (!code) return null;
  const c = String(code);
  if (/^92/.test(c)) return "association";
  if (c === "1000") return "ei";
  if (c === "5498") return "eurl";
  if (/^54/.test(c)) return "sarl";
  if (c === "5710") return "sas";
  if (c === "5720") return "sasu";
  if (/^57/.test(c)) return "sas";
  if (c === "6598") return "earl";
  if (c === "6533") return "gaec";
  if (/^65/.test(c)) return "scea";
  if (/^[a-z]+$/.test(c)) return c;
  return "autre";
}

export function buildPlan(a: Answers): Plan {
  const kind: Kind = a.kind || "centre";
  const act = new Set(a.activities && a.activities.length ? a.activities : defaultActivities(kind));
  const has = (x: string) => act.has(x);
  const coach = kind === "coach_independant";
  const lessons = has("cours") || has("particuliers") || has("baby") || coach;
  const pension = has("pensions") || has("demi_pensions") || has("location_box") || kind === "ecurie_pension" || kind === "ecurie_proprietaires";
  const legal = a.legal_form || (kind === "association" ? "association" : null);
  let vat = a.vat_regime || "";
  if (!vat) vat = legal === "association" || kind === "association" ? "association_exoneree" : "normal";

  /* écrans masqués : ce qui ne sert pas à ce club, et ce qui demande un matériel qu'il n'a pas encore */
  const off: Record<string, Set<string>> = { gerant: new Set(["cameras"]), adherent: new Set(), employe: new Set(), coach: new Set() };
  const g = off.gerant, ad = off.adherent, em = off.employe;
  if (!pension) { g.add("pensions"); ad.add("adh-demipension"); }
  if (!has("demi_pensions")) ad.add("adh-demipension");
  if (!has("concours")) { g.add("competitions"); ad.add("adh-concours"); }
  if (!has("stages") && !has("anniversaires") && !has("vente")) { g.add("boutique"); ad.add("adh-boutique"); }
  if (!has("particuliers") && !coach) { g.add("coachs"); ad.add("adh-coachs"); }
  if (!lessons) { ad.add("adh-reserver"); ad.add("adh-progression"); }
  if ((a.staff ?? 1) === 0) { g.add("equipe"); }
  if ((a.boxes ?? 1) === 0 && (a.horses ?? 1) === 0) { g.add("ecurie3d"); g.add("alimentation"); }
  if (coach) { ["ecurie3d", "alimentation", "entretien", "pensions", "equipe"].forEach((x) => g.add(x)); em.add("emp-tournee"); }
  /* écrans de démonstration remplacés par les écrans branchés */
  g.add("connecteurs");

  const indoor = a.arenas_indoor ?? (kind === "coach_independant" ? 0 : 1);
  const outdoor = a.arenas_outdoor ?? (kind === "coach_independant" ? 0 : 1);
  const arenas: { id: string; name: string; kind: string; size: string }[] = [];
  for (let i = 0; i < indoor; i++) arenas.push({ id: "a" + (arenas.length + 1), name: indoor > 1 ? "Manège " + (i + 1) : "Manège", kind: "Couvert", size: "" });
  for (let i = 0; i < outdoor; i++) arenas.push({ id: "a" + (arenas.length + 1), name: outdoor > 1 ? "Carrière " + (i + 1) : "Carrière", kind: "Extérieure", size: "" });
  if (a.round_pen) arenas.push({ id: "a" + (arenas.length + 1), name: "Rond de longe", kind: "Rond", size: "" });
  const pads = a.paddocks ?? (coach ? 0 : 2);
  const paddocks: string[] = [];
  for (let i = 0; i < Math.min(pads, 30); i++) paddocks.push(pads > 1 ? "Pré " + (i + 1) : "Pré");

  const address = a.address ? [a.address.line1, [a.address.zip, a.address.city].filter(Boolean).join(" ")].filter(Boolean).join(", ") : "";
  const club_ui: Record<string, unknown> = {
    name: a.name || "", short: shortName(a.name || ""), city: a.address?.city || "", address,
    siret: a.siret ? a.siret.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, "$1 $2 $3 $4") : "",
    boxes: a.boxes || 0, arenas, paddocks, kind, disciplines: a.disciplines || [], activities: [...act],
    email: a.email || "", phone: a.phone || "",
  };
  if (a.lat !== undefined) { club_ui.lat = a.lat; club_ui.lon = a.lon; }

  /* forfaits types : prix indicatifs, à ajuster dans Réglages › Tarifs */
  const ttc = vat === "normal";
  const vatLesson = ttc ? 5.5 : 0, vatPension = ttc ? 20 : 0;
  const forfaits: Plan["forfaits"] = [];
  if (has("cours") || coach) {
    forfaits.push({ id: "f_cours", name: "Cours collectif à l’unité", price: 28, kind: "unite", vat: vatLesson });
    forfaits.push({ id: "f_carte10", name: "Carte 10 séances", price: 250, kind: "carte", vat: vatLesson });
    if (!coach) forfaits.push({ id: "f_annuel", name: "Forfait annuel 1 h par semaine", price: 720, kind: "annuel", vat: vatLesson });
  }
  if (has("particuliers") || coach) forfaits.push({ id: "f_part", name: "Cours particulier", price: coach ? 50 : 45, kind: "unite", vat: vatLesson });
  if (has("baby") || kind === "poney_club") forfaits.push({ id: "f_baby", name: "Baby poney (trimestre)", price: 180, kind: "trimestre", vat: vatLesson });
  if (has("pensions") || kind === "ecurie_pension" || kind === "ecurie_proprietaires") {
    forfaits.push({ id: "f_pension_box", name: "Pension box", price: 480, kind: "pension", vat: vatPension });
    forfaits.push({ id: "f_pension_pre", name: "Pension pré", price: 220, kind: "pension", vat: vatPension });
    forfaits.push({ id: "f_proprio", name: "Propriétaire, accès aux installations", price: 0, kind: "proprio", vat: vatPension });
  }
  if (has("demi_pensions")) forfaits.push({ id: "f_dp", name: "Demi-pension 2 jours par semaine", price: 160, kind: "demi-pension", vat: vatPension });
  if (has("location_box")) forfaits.push({ id: "f_box", name: "Location de box", price: 250, kind: "location", vat: vatPension });
  if (has("stages")) forfaits.push({ id: "f_stage", name: "Stage à la journée", price: 55, kind: "stage", vat: vatLesson });
  if (has("balades")) forfaits.push({ id: "f_balade", name: "Balade d’une heure", price: 30, kind: "unite", vat: vatLesson });

  const pensionPlans: Plan["pensionPlans"] = [];
  if (pension) {
    pensionPlans.push({ id: "pc", name: "Pension box", price: 480, icon: "stable", inc: ["Box et litière", "Foin et rations du club", "Sortie au paddock", "Accès aux installations"] });
    pensionPlans.push({ id: "pp", name: "Pension pré", price: 220, icon: "paddock", inc: ["Pré avec abri", "Foin l’hiver", "Surveillance quotidienne"] });
  }

  const templates = ["Inscription et règlement intérieur", "Autorisation parentale et droit à l’image", "Décharge de responsabilité"];
  if (pension) templates.unshift("Pension complète", "Pension pré");
  if (has("demi_pensions")) templates.push("Demi-pension");
  if (has("location_box")) templates.push("Location de box");
  if (has("vente")) templates.push("Vente de cheval");
  if ((a.staff ?? 0) > 0) templates.push("Contrat de travail");
  templates.push("Mise à disposition d’un cheval");

  const careRules: Plan["careRules"] = coach ? [] : [
    { id: "cr_vermifuge", kind: "Vermifuge", every_days: 90, note: "Selon la coproscopie de votre vétérinaire" },
    { id: "cr_vaccin", kind: "Vaccin", every_days: 365, note: "Grippe et tétanos, rappel annuel" },
    { id: "cr_marechal", kind: "Maréchal", every_days: 42, note: "Parage ou ferrure toutes les 6 semaines" },
    { id: "cr_dentiste", kind: "Dentiste", every_days: 365, note: "Contrôle dentaire annuel" },
  ];

  /* liste de démarrage personnalisée, affichée sur l'accueil */
  const tasks: Task[] = [];
  const mig = a.migration;
  const sw = a.software || "aucun";
  if (mig && (mig.tools.length || mig.uses !== undefined)) {
    const rec = mig.tools.filter((t) => t.action === "replace");
    if (rec.length) {
      const n = joinNames(rec.map((t) => t.name));
      const done = mig.etat === "termine";
      tasks.push({ id: "migration", title: done ? "Vérifier les données reprises de " + n : "Lancer la migration depuis " + n,
        sub: done ? "Comparez le nombre de cavaliers, de chevaux et le reste dû avec votre ancien logiciel." : "Notre outil de migration récupère tout pour vous : adhérents, chevaux, forfaits, factures et planning.",
        icon: "import", go: "lv-migration", params: { source: rec[0].id, outils: rec.map((t) => t.id).join(",") } });
      /* le robot pour ordinateur (logiciels installés) s'authentifie avec une clé d'API d'import */
      if (rec.some((t) => ["kavalog", "pegase", "autre"].includes(t.id)))
        tasks.push({ id: "migration_key", title: "Créer la clé d’import du robot de migration", sub: "Utile si votre ancien logiciel est installé sur un ordinateur du club.", icon: "key", go: "lv-cles", params: { scope: "import" } });
      const res = switchoverOf(mig).resilier.map((id) => rec.find((t) => t.id === id)?.name).filter(Boolean) as string[];
      if (res.length) tasks.push({ id: "resiliation", title: "Résilier " + joinNames(res), sub: "Une fois vos données vérifiées, une lettre de résiliation prête à envoyer.", icon: "doc", go: "lv-migration", params: { etape: "resiliation" } });
    }
    for (const t of mig.tools.filter((x) => x.action === "integrate")) tasks.push(connectTask(t));
  } else if (["kavalog", "equimondo", "pegase"].includes(sw)) {
    const n = sw === "kavalog" ? "Kavalog" : sw === "equimondo" ? "Equimondo" : "Pégase";
    tasks.push({ id: "migration", title: "Lancer la migration depuis " + n, sub: "Notre outil de migration récupère tout pour vous : adhérents, chevaux et factures.", icon: "import", go: "lv-migration", params: { source: sw } });
  } else if (sw === "excel" || sw === "autre") {
    tasks.push({ id: "migration", title: "Importer votre fichier", sub: "Excel ou CSV : adhérents, chevaux, forfaits.", icon: "import", go: "import" });
  }
  if (!coach) tasks.push({ id: "horses", title: "Ajouter vos chevaux", sub: a.horses ? a.horses + " chevaux annoncés : commencez par le nom et le box." : "Nom, box et propriétaire suffisent pour commencer.", icon: "horse", form: "horse" });
  tasks.push({ id: "members", title: coach ? "Ajouter vos élèves" : "Ajouter vos adhérents", sub: "Ils reçoivent leur accès par e-mail, sur téléphone.", icon: "members", form: "member" });
  if (lessons && !coach) tasks.push({ id: "lessons", title: "Créer vos reprises", sub: "Jour, heure, moniteur et piste : le planning se remplit.", icon: "planning", form: "lesson" });
  tasks.push({ id: "tarifs", title: "Vérifier vos tarifs", sub: forfaits.length + " forfaits préparés avec des prix indicatifs.", icon: "tag", go: "reglages", params: { sec: "tarifs" } });
  if ((a.staff ?? 0) > 0) tasks.push({ id: "team", title: "Inviter votre équipe", sub: a.staff + (a.staff === 1 ? " salarié annoncé" : " salariés annoncés") + " : chacun a son espace sur téléphone.", icon: "team", go: "lv-acces" });
  if (a.online_payments !== false) tasks.push({ id: "payments", title: "Activer les paiements en ligne", sub: "Carte et prélèvement SEPA, l’argent arrive sur votre compte.", icon: "card", go: "lv-paiements" });
  if (a.accountant) tasks.push({ id: "accountant", title: a.accountant_email ? "Votre comptable est invité" : "Inviter votre comptable", sub: a.accountant_einvoice === "yes" ? "Il reçoit vos factures électroniques et les exports FEC." : "Il accède aux exports FEC, CSV et aux PDF.", icon: "accounting", go: "lv-comptable" });
  if (!tasks.some((t) => t.id === "connect_google-agenda")) tasks.push({ id: "calendar", title: "Ajouter le planning à votre agenda", sub: "Google Agenda, Apple Calendrier ou Outlook.", icon: "calendar_add", go: "lv-calendriers" });
  tasks.push({ id: "plan", title: "Choisir votre abonnement", sub: "Trente jours d’essai complet, puis l’offre adaptée à votre taille.", icon: "card", go: "lv-abonnement" });

  return {
    kind, vat_regime: vat, legal_form: legal,
    modulesOff: Object.fromEntries(Object.entries(off).map(([k, v]) => [k, [...v]])),
    features: { lessons, pension, competitions: has("concours"), online_payments: a.online_payments !== false, accountant: !!a.accountant },
    club_ui, forfaits, pensionPlans, templates, careRules, tasks,
    migration: mig && mig.tools.length ? { tools: mig.tools, adresse: mig.adresse, plan: switchoverOf(mig), job_id: mig.job_id } : null,
  };
}

export function defaultActivities(kind: Kind): string[] {
  switch (kind) {
    case "ecurie_pension": return ["pensions", "demi_pensions", "location_box"];
    case "ecurie_proprietaires": return ["pensions", "location_box", "particuliers"];
    case "coach_independant": return ["particuliers", "concours"];
    case "poney_club": return ["cours", "baby", "stages", "anniversaires"];
    case "association": return ["cours", "stages", "concours"];
    default: return ["cours", "particuliers", "pensions", "stages", "concours"];
  }
}

function shortName(n: string): string {
  const t = n.replace(/^(centre équestre|centre equestre|écurie|ecurie|poney-club|poney club|haras|club hippique|écuries|ecuries)\s+(de la |du |des |de l’|de l'|d’|d'|de )?/i, "").trim();
  return t && t.length < n.length ? t.charAt(0).toUpperCase() + t.slice(1) : n;
}
