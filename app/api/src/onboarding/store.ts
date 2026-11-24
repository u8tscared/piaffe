/** Onboarding : lecture et écriture de l'état dans clubs.onboarding / clubs.settings, application du plan. */
import { all, json, one, run, audit } from "../lib/db";
import { nowIso } from "../lib/ids";
import { buildPlan, sanitize, type Answers, type Plan, type Task } from "./plan";

export interface OnbState { answers: Answers; step?: string; completed_at?: string | null; tasks?: Task[]; sandbox?: boolean; started_at?: string }
export interface ClubRow { id: string; name: string; kind: string; settings: string; onboarding: string; legal_form: string | null; siret: string | null; vat_regime: string; address: string | null; email: string | null; phone: string | null }

export async function loadClub(db: D1Database, clubId: string) {
  const c = await one<ClubRow>(db, "SELECT id, name, kind, settings, onboarding, legal_form, siret, vat_regime, address, email, phone FROM clubs WHERE id = ?", clubId);
  if (!c) return null;
  return { row: c, settings: json<Record<string, any>>(c.settings, {}), onb: json<OnbState>(c.onboarding, { answers: {} }) };
}

export async function saveOnboarding(db: D1Database, clubId: string, onb: OnbState) {
  await run(db, "UPDATE clubs SET onboarding = ?, updated_at = ? WHERE id = ?", JSON.stringify(onb), nowIso(), clubId);
}
export async function saveSettings(db: D1Database, clubId: string, settings: Record<string, unknown>) {
  await run(db, "UPDATE clubs SET settings = ?, updated_at = ? WHERE id = ?", JSON.stringify(settings), nowIso(), clubId);
}

/** Insère un enregistrement s'il n'existe pas encore (les modifications du club ne sont jamais écrasées). */
function insertRecord(db: D1Database, clubId: string, coll: string, id: string, data: unknown, userId: string) {
  return db.prepare("INSERT INTO records (club_id, coll, id, data, version, deleted, updated_by, created_at, updated_at) VALUES (?,?,?,?,1,0,?,?,?) ON CONFLICT(club_id, coll, id) DO NOTHING")
    .bind(clubId, coll, id, JSON.stringify(data), userId, nowIso(), nowIso());
}

export interface Me { id: string; first: string | null; last: string | null; email: string }

/** Applique les réponses : colonnes du club, réglages, données de départ, fiche du gérant, liste de démarrage. Idempotent. */
export async function complete(db: D1Database, clubId: string, me: Me, extra: unknown): Promise<{ plan: Plan; person_ref: string | null }> {
  const cur = await loadClub(db, clubId);
  if (!cur) throw new Error("club_missing");
  const answers: Answers = { ...cur.onb.answers, ...sanitize(extra) };
  const plan = buildPlan(answers);
  const now = nowIso();

  /* colonnes du club */
  const address = answers.address ? JSON.stringify({ line1: answers.address.line1 || "", line2: "", zip: answers.address.zip || "", city: answers.address.city || "", country: answers.address.country || "FR" }) : cur.row.address;
  await run(db, `UPDATE clubs SET name = ?, kind = ?, legal_form = ?, siren = COALESCE(?, siren), siret = COALESCE(?, siret), vat_regime = ?, address = ?,
      email = COALESCE(?, email), phone = COALESCE(?, phone), updated_at = ? WHERE id = ?`,
    answers.name || cur.row.name, plan.kind, plan.legal_form ?? cur.row.legal_form, answers.siren ?? null, answers.siret ?? null, plan.vat_regime, address,
    answers.email ?? null, answers.phone ?? null, now, clubId);

  /* réglages : écrans masqués, fonctions, fiche du club pour l'interface */
  const settings = cur.settings;
  settings.modulesOff = plan.modulesOff;
  settings.features = { ...(settings.features || {}), ...plan.features };
  settings.templates = plan.templates;
  settings.careRules = plan.careRules;
  if (plan.migration) settings.migration = plan.migration; else delete settings.migration;
  await saveSettings(db, clubId, settings);

  /* données de départ (jamais écrasées si elles existent déjà) */
  const stmts: D1PreparedStatement[] = [];
  for (const f of plan.forfaits) stmts.push(insertRecord(db, clubId, "forfaits", f.id, f, me.id));
  for (const p of plan.pensionPlans) stmts.push(insertRecord(db, clubId, "pensionPlans", p.id, p, me.id));
  /* la fiche du club au format de l'interface : objet unique « club » (id « _ ») du magasin records */
  const prevClub = await one<{ data: string; version: number }>(db, "SELECT data, version FROM records WHERE club_id = ? AND coll = 'club' AND id = '_'", clubId);
  const clubUi: Record<string, unknown> = { ...stripEmpty(json<Record<string, unknown>>(prevClub?.data, {})), ...stripEmpty(plan.club_ui), name: answers.name || cur.row.name };
  if (!Array.isArray(clubUi.arenas) || !(clubUi.arenas as unknown[]).length) clubUi.arenas = plan.club_ui.arenas;
  if (!Array.isArray(clubUi.paddocks) || !(clubUi.paddocks as unknown[]).length) clubUi.paddocks = plan.club_ui.paddocks;
  stmts.push(db.prepare(`INSERT INTO records (club_id, coll, id, data, version, deleted, updated_by, created_at, updated_at) VALUES (?, 'club', '_', ?, 1, 0, ?, ?, ?)
    ON CONFLICT(club_id, coll, id) DO UPDATE SET data = excluded.data, version = records.version + 1, deleted = 0, updated_by = excluded.updated_by, updated_at = excluded.updated_at`)
    .bind(clubId, JSON.stringify(clubUi), me.id, now, now));

  /* fiche du gérant dans l'équipe, reliée à son accès */
  const m = await one<{ role: string; person_ref: string | null }>(db, "SELECT role, person_ref FROM memberships WHERE user_id = ? AND club_id = ?", me.id, clubId);
  let personRef = m?.person_ref ?? null;
  if (!personRef && m && (m.role === "owner" || m.role === "manager")) {
    personRef = "s_" + me.id.replace(/^usr_/, "").slice(-10);
    const coach = plan.kind === "coach_independant";
    stmts.push(insertRecord(db, clubId, "staff", personRef, {
      id: personRef, first: me.first || me.email.split("@")[0], last: me.last || "", role: coach ? "Coach" : m.role === "owner" ? "Gérant" : "Gérant associé",
      dip: "", contract: "Dirigeant", hours: 0, color: "var(--c2)", email: me.email, user_id: me.id,
    }, me.id));
    stmts.push(db.prepare("UPDATE memberships SET person_ref = ? WHERE user_id = ? AND club_id = ? AND person_ref IS NULL").bind(personRef, me.id, clubId));
  }
  await db.batch(stmts);

  /* liste de démarrage : garde les tâches déjà cochées */
  const done = await all<{ task_id: string; done_at: string | null; dismissed_at: string | null }>(db, "SELECT task_id, done_at, dismissed_at FROM onboarding_tasks WHERE club_id = ?", clubId);
  const doneSet = new Set(done.filter((d) => d.done_at || d.dismissed_at).map((d) => d.task_id));
  const tasks = plan.tasks.map((t) => ({ ...t, done: doneSet.has(t.id) }));
  const onb: OnbState = { ...cur.onb, answers, completed_at: cur.onb.completed_at || now, tasks, step: "done" };
  await saveOnboarding(db, clubId, onb);
  await audit(db, { club_id: clubId, user_id: me.id, action: "onboarding.complete", target: clubId, data: { kind: plan.kind, software: answers.software || null } });
  return { plan, person_ref: personRef };
}

function stripEmpty(o: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && !v.length)) out[k] = v;
  return out;
}

export async function tasksWithState(db: D1Database, clubId: string, tasks: Task[] = []) {
  const rows = await all<{ task_id: string; done_at: string | null; dismissed_at: string | null }>(db, "SELECT task_id, done_at, dismissed_at FROM onboarding_tasks WHERE club_id = ?", clubId);
  const by = new Map(rows.map((r) => [r.task_id, r]));
  return tasks.map((t) => { const r = by.get(t.id); return { ...t, done: !!(r && r.done_at), dismissed: !!(r && r.dismissed_at) }; });
}
