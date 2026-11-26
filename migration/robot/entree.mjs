// Point d'entrée du robot côté serveur, pour le Worker Cloudflare (Browser Rendering) comme pour le serveur local.
//
//   const r = await migrerDepuisPage(page, { logiciel: 'kavalog', recette, envoyer, surEtat, signal, ia });
//   const r = await migrerAvecAcces(page, { adresse, identifiant, motDePasse, demanderCode, ajouterScript, ... });
//
// - page     : page Puppeteer (@cloudflare/puppeteer) ou Playwright, connectée (par le gérant ou par le robot).
// - recette  : chemin déjà appris pour ce logiciel (facultatif) ; sinon le robot cherche tout seul.
// - ia       : pilote facultatif (un modèle Claude) pour ce que le robot ne trouve pas ; sans lui, tout marche quand même.
// - envoyer  : async ({coll, items}) => … appelé lot par lot (≤ 500 objets) pour POST /api/v1/import/jobs/:id/items.
// - surEtat  : rappel de progression pour la vue en direct.
// Renvoie { paquet, recette (à enregistrer, ne contient aucune donnée du club), incidents, contrat, resume, trace }.
// En connexion assistée, les identifiants tapés par le gérant ne passent jamais par ce code. En connexion automatique,
// ils ne servent qu'à remplir le formulaire de l'ancien logiciel (auto.mjs), sans journal ni stockage.
import { copier, migrerAvecAcces, seConnecter, genresAttendus, POURQUOI } from './auto.mjs';
import { scriptRobot } from './ecoute.mjs';
import { versLots } from '../core/vers-api.mjs';

export { migrerAvecAcces, seConnecter, genresAttendus, POURQUOI, scriptRobot };

export async function migrerDepuisPage(page, { envoyer = null, ...o } = {}) {
  const r = await copier(page, o);
  if (envoyer) for (const lot of versLots(r.paquet)) for (let i = 0; i < lot.items.length; i += 500) await envoyer({ coll: lot.coll, items: lot.items.slice(i, i + 500) });
  return r;
}

// Le gérant est-il connecté ? (plus de champ mot de passe, et la page a du contenu ou un menu)
export async function estConnecte(page) {
  const { extrairePage } = await import('../extension/extraire.js');
  const p = await page.evaluate(extrairePage);
  return !p.connexion && (p.liens.length > 0 || p.tables.length > 0);
}

// Refuse les adresses internes (protection du serveur), sauf en essai local explicite.
export function adresseAutorisee(adresse, { local = false } = {}) {
  let u; try { u = new URL(adresse); } catch { return false; }
  if (!/^https?:$/.test(u.protocol)) return false;
  if (local) return true;
  if (u.protocol !== 'https:') return false;
  const h = u.hostname;
  return !(/^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) || h.endsWith('.local') || h.endsWith('.internal') || h.includes(':'));
}
