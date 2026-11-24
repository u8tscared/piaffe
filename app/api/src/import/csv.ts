/*
 * Import de fichiers CSV exportés d'autres logiciels : encodage (UTF-8, UTF-16, Windows-1252),
 * séparateur (; , tabulation |), ligne d'en-tête, mappage automatique des colonnes françaises courantes.
 * Le mappage passe par une interface (ColumnMapper) pour pouvoir brancher plus tard un mappeur plus malin.
 */
import { key, normEmail, normPhone, normSire, normDate } from "./normalize";

/* ---------- Encodage ---------- */
const CP1252: Record<number, number> = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160,
  0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153, 0x9e: 0x017e, 0x9f: 0x0178,
};
export function decodeCp1252(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) { const c = b[i]; s += String.fromCharCode(c >= 0x80 && c <= 0x9f ? CP1252[c] ?? c : c); }
  return s;
}
export function decode(bytes: Uint8Array, forced?: string): { text: string; encoding: string } {
  const f = (forced || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return { text: new TextDecoder("utf-8").decode(bytes.subarray(3)), encoding: "utf-8" };
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return { text: new TextDecoder("utf-16le").decode(bytes.subarray(2)), encoding: "utf-16le" };
  if (bytes[0] === 0xfe && bytes[1] === 0xff) { const sw = new Uint8Array(bytes.length - 2); for (let i = 2; i + 1 < bytes.length; i += 2) { sw[i - 2] = bytes[i + 1]; sw[i - 1] = bytes[i]; } return { text: new TextDecoder("utf-16le").decode(sw), encoding: "utf-16be" }; }
  if (["windows1252", "cp1252", "latin1", "iso88591", "ansi"].includes(f)) return { text: decodeCp1252(bytes), encoding: "windows-1252" };
  if (f !== "utf8") {
    try { return { text: new TextDecoder("utf-8", { fatal: true } as any).decode(bytes), encoding: "utf-8" }; }
    catch { return { text: decodeCp1252(bytes), encoding: "windows-1252" }; }
  }
  return { text: new TextDecoder("utf-8").decode(bytes), encoding: "utf-8" };
}

/* ---------- Analyse ---------- */
export function detectDelimiter(text: string): string {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim()).slice(0, 15);
  let best = ";", score = -1;
  for (const d of [";", ",", "\t", "|"]) {
    const counts = lines.map((l) => { let n = 0, q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === d && !q) n++; } return n; });
    const nonZero = counts.filter((c) => c > 0);
    if (!nonZero.length) continue;
    // Le meilleur séparateur donne un nombre de colonnes stable et élevé.
    const mode = nonZero.sort((a, b) => nonZero.filter((x) => x === b).length - nonZero.filter((x) => x === a).length)[0];
    const s = counts.filter((c) => c === mode).length * 10 + mode;
    if (s > score) { score = s; best = d; }
  }
  return best;
}

export function parseCsv(text: string, delim: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], f = "", q = false, i = 0;
  const t = text.replace(/^﻿/, "");
  while (i < t.length) {
    const ch = t[i];
    if (q) {
      if (ch === '"') { if (t[i + 1] === '"') { f += '"'; i += 2; continue; } q = false; i++; continue; }
      f += ch; i++; continue;
    }
    if (ch === '"' && f.trim() === "") { q = true; f = ""; i++; continue; }
    if (ch === delim) { row.push(f); f = ""; i++; continue; }
    if (ch === "\r" || ch === "\n") { row.push(f); rows.push(row); row = []; f = ""; i += ch === "\r" && t[i + 1] === "\n" ? 2 : 1; continue; }
    f += ch; i++;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ""));
}

/* ---------- Dictionnaire des colonnes ---------- */
/** Champ cible : chemin dans data (« address.ville »), « horse.<champ> » pour un cheval lié, ou « external_id ». */
const DICT: [string, string[]][] = [
  ["external_id", ["id", "code", "identifiant", "n adherent", "numero adherent", "no adherent", "num adherent", "code adherent", "reference", "ref", "id cavalier", "code client", "n client", "numero client"]],
  ["last", ["nom", "nom de famille", "nom cavalier", "nom adherent", "nom du cavalier", "nom de naissance", "last name", "lastname"]],
  ["first", ["prenom", "prenom cavalier", "prenom adherent", "prenom du cavalier", "first name", "firstname"]],
  ["fullName", ["nom prenom", "nom et prenom", "cavalier", "adherent", "client", "nom complet"]],
  ["birth", ["date de naissance", "date naissance", "naissance", "ne le", "nee le", "ne e le", "date de naiss", "dob"]],
  ["sex", ["sexe", "genre", "civilite"]],
  ["lic", ["n licence", "numero de licence", "numero licence", "no licence", "num licence", "licence", "licence ffe", "n de licence", "licence n"]],
  ["licenceType", ["type de licence", "type licence", "categorie licence"]],
  ["licence", ["annee licence", "millesime", "saison licence", "licence annee"]],
  ["galop", ["galop", "niveau", "niveau galop", "dernier galop", "galop obtenu"]],
  ["phone", ["telephone", "tel", "portable", "mobile", "telephone portable", "tel portable", "tel mobile", "gsm", "telephone 1", "tel 1"]],
  ["phone2", ["telephone 2", "tel 2", "tel fixe", "telephone fixe", "fixe", "telephone domicile", "tel domicile", "autre telephone"]],
  ["email", ["email", "e mail", "mail", "courriel", "adresse email", "adresse e mail", "adresse mail", "email 1"]],
  ["address.ligne1", ["adresse", "adresse 1", "rue", "adresse postale", "voie"]],
  ["address.ligne2", ["adresse 2", "complement", "complement d adresse", "complement adresse"]],
  ["address.code_postal", ["code postal", "cp", "code post"]],
  ["address.ville", ["ville", "commune", "localite"]],
  ["forfaitName", ["forfait", "formule", "abonnement", "prestation", "carte"]],
  ["balance", ["solde", "solde du", "reste a payer", "du", "balance"]],
  ["certDate", ["certificat medical", "date certificat", "certificat", "date du certificat medical"]],
  ["photo", ["droit a l image", "droit image", "autorisation image"]],
  ["notes", ["notes", "remarques", "commentaire", "commentaires", "observations"]],
  ["name", ["nom du cheval", "cheval", "nom cheval", "equide", "nom de l equide"]],
  ["sire", ["sire", "n sire", "numero sire", "no sire", "num sire", "ueln", "n ueln", "sire ueln"]],
  ["chip", ["puce", "n puce", "numero de puce", "numero puce", "transpondeur", "n transpondeur", "puce electronique"]],
  ["breed", ["race"]],
  ["coat", ["robe"]],
  ["born", ["annee de naissance", "annee naissance", "ne en", "millesime cheval"]],
  ["height", ["taille", "taille cm", "toise", "hauteur au garrot"]],
  ["box", ["box", "n box", "numero de box"]],
  ["ownerName", ["proprietaire", "nom du proprietaire", "proprio"]],
];
const DICT_INDEX = new Map<string, string>();
for (const [f, keys] of DICT) for (const k of keys) if (!DICT_INDEX.has(k)) DICT_INDEX.set(k, f);
const HORSE_FIELDS = new Set(["name", "sire", "chip", "breed", "coat", "born", "height", "box", "ownerName"]);

export const CSV_FIELDS: Record<string, string> = {
  external_id: "Identifiant dans l'ancien logiciel", last: "Nom", first: "Prénom", fullName: "Nom et prénom dans la même colonne",
  birth: "Date de naissance", sex: "Sexe", lic: "Numéro de licence", licenceType: "Type de licence", licence: "Année de licence",
  galop: "Galop", phone: "Téléphone", phone2: "Second téléphone", email: "E-mail", "address.ligne1": "Adresse", "address.ligne2": "Complément d'adresse",
  "address.code_postal": "Code postal", "address.ville": "Ville", forfaitName: "Forfait (nom)", balance: "Solde", certDate: "Certificat médical",
  photo: "Droit à l'image", notes: "Notes", name: "Nom du cheval", sire: "SIRE ou UELN", chip: "Puce", breed: "Race", coat: "Robe",
  born: "Année de naissance du cheval", height: "Taille", box: "Box", ownerName: "Propriétaire (nom)",
};

export interface Mapping { mapping: Record<string, string | null>; confiance: Record<string, number> }
/** Interface d'un mappeur de colonnes (heuristique aujourd'hui, assistant plus tard). */
export type ColumnMapper = (headers: string[], examples: string[][], coll?: string) => Promise<Mapping> | Mapping;

function guessByValues(vals: string[]): string | null {
  const v = vals.filter(Boolean).slice(0, 8);
  if (!v.length) return null;
  const share = (f: (s: string) => boolean) => v.filter(f).length / v.length;
  if (share((s) => normEmail(s).ok && /@/.test(s)) > 0.7) return "email";
  if (share((s) => /^\d{8}[A-Z]$/i.test(s.replace(/\s/g, ""))) > 0.7) return "sire";
  if (share((s) => /^\d{15}$/.test(s.replace(/\s/g, "")) && s.replace(/\s/g, "").startsWith("250")) > 0.7) return "chip";
  if (share((s) => /^(\+33|0)[1-9]([\s.-]?\d{2}){4}$/.test(s.trim())) > 0.7) return "phone";
  if (share((s) => /^\d{7}[A-Z]$/i.test(s.replace(/\s/g, ""))) > 0.7) return "lic";
  if (share((s) => !!normDate(s).value && /\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4}-\d{2}-\d{2}/.test(s)) > 0.7) return "birth";
  return null;
}

export const heuristicMapper: ColumnMapper = (headers, examples, coll) => {
  const mapping: Record<string, string | null> = {}, confiance: Record<string, number> = {};
  const used = new Set<string>();
  const horsesColl = coll === "horses";
  headers.forEach((h, i) => {
    const k = key(h);
    let f: string | null = DICT_INDEX.get(k) || null, c = f ? 1 : 0;
    if (!f) {
      for (const [dk, df] of DICT_INDEX) if (dk.length > 3 && (k.startsWith(dk + " ") || k.endsWith(" " + dk))) { f = df; c = 0.7; break; }
    }
    // Dans un fichier de chevaux, « nom » désigne le cheval, « naissance » l'année.
    if (horsesColl && f === "last") { f = "name"; }
    if (horsesColl && f === "birth") { f = "born"; }
    if (!f) { const g = guessByValues(examples.map((r) => r[i] ?? "")); if (g) { f = g; c = 0.6; } }
    if (f && used.has(f)) { f = null; c = 0; }
    if (f) used.add(f);
    mapping[h] = f; confiance[h] = c;
  });
  return { mapping, confiance };
};
let mapper: ColumnMapper = heuristicMapper;
export function setColumnMapper(m: ColumnMapper | null) { mapper = m || heuristicMapper; }
export function mapColumns(headers: string[], examples: string[][], coll?: string) { return mapper(headers, examples, coll); }

/** Repère la ligne d'en-tête parmi les 10 premières (titres d'export au-dessus). */
export function findHeaderRow(rows: string[][]): number {
  let best = 0, bestScore = -1;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const s = rows[i].filter((c) => DICT_INDEX.has(key(c))).length;
    if (s > bestScore && s >= 2) { best = i; bestScore = s; }
  }
  return best;
}

export function guessColl(mapping: Record<string, string | null>): "members" | "horses" {
  const f = new Set(Object.values(mapping).filter(Boolean) as string[]);
  const person = ["first", "lic", "galop", "email", "phone", "birth", "fullName"].filter((x) => f.has(x)).length;
  const horse = ["sire", "chip", "breed", "coat", "name", "born", "height"].filter((x) => f.has(x)).length;
  return horse > person ? "horses" : "members";
}

const setPath = (o: Record<string, any>, p: string, v: unknown) => {
  const parts = p.split(".");
  let cur = o;
  for (const k of parts.slice(0, -1)) cur = cur[k] ||= {};
  cur[parts[parts.length - 1]] = v;
};

/** Construit les objets à importer. Un fichier d'adhérents avec des colonnes de cheval crée aussi les chevaux (propriétaire lié). */
export function rowsToItems(headers: string[], rows: string[][], mapping: Record<string, string | null>, coll: "members" | "horses") {
  const members: { external_id: string; data: Record<string, any> }[] = [];
  const horses: { external_id: string; data: Record<string, any> }[] = [];
  const seen = new Set<string>();
  rows.forEach((r, ri) => {
    const person: Record<string, any> = {}, horse: Record<string, any> = {};
    let ext = "";
    headers.forEach((h, i) => {
      const f = mapping[h];
      const v = (r[i] ?? "").trim();
      if (!f || v === "") return;
      if (f === "external_id") { ext = v; return; }
      if (f === "fullName") {
        const parts = v.split(/\s+/);
        const upper = parts.filter((p) => p.length > 1 && p === p.toUpperCase() && /[A-Z]/.test(p));
        if (upper.length && upper.length < parts.length) { person.last = upper.join(" "); person.first = parts.filter((p) => !upper.includes(p)).join(" "); }
        else { person.last = parts[0]; person.first = parts.slice(1).join(" "); }
        return;
      }
      if (coll === "horses") { if (HORSE_FIELDS.has(f) || f === "notes") setPath(horse, f, v); return; }
      if (f === "ownerName") return;
      setPath(HORSE_FIELDS.has(f) ? horse : person, f, v);
    });
    if (coll === "horses") {
      if (!Object.keys(horse).length) return;
      const sire = normSire(horse.sire).value;
      let id = ext ? "csv:" + ext : sire ? "sire:" + sire : horse.chip ? "puce:" + String(horse.chip).replace(/\s/g, "") : "nom:" + key(horse.name).replace(/ /g, "-");
      if (seen.has(id)) id += "#" + (ri + 1);
      seen.add(id);
      horses.push({ external_id: id, data: horse });
      return;
    }
    if (!Object.keys(person).length && !Object.keys(horse).length) return;
    const email = normEmail(person.email).value, birth = normDate(person.birth).value;
    let id = ext ? "csv:" + ext : person.lic ? "lic:" + String(person.lic).replace(/\s/g, "").toUpperCase()
      : email ? "email:" + email : "np:" + key([person.last, person.first, birth].filter(Boolean).join(" ")).replace(/ /g, "-");
    if (seen.has(id)) id += "#" + (ri + 1);
    seen.add(id);
    if (person.phone) person.phone = normPhone(person.phone).value;
    if (Object.keys(person).length) members.push({ external_id: id, data: person });
    if (horse.name) {
      const sire = normSire(horse.sire).value;
      const hid = sire ? "sire:" + sire : "nom:" + key(horse.name).replace(/ /g, "-");
      if (!seen.has(hid)) { seen.add(hid); horses.push({ external_id: hid, data: { ...horse, owner: "ext:" + id, kind: "proprietaire" } }); }
    }
  });
  return { members, horses };
}
