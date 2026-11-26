/*
 * Espace admin · prospection : centres équestres à démarcher. Aucun e-mail ne part d'ici : le bouton « Écrire »
 * ouvre la messagerie de l'admin, et l'admin note lui-même le contact.
 *   GET    /admin/api/prospects?q=&statut=
 *   POST   /admin/api/prospects            {name, city?, email?, phone?, source?, notes?}
 *   POST   /admin/api/prospects/import     {csv, confirm: true}  (colonnes : nom, ville, e-mail, source, téléphone, notes)
 *   PATCH  /admin/api/prospects/:id        {status?, notes?, ...}
 *   DELETE /admin/api/prospects/:id        {confirm: true}
 */
import { Hono } from "hono";
import type { AppEnv } from "../env";
import { all, one, run } from "../lib/db";
import { ApiError, bad, body, isEmail, notFound } from "../lib/http";
import { newId, nowIso } from "../lib/ids";
import { adminLog, needConfirm } from "./access";
import { parseProspectsCsv, type ProspectIn } from "./metrics";

const app = new Hono<AppEnv>();
export const PROSPECT_STATUSES = ["a_contacter", "contacte", "demo", "client", "perdu"] as const;

const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

app.get("/admin/api/prospects", async (c) => {
  const q = clean(c.req.query("q"), 80).toLowerCase(), st = c.req.query("statut") || "";
  const like = "%" + q.replace(/[%_]/g, "") + "%";
  const rows = await all<any>(c.env.DB, `SELECT id, name, city, email, phone, source, status, notes, club_id, last_contact_at, created_at, updated_at FROM prospects
    WHERE (? = '' OR status = ?) AND (? = '' OR lower(name) LIKE ? OR lower(COALESCE(city,'')) LIKE ? OR lower(COALESCE(email,'')) LIKE ?)
    ORDER BY CASE status WHEN 'demo' THEN 0 WHEN 'contacte' THEN 1 WHEN 'a_contacter' THEN 2 WHEN 'client' THEN 3 ELSE 4 END, updated_at DESC LIMIT 500`, st, st, q, like, like, like);
  const counts = await all<{ status: string; n: number }>(c.env.DB, "SELECT status, COUNT(*) AS n FROM prospects GROUP BY status");
  return c.json({ prospects: rows, counts: Object.fromEntries(counts.map((x) => [x.status, x.n])) });
});

async function insert(db: D1Database, p: ProspectIn, by: string | null) {
  const email = p.email || null;
  if (email) {
    const ex = await one(db, "SELECT id FROM prospects WHERE email = ?", email);
    if (ex) return { created: false, id: (ex as any).id as string };
  } else {
    const ex = await one(db, "SELECT id FROM prospects WHERE lower(name) = lower(?) AND lower(COALESCE(city,'')) = lower(?)", p.name, p.city || "");
    if (ex) return { created: false, id: (ex as any).id as string };
  }
  const id = newId("prs");
  await run(db, "INSERT INTO prospects (id, name, city, email, phone, source, notes, created_by) VALUES (?,?,?,?,?,?,?,?)",
    id, p.name, p.city || null, email, p.phone || null, p.source || null, p.notes || null, by);
  return { created: true, id };
}

app.post("/admin/api/prospects", async (c) => {
  const b = await body<Record<string, unknown>>(c);
  const p: ProspectIn = { name: clean(b.name, 160), city: clean(b.city, 80), email: clean(b.email, 254).toLowerCase(), phone: clean(b.phone, 40), source: clean(b.source, 120), notes: clean(b.notes, 2000) };
  if (!p.name) throw bad("missing_field", "Indiquez le nom du centre.", { field: "name" });
  if (p.email && !isEmail(p.email)) throw bad("invalid_email", "Cette adresse e-mail n'est pas valide.", { field: "email" });
  if (p.email && !p.source) throw bad("missing_field", "Indiquez d'où vient cette adresse (annuaire, salon, site du centre…).", { field: "source" });
  const r = await insert(c.env.DB, p, c.get("user")!.id);
  if (!r.created) throw new ApiError(409, "duplicate", "Ce centre est déjà dans la liste.");
  await adminLog(c, "prospect.create", { target: r.id, data: { name: p.name } });
  return c.json({ ok: true, id: r.id }, 201);
});

app.post("/admin/api/prospects/import", async (c) => {
  const b = await body<{ csv?: unknown; confirm?: unknown; source?: unknown }>(c);
  const csv = String(b.csv || "");
  if (!csv.trim()) throw bad("missing_field", "Collez ou déposez un fichier CSV.", { field: "csv" });
  if (csv.length > 2_000_000) throw bad("too_large", "Fichier trop gros : 2 Mo au maximum.");
  const parsed = parseProspectsCsv(csv);
  const fallbackSource = clean(b.source, 120);
  const rows = parsed.rows.map((r) => ({ ...r, source: r.source || fallbackSource }));
  const noSource = rows.filter((r) => r.email && !r.source).length;
  if (b.confirm !== true) return c.json({ preview: true, rows: rows.length, rejected: parsed.rejected.slice(0, 50), columns: parsed.columns, sample: rows.slice(0, 5), missing_source: noSource });
  needConfirm(b);
  if (noSource) throw bad("missing_source", `${noSource} ligne(s) ont un e-mail sans origine : ajoutez une colonne « source » ou indiquez l'origine du fichier.`);
  let created = 0, skipped = 0;
  for (const r of rows) { const x = await insert(c.env.DB, r, c.get("user")!.id); if (x.created) created++; else skipped++; }
  await adminLog(c, "prospect.import", { data: { created, skipped, rejected: parsed.rejected.length } });
  return c.json({ ok: true, created, skipped, rejected: parsed.rejected.slice(0, 50) });
});

app.patch("/admin/api/prospects/:id", async (c) => {
  const b = await body<Record<string, unknown>>(c);
  const p = await one<any>(c.env.DB, "SELECT * FROM prospects WHERE id = ?", c.req.param("id"));
  if (!p) throw notFound("Prospect introuvable.");
  const status = b.status === undefined ? p.status : String(b.status);
  if (!(PROSPECT_STATUSES as readonly string[]).includes(status)) throw bad("invalid_field", "Statut inconnu.", { field: "status", allowed: PROSPECT_STATUSES });
  const f = (k: string, max: number) => (b[k] === undefined ? p[k] : clean(b[k], max) || null);
  const email = b.email === undefined ? p.email : clean(b.email, 254).toLowerCase() || null;
  if (email && !isEmail(email)) throw bad("invalid_email", "Cette adresse e-mail n'est pas valide.", { field: "email" });
  const contacted = status !== p.status && status !== "a_contacter" ? nowIso() : p.last_contact_at;
  try {
    await run(c.env.DB, "UPDATE prospects SET name = ?, city = ?, email = ?, phone = ?, source = ?, notes = ?, status = ?, last_contact_at = ?, updated_at = ? WHERE id = ?",
      f("name", 160) || p.name, f("city", 80), email, f("phone", 40), f("source", 120), f("notes", 4000), status, contacted, nowIso(), p.id);
  } catch (e) {
    if (String((e as Error).message).includes("UNIQUE")) throw new ApiError(409, "duplicate", "Un autre prospect a déjà cette adresse e-mail.");
    throw e;
  }
  await adminLog(c, "prospect.update", { target: p.id, data: { status: status !== p.status ? status : undefined } });
  return c.json({ ok: true, status });
});

app.delete("/admin/api/prospects/:id", async (c) => {
  const b = await body<{ confirm?: unknown }>(c);
  needConfirm(b);
  const p = await one<any>(c.env.DB, "SELECT id, name FROM prospects WHERE id = ?", c.req.param("id"));
  if (!p) throw notFound("Prospect introuvable.");
  await run(c.env.DB, "DELETE FROM prospects WHERE id = ?", p.id);
  await adminLog(c, "prospect.delete", { target: p.id, data: { name: p.name } });
  return c.json({ ok: true });
});

export default app;
