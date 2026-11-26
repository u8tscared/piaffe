import { Hono } from "hono";
import type { AppEnv } from "../env";
import { requireRole, requireUser } from "../lib/auth";
import { ApiError, bad, body, forbidden } from "../lib/http";
import { audit, rateLimit, run } from "../lib/db";
import { nowIso } from "../lib/ids";
import { sanitize } from "./plan";
import { complete, loadClub, saveOnboarding, saveSettings, tasksWithState } from "./store";
import { searchCompanies } from "./siret";
import { csrf } from "../auth/csrf";

/*
 * Onboarding et réglages d'affichage du club (lot E).
 *   GET    /api/onboarding                 état (tout membre) ; réponses et tâches pour le gérant
 *   PUT    /api/onboarding                 {answers, step} enregistre l'avancement (gérant)
 *   POST   /api/onboarding/complete        {answers?} configure le club (gérant), idempotent
 *   GET    /api/onboarding/siret?q=        recherche d'entreprise (gérant connecté), limitée
 *   POST   /api/onboarding/tasks/:id       {done?, dismissed?} coche une étape de démarrage
 *   PUT    /api/onboarding/modules         {modulesOff:{gerant:[…],…}} écrans masqués pour tout le club
 *   PATCH  /api/onboarding/club            fiche du club (nom, adresse, SIRET… et forme d'affichage)
 *   POST   /api/onboarding/sandbox         marque le club courant comme club d'exemple (titulaire)
 *   POST   /api/onboarding/reset           {confirm:"EFFACER"} efface les données d'un club d'exemple
 */
const app = new Hono<AppEnv>();
app.use("/api/onboarding", csrf);
app.use("/api/onboarding/*", csrf);
const manager = requireRole("owner", "manager");
const ROLES_VIEW = ["gerant", "employe", "adherent", "coach", "comptable"];
const ID_RE = /^[a-zA-Z0-9_-]{1,40}$/;

function needClub(c: any) {
  const club = c.get("club");
  if (!club || !c.get("membership")) throw new ApiError(403, "no_club", "Choisissez d'abord un club.");
  return club as { id: string };
}

app.get("/api/onboarding", requireUser, async (c) => {
  const club = needClub(c);
  const m = c.get("membership")!;
  const cur = await loadClub(c.env.DB, club.id);
  if (!cur) throw new ApiError(404, "not_found", "Club introuvable.");
  const isManager = m.role === "owner" || m.role === "manager";
  const out: Record<string, unknown> = {
    completed: !!cur.onb.completed_at, completed_at: cur.onb.completed_at || null,
    sandbox: !!cur.settings.sandbox, modulesOff: cur.settings.modulesOff || {}, features: cur.settings.features || {},
    templates: cur.settings.templates || null, careRules: cur.settings.careRules || [], kind: cur.row.kind, vat_regime: cur.row.vat_regime,
  };
  if (isManager) {
    out.answers = cur.onb.answers || {};
    out.step = cur.onb.step || null;
    out.tasks = await tasksWithState(c.env.DB, club.id, cur.onb.tasks || []);
  }
  return c.json(out);
});

app.put("/api/onboarding", manager, async (c) => {
  const club = needClub(c);
  const b = await body<{ answers?: unknown; step?: unknown }>(c);
  const cur = (await loadClub(c.env.DB, club.id))!;
  const answers = { ...cur.onb.answers, ...sanitize(b.answers) };
  const step = typeof b.step === "string" && b.step.length <= 40 ? b.step : cur.onb.step;
  await saveOnboarding(c.env.DB, club.id, { ...cur.onb, answers, step, started_at: cur.onb.started_at || nowIso() });
  return c.json({ ok: true, answers, step });
});

app.post("/api/onboarding/complete", manager, async (c) => {
  const club = needClub(c);
  const b = await body<{ answers?: unknown }>(c).catch(() => ({} as { answers?: unknown }));
  const u = c.get("user")!;
  const r = await complete(c.env.DB, club.id, { id: u.id, first: u.first, last: u.last, email: u.email }, b.answers);
  const tasks = await tasksWithState(c.env.DB, club.id, r.plan.tasks);
  return c.json({ ok: true, person_ref: r.person_ref, modulesOff: r.plan.modulesOff, features: r.plan.features, club_ui: r.plan.club_ui, templates: r.plan.templates, tasks,
    created: { forfaits: r.plan.forfaits.length, pensionPlans: r.plan.pensionPlans.length, templates: r.plan.templates.length, careRules: r.plan.careRules.length } });
});

app.get("/api/onboarding/siret", requireUser, async (c) => {
  const q = (c.req.query("q") || "").trim();
  if (q.length < 3) throw bad("query_too_short", "Saisissez au moins trois caractères, ou un SIRET.");
  const u = c.get("user")!;
  const ip = c.req.header("cf-connecting-ip") || "local";
  if (!(await rateLimit(c.env.DB, "siret:u:" + u.id, 30, 600)) || !(await rateLimit(c.env.DB, "siret:ip:" + ip, 60, 600)))
    throw new ApiError(429, "rate_limited", "Trop de recherches d'un coup. Réessayez dans quelques minutes.");
  try {
    return c.json({ results: await searchCompanies(c.env.DB, q) });
  } catch (e) {
    const m = String((e as Error).message || "");
    if (m === "busy") throw new ApiError(503, "upstream_busy", "Le service de recherche des entreprises est très sollicité. Réessayez dans un instant ou saisissez les informations à la main.");
    throw new ApiError(502, "upstream_error", "La recherche des entreprises est indisponible pour le moment. Saisissez les informations à la main.");
  }
});

app.post("/api/onboarding/tasks/:id", manager, async (c) => {
  const club = needClub(c);
  const id = c.req.param("id");
  if (!ID_RE.test(id)) throw bad("invalid_task", "Étape inconnue.");
  const b = await body<{ done?: unknown; dismissed?: unknown }>(c).catch(() => ({} as Record<string, unknown>));
  const done = b.done === undefined ? true : !!b.done, dismissed = !!b.dismissed, now = nowIso();
  await run(c.env.DB, `INSERT INTO onboarding_tasks (club_id, task_id, done_at, dismissed_at) VALUES (?,?,?,?)
    ON CONFLICT(club_id, task_id) DO UPDATE SET done_at = excluded.done_at, dismissed_at = excluded.dismissed_at`, club.id, id, done ? now : null, dismissed ? now : null);
  return c.json({ ok: true, id, done, dismissed });
});

app.put("/api/onboarding/modules", manager, async (c) => {
  const club = needClub(c);
  const b = await body<{ modulesOff?: unknown }>(c);
  if (!b.modulesOff || typeof b.modulesOff !== "object") throw bad("missing_field", "Le champ « modulesOff » est obligatoire.");
  const off: Record<string, string[]> = {};
  for (const [role, list] of Object.entries(b.modulesOff as Record<string, unknown>)) {
    if (!ROLES_VIEW.includes(role) || !Array.isArray(list)) continue;
    off[role] = [...new Set(list.filter((x): x is string => typeof x === "string" && /^[a-z0-9-]{1,40}$/.test(x)))].slice(0, 80);
  }
  const cur = (await loadClub(c.env.DB, club.id))!;
  cur.settings.modulesOff = { ...(cur.settings.modulesOff || {}), ...off };
  await saveSettings(c.env.DB, club.id, cur.settings);
  return c.json({ ok: true, modulesOff: cur.settings.modulesOff });
});

/* Colonnes légales du club (utilisées par les factures et les e-mails). La fiche d'affichage complète
   (pistes, prés, boxes…) est l'objet « club » du magasin records, synchronisé par l'appli web. */
app.patch("/api/onboarding/club", manager, async (c) => {
  const club = needClub(c);
  const b = await body<Record<string, unknown>>(c);
  const cur = (await loadClub(c.env.DB, club.id))!;
  const t = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const name = t(b.name, 120) || cur.row.name;
  const siret = t(b.siret, 40).replace(/\D/g, "");
  if (b.siret && siret.length !== 14) throw bad("invalid_field", "Le SIRET doit compter 14 chiffres.", { field: "siret" });
  const email = t(b.email, 200).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw bad("invalid_field", "L'adresse e-mail du club n'est pas valide.", { field: "email" });
  const vat = typeof b.vat_regime === "string" && ["normal", "franchise", "association_exoneree"].includes(b.vat_regime) ? b.vat_regime : cur.row.vat_regime;
  let address = cur.row.address;
  if (b.address && typeof b.address === "object") {
    const a = b.address as Record<string, unknown>;
    address = JSON.stringify({ line1: t(a.line1, 160), line2: t(a.line2, 160), zip: t(a.zip, 12), city: t(a.city, 80), country: t(a.country, 2) || "FR" });
  }
  await run(c.env.DB, "UPDATE clubs SET name = ?, siret = COALESCE(?, siret), siren = COALESCE(?, siren), email = COALESCE(?, email), phone = COALESCE(?, phone), ffe_number = COALESCE(?, ffe_number), vat_regime = ?, address = ?, updated_at = ? WHERE id = ?",
    name, siret || null, siret ? siret.slice(0, 9) : null, email || null, t(b.phone, 30) || null, t(b.ffe, 40) || null, vat, address, nowIso(), club.id);
  await audit(c.env.DB, { club_id: club.id, user_id: c.get("user")!.id, action: "club.update", target: club.id });
  return c.json({ ok: true, name, vat_regime: vat });
});

app.post("/api/onboarding/sandbox", requireRole("owner"), async (c) => {
  const club = needClub(c);
  const cur = (await loadClub(c.env.DB, club.id))!;
  const n = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM records WHERE club_id = ? AND deleted = 0").bind(club.id).first<{ n: number }>();
  if (n && n.n > 0 && !cur.settings.sandbox) throw new ApiError(409, "club_not_empty", "Ce club contient déjà des données : les exemples sont chargés dans un club séparé.");
  cur.settings.sandbox = true;
  cur.settings.modulesOff = cur.settings.modulesOff || { gerant: [] };
  await saveSettings(c.env.DB, club.id, cur.settings);
  await saveOnboarding(c.env.DB, club.id, { ...cur.onb, answers: cur.onb.answers || {}, completed_at: cur.onb.completed_at || nowIso(), step: "sandbox", sandbox: true });
  await audit(c.env.DB, { club_id: club.id, user_id: c.get("user")!.id, action: "onboarding.sandbox", target: club.id });
  return c.json({ ok: true, sandbox: true });
});

app.post("/api/onboarding/reset", requireRole("owner"), async (c) => {
  const club = needClub(c);
  const b = await body<{ confirm?: unknown }>(c);
  if (b.confirm !== "EFFACER") throw bad("confirm_required", "Pour confirmer, envoyez « EFFACER ».");
  const cur = (await loadClub(c.env.DB, club.id))!;
  if (!cur.settings.sandbox) throw forbidden("Seul un club d'exemple peut être effacé d'un coup. Pour un vrai club, contactez le support.");
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM records WHERE club_id = ?").bind(club.id),
    c.env.DB.prepare("DELETE FROM onboarding_tasks WHERE club_id = ?").bind(club.id),
  ]);
  delete cur.settings.sandbox; delete cur.settings.club_ui; delete cur.settings.modulesOff;
  await saveSettings(c.env.DB, club.id, cur.settings);
  await saveOnboarding(c.env.DB, club.id, { answers: {} });
  await audit(c.env.DB, { club_id: club.id, user_id: c.get("user")!.id, action: "onboarding.reset", target: club.id });
  return c.json({ ok: true });
});

export default app;
/** Tâche planifiée facultative du lot (appelée par le cron du Worker) : purge du cache de recherche. */
export async function cron(env: AppEnv["Bindings"], expr: string): Promise<void> {
  if (expr !== "0 6 * * *") return;
  await run(env.DB, "DELETE FROM siret_cache WHERE at < ?", new Date(Date.now() - 7 * 864e5).toISOString());
}
