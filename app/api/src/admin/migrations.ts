/*
 * Espace admin · migrations : jobs d'import (passerelle, robot, fichiers), sessions du robot (journal),
 * incidents signalés, recettes apprises par logiciel. « Relancer » recalcule la simulation d'un job
 * (rien n'est écrit chez le club) et le remet à l'état « simulé » : le gérant n'a plus qu'à confirmer.
 */
import { Hono } from "hono";
import type { AppEnv } from "../env";
import { all, json, one, run } from "../lib/db";
import { ApiError, body, notFound } from "../lib/http";
import { runCommit, type Report } from "../import/engine";
import { adminLog, needConfirm } from "./access";

const app = new Hono<AppEnv>();
const DAY = 864e5;

function summary(rep: Partial<Report> & { error?: string } | null) {
  if (!rep) return { sets: 0, found: 0, imported: 0, errors: 0, warnings: 0, error: null as string | null };
  const counts = rep.counts || {};
  const t = rep.totals;
  return {
    sets: Object.values(counts).filter((x: any) => x && x.received > 0).length,
    found: t?.received ?? 0,
    imported: t ? t.created + t.updated + t.merged : 0,
    errors: t?.errors ?? 0, warnings: t?.warnings ?? 0,
    error: rep.error || null,
  };
}

app.get("/admin/api/migrations", async (c) => {
  const db = c.env.DB;
  const etat = c.req.query("etat") || "";
  const jobs = await all<any>(db, `SELECT j.id, j.club_id, c.name AS club_name, j.source, j.status, j.dry_run, j.item_count, j.report, j.created_at, j.committed_at, j.rolled_back_at
    FROM import_jobs j LEFT JOIN clubs c ON c.id = j.club_id
    WHERE (? = '' OR j.status = ? OR (? = 'en_cours' AND j.status IN ('open','simulated','committing')))
    ORDER BY j.created_at DESC LIMIT 200`, etat, etat, etat);
  const robots = await all<any>(db, `SELECT a.at, a.club_id, c.name AS club_name, a.target, a.data FROM audit_log a LEFT JOIN clubs c ON c.id = a.club_id
    WHERE a.action = 'migration.robot.open' ORDER BY a.at DESC LIMIT 30`);
  const incidents = await all<any>(db, `SELECT i.id, i.club_id, c.name AS club_name, i.software, i.step, i.message, i.screenshot_key, i.tool_version, i.created_at
    FROM migration_incidents i LEFT JOIN clubs c ON c.id = i.club_id ORDER BY i.created_at DESC LIMIT 50`);
  const recipes = await all<any>(db, `SELECT software, name, MAX(version) AS version, COUNT(*) AS versions, MAX(created_at) AS updated_at,
      COUNT(DISTINCT created_by_club) AS clubs FROM migration_recipes GROUP BY software, name ORDER BY software, name LIMIT 200`);
  const bySoftware = await all<any>(db, `SELECT source, COUNT(*) AS jobs, SUM(CASE WHEN status = 'committed' THEN 1 ELSE 0 END) AS committed,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed FROM import_jobs GROUP BY source ORDER BY jobs DESC LIMIT 30`);
  const since = new Date(Date.now() - 30 * DAY).toISOString();
  const incBySoft = await all<any>(db, "SELECT software, COUNT(*) AS n FROM migration_incidents WHERE created_at >= ? GROUP BY software", since);
  return c.json({
    jobs: jobs.map((j) => ({ ...j, report: undefined, dry_run: !!j.dry_run, summary: summary(json(j.report, null)) })),
    robots: robots.map((r) => ({ at: r.at, club_id: r.club_id, club_name: r.club_name, session: r.target, ...json<any>(r.data, {}) })),
    incidents: incidents.map((i) => ({ ...i, has_capture: !!i.screenshot_key, screenshot_key: undefined })),
    recipes, by_software: bySoftware.map((s) => ({ ...s, incidents_30d: incBySoft.find((x) => x.software === s.source)?.n || 0 })),
  });
});

app.get("/admin/api/migrations/:id", async (c) => {
  const db = c.env.DB;
  const j = await one<any>(db, "SELECT j.*, c.name AS club_name FROM import_jobs j LEFT JOIN clubs c ON c.id = j.club_id WHERE j.id = ?", c.req.param("id"));
  if (!j) throw notFound("Migration introuvable.");
  const rep = json<any>(j.report, null);
  const items = await all<any>(db, "SELECT coll, COUNT(*) AS n FROM import_items WHERE job_id = ? GROUP BY coll", j.id);
  const incidents = await all<any>(db, "SELECT id, software, step, message, details, created_at, screenshot_key FROM migration_incidents WHERE club_id = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 20",
    j.club_id, new Date(Date.parse(j.created_at) - DAY).toISOString());
  return c.json({
    job: { id: j.id, club_id: j.club_id, club_name: j.club_name, source: j.source, status: j.status, dry_run: !!j.dry_run, item_count: j.item_count, created_at: j.created_at, committed_at: j.committed_at, rolled_back_at: j.rolled_back_at, created_by: j.created_by },
    summary: summary(rep), counts: rep?.counts || {}, items: Object.fromEntries(items.map((x) => [x.coll, x.n])),
    errors: (rep?.errors || []).slice(0, 50), warnings: (rep?.warnings || []).slice(0, 50), error: rep?.error || null,
    incidents: incidents.map((i) => ({ ...i, details: json(i.details, i.details), has_capture: !!i.screenshot_key, screenshot_key: undefined })),
  });
});

app.post("/admin/api/migrations/:id/relancer", async (c) => {
  const b = await body<{ confirm?: unknown }>(c);
  needConfirm(b);
  const db = c.env.DB;
  const j = await one<any>(db, "SELECT id, club_id, source, status, item_count FROM import_jobs WHERE id = ?", c.req.param("id"));
  if (!j) throw notFound("Migration introuvable.");
  if (!["failed", "open", "simulated"].includes(j.status)) throw new ApiError(409, "job_closed", `Cette migration est à l'état « ${j.status} » : il n'y a rien à relancer.`);
  if (!j.item_count) throw new ApiError(409, "empty_job", "Cette migration ne contient aucune ligne : le club doit relancer la copie.");
  const rep = await runCommit(c.env, j, true);
  await run(db, "UPDATE import_jobs SET status = 'simulated', report = ? WHERE id = ?", JSON.stringify(rep), j.id);
  await adminLog(c, "migration.resimulate", { club_id: j.club_id, target: j.id, data: { from: j.status, totals: rep.totals } });
  return c.json({ ok: true, status: "simulated", summary: summary(rep) });
});

app.get("/admin/api/incidents/:id/capture", async (c) => {
  const i = await one<{ screenshot_key: string | null }>(c.env.DB, "SELECT screenshot_key FROM migration_incidents WHERE id = ?", c.req.param("id"));
  if (!i?.screenshot_key) throw notFound("Pas de capture pour cet incident.");
  const o = await c.env.FILES.get(i.screenshot_key);
  if (!o) throw notFound("Capture introuvable.");
  return new Response(o.body, { headers: { "content-type": o.httpMetadata?.contentType || "image/png", "cache-control": "private, no-store" } });
});

app.get("/admin/api/recettes/:software", async (c) => {
  const rows = await all<any>(c.env.DB, "SELECT id, name, version, recipe, notes, created_by_club, created_at FROM migration_recipes WHERE software = ? ORDER BY name, version DESC LIMIT 50", c.req.param("software"));
  return c.json({ software: c.req.param("software"), versions: rows.map((r) => ({ ...r, recipe: json(r.recipe, {}) })) });
});

export default app;
