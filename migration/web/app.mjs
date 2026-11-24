// Passerelle Piaffe dans le navigateur : rien n'est envoyé, tout est lu sur place.
import { lireFichier } from '../core/lire.mjs';
import { construirePaquet, analyserTable } from '../core/paquet.mjs';
import { TYPES } from '../core/champs.mjs';
import { LOGICIELS, FAMILLES, reconnaitreAdresse } from '../core/logiciels.mjs';
import { LOGOS } from '../core/logos.mjs';
import { envoyerAcces } from '../core/acces.mjs';
import { lettreResiliation } from '../core/resiliation.mjs';
import { rapportHTML } from '../core/rapport.mjs';
import { envoyer } from '../core/vers-api.mjs';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const eur = n => (n ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const inflate = async b => new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());

const etat = { logiciel: null, tables: [], paquet: null };

// 1. Changer de logiciel : catalogue, recherche, adresse collée
const LIEN_EXTENSION = 'https://github.com/u8tscared/piaffe/tree/main/migration/extension';
const LIEN_MODE_EMPLOI = 'https://github.com/u8tscared/piaffe/blob/main/migration/extension/LISEZMOI.md';
const SERVEUR_MIGRATION = globalThis.PIAFFE_SERVEUR || '';   // vide tant que le serveur n'ouvre pas la reprise par codes
const COULEURS = { equestre: 'hz', federation: 'tm', adhesions: 'mo', agenda: 'rd', compta: 'mo', rh: 'tm', tableurs: 'hz', papier: 'pf' };
let famille = 'tous';

function vignette(l) {
  const logo = LOGOS[l.id];
  const pastille = logo ? `<span class="logo"><img src="${logo}" alt="" loading="lazy" width="40" height="40"></span>`
    : `<span class="logo initiale ${COULEURS[l.famille] || 'pf'}">${esc(l.nom.replace(/^[^A-Za-zÀ-ÿ0-9]+/, '')[0])}</span>`;
  const forme = { web: 'En ligne', bureau: 'Sur ordinateur', 'les-deux': 'En ligne et sur ordinateur' }[l.forme] || '';
  return `<button class="carte-l ${etat.logiciel === l.id ? 'on' : ''}" data-l="${l.id}" type="button">${pastille}<span class="nom">${esc(l.nom)}</span><small>${esc(forme || FAMILLES.find(f => f.id === l.famille).nom)}</small><i class="coche" aria-hidden="true"></i></button>`;
}
function dessinerCatalogue() {
  const q = cleRecherche($('#recherche').value);
  const liste = Object.values(LOGICIELS).filter(l => (famille === 'tous' || l.famille === famille) && (!q || cleRecherche(l.nom + ' ' + (l.editeur || '')).includes(q)));
  $('#catalogue').innerHTML = liste.map(vignette).join('') || `<p class="vide">Aucun logiciel ne correspond. Collez son adresse au-dessus : le robot sait explorer un logiciel qu’il ne connaît pas.</p>`;
  $('#catalogue').querySelectorAll('.carte-l').forEach((c, i) => c.style.setProperty('--i', Math.min(i, 24)));
}
const cleRecherche = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
$('#familles').innerHTML = [{ id: 'tous', nom: 'Tous' }, ...FAMILLES].map(f => {
  const n = f.id === 'tous' ? Object.keys(LOGICIELS).length : Object.values(LOGICIELS).filter(l => l.famille === f.id).length;
  return `<button class="fam ${f.id === 'tous' ? 'on' : ''}" data-f="${f.id}" type="button">${esc(f.nom)} <span>${n}</span></button>`;
}).join('');
$('#familles').addEventListener('click', e => {
  const b = e.target.closest('[data-f]'); if (!b) return;
  famille = b.dataset.f;
  document.querySelectorAll('.fam').forEach(x => x.classList.toggle('on', x === b));
  dessinerCatalogue();
});
$('#recherche').addEventListener('input', dessinerCatalogue);
$('#catalogue').addEventListener('click', e => {
  const b = e.target.closest('[data-l]'); if (!b) return;
  choisir(b.dataset.l);
});
let minuterie;
$('#adresse').addEventListener('input', () => { clearTimeout(minuterie); minuterie = setTimeout(lireAdresse, 350); });
$('#adresse-form').addEventListener('submit', e => { e.preventDefault(); lireAdresse(); });
function lireAdresse() {
  const v = $('#adresse').value.trim(), info = $('#adresse-info');
  if (!v) { info.textContent = ''; info.className = ''; return; }
  const l = reconnaitreAdresse(v);
  if (l) {
    info.className = 'ok'; info.textContent = `C’est ${l.nom} : on le connaît.`;
    famille = 'tous'; document.querySelectorAll('.fam').forEach(x => x.classList.toggle('on', x.dataset.f === 'tous'));
    $('#recherche').value = ''; choisir(l.id, v);
  } else if (/^(https?:\/\/)?[\w-]+(\.[\w-]+)+/i.test(v)) {
    info.className = 'neuf'; info.textContent = 'Logiciel inconnu : le robot va l’explorer pour vous.';
    choisir(null, v);
  } else { info.className = ''; info.textContent = 'Collez une adresse complète, par exemple https://app.monlogiciel.fr'; }
}

function choisir(id, adresse) {
  etat.logiciel = id; etat.adresse = adresse || null;
  dessinerCatalogue();
  const l = id ? LOGICIELS[id] : null;
  $('#guide-titre').textContent = l ? `Récupérer vos données de ${l.nom}` : 'Exploration automatique de votre logiciel';
  $('#guide').innerHTML = l ? cartesModes(l) : carteExploration(adresse);
  $('#etape-guide').hidden = false; $('#etape-depot').hidden = false; $('#etape-bonus').hidden = !l || ['papier', 'excel', 'numbers', 'libreoffice', 'google-sheets', 'sire'].includes(l.id);
  if (l) { $('#r-logiciel').value = l.nom; $('#r-editeur').value = l.editeur || l.nom; }
  requestAnimationFrame(() => $('#etape-guide').scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

const MODES = {
  robot: { badge: 'Le plus magique', titre: 'Le robot navigateur', icone: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2.5"/><path d="M3 8h18M8.5 13.5l2 2 4.5-4.5"/></svg>' },
  ordinateur: { badge: 'Logiciel installé', titre: 'Le robot pour ordinateur', icone: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>' },
  codes: { badge: 'Sans rien faire', titre: 'Donnez-nous vos codes', icone: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/></svg>' },
  export: { badge: 'Le plus sûr', titre: 'Export de fichier', icone: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14"/></svg>' },
};
function lienExt(adresse) { return adresse ? '?adresse=' + encodeURIComponent(adresse) : ''; }
function carteMode(mode, corps, i) {
  const m = MODES[mode];
  return `<article class="mode m-${mode}" style="--i:${i}"><header><span class="mi" aria-hidden="true">${m.icone}</span><div><span class="badge">${m.badge}</span><h3>${m.titre}</h3></div></header>${corps}</article>`;
}
function cartesModes(l) {
  const a = etat.adresse;
  const blocs = {
    robot: `<ol><li>Installez l’extension Piaffe pour Chrome (gratuite).</li><li>Connectez-vous normalement à ${esc(l.nom)}, double authentification comprise.</li><li>Cliquez sur « Copier » : le robot parcourt les pages et copie cavaliers, chevaux, factures, planning.</li><li>Déposez ici le fichier <code>capture-piaffe.json</code> qu’il produit.</li></ol>
      <p class="actions-m"><a class="bouton" href="${LIEN_EXTENSION}${lienExt(a)}" target="_blank" rel="noopener">Installer l’extension</a><a class="lien" href="${LIEN_MODE_EMPLOI}${lienExt(a)}" target="_blank" rel="noopener">Mode d’emploi</a></p><p class="fine">Tout tourne sur votre ordinateur : vos mots de passe ne nous sont jamais transmis.</p>`,
    ordinateur: `<ol><li>Téléchargez le robot Piaffe pour Windows sur l’ordinateur où ${esc(l.nom)} est installé.</li><li>Il repère tout seul les exports et le dossier de données, et n’en lit qu’une copie.</li><li>Il prépare le paquet Piaffe et le rapport, puis vous les déposez ici.</li></ol><p class="fine">Version Windows signée bientôt disponible. En attendant, utilisez l’export de fichier.</p>`,
    codes: `<p>Confiez-nous l’accès : notre robot fait la migration à votre place, puis efface vos identifiants.</p>
      ${SERVEUR_MIGRATION ? '' : '<p class="bientot">Bientôt disponible. Rien n’est envoyé depuis cette page pour l’instant.</p>'}
      <form id="codes" class="codes" autocomplete="off"><input name="identifiant" placeholder="Identifiant ${esc(l.nom)}" ${SERVEUR_MIGRATION ? '' : 'disabled'}><input name="motDePasse" type="password" placeholder="Mot de passe" ${SERVEUR_MIGRATION ? '' : 'disabled'}>
      <label class="plein"><input type="checkbox" name="doubleAuth" ${SERVEUR_MIGRATION ? '' : 'disabled'}> Mon compte a une double authentification (code par SMS ou application) : on vous appellera pour le saisir ensemble.</label>
      <button class="bouton second plein" ${SERVEUR_MIGRATION ? '' : 'disabled'}>Envoyer de façon chiffrée</button><p class="fine plein" id="codes-sortie">Chiffré dans votre navigateur avant envoi, effacé après la migration.</p></form>`,
    export: `<ol>${l.voies[0].etapes.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` +
      (l.famille === 'equestre' ? `<p class="astuce">Ajoutez aussi la liste des licenciés exportée de FFE Club SIF : Piaffe rapproche les licences et complète les fiches.</p>` : '') +
      (!l.confirme ? `<p class="fine">Les noms de menus peuvent varier selon votre version : déposez ce que vous avez, la passerelle reconnaît les colonnes toute seule.</p>` : ''),
  };
  return `<div class="modes">${['robot', 'ordinateur', 'codes', 'export'].filter(m => l.modes.includes(m)).map((m, i) => carteMode(m, blocs[m], i)).join('')}</div>`;
}
function carteExploration(adresse) {
  return `<div class="modes">${carteMode('robot', `<p>Nous ne connaissons pas encore ce logiciel : le robot l’explore pour vous.</p><ol><li>Installez l’extension Piaffe pour Chrome.</li><li>Elle ouvre <b>${esc(adresse)}</b> : connectez-vous normalement.</li><li>Cliquez sur « Explorer » : le robot parcourt seul les menus et copie tout ce qu’il trouve (listes, fiches, tableaux).</li><li>Déposez ici le fichier <code>capture-piaffe.json</code>. Le chemin suivi est gardé : le prochain club qui vient de ce logiciel ira plus vite.</li></ol>
    <p class="actions-m"><a class="bouton" href="${LIEN_EXTENSION}${lienExt(adresse)}" target="_blank" rel="noopener">Installer l’extension</a><a class="lien" href="${LIEN_MODE_EMPLOI}${lienExt(adresse)}" target="_blank" rel="noopener">Mode d’emploi</a></p>`, 0)}
    ${carteMode('export', `<ol>${EXPORT_GENERIQUE.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`, 1)}</div>`;
}
const EXPORT_GENERIQUE = ['Dans votre logiciel, cherchez Exporter, Excel ou CSV sur la liste des clients ou cavaliers.', 'Faites de même pour les chevaux, les tarifs, les factures et le planning.', 'Déposez les fichiers ici.'];
document.addEventListener('submit', async e => {
  if (e.target.id !== 'codes') return;
  e.preventDefault();
  const f = new FormData(e.target), s = $('#codes-sortie');
  try {
    const r = await envoyerAcces(SERVEUR_MIGRATION, { logiciel: etat.logiciel, adresse: etat.adresse, identifiant: f.get('identifiant'), motDePasse: f.get('motDePasse'), doubleAuth: !!f.get('doubleAuth') });
    s.textContent = 'Reçu et chiffré. Nous vous prévenons dès que la migration est prête (' + (r.statut || 'en attente') + ').';
    e.target.reset();
  } catch (err) { s.textContent = err.code === 'indisponible' ? 'Bientôt disponible : rien n’a été envoyé.' : 'Échec : ' + err.message; }
});
dessinerCatalogue();

// Bonus : lettre de résiliation
$('#resiliation').addEventListener('submit', e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  $('#lettre').value = lettreResiliation(f);
  $('#lettre-zone').hidden = false;
  $('#lettre').style.height = $('#lettre').scrollHeight + 'px';
});
$('#copier-lettre').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#lettre').value); toast('Lettre copiée.'); }
  catch { $('#lettre').select(); toast('Sélectionnée : faites Ctrl+C (ou Cmd+C).'); }
});
$('#dl-lettre').addEventListener('click', () => telecharger('lettre-resiliation.txt', $('#lettre').value, 'text/plain'));

// 2. Dépôt des fichiers
const zone = $('#zone');
['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('survol'); }));
['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('survol'); }));
zone.addEventListener('drop', e => ajouter([...e.dataTransfer.files]));
$('#choisir').addEventListener('change', e => ajouter([...e.target.files]));
$('#exemple').addEventListener('click', async () => {
  const noms = ['kavalog-cavaliers.csv', 'ffe-licencies-2027.xlsx', 'cavalerie.xlsx', 'kavalog-factures.csv', 'planning-reprises.csv', 'tarifs.csv', 'equipe-salaries.xls'];
  const lire = async n => globalThis.EXEMPLES ? Uint8Array.from(atob(globalThis.EXEMPLES[n]), c => c.charCodeAt(0)) : await (await fetch('../fixtures/' + n)).arrayBuffer();
  const fichiers = await Promise.all(noms.map(async n => new File([await lire(n)], n)));
  ajouter(fichiers);
});

async function ajouter(fichiers) {
  for (const f of fichiers) {
    try {
      const tables = await lireFichier(f.name, await f.arrayBuffer(), { inflate });
      for (const t of tables) {
        if (t.erreur) { toast(`${f.name} : ${t.erreur}`); continue; }
        if (etat.logiciel && LOGICIELS[etat.logiciel]?.famille === 'equestre' && !/ffe|sif|licenci/i.test(f.name)) t.logiciel = etat.logiciel;
        etat.tables.push(t);
      }
    } catch (err) { toast(`${f.name} : fichier illisible (${err.message}).`); }
  }
  recalculer();
}

function recalculer() {
  etat.paquet = construirePaquet(etat.tables.filter(t => !t.ignorer));
  dessinerFichiers(); dessinerResultat();
  $('#etape-fichiers').hidden = !etat.tables.length; $('#etape-resultat').hidden = !etat.tables.length;
}

function dessinerFichiers() {
  $('#fichiers').innerHTML = etat.tables.map((t, i) => {
    const a = analyserTable(t);
    if (!a) return '';
    const opts = ['', ...Object.keys(TYPES)].map(k => `<option value="${k}" ${k === (a.source.type || '') ? 'selected' : ''}>${k ? esc(TYPES[k].libelle) : 'Ne pas importer'}</option>`).join('');
    const champs = a.source.type ? Object.keys(TYPES[a.source.type].champs) : [];
    const cols = a.entetes.map((h, j) => {
      if (!h) return '';
      const c = a.colonnes[j] || '';
      const ex = a.corps.slice(0, 2).map(r => r.l[j]).filter(Boolean).join(' · ');
      return `<tr class="${c ? '' : 'nonpris'}"><td><b>${esc(h)}</b><small>${esc(String(ex).slice(0, 60))}</small></td><td>${a.source.type ? `<select data-t="${i}" data-c="${j}"><option value="">Ignorer</option>${champs.map(ch => `<option ${ch === c ? 'selected' : ''}>${ch}</option>`).join('')}</select>` : ''}</td></tr>`;
    }).join('');
    const ok = a.source.type ? Object.keys(a.colonnes).length : 0;
    return `<article class="fichier ${a.source.type ? 'ok' : 'ko'}" style="--i:${i}">
      <header><div><b>${esc(t.fichier)}</b>${t.feuille ? ` <span class="mut">› ${esc(t.feuille)}</span>` : ''}<small>${a.source.lignes} lignes · ${ok} colonnes reconnues sur ${a.entetes.filter(Boolean).length}${t.encodage ? ' · ' + t.encodage : ''}</small></div>
      <select data-type="${i}">${opts}</select></header>
      <details><summary>Voir et corriger les colonnes</summary><table>${cols}</table></details></article>`;
  }).join('');
}
$('#fichiers').addEventListener('change', e => {
  const s = e.target;
  if (s.dataset.type !== undefined) { const t = etat.tables[+s.dataset.type]; t.type = s.value || null; t.colonnes = null; if (!s.value) t.ignorer = true; else delete t.ignorer; }
  if (s.dataset.t !== undefined) {
    const t = etat.tables[+s.dataset.t]; const a = analyserTable(t);
    t.type = a.source.type; t.colonnes = { ...a.colonnes };
    for (const [k, v] of Object.entries(t.colonnes)) if (v === s.value) delete t.colonnes[k];
    if (s.value) t.colonnes[s.dataset.c] = s.value; else delete t.colonnes[s.dataset.c];
  }
  if (s.dataset.type !== undefined) recalculer();
  else { etat.paquet = construirePaquet(etat.tables.filter(t => !t.ignorer)); dessinerResultat(); }
});

function dessinerResultat() {
  const p = etat.paquet, c = p.controle;
  const tuiles = [['Cavaliers', c.cavaliers, `${c.foyers} familles`, 'rd'], ['Chevaux', c.chevaux, `${c.chevaux_proprietaires} de propriétaires`, 'hz'],
    ['Factures', c.factures, eur(c.chiffre_factures_ttc), 'mo'], ['Reste dû', eur(c.impayes_factures_ttc), 'à comparer', 'cr'], ['Planning', c.reprises, 'reprises', 'tm']];
  $('#tuiles').innerHTML = tuiles.map(([t, v, s, k], i) => `<div class="t ${k}" style="--i:${i}"><div>${t}</div><div class="big" data-n="${typeof v === 'number' ? v : ''}">${v}</div><small>${s}</small></div>`).join('');
  document.querySelectorAll('.big[data-n]').forEach(compter);
  const att = p.avertissements.filter(a => a.niveau === 'attention'), inf = p.avertissements.filter(a => a.niveau !== 'attention');
  $('#avert').innerHTML = (att.length ? `<h3>À vérifier (${att.length})</h3><ul>${att.map(a => `<li>${esc(a.message)}</li>`).join('')}</ul>` : '<p class="bravo">Rien de bloquant : vous pouvez importer.</p>') +
    (inf.length ? `<details><summary>Remarques (${inf.length})</summary><ul class="discret">${inf.map(a => `<li>${esc(a.message)}</li>`).join('')}</ul></details>` : '');
}
function compter(el) {
  const n = +el.dataset.n; if (!n || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const t0 = performance.now();
  const pas = t => { const k = Math.min(1, (t - t0) / 700); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(pas); };
  requestAnimationFrame(pas);
}

// Dans une page publiée (Artifact), seuls les téléchargements passant par la plateforme fonctionnent.
const promesseDl = Promise.resolve(globalThis.claude?.use?.('downloads')).catch(() => null);
async function telecharger(nom, contenu, type) {
  try {
    const d = await Promise.race([promesseDl, new Promise(r => setTimeout(() => r(null), 3000))]);
    if (d) { await d.save({ filename: nom, data: contenu }); return; }
  } catch (err) { if (err?.code === 'declined') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([contenu], { type })); a.download = nom;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$('#dl-paquet').addEventListener('click', () => telecharger('paquet-piaffe.json', JSON.stringify(etat.paquet, null, 2), 'application/json'));
$('#dl-rapport').addEventListener('click', () => telecharger('rapport-migration.html', rapportHTML(etat.paquet), 'text/html'));
$('#envoi').addEventListener('submit', async e => {
  e.preventDefault();
  const f = new FormData(e.target), sortie = $('#envoi-sortie');
  sortie.textContent = 'Envoi…';
  try {
    const r = await envoyer(etat.paquet, { url: f.get('url'), cle: f.get('cle'), essai: !f.get('reel'), journal: m => { sortie.textContent += '\n' + m; } });
    sortie.textContent += '\n' + JSON.stringify(r, null, 2);
  } catch (err) { sortie.textContent += '\nÉchec : ' + err.message; }
});

function toast(m) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.append(t);
  setTimeout(() => t.classList.add('part'), 4200); setTimeout(() => t.remove(), 4700);
}
