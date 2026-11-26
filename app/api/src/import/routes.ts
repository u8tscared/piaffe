import { Hono, type Context, type MiddlewareHandler } from "hono";
import type { AppEnv } from "../env";
import { requireRole } from "../lib/auth";
import { csrf } from "../auth/csrf";
import { all, json, one, rateLimit, run } from "../lib/db";
import { ApiError, bad, body, forbidden, notFound } from "../lib/http";
import { newId, nowIso } from "../lib/ids";
import { COLLS, type Coll } from "./schema";
import { runCommit, runRollback, type Report, type Saved } from "./engine";
import { emit } from "../lib/events";
import { CSV_FIELDS, decode, detectDelimiter, findHeaderRow, guessColl, mapColumns, parseCsv, rowsToItems } from "./csv";
import { normalizeItem } from "./schema";
import campaign, { cron as campaignCron } from "./campaign";
// @ts-ignore : module JavaScript du fil migration (passerelle), sans déclaration de types
import { lireFichier } from "../../../../migration/core/lire.mjs";
// @ts-ignore : module JavaScript du fil migration (passerelle), sans déclaration de types
import { construirePaquet } from "../../../../migration/core/paquet.mjs";
// @ts-ignore : module JavaScript du fil migration (passerelle), sans déclaration de types
import { versLots } from "../../../../migration/core/vers-api.mjs";

const app = new Hono<AppEnv>();

export const MAX_ITEMS_PER_CALL = 500;
export const MAX_ITEMS_PER_JOB = 50000;
const MAX_ITEM_BYTES = 64 * 1024;
const MAX_CSV_BYTES = 10 * 1024 * 1024;

/** Clé d'API portant l'un des scopes, ou session gérant. */
export function requireAnyScope(...scopes: string[]): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const k = c.get("apiKey");
    if (k) {
      if (!k.scopes.includes("*") && !scopes.some((s) => k.scopes.includes(s))) throw forbidden(`Cette clé d'API n'a pas le droit « ${scopes[0]} ».`);
      return next();
    }
    return requireRole("owner", "manager")(c, next);
  };
}
const actor = (c: Context<AppEnv>) => c.get("apiKey") ? "key:" + c.get("apiKey")!.id : c.get("user")?.id || null;
const clubId = (c: Context<AppEnv>) => { const cl = c.get("club"); if (!cl) throw new ApiError(403, "no_club", "Choisissez d'abord un club."); return cl.id; };

const limiter: MiddlewareHandler<AppEnv> = async (c, next) => {
  const club = c.get("club");
  if (club && !(await rateLimit(c.env.DB, "import:" + club.id, 600, 60)))
    throw new ApiError(429, "rate_limited", "Trop d'appels à l'API d'import : 600 par minute au maximum. Réessayez dans un instant.");
  return next();
};

app.use("/api/v1/*", csrf);
app.use("/api/v1/import/*", requireAnyScope("import"), limiter);

interface JobRow { id: string; club_id: string; source: string; dry_run: number; status: string; item_count: number; report: string | null; created_at: string; committed_at: string | null; rolled_back_at: string | null; created_by: string | null }

async function loadJob(c: Context<AppEnv>): Promise<JobRow> {
  const j = await one<JobRow>(c.env.DB, "SELECT * FROM import_jobs WHERE id = ? AND club_id = ?", c.req.param("id"), clubId(c));
  if (!j) throw notFound("Job d'import introuvable pour ce club.");
  return j;
}
function jobView(j: JobRow) {
  const r = json<Report | null>(j.report, null);
  return { job_id: j.id, source: j.source, dry_run: !!j.dry_run, status: j.status, item_count: j.item_count, created_at: j.created_at, committed_at: j.committed_at, rolled_back_at: j.rolled_back_at, report: r };
}

async function createJob(c: Context<AppEnv>, source: string, dry: boolean) {
  if (!/^[a-z0-9][a-z0-9_.-]{0,39}$/.test(source)) throw bad("invalid_source", "Le champ « source » doit être un identifiant court en minuscules (ex. kavalog, equimondo, csv).", { field: "source" });
  const id = newId("imp");
  await run(c.env.DB, "INSERT INTO import_jobs (id, club_id, source, dry_run, created_by) VALUES (?,?,?,?,?)", id, clubId(c), source, dry ? 1 : 0, actor(c));
  return id;
}

async function stageItems(c: Context<AppEnv>, j: JobRow, coll: string, items: unknown) {
  if (!(COLLS as readonly string[]).includes(coll)) throw bad("invalid_coll", `Collection inconnue : « ${coll} ». Valeurs possibles : ${COLLS.join(", ")}.`, { field: "coll", allowed: COLLS });
  if (!Array.isArray(items) || !items.length) throw bad("invalid_items", "Le champ « items » doit être un tableau non vide d'objets {external_id, data}.", { field: "items" });
  if (items.length > MAX_ITEMS_PER_CALL) throw bad("too_many_items", `500 objets au maximum par appel (reçu : ${items.length}). Découpez en plusieurs appels.`, { max: MAX_ITEMS_PER_CALL });
  if (!["open", "simulated"].includes(j.status)) throw new ApiError(409, "job_closed", `Ce job est à l'état « ${j.status} » : il n'accepte plus d'objets. Créez un nouveau job.`);
  const invalid: { index: number; message: string }[] = [];
  const seen = new Set<string>();
  items.forEach((it: any, i) => {
    if (!it || typeof it !== "object") return invalid.push({ index: i, message: "Objet attendu." });
    if (typeof it.external_id !== "string" || !it.external_id.trim() || it.external_id.length > 200) return invalid.push({ index: i, message: "« external_id » doit être un texte de 1 à 200 caractères." });
    if (!it.data || typeof it.data !== "object" || Array.isArray(it.data)) return invalid.push({ index: i, message: "« data » doit être un objet." });
    if (JSON.stringify(it.data).length > MAX_ITEM_BYTES) return invalid.push({ index: i, message: "« data » dépasse 64 Ko." });
    if (seen.has(it.external_id)) return invalid.push({ index: i, message: `external_id en double dans cet appel : ${it.external_id}.` });
    seen.add(it.external_id);
  });
  if (invalid.length) throw new ApiError(422, "invalid_items", `${invalid.length} objet(s) mal formé(s) : rien n'a été enregistré pour cet appel.`, { invalid: invalid.slice(0, 50) });
  if (j.item_count + items.length > MAX_ITEMS_PER_JOB) throw bad("job_too_large", `Un job accepte ${MAX_ITEMS_PER_JOB} objets au maximum. Ouvrez un second job.`);
  const db = c.env.DB;
  const base = (await one<{ n: number }>(db, "SELECT COALESCE(MAX(seq), 0) AS n FROM import_items WHERE job_id = ?", j.id))!.n;
  const st = (items as { external_id: string; data: unknown }[]).map((it, i) => db.prepare(
    "INSERT INTO import_items (job_id, coll, external_id, seq, data) VALUES (?,?,?,?,?) ON CONFLICT(job_id, coll, external_id) DO UPDATE SET data = excluded.data, seq = excluded.seq")
    .bind(j.id, coll, it.external_id.trim(), base + i + 1, JSON.stringify(it.data)));
  for (let i = 0; i < st.length; i += 100) await db.batch(st.slice(i, i + 100));
  const n = (await one<{ n: number }>(db, "SELECT COUNT(*) AS n FROM import_items WHERE job_id = ?", j.id))!.n;
  await run(db, "UPDATE import_jobs SET item_count = ? WHERE id = ?", n, j.id);
  return { job_id: j.id, coll, accepted: items.length, total_items: n };
}

async function commitJob(c: Context<AppEnv>, j: JobRow, dryRun: boolean): Promise<Report> {
  const db = c.env.DB;
  if (!["open", "simulated"].includes(j.status)) throw new ApiError(409, "job_closed", `Ce job est à l'état « ${j.status} » : il ne peut plus être appliqué.`);
  if (!j.item_count) throw bad("empty_job", "Ce job ne contient aucun objet : envoyez-les d'abord avec POST /api/v1/import/jobs/:id/items.");
  if (dryRun) {
    const rep = await runCommit(c.env, j, true);
    await run(db, "UPDATE import_jobs SET status = 'simulated', report = ? WHERE id = ?", JSON.stringify(rep), j.id);
    return rep;
  }
  const stale = new Date(Date.now() - 10 * 60000).toISOString();
  const lock = await run(db, `UPDATE import_jobs SET status = 'committing', committed_at = ? WHERE id = ? AND status IN ('open','simulated')
    AND NOT EXISTS (SELECT 1 FROM import_jobs j2 WHERE j2.club_id = ? AND j2.status = 'committing' AND j2.id != ? AND j2.committed_at > ?)`,
    nowIso(), j.id, j.club_id, j.id, stale);
  if (!lock.meta.changes) throw new ApiError(409, "import_busy", "Un autre import est en cours d'application pour ce club. Réessayez dans une minute.");
  try {
    const saved: Saved[] = [];
    const rep = await runCommit(c.env, j, false, (x) => saved.push(x));
    // Les autres lots sont prévenus (via: "import") : pas d'e-mail de bienvenue ni de confirmation pour un import.
    const userId = c.get("user")?.id ?? null;
    c.executionCtx.waitUntil((async () => {
      for (const x of saved) await emit(c.env, null, { type: "record.saved", club_id: j.club_id, coll: x.coll, id: x.id, data: x.data, previous: x.previous, user_id: userId, via: "import", job_id: j.id });
    })());
    await run(db, "UPDATE import_jobs SET status = 'committed', dry_run = 0, report = ?, committed_at = ? WHERE id = ?", JSON.stringify(rep), nowIso(), j.id);
    await run(db, "INSERT INTO audit_log (id, club_id, user_id, action, target, data) VALUES (?,?,?,?,?,?)", newId("aud"), j.club_id, c.get("user")?.id ?? null,
      "import.commit", j.id, JSON.stringify({ source: j.source, totals: rep.totals, by: actor(c) }));
    return rep;
  } catch (e) {
    await run(db, "UPDATE import_jobs SET status = 'failed', report = ? WHERE id = ?", JSON.stringify({ error: String((e as Error)?.message || e).slice(0, 500) }), j.id);
    throw new ApiError(500, "import_failed", "L'import a échoué en cours d'application. Ce qui a été écrit peut être annulé avec POST /api/v1/import/jobs/:id/rollback.");
  }
}

/* ---------- Jobs ---------- */
app.post("/api/v1/import/jobs", async (c) => {
  const b = await body<{ source?: string; dry_run?: boolean }>(c);
  const source = String(b.source ?? "").trim().toLowerCase();
  if (!source) throw bad("missing_field", "Le champ « source » est obligatoire (ex. kavalog, equimondo, csv).", { field: "source" });
  const id = await createJob(c, source, !!b.dry_run);
  return c.json({ job_id: id, source, dry_run: !!b.dry_run, status: "open" }, 201);
});
app.get("/api/v1/import/jobs", async (c) => {
  const rows = await all<JobRow>(c.env.DB, "SELECT id, club_id, source, dry_run, status, item_count, NULL AS report, created_at, committed_at, rolled_back_at, created_by FROM import_jobs WHERE club_id = ? ORDER BY created_at DESC LIMIT 50", clubId(c));
  return c.json({ jobs: rows.map(jobView) });
});
app.get("/api/v1/import/jobs/:id", async (c) => c.json(jobView(await loadJob(c))));
app.post("/api/v1/import/jobs/:id/items", async (c) => {
  const j = await loadJob(c);
  const b = await body<{ coll?: string; items?: unknown }>(c);
  return c.json(await stageItems(c, j, String(b.coll ?? ""), b.items));
});
app.post("/api/v1/import/jobs/:id/commit", async (c) => {
  const j = await loadJob(c);
  let b: { dry_run?: boolean } = {};
  try { const t = await c.req.text(); if (t.trim()) b = JSON.parse(t); } catch { throw bad("invalid_json", "Le corps de la requête doit être un objet JSON (ou vide)."); }
  const dry = typeof b.dry_run === "boolean" ? b.dry_run : !!j.dry_run;
  return c.json(await commitJob(c, j, dry));
});
app.post("/api/v1/import/jobs/:id/rollback", async (c) => {
  const j = await loadJob(c);
  if (!["committed", "failed"].includes(j.status)) throw new ApiError(409, "not_committed", `Seul un job appliqué peut être annulé (état actuel : « ${j.status} »).`);
  const r = await runRollback(c.env, j);
  await run(c.env.DB, "INSERT INTO audit_log (id, club_id, user_id, action, target, data) VALUES (?,?,?,?,?,?)", newId("aud"), j.club_id, c.get("user")?.id ?? null, "import.rollback", j.id, JSON.stringify({ deleted: r.deleted, restored: r.restored }));
  return c.json({ job_id: j.id, status: "rolled_back", ...r });
});

/* ---------- Mappage des colonnes ---------- */
app.post("/api/v1/import/colonnes", async (c) => {
  const b = await body<{ entetes?: unknown; exemples?: unknown; coll?: string }>(c);
  if (!Array.isArray(b.entetes) || !b.entetes.length || b.entetes.length > 300) throw bad("invalid_field", "Le champ « entetes » doit être un tableau de 1 à 300 textes.", { field: "entetes" });
  const headers = b.entetes.map((x) => String(x ?? ""));
  const ex = Array.isArray(b.exemples) ? (b.exemples as unknown[]).slice(0, 20).map((r) => (Array.isArray(r) ? r.map((x) => String(x ?? "")) : [])) : [];
  const m = await mapColumns(headers, ex, b.coll);
  return c.json({ ...m, coll: b.coll || guessColl(m.mapping), champs: CSV_FIELDS, moteur: "heuristique" });
});

/* ---------- Import CSV ---------- */
app.post("/api/v1/import/csv", async (c) => {
  const ct = c.req.header("content-type") || "";
  const q = c.req.query();
  let bytes: Uint8Array | null = null;
  const opt: Record<string, string> = { ...q };
  if (ct.startsWith("multipart/form-data")) {
    const form = await c.req.parseBody();
    const f = form.file ?? form.fichier;
    if (!(f instanceof File)) throw bad("missing_file", "Envoyez le fichier dans le champ « file » du formulaire.", { field: "file" });
    if (f.size > MAX_CSV_BYTES) throw bad("file_too_large", "Fichier trop volumineux : 10 Mo au maximum.");
    bytes = new Uint8Array(await f.arrayBuffer());
    for (const [k, v] of Object.entries(form)) if (typeof v === "string") opt[k] = v;
  } else if (ct.startsWith("application/json")) {
    const b = await body<Record<string, any>>(c);
    if (typeof b.content === "string") bytes = new TextEncoder().encode(b.content);
    else if (typeof b.content_b64 === "string") bytes = Uint8Array.from(atob(b.content_b64), (x) => x.charCodeAt(0));
    else throw bad("missing_file", "Indiquez le contenu du fichier dans « content » (texte) ou « content_b64 » (base64).");
    for (const [k, v] of Object.entries(b)) if (k !== "content" && k !== "content_b64") opt[k] = typeof v === "string" ? v : JSON.stringify(v);
  } else {
    const buf = new Uint8Array(await c.req.arrayBuffer());
    if (!buf.length) throw bad("missing_file", "Le corps de la requête est vide : envoyez le contenu du fichier CSV.");
    bytes = buf;
  }
  if (bytes.length > MAX_CSV_BYTES) throw bad("file_too_large", "Fichier trop volumineux : 10 Mo au maximum.");
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) throw bad("xlsx_not_supported", "Ce fichier est un classeur Excel (.xlsx). Enregistrez-le au format CSV (séparateur point-virgule) ou utilisez la passerelle de migration.");
  const { text, encoding } = decode(bytes, opt.encoding);
  const delimiter = opt.delimiter ? (opt.delimiter === "tab" ? "\t" : opt.delimiter.slice(0, 1)) : detectDelimiter(text);
  const rows = parseCsv(text, delimiter);
  if (rows.length < 2) throw bad("empty_csv", "Le fichier ne contient pas de données (au moins une ligne d'en-tête et une ligne).");
  if (rows.length > 20001) throw bad("too_many_rows", "20 000 lignes au maximum par fichier.");
  const hr = findHeaderRow(rows);
  const headers = rows[hr].map((h, i) => h || `Colonne ${i + 1}`);
  const data = rows.slice(hr + 1);
  let mapping: Record<string, string | null>, confiance: Record<string, number> = {};
  if (opt.mapping) {
    try { mapping = JSON.parse(opt.mapping); } catch { throw bad("invalid_mapping", "Le champ « mapping » doit être un objet JSON {\"En-tête\": \"champ\" | null}."); }
    if (!mapping || typeof mapping !== "object") throw bad("invalid_mapping", "Le champ « mapping » doit être un objet JSON.");
    const unknown = Object.entries(mapping).filter(([, f]) => f && !(f in CSV_FIELDS));
    if (unknown.length) throw bad("invalid_mapping", `Champs inconnus dans le mappage : ${unknown.map(([, f]) => f).join(", ")}.`, { allowed: Object.keys(CSV_FIELDS) });
    for (const h of headers) if (!(h in mapping)) mapping[h] = null;
  } else ({ mapping, confiance } = await mapColumns(headers, data.slice(0, 10), opt.coll));
  const coll = opt.coll === "horses" || opt.coll === "members" ? opt.coll : guessColl(mapping);
  const { members, horses } = rowsToItems(headers, data, mapping, coll);
  const detected = { encoding, delimiter: delimiter === "\t" ? "tab" : delimiter, header_row: hr + 1, rows: data.length, columns: headers.length };
  const action = (opt.action || "preview").toLowerCase();
  if (action !== "commit") {
    const sample = [...members.slice(0, 5).map((m) => ({ coll: "members", external_id: m.external_id, data: normalizeItem("members", m.data).data })),
      ...horses.slice(0, 3).map((h) => ({ coll: "horses", external_id: h.external_id, data: normalizeItem("horses", h.data).data }))];
    return c.json({
      action: "preview", detected, coll, mapping, confiance, champs: CSV_FIELDS,
      unmapped: headers.filter((h) => !mapping[h]),
      counts: { members: members.length, horses: horses.length }, sample,
      next: "Vérifiez le mappage puis renvoyez le fichier avec action=commit (et mapping si vous l'avez modifié). Ajoutez dry_run=true pour simuler.",
    });
  }
  const dry = ["1", "true", "oui"].includes(String(opt.dry_run || "").toLowerCase());
  const source = (opt.source || "csv").toLowerCase();
  const jobId = await createJob(c, source, dry);
  let j = (await one<JobRow>(c.env.DB, "SELECT * FROM import_jobs WHERE id = ?", jobId))!;
  for (const [cl, list] of [["members", members], ["horses", horses]] as [Coll, typeof members][]) {
    for (let i = 0; i < list.length; i += MAX_ITEMS_PER_CALL) {
      await stageItems(c, j, cl, list.slice(i, i + MAX_ITEMS_PER_CALL));
      j = (await one<JobRow>(c.env.DB, "SELECT * FROM import_jobs WHERE id = ?", jobId))!;
    }
  }
  if (!j.item_count) throw bad("empty_csv", "Aucune ligne exploitable avec ce mappage : vérifiez les colonnes Nom, Prénom ou Nom du cheval.");
  const report = await commitJob(c, j, dry);
  return c.json({ action: "commit", detected, coll, mapping, job_id: jobId, report });
});

/* ---------- Import de n'importe quel fichier : Excel, CSV, FEC, export HelloAsso, capture du robot ----------
 * Même lecture que la passerelle (migration/core) : le type de chaque tableau et le rôle de chaque colonne sont
 * devinés tout seuls ; un FEC donne aussi le résumé comptable (exercice, journaux, plan de comptes, TVA, équilibre).
 *   POST /api/v1/import/fichier   multipart (champ « file ») | JSON {nom, content | content_b64} | corps brut (?nom=)
 *   action=preview (défaut) : ce qui a été compris, sans rien écrire ; action=commit (+ dry_run=true pour simuler).
 *   POST /api/v1/import/fec       même chose, pour un fichier des écritures comptables. */
const inflateBrut = async (o: Uint8Array) => new Uint8Array(await new Response(new Blob([o]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
async function fichierRecu(c: Context<AppEnv>): Promise<{ nom: string; octets: Uint8Array; opt: Record<string, string> }> {
  const ct = c.req.header("content-type") || "";
  const opt: Record<string, string> = { ...c.req.query() };
  let octets: Uint8Array, nom = opt.nom || "";
  if (ct.startsWith("multipart/form-data")) {
    const form = await c.req.parseBody();
    const f = form.file ?? form.fichier;
    if (!(f instanceof File)) throw bad("missing_file", "Envoyez le fichier dans le champ « file » du formulaire.", { field: "file" });
    if (f.size > MAX_CSV_BYTES) throw bad("file_too_large", "Fichier trop volumineux : 10 Mo au maximum.");
    octets = new Uint8Array(await f.arrayBuffer()); nom = nom || f.name;
    for (const [k, v] of Object.entries(form)) if (typeof v === "string") opt[k] = v;
  } else if (ct.startsWith("application/json")) {
    const b = await body<Record<string, any>>(c);
    if (typeof b.content === "string") octets = new TextEncoder().encode(b.content);
    else if (typeof b.content_b64 === "string") { try { octets = Uint8Array.from(atob(b.content_b64), (x) => x.charCodeAt(0)); } catch { throw bad("invalid_field", "« content_b64 » n'est pas du base64 valide."); } }
    else throw bad("missing_file", "Indiquez le contenu du fichier dans « content » (texte) ou « content_b64 » (base64).");
    for (const [k, v] of Object.entries(b)) if (k !== "content" && k !== "content_b64" && typeof v !== "object") opt[k] = String(v);
    nom = String(b.nom || nom);
  } else {
    octets = new Uint8Array(await c.req.arrayBuffer());
    if (!octets.length) throw bad("missing_file", "Le corps de la requête est vide : envoyez le contenu du fichier.");
  }
  if (octets.length > MAX_CSV_BYTES) throw bad("file_too_large", "Fichier trop volumineux : 10 Mo au maximum.");
  return { nom: (nom || "fichier.csv").slice(0, 200), octets, opt };
}
async function importerFichier(c: Context<AppEnv>, nom: string, octets: Uint8Array, opt: Record<string, string>) {
  let tables: any[];
  try { tables = await lireFichier(nom, octets, { inflate: inflateBrut }); }
  catch { throw bad("unreadable_file", "Ce fichier n'a pas pu être lu. Enregistrez-le en .xlsx ou en .csv et réessayez."); }
  const erreur = tables.find((t) => t.erreur);
  if (erreur && tables.every((t) => !t.lignes?.length)) throw bad("unreadable_file", erreur.erreur);
  const paquet = construirePaquet(tables);
  const lots = (versLots(paquet) as { coll: Coll; items: { external_id: string; data: unknown }[] }[]).filter((l) => l.items.length);
  const sources = paquet.sources.map((x: any) => ({ fichier: x.fichier, feuille: x.feuille, logiciel: x.logiciel, type: x.type, lignes: x.lignes, colonnes: x.colonnes, ignorees: x.ignorees }));
  const resume = { sources, controle: paquet.controle, comptabilite: paquet.comptabilite ? { ...paquet.comptabilite, comptes: paquet.comptabilite.comptes.length, journaux: paquet.comptabilite.journaux } : null,
    lots: Object.fromEntries(lots.map((l) => [l.coll, l.items.length])), avertissements: (paquet.avertissements || []).slice(0, 50) };
  if ((opt.action || "preview").toLowerCase() !== "commit")
    return c.json({ action: "preview", ...resume, next: "Si le rangement vous convient, renvoyez le fichier avec action=commit (dry_run=true pour simuler)." });
  if (!lots.length) throw bad("empty_file", "Aucune donnée exploitable dans ce fichier.");
  const dry = ["1", "true", "oui"].includes(String(opt.dry_run || "").toLowerCase());
  const brut = String(opt.source || sources.find((x: any) => x.logiciel)?.logiciel || "fichier").toLowerCase();
  const jobId = await createJob(c, /^[a-z0-9][a-z0-9_.-]{0,39}$/.test(brut) ? brut : "fichier", dry);
  let j = (await one<JobRow>(c.env.DB, "SELECT * FROM import_jobs WHERE id = ?", jobId))!;
  for (const l of lots) for (let i = 0; i < l.items.length; i += MAX_ITEMS_PER_CALL) {
    await stageItems(c, j, l.coll, l.items.slice(i, i + MAX_ITEMS_PER_CALL));
    j = (await one<JobRow>(c.env.DB, "SELECT * FROM import_jobs WHERE id = ?", jobId))!;
  }
  const report = await commitJob(c, j, dry);
  return c.json({ action: "commit", ...resume, job_id: jobId, report });
}
app.post("/api/v1/import/fichier", async (c) => { const f = await fichierRecu(c); return importerFichier(c, f.nom, f.octets, f.opt); });
app.post("/api/v1/import/fec", async (c) => {
  const f = await fichierRecu(c);
  const tete = new TextDecoder().decode(f.octets.slice(0, 600)).toLowerCase().replace(/[^a-z]/g, "");
  if (!(tete.includes("journalcode") && tete.includes("ecriturenum") && tete.includes("comptenum")))
    throw bad("not_fec", "Ce fichier n'est pas un FEC : la première ligne doit contenir JournalCode, EcritureNum, CompteNum…");
  return importerFichier(c, /\.(txt|csv|tsv)$/i.test(f.nom) ? f.nom : f.nom + ".txt", f.octets, f.opt);
});

/* ---------- Outil de migration : recettes et incidents ---------- */
app.use("/api/v1/migration/*", requireAnyScope("import", "migration"));
app.get("/api/v1/migration/recettes", async (c) => {
  const soft = (c.req.query("logiciel") || "").toLowerCase();
  const rows = await all<any>(c.env.DB,
    `SELECT r.id, r.software, r.name, r.version, r.recipe, r.notes, r.created_at FROM migration_recipes r
     WHERE (? = '' OR r.software = ?) AND r.version = (SELECT MAX(version) FROM migration_recipes x WHERE x.software = r.software AND x.name = r.name)
     ORDER BY r.software, r.name LIMIT 200`, soft, soft);
  return c.json({ recettes: rows.map((r) => ({ id: r.id, logiciel: r.software, nom: r.name, version: r.version, recette: json(r.recipe, {}), notes: r.notes, created_at: r.created_at })) });
});
app.post("/api/v1/migration/recettes", async (c) => {
  const k = c.get("apiKey");
  if (!k || !(k.scopes.includes("migration") || k.scopes.includes("*"))) throw forbidden("L'enregistrement d'une recette est réservé aux clés d'API de scope « migration ».");
  const b = await body<{ logiciel?: string; nom?: string; recette?: unknown; notes?: string }>(c);
  const soft = String(b.logiciel || "").trim().toLowerCase(), name = String(b.nom || "defaut").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_.-]{0,39}$/.test(soft)) throw bad("invalid_field", "Le champ « logiciel » est obligatoire (identifiant court, ex. kavalog).", { field: "logiciel" });
  if (!/^[a-z0-9][a-z0-9_.-]{0,59}$/.test(name)) throw bad("invalid_field", "Le champ « nom » doit être un identifiant court.", { field: "nom" });
  if (!b.recette || typeof b.recette !== "object") throw bad("invalid_field", "Le champ « recette » doit être un objet JSON.", { field: "recette" });
  const raw = JSON.stringify(b.recette);
  if (raw.length > 256 * 1024) throw bad("too_large", "Une recette fait 256 Ko au maximum.");
  const v = ((await one<{ v: number | null }>(c.env.DB, "SELECT MAX(version) AS v FROM migration_recipes WHERE software = ? AND name = ?", soft, name))?.v || 0) + 1;
  const id = newId("rcp");
  await run(c.env.DB, "INSERT INTO migration_recipes (id, software, name, version, recipe, notes, created_by_club) VALUES (?,?,?,?,?,?,?)", id, soft, name, v, raw, b.notes ? String(b.notes).slice(0, 2000) : null, k.club_id);
  return c.json({ id, logiciel: soft, nom: name, version: v }, 201);
});
app.post("/api/v1/migration/incidents", async (c) => {
  const club = clubId(c);
  if (!(await rateLimit(c.env.DB, "incident:" + club, 30, 3600))) throw new ApiError(429, "rate_limited", "Trop de signalements : 30 par heure au maximum.");
  const b = await body<{ logiciel?: string; etape?: string; message?: string; details?: unknown; capture_b64?: string; version_outil?: string }>(c);
  const soft = String(b.logiciel || "").trim().toLowerCase().slice(0, 40), step = String(b.etape || "").trim().slice(0, 120), msg = String(b.message || "").trim().slice(0, 4000);
  if (!soft || !step || !msg) throw bad("missing_field", "Les champs « logiciel », « etape » et « message » sont obligatoires.");
  const id = newId("inc");
  let shot: string | null = null;
  if (b.capture_b64) {
    let bin: Uint8Array;
    try { bin = Uint8Array.from(atob(String(b.capture_b64).replace(/^data:[^,]+,/, "")), (x) => x.charCodeAt(0)); } catch { throw bad("invalid_field", "« capture_b64 » n'est pas du base64 valide.", { field: "capture_b64" }); }
    if (bin.length > 5 * 1024 * 1024) throw bad("too_large", "La capture fait 5 Mo au maximum.");
    const png = bin[0] === 0x89 && bin[1] === 0x50, jpg = bin[0] === 0xff && bin[1] === 0xd8;
    if (!png && !jpg) throw bad("invalid_field", "La capture doit être une image PNG ou JPEG.", { field: "capture_b64" });
    shot = `migration/incidents/${club}/${id}.${png ? "png" : "jpg"}`;
    await c.env.FILES.put(shot, bin, { httpMetadata: { contentType: png ? "image/png" : "image/jpeg" } });
  }
  await run(c.env.DB, "INSERT INTO migration_incidents (id, club_id, software, step, message, details, screenshot_key, tool_version) VALUES (?,?,?,?,?,?,?,?)",
    id, club, soft, step, msg, b.details === undefined ? null : JSON.stringify(b.details).slice(0, 20000), shot, b.version_outil ? String(b.version_outil).slice(0, 40) : null);
  return c.json({ id, recu: true }, 201);
});

app.route("/", campaign);

export default app;
/** Tâche planifiée du lot : campagnes d'accueil après migration, ménage des objets en attente. */
export async function cron(env: AppEnv["Bindings"], expr: string): Promise<void> {
  await campaignCron(env, expr);
  if (expr === "0 6 * * *") {
    const old = new Date(Date.now() - 30 * 864e5).toISOString();
    await run(env.DB, "DELETE FROM import_items WHERE job_id IN (SELECT id FROM import_jobs WHERE created_at < ? AND status IN ('committed','rolled_back','failed','simulated','open'))", old);
  }
}
