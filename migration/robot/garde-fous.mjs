// Garde-fous du robot : c'est le CODE qui décide si un clic, une adresse ou une lecture part, jamais le modèle.
// Le robot ne fait que lire : rien qui efface, paie, envoie, crée, modifie ou déconnecte.

// INTERDIT où que ce soit (texte, infobulle, adresse, code du clic, action du formulaire).
export const INTERDIT = /supprim|delete|effac|remov|d[ée]conn|logout|log.?out|sign.?out|\bquitter|payer|paiement en ligne|pay now|achet|upgrade|souscri|subscription|rembours|refund|archiver|d[ée]sactiv|cl[oô]tur|\bvider|purg|elimin|annuler|\bcancel|refus|imprim|\bprint|envoy|\bsend|relanc|destroy|r[ée]initialis|\breset|valider la facture|[ée]mettre|encaisser|action=(del|rem|upd|edit|save)/i;
// INTERDIT quand le libellé commence par là (un bouton « Ajouter un cavalier », « Modifier »…).
export const DOUTEUX = /^\s*(tout\s+)?(confirmer|valider|enregistrer|sauvegarder|save|publier|nouveau|nouvelle|ajouter|cr[ée]er|new|add|create|modifier|edit|marquer|mark|dupliquer|importer|inscrire|affecter|d[ée]placer|×|x|✕|🗑)\s*(\b|$)/i;
// Un bouton qui envoie un formulaire n'est permis que s'il cherche, filtre ou affiche.
export const LECTURE = /recherch|chercher|filtr|affich|voir|appliqu|actualis|rafra|search|filter|apply|show|refresh|\bok\b|tous|toutes|suivant|next|liste|list|p[ée]riode|exporter la liste/i;

export const interdit = t => INTERDIT.test(String(t || '')) || DOUTEUX.test(String(t || ''));
const cheminEtFiltres = u => { try { const x = new URL(u); return x.pathname + x.search; } catch { return String(u); } };

// Le logiciel = les hôtes vus pendant la connexion (page de connexion, page d'arrivée). Rien d'autre.
export class Sites {
  constructor(depart) { this.hotes = new Set(); this.ajouter(depart); }
  ajouter(u) { try { this.hotes.add(new URL(u).host); } catch { /* rien */ } }
  memeSite(u) { try { const a = new URL(u); return /^https?:$/.test(a.protocol) && this.hotes.has(a.host); } catch { return false; } }
}

// Verdict avant tout clic : b = boiteElement() (quoi, href, post).
export function clicPermis(b, sites) {
  if (!b) return false;
  if (interdit(b.quoi)) return false;
  if (b.href && sites && !sites.memeSite(b.href)) return false;
  if (b.post && !LECTURE.test(b.quoi)) return false;
  return true;
}

// Adresse que le robot ou le pilote veut ouvrir.
export function adressePermise(u, sites) {
  if (!sites.memeSite(u)) return false;
  const p = cheminEtFiltres(u);
  if (INTERDIT.test(p)) return false;
  if (/\/(confirm|edit|update|create|new|add|save|delete|remove|nouveau|ajouter|modifier|supprimer)(\/|$|\?|\.)/i.test(p)) return false;
  return true;
}

// Page incrustée à rouvrir seule : rien dans son chemin ni ses filtres qui agisse.
export function cadrePermis(u) {
  try {
    const x = new URL(u); if (INTERDIT.test(x.pathname)) return false;
    for (const [k, v] of x.searchParams) {
      if (INTERDIT.test(k) || (/^(action|op|do|cmd|method)$/i.test(k) && v)) return false;
      if (/^(delete|remove|logout|reset|send|pay)/i.test(v)) return false;
    }
    return true;
  } catch { return false; }
}

// Filtres d'une lecture refaite (api) : noms simples, rien de secret, rien qui agisse.
export function filtresPermis(P) {
  return Array.isArray(P) && P.length <= 10 && P.every(p => p && /^[\w.\-[\]]{1,40}$/.test(String(p.n || '')) && !INTERDIT.test(String(p.n) + '=' + String(p.v ?? '')) && !/token|key|auth|secret|sig|pass/i.test(p.n));
}

// Une date de filtre est gardée dans la recette comme un écart en jours, pour rester juste le mois suivant.
const jour0 = (auj = new Date()) => Date.parse(auj.toISOString().slice(0, 10));
export function ecartDate(v, auj) {
  let m = /^(\d{4})-(\d{2})-(\d{2})(.*)$/.exec(v); if (m) return { ecart: Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - jour0(auj)) / 864e5), f: 'iso', fin: m[4].slice(0, 20) };
  m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v); if (m) return { ecart: Math.round((Date.UTC(+m[3], +m[2] - 1, +m[1]) - jour0(auj)) / 864e5), f: 'fr', fin: '' };
  return null;
}
export function dateDe(o, auj) {
  const d = new Date(jour0(auj) + o.ecart * 864e5).toISOString().slice(0, 10);
  return o.f === 'fr' ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : d + (o.fin || '');
}

// Chemin montrable (journal, recette) : jamais la partie après « ? », ni un jeton rangé dans l'adresse.
export function cheminSur(u) {
  try { return new URL(u).pathname.split('/').map(p => (p.length > 24 || (/^[\w-]{16,}$/.test(p) && /\d/.test(p) && /[a-zA-Z]/.test(p)) ? '…' : p)).join('/').slice(-80); } catch { return '?'; }
}
