import type { Env, Role } from "../env";
import { all, one } from "../lib/db";
import { isSingleton, SINGLETON_ID } from "../records/collections";
import { projectRead, type PolicyCtx, type Row } from "../records/policy";
import { loadCtx, type Principal } from "../records/store";

/**
 * Qui appelle les outils MCP : une personne du club (accord OAuth) ou une clé d'API du club.
 * L'isolation est stricte : chaque lecture porte club_id, et chaque objet passe par la politique d'accès
 * des données (records/policy.ts) avec le rôle de la personne. Un employé voit donc ce qu'il voit dans l'appli.
 */
export interface Caller {
  clubId: string;
  role: Role;               // owner | manager | staff (une clé d'API agit comme un gérant)
  personRef: string | null;
  userId: string | null;
  scopes: string[];         // lecture, ecriture
  grantId: string | null;
  apiKeyId: string | null;
  clientName: string;
}

export const isManager = (r: Role) => r === "owner" || r === "manager";
/** Rôles qui peuvent relier un assistant (les adhérents, coachs et comptables n'ont pas le connecteur). */
export const MCP_ROLES: Role[] = ["owner", "manager", "staff"];

const parse = (s: string): Row | null => { try { const v = JSON.parse(s); return v && typeof v === "object" ? v : null; } catch { return null; } };

/** Lecture paresseuse et mise en cache, pour un appel d'outil, des données du club vues par ce rôle. */
export class ClubData {
  private cache = new Map<string, Row[]>();
  private ctx: PolicyCtx | null = null;
  club: { id: string; name: string; kind: string; timezone: string; plan: string; plan_status: string; address: string | null; settings: string } | null = null;

  constructor(public env: Env, public caller: Caller) {}

  principal(): Principal {
    const who = this.caller.apiKeyId ? "cle:" + this.caller.apiKeyId : "mcp:" + (this.caller.clientName || "assistant").slice(0, 40);
    return { role: this.caller.role, personRef: this.caller.personRef, userId: this.caller.userId, actor: who, clubId: this.caller.clubId };
  }

  async init() {
    this.club = await one<any>(this.env.DB, "SELECT id, name, kind, timezone, plan, plan_status, address, settings FROM clubs WHERE id = ?", this.caller.clubId);
    this.ctx = await loadCtx(this.env, this.principal());
    return this;
  }

  get tz() { return this.club?.timezone || "Europe/Paris"; }

  /** Collection « tableau », filtrée par la politique d'accès. */
  async rows(coll: string): Promise<Row[]> {
    const hit = this.cache.get(coll);
    if (hit) return hit;
    const res = await all<{ id: string; data: string }>(this.env.DB,
      "SELECT id, data FROM records WHERE club_id = ? AND coll = ? AND deleted = 0 ORDER BY created_at, id", this.caller.clubId, coll);
    const out: Row[] = [];
    for (const r of res) {
      const d = parse(r.data);
      if (!d) continue;
      const v = projectRead(this.ctx!, coll, isSingleton(coll) ? d : { ...d, id: d.id ?? r.id });
      if (v) out.push(v);
    }
    this.cache.set(coll, out);
    return out;
  }

  /** Objet unique (club, facts…), ou null. */
  async single(coll: string): Promise<Row | null> {
    const r = await this.rows(coll);
    return r[0] ?? null;
  }

  /** Version actuelle d'un objet (pour une écriture sans écraser une modification concurrente). */
  async version(coll: string, id: string): Promise<{ data: Row; version: number } | null> {
    const r = await one<{ data: string; version: number }>(this.env.DB,
      "SELECT data, version FROM records WHERE club_id = ? AND coll = ? AND id = ? AND deleted = 0", this.caller.clubId, coll, isSingleton(coll) ? SINGLETON_ID : id);
    const d = r && parse(r.data);
    return r && d ? { data: d, version: r.version } : null;
  }

  /** Date de la dernière saisie dans le club (toutes collections). */
  async lastWrite(): Promise<string | null> {
    const r = await one<{ at: string | null }>(this.env.DB, "SELECT MAX(updated_at) AS at FROM records WHERE club_id = ?", this.caller.clubId);
    return r?.at ?? null;
  }

  // ---------- Index pratiques ----------
  private names: Map<string, string> | null = null;
  /** Nom lisible d'une personne (adhérent, salarié, coach) ou d'un cheval, à partir de son id. */
  async nameOf(id: unknown): Promise<string | null> {
    if (typeof id !== "string" || !id) return null;
    if (!this.names) {
      this.names = new Map();
      for (const c of ["members", "staff", "coaches"]) for (const p of await this.rows(c)) this.names.set(p.id, [p.first, p.last].filter(Boolean).join(" ") || p.name || p.id);
      for (const h of await this.rows("horses")) this.names.set(h.id, h.name || h.id);
    }
    return this.names.get(id) ?? null;
  }
}

// ---------- Dates (fuseau du club) ----------
export function dayIn(tz: string, ms = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
}
export function longTime(tz: string, ms = Date.now()): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: tz, dateStyle: "full", timeStyle: "short" }).format(new Date(ms));
}
export const isDay = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + "T12:00:00Z"));
export const addDays = (d: string, n: number) => new Date(Date.parse(d + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5);
/** 0 = dimanche … 6 = samedi, comme Date.getDay() et le champ dow des reprises. */
export const dowOf = (d: string) => new Date(d + "T12:00:00Z").getUTCDay();
export const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const DAY_ABBR: Record<string, number> = { dim: 0, lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6 };
export function dowFromText(s: unknown): number | null {
  if (typeof s !== "string") return null;
  const k = fold(s).slice(0, 3);
  return k in DAY_ABBR ? DAY_ABBR[k] : null;
}
/** Date d'un objet : champ date, sinon jour ISO au début d'un champ when/at/d. */
export function rowDay(r: Row): string | null {
  for (const k of ["date", "day", "d", "from", "start", "when", "at"]) if (typeof r[k] === "string" && /^\d{4}-\d{2}-\d{2}/.test(r[k])) return r[k].slice(0, 10);
  return null;
}

// ---------- Texte ----------
export const fold = (s: unknown) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
/** Trouve un objet par id exact, sinon par nom (sans accents, contient). Renvoie aussi les homonymes. */
export function findOne(rows: Row[], q: unknown, fields: string[]): { hit: Row | null; many: Row[] } {
  if (typeof q !== "string" || !q.trim()) return { hit: null, many: [] };
  const exact = rows.find((r) => r.id === q.trim());
  if (exact) return { hit: exact, many: [] };
  const f = fold(q);
  const full = (r: Row) => fold(fields.map((k) => r[k]).filter(Boolean).join(" "));
  const eq = rows.filter((r) => full(r) === f || fields.some((k) => fold(r[k]) === f));
  if (eq.length === 1) return { hit: eq[0], many: [] };
  const hits = eq.length ? eq : rows.filter((r) => full(r).includes(f));
  return hits.length === 1 ? { hit: hits[0], many: [] } : { hit: null, many: hits.slice(0, 10) };
}
export const euros = (n: unknown) => (typeof n === "number" && isFinite(n) ? Math.round(n * 100) / 100 : typeof n === "string" && n.trim() !== "" && isFinite(+n) ? Math.round(+n * 100) / 100 : 0);
export const cents = (n: unknown) => (typeof n === "number" ? Math.round(n) / 100 : 0);
