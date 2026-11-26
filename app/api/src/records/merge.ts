/**
 * Fusion à trois voies d'un objet modifié hors ligne.
 *   base   : l'objet tel que l'appareil le connaissait avant sa modification ;
 *   server : l'objet tel qu'il est maintenant en base (quelqu'un d'autre l'a modifié entre-temps) ;
 *   local  : l'objet modifié par l'appareil.
 * Règles, champ par champ :
 *   - un champ changé d'un seul côté prend la valeur de ce côté ;
 *   - les objets imbriqués sont fusionnés de la même façon (ex. lesson.horses = {cavalier: cheval}) ;
 *   - les listes de valeurs simples sont fusionnées comme des ensembles (deux réservations hors ligne
 *     dans la même reprise sont gardées toutes les deux ; un retrait d'un côté est respecté) ;
 *   - les listes d'objets à id sont fusionnées par id ;
 *   - un même champ changé des deux côtés avec des valeurs différentes : la modification la plus récente
 *     gagne (« dernier qui écrit gagne », par champ), et le champ est signalé pour prévenir l'utilisateur.
 */
export type Json = unknown;
export interface MergeConflict { field: string; kept: "yours" | "theirs" }

const isObj = (v: Json): v is Record<string, Json> => !!v && typeof v === "object" && !Array.isArray(v);
const isPrim = (v: Json) => v === null || ["string", "number", "boolean"].includes(typeof v);

export function same(a: Json, b: Json): boolean {
  if (a === b) return true;
  if (a === undefined || b === undefined || a === null || b === null) return false;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) { const bb = b as Json[]; return a.length === bb.length && a.every((x, i) => same(x, bb[i])); }
  const ka = Object.keys(a as object).filter((k) => (a as any)[k] !== undefined), kb = Object.keys(b as object).filter((k) => (b as any)[k] !== undefined);
  return ka.length === kb.length && ka.every((k) => same((a as any)[k], (b as any)[k]));
}

const key = (v: Json) => JSON.stringify(v);
const hasId = (v: Json) => isObj(v) && (typeof v.id === "string" || typeof v.id === "number");

function mergeSets(b: Json[], s: Json[], l: Json[]): Json[] {
  const B = new Set(b.map(key)), S = new Set(s.map(key)), L = new Set(l.map(key));
  const out = s.filter((x) => !(B.has(key(x)) && !L.has(key(x)))); // retiré localement → retiré
  for (const x of l) if (!B.has(key(x)) && !S.has(key(x))) out.push(x); // ajouté localement → ajouté
  return out;
}

function mergeById(b: Json[], s: Json[], l: Json[], preferLocal: boolean, path: string, conflicts: MergeConflict[]): Json[] {
  const idx = (arr: Json[]) => new Map(arr.map((x) => [String((x as any).id), x]));
  const B = idx(b), L = idx(l), S = idx(s);
  const out: Json[] = [];
  for (const x of s) {
    const id = String((x as any).id);
    if (B.has(id) && !L.has(id)) { if (same(B.get(id), x)) continue; } // supprimé localement, inchangé ailleurs
    out.push(L.has(id) ? merge3(B.get(id), x, L.get(id), preferLocal, path + "[" + id + "]", conflicts) : x);
  }
  for (const x of l) { const id = String((x as any).id); if (!S.has(id) && !B.has(id)) out.push(x); }
  return out;
}

export function merge3(base: Json, server: Json, local: Json, preferLocal: boolean, path = "", conflicts: MergeConflict[] = []): Json {
  if (same(local, base)) return server;
  if (same(server, base)) return local;
  if (same(server, local)) return server;
  if (isObj(server) && isObj(local) && (isObj(base) || base === undefined || base === null)) {
    const b = isObj(base) ? base : {};
    const out: Record<string, Json> = {};
    for (const k of new Set([...Object.keys(server), ...Object.keys(local), ...Object.keys(b)])) {
      const v = merge3(b[k], server[k], local[k], preferLocal, path ? path + "." + k : k, conflicts);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  if (Array.isArray(server) && Array.isArray(local) && (Array.isArray(base) || base === undefined || base === null)) {
    const b = Array.isArray(base) ? base : [];
    const all = [...b, ...server, ...local];
    if (all.every(isPrim)) return mergeSets(b, server, local);
    if (all.every(hasId)) return mergeById(b, server, local, preferLocal, path, conflicts);
  }
  conflicts.push({ field: path || "(objet)", kept: preferLocal ? "yours" : "theirs" });
  return preferLocal ? local : server;
}
