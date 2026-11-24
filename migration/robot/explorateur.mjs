// Moteur d'exploration du robot Piaffe, indépendant du navigateur qui l'exécute.
// `page` suit l'interface commune à Playwright et Puppeteer : goto(url), url(), evaluate(fn, arg).
// Utilisé par le robot côté serveur (aucune installation chez le club). Mêmes règles que l'extension :
// lecture seule, seul le bouton « suivant » est cliqué, liens dangereux ignorés, pause entre les pages.
import { extrairePage, cliquer, empreinte } from '../extension/extraire.js';

const dormir = ms => new Promise(r => setTimeout(r, ms));
const sig = t => t.entetes.map(h => String(h).toLowerCase().trim()).join('|');
const cheminDe = url => { const u = new URL(url); for (const k of [...u.searchParams.keys()]) if (/^(page|p|offset|start|debut)$/i.test(k)) u.searchParams.delete(k); return u.pathname + (u.search || ''); };

export class Explorateur {
  constructor(page, { pause = 700, maxPages = 150, maxFiches = 3000, fiches = true, signal = { arret: false }, surEtat = () => {} } = {}) {
    Object.assign(this, { page, pause, maxPages, maxFiches, fiches, signal, surEtat });
    this.tables = []; this.fiches_ = []; this.etapes = []; this.incidents = []; this.journal = []; this.pages = 0;
  }
  noter(m) { this.journal.push(m); this.journal = this.journal.slice(-40); this.surEtat(this.etat()); }
  etat(progression = null) {
    return { progression, journal: this.journal.slice(-6), lignes: this.tables.reduce((a, t) => a + t.lignes.length, 0), listes: this.tables.map(t => ({ titre: t.titre, n: t.lignes.length })), fiches: this.fiches_.length, pages: this.pages };
  }
  async lire() { return this.page.evaluate(extrairePage); }
  async attendreChangement(avant) {
    for (let i = 0; i < 40; i++) {
      await dormir(250);
      try { const e = await this.page.evaluate(empreinte); if (e !== avant) { await dormir(300); return true; } } catch { /* navigation en cours */ }
    }
    return false;
  }
  async aller(url) { await this.page.goto(url, { waitUntil: 'load', timeout: 30000 }).catch(() => {}); await dormir(this.pause); }

  ranger(p, t) {
    const cle = cheminDe(p.url) + '#' + sig(t);
    let x = this.tables.find(y => y.cle === cle);
    if (!x) { x = { cle, titre: t.titre, url: p.url, entetes: t.entetes, lignes: [], pages: 0 }; this.tables.push(x); }
    const vues = new Set(x.lignes.map(l => l.join('\u0001')));
    for (const l of t.lignes) { const k = l.join('\u0001'); if (!vues.has(k)) { vues.add(k); x.lignes.push(l); } }
    x.pages++;
    const chemin = cheminDe(p.url);
    if (!this.etapes.some(s => s.chemin === chemin && s.signature === sig(t))) this.etapes.push({ chemin, titre: t.titre, selecteur: t.selecteur, signature: sig(t) });
  }
  rangerFiches(p) { for (const f of p.fiches) { const k = p.url + '#' + f.selecteur; if (!this.fiches_.some(x => x.cle === k)) this.fiches_.push({ cle: k, url: p.url, titre: f.titre, champs: f.champs }); } }

  async copierListe(etiquette = '') {
    let p = await this.lire();
    if (p.connexion && !p.tables.length) return { connexion: true, page: p, details: [] };
    const details = new Map();
    const noter = q => { for (const t of q.tables) { const k = sig(t); if (!details.has(k)) details.set(k, new Set()); for (const d of t.details || []) details.get(k).add(d); } };
    for (const t of p.tables) this.ranger(p, t);
    this.rangerFiches(p); noter(p);
    let n = 1;
    while (p.suivant && n < 300 && !this.signal.arret) {
      const avant = await this.page.evaluate(empreinte);
      if (!(await this.page.evaluate(cliquer, p.suivant))) break;
      if (!(await this.attendreChangement(avant))) break;
      await dormir(this.pause);
      p = await this.lire(); n++; noter(p);
      for (const t of p.tables) this.ranger(p, t);
      this.surEtat(this.etat(`${etiquette}page ${n}`));
    }
    const total = p.tables.reduce((a, t) => a + t.lignes.length, 0);
    if (p.tables.length) this.noter(`${p.titre || p.url} : ${n} page(s) lue(s).`);
    return { page: p, details: [...details.values()].map(s => [...s]), total };
  }

  // Part de la page où le gérant est connecté et suit les menus du même site.
  async explorer() {
    const depart = await this.lire();
    const origine = new URL(depart.url).origin;
    const file = [depart.url, ...depart.liens.map(l => l.href)];
    const vues = new Set();
    while (file.length && this.pages < this.maxPages && !this.signal.arret) {
      const url = file.shift();
      const cle = cheminDe(url);
      if (vues.has(cle) || !url.startsWith(origine)) continue;
      vues.add(cle); this.pages++;
      this.surEtat(this.etat(`Lecture de ${new URL(url).pathname}`));
      if (this.page.url() !== url) await this.aller(url);
      const r = await this.copierListe(new URL(url).pathname + ' · ');
      if (r.connexion) { this.noter('Le logiciel a fermé la session : reconnectez-vous, la copie reprendra.'); return { deconnecte: true }; }
      for (const l of r.page.liens || []) if (!vues.has(cheminDe(l.href))) file.push(l.href);
      if (this.fiches) for (const liste of r.details) for (const [k, d] of liste.slice(0, this.maxFiches).entries()) {
        if (this.signal.arret) break;
        if (vues.has(cheminDe(d))) continue; vues.add(cheminDe(d));
        this.surEtat(this.etat(`Fiches détaillées : ${k + 1}/${liste.length}`));
        await this.aller(d);
        this.rangerFiches(await this.lire());
      }
    }
    this.noter(`Terminé : ${this.pages} pages parcourues.`);
    return { termine: true };
  }

  // Rejoue un chemin appris ; signale l'écran qui a changé au lieu de copier n'importe quoi.
  async rejouer(recette) {
    for (const s of recette.etapes) {
      if (this.signal.arret) break;
      await this.aller(recette.origine + s.chemin);
      const p = await this.lire();
      if (!p.tables.some(t => sig(t) === s.signature)) this.incidents.push({ origine: recette.origine, etape: s.chemin, attendu: s.signature, trouve: p.tables.map(sig), le: new Date().toISOString() });
      await this.copierListe((s.titre || s.chemin) + ' · ');
    }
  }

  capture(logiciel) {
    const origine = this.tables[0] ? new URL(this.tables[0].url).origin : null;
    return {
      format: 'piaffe-capture', version: '1.0', capture_le: new Date().toISOString(), origine, logiciel: logiciel || null,
      tables: this.tables.map(({ cle, ...t }) => t), fiches: this.fiches_.map(({ cle, ...f }) => f),
      recette: origine ? { origine, etapes: this.etapes, apprise_le: new Date().toISOString() } : null, incidents: this.incidents,
    };
  }
}
