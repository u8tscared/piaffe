// Point d'entrée du robot côté serveur, pour le Worker Cloudflare (Browser Rendering) comme pour le serveur local.
//
//   const r = await migrerDepuisPage(page, { logiciel: 'kavalog', recette, envoyer, surEtat, signal });
//
// - page     : page Puppeteer (@cloudflare/puppeteer) ou Playwright, sur laquelle le gérant vient de se connecter.
// - recette  : chemin déjà appris pour ce logiciel (facultatif) ; sinon exploration automatique.
// - envoyer  : async ({coll, items}) => … appelé lot par lot (≤ 500 objets) pour POST /api/v1/import/jobs/:id/items.
// - surEtat  : rappel de progression pour la vue en direct.
// Renvoie { paquet (sans les données brutes), recette (à enregistrer, ne contient aucune donnée du club), incidents }.
// Les identifiants tapés par le gérant ne passent jamais par ce code : ils vont directement du clavier au navigateur.
import { Explorateur } from './explorateur.mjs';
import { tablesDeCapture } from '../core/capture.mjs';
import { construirePaquet } from '../core/paquet.mjs';
import { versLots } from '../core/vers-api.mjs';

export async function migrerDepuisPage(page, { logiciel = null, recette = null, envoyer = null, surEtat = () => {}, signal = { arret: false }, fiches = true } = {}) {
  const ex = new Explorateur(page, { surEtat, signal, fiches });
  if (recette?.etapes?.length) await ex.rejouer(recette);
  if (!recette || ex.incidents.length || !ex.tables.length) await ex.explorer();
  const capture = ex.capture(logiciel);
  const paquet = construirePaquet(tablesDeCapture(capture));
  if (envoyer) for (const lot of versLots(paquet)) for (let i = 0; i < lot.items.length; i += 500) await envoyer({ coll: lot.coll, items: lot.items.slice(i, i + 500) });
  return { capture, paquet, recette: capture.recette, incidents: capture.incidents };
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
