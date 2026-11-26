/*
 * Moteur d'import : applique (ou simule) un job en trois temps.
 *  1. identité : normalisation, validation, correspondance (import_map), doublons, attribution des ids ;
 *  2. références : traduction des « ext:… » vers les ids Stabl, rapprochement des noms en clair ;
 *  3. écriture dans records (sauf simulation), journal des changements pour l'annulation.
 * La simulation suit exactement le même chemin et produit le même rapport, sans rien écrire.
 */
import type { Env } from "../env";
import { all, json, one, run } from "../lib/db";
import { nowIso } from "../lib/ids";
import { key } from "./normalize";
import { COLLS, ID_FORMAT, KEY_HINTS, ORDER, REF_HINTS, dedupeKeys, normalizeItem, type Coll, type Issue } from "./schema";

export interface ItemIssue extends Issue { coll: string; external_id: string }
export interface CollCount { received: number; created: number; updated: number; unchanged: number; merged: number; errors: number }
export interface Report {
  job_id: string; source: string; dry_run: boolean; status: string;
  counts: Record<string, CollCount>;
  totals: CollCount & { warnings: number };
  warnings: ItemIssue[]; errors: ItemIssue[];
  ids: Record<string, Record<string, string>>;
  started_at: string; finished_at: string;
  truncated?: boolean;
}

const MAX_ISSUES = 2000;
const stable = (v: unknown): string => JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x));
const fullName = (d: Record<string, any>) => [d.first, d.last].filter(Boolean).join(" ");

interface Existing { id: string; data: Record<string, any>; version: number; deleted: number }
interface Work {
  coll: Coll; ext: string; seq: number; data: Record<string, any>;
  action: "create" | "update" | "merge" | "fold" | "error";
  id?: string; foldInto?: Work; existing?: Existing; newMap: boolean;
  /** Objet parent réécrit pour porter des règlements (non compté dans le rapport). */
  synthetic?: boolean;
}

export interface Saved { coll: string; id: string; data: Record<string, any>; previous: Record<string, any> | null }
export async function runCommit(env: Env, job: { id: string; club_id: string; source: string }, dryRun: boolean, onSaved?: (s: Saved) => void): Promise<Report> {
  const db = env.DB, club = job.club_id, started = nowIso(), today = new Date();
  const warnings: ItemIssue[] = [], errors: ItemIssue[] = [];
  let nWarn = 0;
  const warn = (w: Work, i: Issue) => { nWarn++; if (warnings.length < MAX_ISSUES) warnings.push({ coll: w.coll, external_id: w.ext, ...i }); };
  const fail = (w: Work, i: Issue) => { if (errors.length < MAX_ISSUES) errors.push({ coll: w.coll, external_id: w.ext, ...i }); };

  const items = await all<{ coll: Coll; external_id: string; seq: number; data: string }>(db,
    "SELECT coll, external_id, seq, data FROM import_items WHERE job_id = ? ORDER BY seq", job.id);
  const involved = new Set<Coll>(items.map((i) => i.coll));
  for (const c of [...involved]) for (const t of Object.values(REF_HINTS[c] || {})) t.forEach((x) => involved.add(x));
  if (involved.has("lessons")) { involved.add("staff"); involved.add("coaches"); }
  if (involved.has("members")) involved.add("forfaits");
  if (involved.has("horses")) involved.add("members");
  if (involved.has("payments")) { involved.add("invoices"); involved.add("members"); involved.delete("payments"); }

  // Existant du club et correspondances déjà connues pour cette source.
  const existing = new Map<Coll, Map<string, Existing>>();
  const usedIds = new Map<Coll, Set<string>>();
  for (const c of COLLS) { existing.set(c, new Map()); usedIds.set(c, new Set()); }
  const collList = [...involved];
  if (collList.length) {
    const rows = await all<{ coll: Coll; id: string; data: string; version: number; deleted: number }>(db,
      `SELECT coll, id, data, version, deleted FROM records WHERE club_id = ? AND coll IN (${collList.map(() => "?").join(",")})`, club, ...collList);
    for (const r of rows) {
      usedIds.get(r.coll)?.add(r.id);
      // Les règlements sont rangés dans leur facture (ou la fiche de l'adhérent) : leurs ids comptent aussi.
      if (r.coll === "invoices" || r.coll === "members") for (const p of json<any>(r.data, {}).payments || []) if (p?.id) usedIds.get("payments")!.add(String(p.id));
      existing.get(r.coll)?.set(r.id, { id: r.id, data: json(r.data, {}), version: r.version, deleted: r.deleted });
    }
  }
  // Ids déjà attribués à d'autres collections partageant un préfixe ne posent pas de problème : la clé inclut coll.
  const mapRows = await all<{ coll: Coll; external_id: string; piaffe_id: string }>(db,
    "SELECT coll, external_id, piaffe_id FROM import_map WHERE club_id = ? AND source = ?", club, job.source);
  const extIndex = new Map<Coll, Map<string, string>>();
  for (const c of COLLS) extIndex.set(c, new Map());
  const knownMap = new Map<string, string>();
  for (const m of mapRows) { knownMap.set(m.coll + "\u0000" + m.external_id, m.piaffe_id); extIndex.get(m.coll)!.set(m.external_id, m.piaffe_id); }

  // Index de doublons sur l'existant (non supprimé).
  const dupIndex = new Map<Coll, Map<string, { id: string; work?: Work }>>();
  for (const c of COLLS) {
    const idx = new Map<string, { id: string; work?: Work }>();
    for (const e of existing.get(c)!.values()) if (!e.deleted) for (const k of dedupeKeys(c, e.data)) if (!idx.has(k)) idx.set(k, { id: e.id });
    dupIndex.set(c, idx);
  }

  // Générateur d'ids sans collision : au-delà du plus grand numéro existant (supprimés compris).
  const nextNum = new Map<Coll, number>();
  const allocate = (c: Coll): string => {
    const [p, w] = ID_FORMAT[c];
    if (!nextNum.has(c)) {
      let max = 0;
      const re = new RegExp("^" + p.replace(/[-]/g, "\\-") + "(\\d+)$");
      for (const id of usedIds.get(c)!) { const m = re.exec(id); if (m) max = Math.max(max, +m[1]); }
      nextNum.set(c, max + 1);
    }
    let n = nextNum.get(c)!, id = p + String(n).padStart(w, "0");
    while (usedIds.get(c)!.has(id)) { n++; id = p + String(n).padStart(w, "0"); }
    nextNum.set(c, n + 1); usedIds.get(c)!.add(id);
    return id;
  };

  // ---------- 1. Identité ----------
  const works: Work[] = [];
  const sorted = [...items].sort((a, b) => ORDER.indexOf(a.coll) - ORDER.indexOf(b.coll) || a.seq - b.seq);
  for (const it of sorted) {
    const n = normalizeItem(it.coll, json(it.data, {}), today);
    const w: Work = { coll: it.coll, ext: it.external_id, seq: it.seq, data: n.data, action: "error", newMap: false };
    works.push(w);
    n.warnings.forEach((x) => warn(w, x));
    if (n.errors.length) { n.errors.forEach((x) => fail(w, x)); continue; }
    const mapped = knownMap.get(it.coll + "\u0000" + it.external_id);
    const ex = mapped ? existing.get(it.coll)!.get(mapped) : undefined;
    if (mapped && it.coll === "payments") { w.action = "update"; w.id = mapped; }
    else if (mapped && ex && !ex.deleted) { w.action = "update"; w.id = mapped; w.existing = ex; }
    else {
      if (mapped) warn(w, { code: "recreated", message: "Cet objet avait été importé puis supprimé dans Stabl : il est recréé." });
      const idx = dupIndex.get(it.coll)!;
      const hit = dedupeKeys(it.coll, n.data).map((k) => idx.get(k)).find(Boolean);
      if (hit?.work) {
        w.action = "fold"; w.foldInto = hit.work; w.id = hit.id;
        warn(w, { code: "duplicate_in_job", message: `Doublon de « ${hit.work.ext} » dans ce même import : les informations sont fusionnées.` });
      } else if (hit) {
        w.action = "merge"; w.id = hit.id; w.existing = existing.get(it.coll)!.get(hit.id);
        warn(w, { code: "duplicate_merged", message: `Déjà présent dans Stabl (${hit.id}) : rattaché à la fiche existante, seuls les champs vides sont complétés.` });
      } else { w.action = "create"; w.id = allocate(it.coll); }
      w.newMap = true;
    }
    if (w.action !== "fold") for (const k of dedupeKeys(it.coll, n.data)) if (w.action === "update" || !dupIndex.get(it.coll)!.has(k)) dupIndex.get(it.coll)!.set(k, { id: w.id!, work: w });
    extIndex.get(it.coll)!.set(it.external_id, w.id!);
  }

  // ---------- 2. Références ----------
  const resolve = (ref: string, hints: Coll[]): string | null => {
    const rest = ref.slice(4);
    for (const c of [...hints, ...COLLS.filter((x) => !hints.includes(x))]) { const id = extIndex.get(c)!.get(rest); if (id) return id; }
    const m = /^([a-zA-Z]+):(.+)$/.exec(rest);
    if (m && (COLLS as readonly string[]).includes(m[1])) return extIndex.get(m[1] as Coll)!.get(m[2]) || null;
    return null;
  };
  const isExt = (v: unknown): v is string => typeof v === "string" && v.startsWith("ext:");
  const REQUIRED_REFS: Record<string, string[]> = { halfboard: ["horse", "rider"], care: ["horse"] };
  const people = (c: Coll) => [...existing.get(c)!.values()].filter((e) => !e.deleted).map((e) => ({ id: e.id, d: e.data }))
    .concat(works.filter((w) => w.coll === c && (w.action === "create")).map((w) => ({ id: w.id!, d: w.data })));
  const clubRow = await one<{ settings: string }>(db, "SELECT settings FROM clubs WHERE id = ?", club);
  const arenas: { id: string; name: string }[] = [...(json<any>(clubRow?.settings, {}).arenas || [])];
  const clubRec = await one<{ data: string }>(db, "SELECT data FROM records WHERE club_id = ? AND coll = 'club' AND id = '_' AND deleted = 0", club);
  for (const a of json<any>(clubRec?.data, {}).arenas || []) if (a?.id) arenas.push({ id: a.id, name: a.name || "" });

  for (const w of works) {
    if (w.action === "error") continue;
    const hints = REF_HINTS[w.coll] || {};
    let broken = false;
    const fixRef = (v: string, h: Coll[], field: string): string | null => {
      const id = resolve(v, h);
      if (!id) {
        if ((REQUIRED_REFS[w.coll] || []).includes(field)) { fail(w, { code: "unresolved_ref", field, message: `Référence introuvable : ${v}. Envoyez l'objet référencé avant, dans ce job ou un précédent de la même source.` }); broken = true; }
        else warn(w, { code: "unresolved_ref", field, message: `Référence introuvable, champ laissé vide : ${v}.` });
      }
      return id;
    };
    const walk = (v: any, h: Coll[], field: string): any => {
      if (isExt(v)) return fixRef(v, h, field);
      if (Array.isArray(v)) return v.map((x) => walk(x, h, field)).filter((x) => x !== null);
      if (v && typeof v === "object") {
        const kh = KEY_HINTS[w.coll + "." + field];
        const o: Record<string, any> = {};
        for (const [k, x] of Object.entries(v)) {
          const nk = isExt(k) ? fixRef(k, kh || [], field) : k;
          if (nk === null) continue;
          o[nk] = walk(x, h, field);
        }
        return o;
      }
      return v;
    };
    for (const [f, v] of Object.entries(w.data)) {
      const nv = walk(v, hints[f] || [], f);
      if (nv === null) delete w.data[f]; else w.data[f] = nv;
    }
    if (broken) { w.action = "error"; continue; }
    // Noms en clair à rapprocher.
    if (w.coll === "lessons") {
      if (!w.data.coach && w.data.coachName) {
        const k = key(w.data.coachName);
        const cand = [...people("staff"), ...people("coaches")].filter((p) => [key(p.d.first), key(fullName(p.d)), key([p.d.last, p.d.first].join(" ")), key(p.d.last)].includes(k));
        if (cand.length === 1) w.data.coach = cand[0].id;
        else warn(w, { code: cand.length ? "ambiguous_coach" : "unknown_coach", field: "coachName", message: cand.length ? `Plusieurs moniteurs s'appellent « ${w.data.coachName} » : choisissez-le dans le planning.` : `Moniteur « ${w.data.coachName} » introuvable dans l'équipe : à attribuer dans le planning.` });
      }
      if (!w.data.arena && w.data.arenaName) {
        const k = key(w.data.arenaName);
        const a = arenas.find((x) => key(x.name) === k) || arenas.find((x) => key(x.name).includes(k) || k.includes(key(x.name)));
        if (a && key(a.name)) w.data.arena = a.id;
        else warn(w, { code: "unknown_arena", field: "arenaName", message: `Installation « ${w.data.arenaName} » inconnue : créez-la dans Réglages puis attribuez-la.` });
      }
    }
    if (w.coll === "members" && !w.data.forfait && w.data.forfaitName) {
      const k = key(w.data.forfaitName);
      const f = people("forfaits").find((p) => key(p.d.name) === k);
      if (f) w.data.forfait = f.id; else warn(w, { code: "unknown_forfait", field: "forfaitName", message: `Forfait « ${w.data.forfaitName} » introuvable : à attribuer sur la fiche.` });
    }
    if (w.coll === "horses" && !w.data.owner && w.data.ownerName) {
      const k = key(w.data.ownerName);
      const m = people("members").filter((p) => key(fullName(p.d)) === k || key([p.d.last, p.d.first].join(" ")) === k);
      if (m.length === 1) w.data.owner = m[0].id; else warn(w, { code: "unknown_owner", field: "ownerName", message: `Propriétaire « ${w.data.ownerName} » introuvable ou ambigu.` });
    }
  }

  // Fusion des doublons internes au job dans le premier objet.
  for (const w of works) if (w.action === "fold" && w.foldInto) {
    const t = w.foldInto.action === "fold" ? w.foldInto.foldInto! : w.foldInto;
    t.data = { ...w.data, ...t.data };
  }

  // ---------- 3. Écriture ----------
  // Règlements : rangés dans data.payments de leur facture, ou de la fiche de l'adhérent s'ils ne visent pas de facture.
  const payCount = new Map<Work, "created" | "updated" | "unchanged">();
  const parentWork = new Map<string, Work>();
  for (const w of works) if ((w.coll === "invoices" || w.coll === "members") && w.action !== "error" && w.action !== "fold") parentWork.set(w.coll + "/" + w.id, w);
  for (const w of works) {
    if (w.coll !== "payments" || w.action === "error") continue;
    const pc: Coll | null = w.data.invoice ? "invoices" : w.data.member ? "members" : null;
    const pid = pc === "invoices" ? w.data.invoice : w.data.member;
    let parent = pc ? parentWork.get(pc + "/" + pid) : undefined;
    const ex = pc ? existing.get(pc)!.get(pid) : undefined;
    if (!pc || (!parent && (!ex || ex.deleted))) { w.action = "error"; fail(w, { code: "payment_without_target", field: "invoice", message: "Règlement sans facture ni adhérent connus : il n'a pas été importé." }); continue; }
    if (!parent) { parent = { coll: pc, ext: "(règlements)", seq: 0, data: {}, action: "update", id: pid, existing: ex, newMap: false, synthetic: true }; parentWork.set(pc + "/" + pid, parent); works.push(parent); }
    const base: any[] = Array.isArray(parent.data.payments) ? parent.data.payments : parent.synthetic || parent.action !== "create" ? [...(parent.existing?.data.payments || [])] : [];
    const entry: Record<string, any> = { ...w.data, id: w.id };
    delete entry.invoice;
    const i = base.findIndex((p) => p?.id === w.id);
    if (i < 0) { base.push(entry); payCount.set(w, "created"); }
    else if (stable(base[i]) === stable(entry)) payCount.set(w, "unchanged");
    else { base[i] = entry; payCount.set(w, "updated"); }
    parent.data.payments = base;
  }

  const counts: Record<string, CollCount> = {};
  const ids: Record<string, Record<string, string>> = {};
  const z = (): CollCount => ({ received: 0, created: 0, updated: 0, unchanged: 0, merged: 0, errors: 0 });
  const stmts: D1PreparedStatement[] = [];
  const now = nowIso(), by = "import:" + job.id;
  for (const w of works) {
    const cnt = w.synthetic ? z() : (counts[w.coll] ||= z());
    cnt.received++;
    if (w.action === "error") { cnt.errors++; continue; }
    if (!w.synthetic) (ids[w.coll] ||= {})[w.ext] = w.id!;
    if (w.newMap && !dryRun) stmts.push(db.prepare(
      `INSERT INTO import_map (club_id, source, coll, external_id, piaffe_id, job_id) VALUES (?,?,?,?,?,?)
       ON CONFLICT(club_id, source, coll, external_id) DO UPDATE SET piaffe_id = excluded.piaffe_id, job_id = excluded.job_id`)
      .bind(club, job.source, w.coll, w.ext, w.id, job.id));
    if (w.action === "fold") { cnt.merged++; continue; }
    if (w.coll === "payments") { cnt[payCount.get(w) || "unchanged"]++; continue; }
    if (w.action === "create") {
      cnt.created++;
      const data = { ...w.data, id: w.id };
      if (!dryRun) {
        stmts.push(db.prepare("INSERT INTO records (club_id, coll, id, data, version, deleted, updated_by, created_at, updated_at) VALUES (?,?,?,?,1,0,?,?,?)")
          .bind(club, w.coll, w.id, JSON.stringify(data), by, now, now));
        stmts.push(db.prepare("INSERT OR REPLACE INTO import_changes (job_id, club_id, coll, piaffe_id, action, previous, version_after) VALUES (?,?,?,?,'created',NULL,1)")
          .bind(job.id, club, w.coll, w.id));
        onSaved?.({ coll: w.coll, id: w.id!, data, previous: null });
      }
      continue;
    }
    const ex = w.existing!;
    const merged: Record<string, any> = w.action === "merge" ? { ...w.data, ...ex.data, id: w.id } : { ...ex.data, ...w.data, id: w.id };
    if (w.action === "merge" && Array.isArray(w.data.payments)) merged.payments = w.data.payments;
    if (stable(merged) === stable(ex.data)) { w.action === "merge" ? cnt.merged++ : cnt.unchanged++; continue; }
    w.action === "merge" ? cnt.merged++ : cnt.updated++;
    if (!dryRun) {
      stmts.push(db.prepare("UPDATE records SET data = ?, version = version + 1, updated_at = ?, updated_by = ? WHERE club_id = ? AND coll = ? AND id = ? AND version = ?")
        .bind(JSON.stringify(merged), now, by, club, w.coll, w.id, ex.version));
      stmts.push(db.prepare("INSERT OR IGNORE INTO import_changes (job_id, club_id, coll, piaffe_id, action, previous, version_after) VALUES (?,?,?,?,'updated',?,?)")
        .bind(job.id, club, w.coll, w.id, JSON.stringify(ex.data), ex.version + 1));
      onSaved?.({ coll: w.coll, id: w.id!, data: merged, previous: ex.data });
    }
  }
  for (let i = 0; i < stmts.length; i += 90) await db.batch(stmts.slice(i, i + 90));

  const totals: CollCount & { warnings: number } = { ...z(), warnings: 0 };
  for (const c of Object.values(counts)) for (const k of Object.keys(c) as (keyof CollCount)[]) totals[k] += c[k];
  totals.warnings = nWarn;
  return {
    job_id: job.id, source: job.source, dry_run: dryRun, status: dryRun ? "simulated" : "committed",
    counts, totals, warnings, errors, ids, started_at: started, finished_at: nowIso(),
    ...(warnings.length >= MAX_ISSUES || errors.length >= MAX_ISSUES ? { truncated: true } : {}),
  };
}

/** Annule un job appliqué : supprime ce qu'il a créé, restaure ce qu'il a modifié (si personne ne l'a retouché depuis). */
export async function runRollback(env: Env, job: { id: string; club_id: string }) {
  const db = env.DB, now = nowIso(), by = "import-rollback:" + job.id;
  const ch = await all<{ coll: string; piaffe_id: string; action: string; previous: string | null; version_after: number }>(db,
    "SELECT coll, piaffe_id, action, previous, version_after FROM import_changes WHERE job_id = ? AND club_id = ?", job.id, job.club_id);
  const stmts: D1PreparedStatement[] = [];
  const kept: { coll: string; id: string; message: string }[] = [];
  let deleted = 0, restored = 0;
  for (const c of ch) {
    if (c.action === "created") {
      stmts.push(db.prepare("UPDATE records SET deleted = 1, version = version + 1, updated_at = ?, updated_by = ? WHERE club_id = ? AND coll = ? AND id = ? AND deleted = 0")
        .bind(now, by, job.club_id, c.coll, c.piaffe_id));
      deleted++;
    } else {
      const cur = await one<{ version: number }>(db, "SELECT version FROM records WHERE club_id = ? AND coll = ? AND id = ?", job.club_id, c.coll, c.piaffe_id);
      if (!cur || cur.version !== c.version_after) { kept.push({ coll: c.coll, id: c.piaffe_id, message: "Modifié dans Stabl depuis l'import : laissé tel quel." }); continue; }
      stmts.push(db.prepare("UPDATE records SET data = ?, version = version + 1, updated_at = ?, updated_by = ? WHERE club_id = ? AND coll = ? AND id = ?")
        .bind(c.previous, now, by, job.club_id, c.coll, c.piaffe_id));
      restored++;
    }
  }
  stmts.push(db.prepare("DELETE FROM import_map WHERE club_id = ? AND job_id = ?").bind(job.club_id, job.id));
  for (let i = 0; i < stmts.length; i += 90) await db.batch(stmts.slice(i, i + 90));
  await run(db, "UPDATE import_jobs SET status = 'rolled_back', rolled_back_at = ? WHERE id = ?", now, job.id);
  return { deleted, restored, kept };
}
