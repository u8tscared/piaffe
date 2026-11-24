// Mise au propre des valeurs : dates, téléphones, montants, oui/non, numéros FFE et SIRE.
import { vide } from './texte.mjs';
import { dateExcel } from './xlsx.mjs';

export function texte(v) { return vide(v) ? null : String(v).replace(/\s+/g, ' ').trim(); }

export function date(v) {
  if (vide(v)) return null;
  const s = String(v).trim();
  let m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return iso(+m[1], +m[2], +m[3]);
  if ((m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/))) {
    let a = +m[3]; if (a < 100) a += a > 40 ? 1900 : 2000;
    return iso(a, +m[2], +m[1]);
  }
  if ((m = s.match(/^(\d{4})(\d{2})(\d{2})$/))) return iso(+m[1], +m[2], +m[3]);
  if (/^\d{5}(\.\d+)?$/.test(s) && +s > 10000 && +s < 80000) return dateExcel(+s);
  return null;
}
function iso(a, mo, j) {
  if (mo < 1 || mo > 12 || j < 1 || j > 31 || a < 1900 || a > 2100) return null;
  return `${a}-${String(mo).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
}

export function annee(v) {
  if (vide(v)) return null;
  const d = date(v); if (d) return +d.slice(0, 4);
  const m = String(v).match(/\b(19|20)\d{2}\b/); return m ? +m[0] : null;
}

export function heure(v) {
  if (vide(v)) return null;
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})\s*[h:]\s*(\d{2})?/i);
  if (m) return `${m[1].padStart(2, '0')}:${m[2] || '00'}`;
  if (/^0?\.\d+$/.test(s)) { const min = Math.round(+s * 1440); return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`; }
  return null;
}

export function duree(v) {
  if (vide(v)) return null;
  const s = String(v).toLowerCase();
  let m = s.match(/(\d+)\s*h\s*(\d+)?/); if (m) return +m[1] * 60 + (+m[2] || 0);
  m = s.match(/^(\d+)\s*(min|mn)?$/); if (m) return +m[1];
  m = s.match(/^(\d+):(\d{2})$/); if (m) return +m[1] * 60 + +m[2];
  return null;
}

export function telephone(v) {
  if (vide(v)) return null;
  let s = String(v).replace(/[^\d+]/g, '');
  if (/^\d{9}$/.test(s) && /^[1-9]/.test(s)) s = '0' + s;          // zéro perdu par Excel
  if (/^0\d{9}$/.test(s)) return '+33' + s.slice(1);
  if (/^0033\d{9}$/.test(s)) return '+' + s.slice(2);
  if (/^\+\d{8,15}$/.test(s)) return s;
  if (/^33\d{9}$/.test(s)) return '+' + s;
  return null;
}
export function estMobile(tel) { return !!tel && /^\+33[67]/.test(tel); }

export function email(v) {
  if (vide(v)) return null;
  const s = String(v).trim().toLowerCase().replace(/^mailto:/, '');
  return /^[^\s@;,]+@[^\s@;,]+\.[a-z]{2,}$/.test(s) ? s : null;
}

export function montant(v) {
  if (vide(v)) return null;
  if (typeof v === 'number') return Math.round(v * 100) / 100;
  let s = String(v).replace(/[€\s  ]|eur/gi, '');
  const neg = /^\(.*\)$/.test(s) || /-$/.test(s);
  s = s.replace(/[()]/g, '').replace(/-$/, '');
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/,/g, '');
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return Math.round((neg ? -n : n) * 100) / 100;
}

export function taux(v) {
  const n = montant(String(v ?? '').replace('%', ''));
  if (n === null) return null;
  return n < 1 && n > 0 ? Math.round(n * 1000) / 10 : n;
}

export function ouiNon(v) {
  if (vide(v)) return null;
  const s = String(v).trim().toLowerCase();
  if (/^(o|oui|x|1|vrai|true|y|yes|ok|fourni|valide|à jour|a jour)$/.test(s)) return true;
  if (/^(n|non|0|faux|false|no|manquant)$/.test(s)) return false;
  return null;
}

export function entier(v) { const n = montant(v); return n === null ? null : Math.round(n); }

// Numéro de licence FFE : 7 ou 8 chiffres suivis d'une lettre (forme observée, à confirmer sur un vrai fichier FFE).
export function licence(v) {
  if (vide(v)) return null;
  const s = String(v).toUpperCase().replace(/[\s.\-]/g, '');
  return /^\d{6,8}[A-Z]$/.test(s) ? s : null;
}

// SIRE : 8 chiffres + lettre de contrôle. UELN : 15 caractères commençant par le pays (250 pour la France).
export function sire(v) {
  if (vide(v)) return null;
  const s = String(v).toUpperCase().replace(/[\s.\-]/g, '');
  return /^\d{8}[A-Z]$/.test(s) ? s : null;
}
export function ueln(v) {
  if (vide(v)) return null;
  const s = String(v).toUpperCase().replace(/[\s.\-]/g, '');
  return /^\d{3}[0-9A-Z]{12}$/.test(s) ? s : null;
}
export function puce(v) {
  if (vide(v)) return null;
  const s = String(v).replace(/\D/g, '');
  return /^\d{15}$/.test(s) ? s : null;
}

export function sexePersonne(v) {
  const s = String(v ?? '').trim().toLowerCase();
  if (/^(f|femme|féminin|feminin|mme|madame|mlle)/.test(s)) return 'F';
  if (/^(m|h|homme|masculin|m\.|monsieur|mr)/.test(s)) return 'M';
  return null;
}
export function sexeCheval(v) {
  const s = String(v ?? '').trim().toLowerCase();
  if (/^(j|jument|f|femelle|mare)/.test(s)) return 'jument';
  if (/^(h|hongre|gelding)/.test(s)) return 'hongre';
  if (/^(e|é|etalon|étalon|m|male|mâle|stallion)/.test(s)) return 'etalon';
  return null;
}

export function taille(v) {
  if (vide(v)) return null;
  const n = montant(String(v).replace(/cm|m/gi, ''));
  if (n === null) return null;
  return n < 3 ? Math.round(n * 100) : Math.round(n);
}

export function galop(v) {
  if (vide(v)) return null;
  const s = String(v).toLowerCase();
  const m = s.match(/(\d{1,2})/);
  if (/poney|bronze|argent|or/.test(s) && !m) return texte(v);
  return m && +m[1] <= 9 ? +m[1] : null;
}

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
export function jour(v) {
  if (vide(v)) return null;
  const s = String(v).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const i = JOURS.findIndex(j => s.startsWith(j.slice(0, 3)));
  if (i >= 0) return i + 1;
  const n = +s; return n >= 1 && n <= 7 ? n : null;
}

const MOYENS = [
  [/carte|cb|tpe|visa|mastercard/, 'carte'], [/prelev|sepa/, 'prelevement'], [/vir/, 'virement'],
  [/cheques?.?vac|ancv|ch.?vac/, 'cheque_vacances'], [/coupon.?sport/, 'coupon_sport'], [/pass.?sport/, 'pass_sport'],
  [/cheq|chq|ch\b/, 'cheque'], [/esp|cash|liquide/, 'especes'], [/stripe|en ligne|web|internet|paypal/, 'en_ligne'],
];
export function moyen(v) {
  const s = String(v ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [re, m] of MOYENS) if (re.test(s)) return m;
  return vide(v) ? null : 'autre';
}

// « MARTIN Léa », « Léa MARTIN », « Martin, Léa » -> { prenom, nom }
export function separerNom(v) {
  const s = texte(v); if (!s) return {};
  if (s.includes(',')) { const [n, p] = s.split(',').map(x => x.trim()); return { nom: n, prenom: p }; }
  const mots = s.split(' ');
  if (mots.length === 1) return { nom: s };
  const majuscules = mots.filter(m => m.length > 1 && m === m.toUpperCase() && /[A-Z]/.test(m));
  if (majuscules.length && majuscules.length < mots.length) {
    return { nom: majuscules.join(' '), prenom: mots.filter(m => !majuscules.includes(m)).join(' ') };
  }
  return { prenom: mots[0], nom: mots.slice(1).join(' ') };
}

export function joliNom(s) {
  if (!s) return s;
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/(^|[\s\-'’])(\p{L})/gu, (_, a, b) => a + b.toUpperCase())
    .replace(/(?<=\S )(De|Du|Des|La|Le|Les|D’|D'|Et|Sur|Sous)(?= |’|'|$)/g, m => m.toLowerCase());
}
