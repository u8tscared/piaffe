// Serveur de référence du robot sans installation (Node + Playwright). En production : Worker Cloudflare
// + Browser Rendering + un Durable Object par session, même contrat HTTP.
//   node migration/robot/serveur-local.mjs   ->  http://localhost:4800  (sert aussi la passerelle)
//   PIAFFE_ROBOT_LOCAL=1 autorise les adresses locales (essais avec essais/ancien-logiciel.mjs)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { migrerDepuisPage, estConnecte, adresseAutorisee, scriptRobot, seConnecter, POURQUOI } from './entree.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ici = path.dirname(new URL(import.meta.url).pathname);
const PORT = +process.env.PORT || 4800, LOCAL = process.env.PIAFFE_ROBOT_LOCAL === '1';
const LARGEUR = 1280, HAUTEUR = 800, INACTIVITE = 20 * 60 * 1000;
const sessions = new Map();
let navigateur;

async function nouvelleSession(adresse, acces = null) {
  navigateur = navigateur || await chromium.launch();
  const contexte = await navigateur.newContext({ viewport: { width: LARGEUR, height: HAUTEUR }, locale: 'fr-FR', acceptDownloads: false });
  // Le robot de la page écoute dès le premier écran ce que le logiciel charge (lecture seule, aucun champ secret).
  await contexte.addInitScript(scriptRobot());
  const page = await contexte.newPage();
  const s = { id: crypto.randomBytes(18).toString('base64url'), contexte, page, phase: 'connexion', etat: {}, clients: new Set(), signal: { arret: false }, vu: Date.now(), capture: null };
  sessions.set(s.id, s);
  page.on('dialog', d => d.dismiss().catch(() => {}));          // aucune boîte de dialogue ne bloque le robot
  await page.goto(adresse, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  s.adresseDepart = page.url();
  boucleImages(s);
  if (acces) connexionAuto(s, adresse, acces); else surveillerConnexion(s);
  return s;
}

function diffuser(s, type, donnees) { const m = `event: ${type}\ndata: ${JSON.stringify(donnees)}\n\n`; for (const c of s.clients) c.write(m); }
async function boucleImages(s) {
  while (sessions.has(s.id)) {
    if (s.clients.size && s.phase !== 'termine') {
      try { const img = await s.page.screenshot({ type: 'jpeg', quality: 62 }); diffuser(s, 'image', img.toString('base64')); } catch { }
    }
    await new Promise(r => setTimeout(r, s.phase === 'connexion' ? 350 : 900));
    if (Date.now() - s.vu > INACTIVITE) fermer(s);
  }
}
// Dès que le gérant est connecté (plus de mot de passe à l'écran), la copie démarre toute seule.
async function surveillerConnexion(s) {
  let stable = 0;
  while (sessions.has(s.id) && s.phase === 'connexion') {
    await new Promise(r => setTimeout(r, 1000));
    try { stable = (await estConnecte(s.page)) ? stable + 1 : 0; } catch { stable = 0; }
    if (stable >= 2) return demarrer(s);
  }
}
// Identifiants confiés : le robot se connecte seul ; un code de vérification est demandé au gérant dans la page.
// Les identifiants ne vivent que le temps de la connexion, puis sont oubliés. En cas d'échec, le gérant se connecte lui-même.
async function connexionAuto(s, adresse, acces) {
  s.etat = { auto: true, progression: 'Connexion à votre ancien logiciel…' }; diffuser(s, 'etat', { phase: 'connexion', ...s.etat });
  const demanderCode = () => new Promise(r => {
    s.attenteCode = r; s.etat = { auto: true, attente: 'code', progression: 'Votre logiciel demande un code de vérification.' }; diffuser(s, 'etat', { phase: 'connexion', ...s.etat });
    setTimeout(() => { if (s.attenteCode === r) { s.attenteCode = null; r(''); } }, 5 * 60e3);
  });
  let c;
  try { c = await seConnecter(s.page, { adresse, identifiant: acces.identifiant, motDePasse: acces.mot_de_passe, demanderCode }); }
  catch { c = { ok: false, pourquoi: 'connexion' }; }
  acces.identifiant = acces.mot_de_passe = ''; s.attenteCode = null;
  if (c.ok) return demarrer(s, c.hotes);
  s.etat = { auto: false, message: POURQUOI[c.pourquoi] + ' Connectez-vous vous-même dans l’écran ci-dessous.' }; diffuser(s, 'etat', { phase: 'connexion', ...s.etat });
  surveillerConnexion(s);
}
async function demarrer(s, hotes = []) {
  if (s.phase !== 'connexion') return;
  s.phase = 'copie'; diffuser(s, 'etat', { phase: 'copie' });
  try {
    const r = await migrerDepuisPage(s.page, { hotes, signal: s.signal, surEtat: e => { s.etat = e; diffuser(s, 'etat', { phase: 'copie', ...e }); } });
    s.capture = r.capture; s.phase = 'termine';
    diffuser(s, 'etat', { phase: 'termine', controle: r.paquet.controle });
  } catch (err) { s.phase = 'erreur'; diffuser(s, 'etat', { phase: 'erreur', message: String(err.message || err) }); }
  // Les cookies de session de l'ancien logiciel ne servent plus : on ferme le navigateur de cette session.
  await s.contexte.close().catch(() => {});
}
function fermer(s) { s.signal.arret = true; s.contexte.close().catch(() => {}); for (const c of s.clients) c.end(); sessions.delete(s.id); }

const TOUCHES = new Set(['Enter', 'Tab', 'Backspace', 'Delete', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);
async function entree(s, e) {
  if (s.phase !== 'connexion') return;                       // le gérant ne pilote que la connexion
  if (e.type === 'clic') await s.page.mouse.click(Math.max(0, Math.min(LARGEUR, +e.x)), Math.max(0, Math.min(HAUTEUR, +e.y)));
  else if (e.type === 'texte') await s.page.keyboard.type(String(e.texte).slice(0, 200));   // jamais journalisé
  else if (e.type === 'touche' && TOUCHES.has(e.touche)) await s.page.keyboard.press(e.touche);
  else if (e.type === 'defiler') await s.page.mouse.wheel(0, Math.max(-2000, Math.min(2000, +e.dy || 0)));
}

const corps = req => new Promise(r => { let b = ''; req.on('data', c => { b += c; if (b.length > 1e5) req.destroy(); }); req.on('end', () => { try { r(JSON.parse(b || '{}')); } catch { r({}); } }); });
const json = (res, code, o) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(o)); };

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'), m = u.pathname.match(/^\/api\/v1\/migration\/robot(?:\/([\w-]+))?(?:\/(\w+))?$/);
  try {
    if (u.pathname === '/' || u.pathname === '/migration/') {
      let h = fs.readFileSync(path.join(ici, '../dist/passerelle.html'), 'utf8');
      h = h.replace('<head>', '<head><script>globalThis.PIAFFE_ROBOT=location.origin</script>');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(h);
    }
    if (!m) return json(res, 404, { error: { code: 'introuvable' } });
    const [, id, action] = m;
    if (!id && req.method === 'POST') {
      const { adresse, acces, consentement } = await corps(req);
      if (!adresseAutorisee(adresse, { local: LOCAL })) return json(res, 400, { error: { code: 'adresse', message: 'Adresse refusée : indiquez l’adresse https de votre logiciel.' } });
      const a = acces && typeof acces.identifiant === 'string' && typeof acces.mot_de_passe === 'string' && acces.identifiant && acces.mot_de_passe ? { identifiant: acces.identifiant.slice(0, 200), mot_de_passe: acces.mot_de_passe.slice(0, 200) } : null;
      if (a && consentement !== true) return json(res, 400, { error: { code: 'consentement', message: 'Cochez la case qui autorise Stabl à se connecter à votre logiciel.' } });
      const s = await nouvelleSession(adresse, a);
      return json(res, 201, { id: s.id, largeur: LARGEUR, hauteur: HAUTEUR });
    }
    const s = sessions.get(id); if (!s) return json(res, 404, { error: { code: 'session', message: 'Session terminée.' } });
    s.vu = Date.now();
    if (action === 'flux') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
      s.clients.add(res); req.on('close', () => s.clients.delete(res));
      return res.write(`event: etat\ndata: ${JSON.stringify({ phase: s.phase, ...s.etat })}\n\n`);
    }
    if (action === 'entree' && req.method === 'POST') { await entree(s, await corps(req)); return json(res, 200, { ok: true }); }
    if (action === 'demarrer' && req.method === 'POST') { demarrer(s); return json(res, 202, { ok: true }); }
    if (action === 'code' && req.method === 'POST') {
      const { code } = await corps(req); const r = s.attenteCode;
      if (!r) return json(res, 409, { error: { code: 'pas_de_code', message: 'Aucun code n’est demandé pour l’instant.' } });
      s.attenteCode = null; r(String(code || '').slice(0, 12)); s.etat = { auto: true, progression: 'Code envoyé, connexion…' }; diffuser(s, 'etat', { phase: 'connexion', ...s.etat });
      return json(res, 200, { ok: true });
    }
    if (action === 'capture') { if (!s.capture) return json(res, 409, { error: { code: 'pas_fini' } }); const c = s.capture; fermer(s); return json(res, 200, c); }
    if (!action && req.method === 'DELETE') { fermer(s); return json(res, 200, { ok: true }); }
    json(res, 404, { error: { code: 'introuvable' } });
  } catch (err) { json(res, 500, { error: { code: 'erreur', message: String(err.message || err) } }); }
}).listen(PORT, () => console.log(`Robot Stabl : http://localhost:${PORT}${LOCAL ? ' (adresses locales autorisées)' : ''}`));
