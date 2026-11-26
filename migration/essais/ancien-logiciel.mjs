// Faux « ancien logiciel » web pour essayer le robot navigateur (données fictives).
// node essais/ancien-logiciel.mjs [port]  -> http://localhost:4799  (identifiant : demo / mot de passe : demo)
// Autres comptes : « a2f » (code de vérification 246810 demandé après le mot de passe), « refus » (toujours refusé).
// Pages pour le robot sans recette : /soins et /pensions (listes JSON paginées, jeton dans l'en-tête), /semaine
// (reprises chargées semaine par semaine, en JSON), /faces/menu.xhtml (menu JSF : liens « # » qui envoient un formulaire).
import http from 'node:http';
const PORT = +process.argv[2] || 4799;
export const journalAcces = [];
const P = ['Léa', 'Emma', 'Chloé', 'Manon', 'Inès', 'Jade', 'Zoé', 'Alice', 'Lina', 'Rose', 'Hugo', 'Jules', 'Nathan', 'Tom', 'Paul', 'Lucas', 'Camille', 'Sarah', 'Louise', 'Arthur'];
const N = ['Martin', 'Laurent', 'Rousseau', 'Faure', 'Girard', 'Lambert', 'Fontaine', 'Chevalier', 'Blanc', 'Guérin', 'Perrin', 'Henry', 'Roussel', 'Nicolas', 'Garnier'];
const cav = Array.from({ length: 62 }, (_, i) => ({ id: 1000 + i, prenom: P[i % P.length], nom: N[(i * 7) % N.length].toUpperCase(), naiss: `${String(1 + i % 28).padStart(2, '0')}/${String(1 + i % 12).padStart(2, '0')}/${2000 + i % 18}`, galop: i % 8, tel: '06 ' + String(10 + i).padStart(2, '0') + ' 22 33 ' + String(10 + i % 80), mail: `cavalier${i}@exemple.fr`, lic: String(2000000 + i * 37) + 'K' }));
const chx = ['Vanille', 'Tornado', 'Opale', 'Quartz', 'Ulysse', 'Câline', 'Nuage', 'Réglisse', 'Saphir', 'Tango', 'Iris', 'Domino'].map((n, i) => ({ n, race: ['Selle Français', 'Connemara', 'KWPN', 'Poney Français de Selle'][i % 4], robe: ['Bai', 'Alezan', 'Gris'][i % 3], an: 2008 + i, sire: String(15000000 + i * 1234) + 'X' }));
const fac = Array.from({ length: 34 }, (_, i) => ({ num: 'F-' + (5000 + i), date: `${String(1 + i % 28).padStart(2, '0')}/10/2026`, client: cav[i % 62].nom + ' ' + cav[i % 62].prenom, lib: ['Forfait annuel', 'Carte 10 séances', 'Pension novembre', 'Stage Toussaint'][i % 4], ttc: [780, 290, 420, 160][i % 4].toFixed(2).replace('.', ',') + ' €', etat: i % 5 ? 'Réglée' : 'Impayée' }));

const JOUR = 864e5, auj = Date.parse(new Date().toISOString().slice(0, 10)), iso = t => new Date(t).toISOString().slice(0, 10);
const soins = Array.from({ length: 27 }, (_, i) => ({ id: 'S' + (300 + i), horse: { name: chx[i % 12].n }, type: ['Vermifuge', 'Vaccin grippe', 'Maréchal', 'Vétérinaire'][i % 4], date: iso(auj - i * 9 * JOUR), nextDate: iso(auj + (60 - i) * JOUR), practitioner: ['Dr Morel', 'Maréchalerie Petit'][i % 2] }));
const pensions = Array.from({ length: 14 }, (_, i) => ({ id: 700 + i, horseName: chx[i % 12].n, ownerName: cav[i * 3].prenom + ' ' + cav[i * 3].nom, formula: ['Pension box', 'Pension pré', 'Demi-pension'][i % 3], monthlyPrice: [420, 280, 190][i % 3], startDate: iso(auj - (200 + i * 11) * JOUR) }));
const reprises = []; for (let t = auj - 600 * JOUR, i = 0; t <= auj + 300 * JOUR; t += 14 * JOUR, i++) reprises.push({ id: 'R' + i, date: iso(t), startTime: ['14:00', '17:30', '10:00'][i % 3], title: ['Galop 3-4', 'Baby poney', 'Galop 6-7'][i % 3], instructor: { firstName: ['Hugo', 'Jade'][i % 2] }, places: 8 });
const JETON = 'Bearer demo-jeton';
const page = (titre, corps) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${titre} · Gestion Écurie (démo)</title>
<style>body{font-family:sans-serif;margin:0;display:flex}nav{width:180px;background:#334;padding:10px;min-height:100vh}nav a{display:block;color:#fff;padding:6px}main{padding:16px}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4px 8px}</style></head>
<body><nav class="menu"><a href="/accueil">Accueil</a><a href="/cavaliers">Cavaliers</a><a href="/chevaux">Cavalerie</a><a href="/factures">Factures</a><a href="/planning">Planning</a><a href="/semaine">Semaine</a><a href="/soins">Soins</a><a href="/pensions">Pensions</a><a href="/faces/menu.xhtml">Gestion (ancienne)</a><a href="/parametres/supprimer-tout">Supprimer toutes les données</a><a href="/deconnexion">Déconnexion</a></nav><main><h1>${titre}</h1>${corps}</main></body></html>`;

const srv = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); journalAcces.push(req.method + ' ' + u.pathname); if (process.env.JOURNAL_ACCES) console.log('ACCES', req.method, u.pathname);
  const connecte = /session=ok/.test(req.headers.cookie || '');
  const html = (h, code = 200) => { res.writeHead(code, { 'content-type': 'text/html; charset=utf-8' }); res.end(h); };
  const json = (o, code = 200) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(o)); };
  const corps = () => new Promise(r => { let b = ''; req.on('data', d => b += d); req.on('end', () => r(new URLSearchParams(b))); });
  if (u.pathname === '/connexion' && req.method === 'POST') return corps().then(f => {
    if (f.get('u') === 'refus') return html(`<!doctype html><meta charset="utf-8"><title>Connexion</title><p role="alert">Identifiant ou mot de passe incorrect.</p><form method="post" action="/connexion"><label>Identifiant <input name="u"></label><label>Mot de passe <input type="password" name="p"></label><button>Se connecter</button></form>`);
    if (f.get('u') === 'a2f') { res.writeHead(302, { 'set-cookie': 'etape=code; Path=/', location: '/verification' }); return res.end(); }
    res.writeHead(302, { 'set-cookie': 'session=ok; Path=/', location: '/accueil' }); res.end();
  });
  if (u.pathname === '/verification' && /etape=code/.test(req.headers.cookie || '')) {
    if (req.method === 'POST') return corps().then(f => {
      if (f.get('code') === '246810') { res.writeHead(302, { 'set-cookie': ['session=ok; Path=/', 'etape=; Max-Age=0; Path=/'], location: '/accueil' }); return res.end(); }
      html(`<!doctype html><meta charset="utf-8"><title>Vérification</title><p role="alert">Code incorrect.</p><form method="post"><label>Code reçu par SMS <input name="code" autocomplete="one-time-code" inputmode="numeric" maxlength="6"></label><button>Valider</button></form>`);
    });
    return html(`<!doctype html><meta charset="utf-8"><title>Vérification</title><p>Saisissez le code de vérification reçu par SMS.</p><form method="post"><label>Code reçu par SMS <input name="code" autocomplete="one-time-code" inputmode="numeric" maxlength="6"></label><label><input type="checkbox" name="confiance"> Se souvenir de cet appareil</label><button>Valider</button></form>`);
  }
  if (u.pathname.startsWith('/api/')) {
    if (!connecte || req.headers.authorization !== JETON) return json({ error: 'non autorisé' }, 401);
    if (u.pathname === '/api/soins') { const p = +(u.searchParams.get('page') || 1), n = +(u.searchParams.get('limit') || 10); return json({ items: soins.slice((p - 1) * n, p * n), page: p, total: soins.length }); }
    if (u.pathname === '/api/pensions') { const o = +(u.searchParams.get('offset') || 0), n = +(u.searchParams.get('limit') || 5); return json({ data: pensions.slice(o, o + n), meta: { offset: o, total: pensions.length } }); }
    if (u.pathname === '/api/reprises') { const du = u.searchParams.get('du'), au = u.searchParams.get('au'); return json({ lessons: reprises.filter(r => r.date >= du && r.date <= au) }); }
    return json({ error: 'introuvable' }, 404);
  }
  if (u.pathname === '/connexion' || !connecte) {
    if (u.pathname !== '/connexion') { res.writeHead(302, { location: '/connexion' }); return res.end(); }
    return html(`<!doctype html><meta charset="utf-8"><title>Connexion</title><form method="post" action="/connexion"><label>Identifiant <input name="u"></label><label>Mot de passe <input type="password" name="p"></label><button>Se connecter</button></form>`);
  }
  if (u.pathname === '/deconnexion') { res.writeHead(302, { 'set-cookie': 'session=; Max-Age=0; Path=/', location: '/connexion' }); return res.end(); }
  if (u.pathname.startsWith('/parametres/supprimer')) return html(page('Données supprimées', '<p>Toutes les données ont été supprimées.</p>'));
  if (u.pathname === '/accueil') return html(page('Accueil', '<p>Bienvenue.</p>'));
  if (u.pathname === '/cavaliers') {
    const p = +(u.searchParams.get('page') || 1), parPage = 25, lot = cav.slice((p - 1) * parPage, p * parPage), dernier = p * parPage >= cav.length;
    return html(page('Cavaliers', `<table><thead><tr><th>N°</th><th>Nom</th><th>Prénom</th><th>Né(e) le</th><th>Galop</th><th>Téléphone</th><th>Email</th><th>Licence</th><th></th></tr></thead><tbody>
      ${lot.map(c => `<tr><td>${c.id}</td><td><a href="/cavaliers/${c.id}">${c.nom}</a></td><td>${c.prenom}</td><td>${c.naiss}</td><td>${c.galop}</td><td>${c.tel}</td><td>${c.mail}</td><td>${c.lic}</td><td><a href="/cavaliers/${c.id}/supprimer">Supprimer</a></td></tr>`).join('')}</tbody></table>
      <p>Page ${p} ${dernier ? '' : `<a href="/cavaliers?page=${p + 1}">Suivant</a>`}</p>`));
  }
  const m = u.pathname.match(/^\/cavaliers\/(\d+)$/);
  if (m) { const c = cav.find(x => x.id === +m[1]); return html(page('Fiche de ' + c.prenom, `<dl><dt>Nom</dt><dd>${c.nom}</dd><dt>Prénom</dt><dd>${c.prenom}</dd><dt>Date de naissance</dt><dd>${c.naiss}</dd><dt>Responsable légal</dt><dd>${c.nom} Parent</dd><dt>Adresse</dt><dd>${c.id % 90} rue des Prés</dd><dt>Code postal</dt><dd>78730</dd><dt>Ville</dt><dd>Saint-Arnoult</dd></dl>`)); }
  if (u.pathname === '/chevaux') return html(page('Cavalerie', `<div role="grid" aria-label="Liste des équidés"><div role="row"><span role="columnheader">Nom</span> <span role="columnheader">Race</span> <span role="columnheader">Robe</span> <span role="columnheader">Année</span> <span role="columnheader">SIRE</span></div>
    ${chx.map(c => `<div role="row"><span role="cell">${c.n}</span> <span role="cell">${c.race}</span> <span role="cell">${c.robe}</span> <span role="cell">${c.an}</span> <span role="cell">${c.sire}</span></div>`).join('')}</div>`));
  if (u.pathname === '/factures') return html(page('Factures', `<table id="f"><thead><tr><th>N° facture</th><th>Date</th><th>Client</th><th>Désignation</th><th>Montant TTC</th><th>Statut</th></tr></thead><tbody></tbody></table>
    <button id="prec" disabled>Précédent</button> <button id="suiv" aria-label="Page suivante">›</button>
    <script>const F=${JSON.stringify(fac)};let p=0;function r(){document.querySelector('#f tbody').innerHTML=F.slice(p*10,p*10+10).map(f=>'<tr><td>'+f.num+'</td><td>'+f.date+'</td><td>'+f.client+'</td><td>'+f.lib+'</td><td>'+f.ttc+'</td><td>'+f.etat+'</td></tr>').join('');document.getElementById('suiv').disabled=(p+1)*10>=F.length}
    document.getElementById('suiv').onclick=()=>{setTimeout(()=>{p++;r()},150)};r();</script>`));
  const spa = (titre, script) => html(page(titre, `<div id="liste" class="cartes"></div><script>const J={authorization:'${JETON}'};${script}</script>`));
  if (u.pathname === '/soins') return spa('Soins', `fetch('/api/soins?page=1&limit=10',{headers:J}).then(r=>r.json()).then(j=>{document.getElementById('liste').innerHTML=j.items.map(s=>'<div class="carte"><b>'+s.horse.name+'</b><span>'+s.type+'</span><span>'+s.date+'</span></div>').join('')})`);
  if (u.pathname === '/pensions') return spa('Pensions', `const x=new XMLHttpRequest();x.open('GET','/api/pensions?offset=0&limit=5');x.setRequestHeader('authorization',J.authorization);x.onload=()=>{const j=JSON.parse(x.responseText);document.getElementById('liste').innerHTML=j.data.map(p=>'<div class="carte"><b>'+p.horseName+'</b><span>'+p.formula+'</span></div>').join('')};x.send()`);
  if (u.pathname === '/semaine') return spa('Reprises de la semaine', `const d=new Date(),l=new Date(d-((d.getDay()+6)%7)*864e5),f=t=>new Date(t).toISOString().slice(0,10);fetch('/api/reprises?du='+f(l)+'&au='+f(+l+6*864e5),{headers:J}).then(r=>r.json()).then(j=>{document.getElementById('liste').innerHTML=j.lessons.map(r=>'<div class="carte"><b>'+r.title+'</b><span>'+r.date+' '+r.startTime+'</span></div>').join('')||'<p>Aucune reprise cette semaine.</p>'})`);
  if (u.pathname === '/faces/menu.xhtml') {
    const vue = req.method === 'POST' ? corps() : Promise.resolve(new URLSearchParams());
    return vue.then(f => {
      const cible = f.get('cible') || '';
      if (cible === 'purge') journalAcces.push('PURGE'), process.env.JOURNAL_ACCES && console.log('ACCES PURGE');
      const lien = (t, c) => `<a href="#" onclick="var f=document.getElementById('jf');f.cible.value='${c}';f.submit();return false">${t}</a>`;
      const menu = `<form id="jf" method="post" action="/faces/menu.xhtml"><input type="hidden" name="javax.faces.ViewState" value="-123:456"><input type="hidden" name="cible"></form><ul class="ui-menu">${['Stocks', 'Fournisseurs'].map((t, i) => '<li class="ui-menuitem">' + lien(t, ['stocks', 'fournisseurs'][i]) + '</li>').join('')}<li class="ui-menuitem">${lien('Vider la corbeille', 'purge')}</li></ul>`;
      const contenu = cible === 'stocks' ? `<h2>Stocks</h2><table><thead><tr><th>Article</th><th>Catégorie</th><th>Quantité</th><th>Unité</th><th>Seuil d'alerte</th></tr></thead><tbody>${[['Foin', 'Fourrage', 120, 'balles', 30], ['Paille', 'Litière', 80, 'balles', 20], ['Granulés', 'Aliment', 900, 'kg', 200], ['Vermifuge', 'Pharmacie', 14, 'doses', 5]].map(l => '<tr>' + l.map(v => '<td>' + v + '</td>').join('') + '</tr>').join('')}</tbody></table>`
        : cible === 'fournisseurs' ? `<h2>Fournisseurs</h2><table><thead><tr><th>Fournisseur</th><th>Catégorie</th><th>Téléphone</th><th>SIRET</th></tr></thead><tbody><tr><td>Fourrages du Hurepoix</td><td>Fourrage</td><td>01 30 00 00 01</td><td>12345678900011</td></tr><tr><td>Sellerie Martin</td><td>Sellerie</td><td>01 30 00 00 02</td><td>98765432100022</td></tr></tbody></table>` : '<p>Choisissez une rubrique.</p>';
      html(page('Gestion', menu + contenu));
    });
  }
  if (u.pathname === '/planning') return html(page('Planning', `<table><tr><th>Jour</th><th>Heure</th><th>Reprise</th><th>Moniteur</th></tr><tr><td>Mercredi</td><td>14h00</td><td>Galop 3-4</td><td>Hugo</td></tr><tr><td>Samedi</td><td>10h00</td><td>Baby poney</td><td>Jade</td></tr></table>`));
  html(page('Introuvable', ''), 404);
});
if (process.argv[1]?.endsWith('ancien-logiciel.mjs')) srv.listen(PORT, () => console.log('http://localhost:' + PORT));
export function demarrer(port = PORT) { return new Promise(r => srv.listen(port, () => r(srv))); }
