/**
 * Recherche d'entreprise (préremplissage de l'onboarding) via l'API publique et gratuite
 * recherche-entreprises.api.gouv.fr. Appel côté serveur, mis en cache 7 jours dans D1.
 */
import { one, run } from "../lib/db";
import { legalFormOf } from "./plan";

export const SEARCH_URL = "https://recherche-entreprises.api.gouv.fr/search";
let fetcher: typeof fetch = (...a) => fetch(...a);
/** Pour les tests : remplace fetch. */
export function setFetch(f: typeof fetch | null) { fetcher = f || ((...a) => fetch(...a)); }

export interface Company {
  siren: string; siret: string; name: string; legal_form: string | null; legal_code: string;
  naf: string; address: { line1: string; zip: string; city: string; country: string };
  lat: number | null; lon: number | null; active: boolean; is_association: boolean;
}

function mapResult(r: any): Company | null {
  if (!r || typeof r !== "object") return null;
  const sg = r.siege || {};
  const line1 = [sg.numero_voie, sg.indice_repetition, sg.type_voie, sg.libelle_voie].filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
    || String(sg.adresse || "").replace(/\s*\d{5}.*$/, "").trim();
  const lat = Number(sg.latitude), lon = Number(sg.longitude);
  const name = String(r.nom_complet || r.nom_raison_sociale || "").trim();
  if (!r.siren || !name) return null;
  return {
    siren: String(r.siren), siret: String(sg.siret || ""), name: titleCase(name),
    legal_form: legalFormOf(String(r.nature_juridique || "")), legal_code: String(r.nature_juridique || ""),
    naf: String(sg.activite_principale || r.activite_principale || ""),
    address: { line1: titleCase(line1), zip: String(sg.code_postal || ""), city: titleCase(String(sg.libelle_commune || "")), country: "FR" },
    lat: Number.isFinite(lat) ? lat : null, lon: Number.isFinite(lon) ? lon : null,
    active: (r.etat_administratif || sg.etat_administratif || "A") === "A",
    is_association: !!(r.complements && r.complements.est_association) || /^92/.test(String(r.nature_juridique || "")),
  };
}
const SMALL = new Set(["de", "du", "des", "la", "le", "les", "et", "d", "l", "en", "sur", "sous", "aux", "au"]);
export function titleCase(s: string): string {
  if (!s || s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/([\p{L}]+)/gu, (w, _m, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .replace(/\b(Sarl|Sas|Sasu|Eurl|Earl|Gaec|Scea|Ei)\b/g, (m) => m.toUpperCase());
}

/** Recherche par nom ou par SIREN / SIRET. Renvoie au plus 6 résultats, centres équestres d'abord. */
export async function searchCompanies(db: D1Database, q: string): Promise<Company[]> {
  const query = q.trim().replace(/\s+/g, " ").slice(0, 120);
  const digits = query.replace(/\s/g, "");
  const key = (/^\d{9}(\d{5})?$/.test(digits) ? digits : query.toLowerCase());
  const cached = await one<{ data: string; at: string }>(db, "SELECT data, at FROM siret_cache WHERE q = ?", key);
  if (cached && Date.now() - Date.parse(cached.at) < 7 * 864e5) { try { return JSON.parse(cached.data); } catch { /* recalcul */ } }
  const url = SEARCH_URL + "?per_page=8&page=1&q=" + encodeURIComponent(/^\d{9}(\d{5})?$/.test(digits) ? digits : query);
  let res: Response;
  try { res = await fetcher(url, { headers: { accept: "application/json" } }); } catch { throw new Error("unreachable"); }
  if (res.status === 429) throw new Error("busy");
  if (!res.ok) throw new Error("upstream_" + res.status);
  const j: any = await res.json();
  let list = (Array.isArray(j.results) ? j.results : []).map(mapResult).filter(Boolean) as Company[];
  /* 93.12Z activités de clubs de sports, 85.51Z enseignement sportif, 01.43Z élevage de chevaux, 93.19Z autres activités sportives */
  const pref = (c: Company) => (/^(93\.12Z|85\.51Z|01\.43Z|93\.19Z|93\.13Z)$/.test(c.naf) ? 0 : 1) + (c.active ? 0 : 2);
  list = list.sort((a, b) => pref(a) - pref(b)).slice(0, 6);
  await run(db, "INSERT INTO siret_cache (q, data, at) VALUES (?,?,?) ON CONFLICT(q) DO UPDATE SET data = excluded.data, at = excluded.at",
    key, JSON.stringify(list), new Date().toISOString());
  return list;
}
