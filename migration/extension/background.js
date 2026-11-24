// Robot navigateur Piaffe. Il travaille dans l'onglet où le gérant est connecté à son ancien logiciel.
// Il lit les pages, suit le bouton « suivant » et les liens du menu ; il ne remplit et n'envoie aucun formulaire.
import { extrairePage, cliquer, empreinte } from './extraire.js';

const PAUSE = 700;             // politesse envers le serveur de l'ancien logiciel
const MAX_PAGES_LISTE = 300;
const MAX_PAGES_EXPLO = 120;
const MAX_FICHES = 3000;        // fiches détaillées lues par liste en exploration

const dormir = ms => new Promise(r => setTimeout(r, ms));
let arret = false;

async function lireEtat() { return (await chrome.storage.local.get('etat')).etat || nouvelEtat(); }
function nouvelEtat() { return { origine: null, tables: [], fiches: [], etapes: [], incidents: [], progression: null, journal: [] }; }
async function ecrireEtat(e) { await chrome.storage.local.set({ etat: e }); }
async function maj(f) { const e = await lireEtat(); await f(e); await ecrireEtat(e); return e; }
const journal = (e, m) => { e.journal.push(new Date().toLocaleTimeString('fr-FR') + ' ' + m); e.journal = e.journal.slice(-60); };

async function executer(tabId, func, args = []) {
  const [r] = await chrome.scripting.executeScript({ target: { tabId }, func, args });
  return r?.result;
}
async function attendreChargement(tabId, avant) {
  for (let i = 0; i < 40; i++) {
    await dormir(250);
    const t = await chrome.tabs.get(tabId);
    if (t.status !== 'complete') continue;
    try { const e = await executer(tabId, empreinte); if (e !== avant) { await dormir(300); return true; } } catch { /* page en cours de remplacement */ }
  }
  return false;
}
async function aller(tabId, url) {
  const avant = await executer(tabId, empreinte).catch(() => null);
  await chrome.tabs.update(tabId, { url });
  await attendreChargement(tabId, avant);
  await dormir(PAUSE);
}

const sig = t => t.entetes.map(h => h.toLowerCase().trim()).join('|');
const cheminDe = url => { const u = new URL(url); for (const k of [...u.searchParams.keys()]) if (/^(page|p|offset|start|debut)$/i.test(k)) u.searchParams.delete(k); return u.pathname + (u.search || ''); };

// Range une table lue : fusionne avec une table déjà vue (même page, mêmes colonnes), sans doublon de ligne.
function ranger(e, page, t) {
  const cle = cheminDe(page.url) + '#' + sig(t);
  let x = e.tables.find(y => y.cle === cle);
  if (!x) { x = { cle, titre: t.titre, url: page.url, selecteur: t.selecteur, entetes: t.entetes, lignes: [], pages: 0 }; e.tables.push(x); }
  const vues = new Set(x.lignes.map(l => l.join('\u0001')));
  let n = 0;
  for (const l of t.lignes) { const k = l.join('\u0001'); if (!vues.has(k)) { vues.add(k); x.lignes.push(l); n++; } }
  x.pages++;
  return n;
}
function rangerFiches(e, page) {
  for (const f of page.fiches) {
    const k = page.url + '#' + f.selecteur;
    if (!e.fiches.some(x => x.cle === k)) e.fiches.push({ cle: k, url: page.url, titre: f.titre, champs: f.champs });
  }
}
function noterEtape(e, page, t, suivant) {
  const chemin = cheminDe(page.url);
  if (!e.etapes.some(s => s.chemin === chemin && s.signature === sig(t))) e.etapes.push({ chemin, titre: t.titre, selecteur: t.selecteur, signature: sig(t), suivant: suivant || null });
}

// Copie la page affichée, puis toutes les pages suivantes de la liste.
async function copierListe(tabId, { toutes = true, etiquette = '' } = {}) {
  let page = await executer(tabId, extrairePage);
  if (page.connexion && !page.tables.length) { await maj(e => journal(e, 'Page de connexion : connectez-vous d’abord.')); return { connexion: true }; }
  let total = 0, pages = 1;
  const details = new Map();
  const noterDetails = p => { for (const t of p.tables) { const k = sig(t); if (!details.has(k)) details.set(k, new Set()); for (const d of t.details || []) details.get(k).add(d); } };
  noterDetails(page);
  await maj(e => {
    e.origine = e.origine || new URL(page.url).origin;
    for (const t of page.tables) { total += ranger(e, page, t); noterEtape(e, page, t, page.suivant); }
    rangerFiches(e, page);
  });
  while (toutes && page.suivant && pages < MAX_PAGES_LISTE && !arret) {
    const avant = await executer(tabId, empreinte);
    if (!(await executer(tabId, cliquer, [page.suivant]))) break;
    if (!(await attendreChargement(tabId, avant))) break;
    await dormir(PAUSE);
    page = await executer(tabId, extrairePage);
    pages++; noterDetails(page);
    await maj(e => { for (const t of page.tables) total += ranger(e, page, t); e.progression = { texte: `${etiquette}page ${pages}`, n: pages }; });
  }
  await maj(e => { journal(e, `${page.titre || page.url} : ${total} lignes sur ${pages} page(s).`); e.progression = null; });
  return { total, pages, page, details: [...details.values()].map(x => [...x]) };
}

// Exploration automatique : part de la page où le gérant est connecté et suit les menus du même site.
async function explorer(tabId, { fiches = true } = {}) {
  arret = false;
  const depart = await executer(tabId, extrairePage);
  if (depart.connexion && !depart.tables.length && !depart.liens.length) { await maj(e => journal(e, 'Connectez-vous d’abord, puis relancez.')); return; }
  const origine = new URL(depart.url).origin;
  const file = [depart.url, ...depart.liens.map(l => l.href)];
  const vues = new Set();
  let n = 0;
  while (file.length && n < MAX_PAGES_EXPLO && !arret) {
    const url = file.shift();
    const cle = cheminDe(url);
    if (vues.has(cle) || !url.startsWith(origine)) continue;
    vues.add(cle); n++;
    await maj(e => { e.progression = { texte: `Exploration : page ${n} (${new URL(url).pathname})`, n }; });
    const tab = await chrome.tabs.get(tabId);
    if (tab.url !== url) await aller(tabId, url);
    const r = await copierListe(tabId, { etiquette: new URL(url).pathname + ' · ' });
    if (r.connexion) { await maj(e => journal(e, 'Déconnecté par le logiciel : reconnectez-vous puis relancez, la copie reprendra où elle en était.')); break; }
    for (const l of r.page?.liens || []) if (!vues.has(cheminDe(l.href))) file.push(l.href);
    if (fiches) for (const liste of r.details || []) for (const [k, d] of liste.slice(0, MAX_FICHES).entries()) {
      if (arret) break;
      if (vues.has(cheminDe(d))) continue; vues.add(cheminDe(d));
      await maj(e => { e.progression = { texte: `Fiches détaillées : ${k + 1}/${liste.length}`, n }; });
      await aller(tabId, d);
      const p = await executer(tabId, extrairePage);
      await maj(e => rangerFiches(e, p));
    }
  }
  await maj(e => { journal(e, `Exploration terminée : ${n} pages parcourues.`); e.progression = null; });
  await sauverRecette();
}

// Recette = chemin appris pour un logiciel : quelles pages, quel tableau, quelles colonnes.
async function sauverRecette() {
  const e = await lireEtat(); if (!e.origine || !e.etapes.length) return;
  const { recettes = {} } = await chrome.storage.local.get('recettes');
  recettes[e.origine] = { origine: e.origine, etapes: e.etapes, apprise_le: new Date().toISOString(), version: (recettes[e.origine]?.version || 0) + 1 };
  await chrome.storage.local.set({ recettes });
  const { serveur } = await chrome.storage.local.get('serveur');
  if (serveur) fetch(serveur + '/api/v1/migration/recettes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(recettes[e.origine]) }).catch(() => {});
}

// Rejoue un chemin appris. Si un écran a changé, on le signale (incident) au lieu de copier n'importe quoi.
async function rejouer(tabId) {
  arret = false;
  const tab = await chrome.tabs.get(tabId);
  const origine = new URL(tab.url).origin;
  const { recettes = {} } = await chrome.storage.local.get('recettes');
  const r = recettes[origine]; if (!r) return;
  let i = 0;
  for (const s of r.etapes) {
    if (arret) break;
    i++;
    await maj(e => { e.progression = { texte: `Chemin connu : étape ${i}/${r.etapes.length}`, n: i }; });
    await aller(tabId, origine + s.chemin);
    const page = await executer(tabId, extrairePage);
    const t = page.tables.find(x => sig(x) === s.signature);
    if (!t) {
      const incident = { origine, etape: s.chemin, attendu: s.signature, trouve: page.tables.map(sig), le: new Date().toISOString(), connexion: page.connexion };
      await maj(e => { e.incidents.push(incident); journal(e, `Écran changé : ${s.titre || s.chemin}. Signalé à Piaffe ; je passe en exploration pour cette page.`); });
      const { serveur } = await chrome.storage.local.get('serveur');
      if (serveur) fetch(serveur + '/api/v1/migration/incidents', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(incident) }).catch(() => {});
      if (page.connexion) break;
    }
    await copierListe(tabId, { etiquette: (s.titre || s.chemin) + ' · ' });
  }
  await maj(e => { journal(e, 'Chemin connu terminé.'); e.progression = null; });
}

chrome.runtime.onMessage.addListener((m, _s, repondre) => {
  (async () => {
    if (m.action === 'copier') { arret = false; await copierListe(m.tabId, { toutes: m.toutes !== false }); await sauverRecette(); }
    else if (m.action === 'explorer') explorer(m.tabId, { fiches: m.fiches !== false });   // long : on ne l'attend pas
    else if (m.action === 'rejouer') rejouer(m.tabId);
    else if (m.action === 'arreter') arret = true;
    else if (m.action === 'vider') await ecrireEtat(nouvelEtat());
    else if (m.action === 'serveur') await chrome.storage.local.set({ serveur: m.url || null });
    repondre({ ok: true });
  })().catch(err => repondre({ ok: false, erreur: String(err) }));
  return true;
});
