// Passer à Stabl : parcours pas à pas (une question par écran), puis récupération des données.
// Mode intégré (ouvert depuis l'onboarding de l'appli) : ?source=<id>&adresse=<url>&outils=<ids>&retour=<url>
// saute les questions et va droit à la récupération ; l'import se fait sur la session du gérant (même origine).
import { lireFichier } from '../core/lire.mjs';
import { construirePaquet, analyserTable } from '../core/paquet.mjs';
import { TYPES } from '../core/champs.mjs';
import { LOGICIELS, FAMILLES, reconnaitreAdresse } from '../core/logiciels.mjs';
import { LOGOS } from '../core/logos.mjs';
import { envoyerAcces } from '../core/acces.mjs';
import { lettreResiliation } from '../core/resiliation.mjs';
import { QUESTIONS, FAMILLES_OUTILS, questionsActives, decisionsPossibles, decision, planDeBascule, reponsesDepuisLien } from '../core/parcours.mjs';
import { rapportHTML } from '../core/rapport.mjs';
import { envoyer } from '../core/vers-api.mjs';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const eur = n => (n ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const inflate = async b => new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
const cleRecherche = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const calme = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const etat = { tables: [], paquet: null };
const rep = { depart: null, principal: null, adresse: null, outils: [], choix: {} };
const SERVEUR_MIGRATION = globalThis.PIAFFE_SERVEUR || '';   // ancien envoi chiffré (core/acces.mjs), si le robot en ligne n'est pas là
const robotEnLigne = () => !!globalThis.PiaffeRobot?.disponible?.();
const COULEURS = { equestre: 'hz', federation: 'tm', adhesions: 'mo', agenda: 'rd', compta: 'mo', rh: 'tm', tableurs: 'hz', papier: 'pf' };
const NOM_REL = { branche: 'Gardé et branché', remplace: 'Remplacé par Stabl', au_choix: 'Au choix' };
const COURT = { depart: 'Départ', principal: 'Logiciel', outils: 'Outils', choix: 'Choix', plan: 'Plan', recuperation: 'Récupération' };

// Mode intégré
const params = new URLSearchParams(location.search);
const integre = !!params.get('source');
if (integre) { Object.assign(rep, reponsesDepuisLien(params)); document.body.classList.add('integre'); }

function pastille(l, taille = 40) {
  const logo = LOGOS[l.id];
  return logo ? `<span class="logo"><img src="${logo}" alt="" loading="lazy" width="${taille}" height="${taille}"></span>`
    : `<span class="logo initiale ${COULEURS[l.famille] || 'pf'}">${esc(l.nom.replace(/^[^A-Za-zÀ-ÿ0-9]+/, '')[0])}</span>`;
}

// ---------- Navigation ----------
let ici = integre ? 'recuperation' : 'depart';
function ecransActifs() { return questionsActives(rep).map(q => q.id); }
function aller(id, sens = 'avant') {
  ici = id;
  document.querySelectorAll('.ecran').forEach(e => {
    const actif = e.dataset.ecran === id;
    e.hidden = !actif; e.classList.remove('avant', 'arriere');
    if (actif) { void e.offsetWidth; e.classList.add(sens); }
  });
  ({ depart: dessinerDepart, principal: dessinerCatalogue, outils: dessinerOutils, choix: dessinerDecisions, plan: dessinerPlan, recuperation: dessinerRecuperation })[id]();
  majNav();
  const e = document.querySelector(`.ecran[data-ecran="${id}"]`);
  e.focus({ preventScroll: true });
  if (!integre) requestAnimationFrame(() => window.scrollTo({ top: Math.min(window.scrollY, $('.progres').offsetTop), behavior: calme() ? 'auto' : 'smooth' }));
}
function majNav() {
  const liste = ecransActifs(), i = liste.indexOf(ici);
  $('#rempli').style.width = ((i + 1) / liste.length * 100) + '%';
  $('#etapes').innerHTML = liste.map((id, k) => `<span class="${k < i ? 'fait' : k === i ? 'ici' : ''}">${COURT[id]}</span>`).join('');
  $('#ou').innerHTML = `Étape <b>${i + 1}</b> sur ${liste.length} · ${COURT[ici]}`;
  $('#retour').hidden = i <= 0 || integre;
  const c = $('#continuer');
  c.hidden = ici === 'recuperation';
  c.disabled = (ici === 'depart' && !rep.depart) || (ici === 'principal' && !rep.principal && !rep.adresse);
  c.textContent = ici === 'outils' && !rep.outils.length ? 'Je n’en utilise pas d’autre' : ici === 'plan' ? (planDeBascule(rep).recuperer.length ? 'Récupérer mes données' : 'Terminer') : 'Continuer';
}
$('#continuer').addEventListener('click', () => { const l = ecransActifs(); const s = l[l.indexOf(ici) + 1]; if (s) aller(s, 'avant'); });
$('#retour').addEventListener('click', () => { const l = ecransActifs(); const s = l[l.indexOf(ici) - 1]; if (s) aller(s, 'arriere'); });
$('#passer').addEventListener('click', e => { e.preventDefault(); signaler('abandon'); });

// ---------- 1. Venez-vous d'un autre logiciel ? ----------
const ICONES_DEPART = {
  oui: ['tm', '<path d="M4 12h12m0 0-4-4m4 4-4 4"/><path d="M20 5v14"/>'],
  zero: ['hz', '<path d="M12 5v14M5 12h14"/>'],
  tableur: ['mo', '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/>'],
};
function dessinerDepart() {
  $('#options-depart').innerHTML = QUESTIONS[0].options.map((o, i) => { const [c, p] = ICONES_DEPART[o.valeur];
    return `<button class="option ${rep.depart === o.valeur ? 'on' : ''}" data-depart="${o.valeur}" type="button" style="--i:${i}"><span class="oi ${c}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg></span><b>${esc(o.libelle)}</b><small>${esc(o.detail)}</small></button>`; }).join('');
}
$('#options-depart').addEventListener('click', e => {
  const b = e.target.closest('[data-depart]'); if (!b) return;
  const avant = rep.depart; rep.depart = b.dataset.depart;
  if (avant !== rep.depart) { rep.principal = null; rep.adresse = null; $('#adresse').value = ''; $('#adresse-info').textContent = ''; }
  document.querySelectorAll('.option').forEach(x => x.classList.toggle('on', x === b)); majNav();
  setTimeout(() => $('#continuer').click(), calme() ? 0 : 260);
});

// ---------- 2. Lequel gère votre club ? ----------
let famille = 'tous';
function famillesPrincipales() { return QUESTIONS.find(q => q.id === 'principal').familles(rep); }
function vignette(l, on, extra = '') {
  const forme = { web: 'En ligne', bureau: 'Sur ordinateur', 'les-deux': 'En ligne et sur ordinateur' }[l.forme] || FAMILLES.find(f => f.id === l.famille).nom;
  return `<button class="carte-l ${on ? 'on' : ''}" data-l="${l.id}" type="button" aria-pressed="${on}">${pastille(l)}<span class="nom">${esc(l.nom)}</span><small>${esc(forme)}</small>${extra}<i class="coche" aria-hidden="true"></i></button>`;
}
function dessinerCatalogue() {
  const fams = famillesPrincipales();
  if (famille !== 'tous' && !fams.includes(famille)) famille = 'tous';
  const tous = Object.values(LOGICIELS).filter(l => fams.includes(l.famille));
  $('#familles').hidden = fams.length < 2;
  $('#familles').innerHTML = [{ id: 'tous', nom: 'Tous' }, ...FAMILLES.filter(f => fams.includes(f.id))].map(f =>
    `<button class="fam ${f.id === famille ? 'on' : ''}" data-f="${f.id}" type="button">${esc(f.nom)} <span>${f.id === 'tous' ? tous.length : tous.filter(l => l.famille === f.id).length}</span></button>`).join('');
  const q = cleRecherche($('#recherche').value);
  const liste = tous.filter(l => (famille === 'tous' || l.famille === famille) && (!q || cleRecherche(l.nom + ' ' + (l.editeur || '')).includes(q)));
  $('#catalogue').innerHTML = liste.map(l => vignette(l, rep.principal === l.id)).join('') || `<p class="vide">Aucun logiciel ne correspond. Collez son adresse juste en dessous : le robot sait explorer un logiciel qu’il ne connaît pas.</p>`;
  $('#catalogue').querySelectorAll('.carte-l').forEach((c, i) => c.style.setProperty('--i', Math.min(i, 24)));
}
$('#familles').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; famille = b.dataset.f; dessinerCatalogue(); });
$('#recherche').addEventListener('input', dessinerCatalogue);
$('#catalogue').addEventListener('click', e => {
  const b = e.target.closest('[data-l]'); if (!b) return;
  rep.principal = b.dataset.l; rep.adresse = null; $('#adresse').value = ''; $('#adresse-info').textContent = '';
  rep.outils = rep.outils.filter(x => x !== rep.principal);
  dessinerCatalogue(); majNav();
  setTimeout(() => { if (ici === 'principal') $('#continuer').click(); }, calme() ? 0 : 420);
});
let minuterie;
$('#adresse').addEventListener('input', () => { clearTimeout(minuterie); minuterie = setTimeout(lireAdresse, 350); });
$('#adresse-form').addEventListener('submit', e => { e.preventDefault(); lireAdresse(); if (!$('#continuer').disabled) $('#continuer').click(); });
function lireAdresse() {
  const v = $('#adresse').value.trim(), info = $('#adresse-info');
  if (!v) { info.textContent = ''; info.className = ''; if (!rep.principal) rep.adresse = null; majNav(); return; }
  const l = reconnaitreAdresse(v);
  if (l) { info.className = 'ok'; info.textContent = `C’est ${l.nom} : on le connaît.`; rep.principal = l.id; rep.adresse = v; famille = 'tous'; $('#recherche').value = ''; }
  else if (/^(https?:\/\/)?[\w-]+(\.[\w-]+)+/i.test(v)) { info.className = 'neuf'; info.textContent = 'Logiciel inconnu : le robot va l’explorer pour vous.'; rep.principal = null; rep.adresse = v; }
  else { info.className = ''; info.textContent = 'Collez une adresse complète, par exemple https://app.monlogiciel.fr'; rep.adresse = null; }
  dessinerCatalogue(); majNav();
}

// ---------- 3. Vos autres outils ----------
function dessinerOutils() {
  const q = cleRecherche($('#recherche-outils').value);
  const html = FAMILLES_OUTILS.map(fid => {
    const liste = Object.values(LOGICIELS).filter(l => l.famille === fid && l.id !== rep.principal && (!q || cleRecherche(l.nom + ' ' + (l.editeur || '')).includes(q)));
    if (!liste.length) return '';
    return `<h3 class="famille-titre">${esc(FAMILLES.find(f => f.id === fid).nom)}</h3><div class="grille">${liste.map(l => { const on = rep.outils.includes(l.id);
      return vignette(l, on, on ? `<span class="rel ${l.relation}">${NOM_REL[l.relation]}</span>` : ''); }).join('')}</div>`;
  }).join('');
  $('#outils').innerHTML = html || '<p class="vide">Aucun outil ne correspond.</p>';
  $('#outils').querySelectorAll('.carte-l').forEach((c, i) => c.style.setProperty('--i', Math.min(i, 24)));
}
$('#recherche-outils').addEventListener('input', dessinerOutils);
$('#outils').addEventListener('click', e => {
  const b = e.target.closest('[data-l]'); if (!b) return;
  const id = b.dataset.l, l = LOGICIELS[id];
  rep.outils = rep.outils.includes(id) ? rep.outils.filter(x => x !== id) : [...rep.outils, id];
  const on = rep.outils.includes(id);
  b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
  b.querySelector('.rel')?.remove();
  if (on) b.querySelector('small').insertAdjacentHTML('afterend', `<span class="rel ${l.relation}">${NOM_REL[l.relation]}</span>`);
  majNav();
});

// ---------- 4. Changer ou intégrer ----------
function dessinerDecisions() {
  $('#decisions').innerHTML = rep.outils.map((id, i) => {
    const l = LOGICIELS[id], possibles = decisionsPossibles(id), d = decision(rep, id);
    const commande = possibles.length > 1
      ? `<div class="seg" role="radiogroup" aria-label="${esc(l.nom)}">${possibles.map(p => `<button type="button" role="radio" aria-checked="${p === d}" class="${p === d ? 'on' : ''}" data-id="${id}" data-d="${p}">${p === 'changer' ? 'Changer' : 'Intégrer'}</button>`).join('')}</div>`
      : `<span class="fixe rel ${d === 'changer' ? 'remplace' : 'branche'}">${d === 'changer' ? 'Remplacé par Stabl' : 'Gardé et branché'}</span>`;
    return `<div class="decision" style="--i:${i}">${pastille(l, 36)}<span class="nom">${esc(l.nom)}</span>${commande}<p class="effet" id="effet-${id}">${esc(l.effets[d])}</p></div>`;
  }).join('');
}
$('#decisions').addEventListener('click', e => {
  const b = e.target.closest('[data-d]'); if (!b) return;
  const { id, d } = b.dataset; rep.choix[id] = d;
  b.parentNode.querySelectorAll('button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
  const p = document.getElementById('effet-' + id); p.style.opacity = 0;
  setTimeout(() => { p.textContent = LOGICIELS[id].effets[d]; p.style.opacity = 1; }, calme() ? 0 : 150);
});

// ---------- 5. Plan de bascule ----------
function itemResil(x, j) {
  return `<li style="--j:${j}"><b>${esc(x.nom)}</b>${x.lettre
    ? `<small>Après vérification de la reprise.</small><button class="lien" type="button" data-lettre="${esc(x.id || '')}" data-nom="${esc(x.nom)}" data-editeur="${esc(x.editeur || '')}">Préparer la lettre</button>`
    : '<small>Gratuit : arrêtez simplement de vous en servir une fois la reprise vérifiée.</small>'}</li>`;
}
function dessinerPlan() {
  const p = planDeBascule(rep);
  const col = (cls, i, icone, titre, sous, items, rien) => `<div class="col ${cls}" style="--i:${i}"><h3><i>${icone}</i>${titre}</h3><p>${sous}</p>${items.length ? `<ul>${items.join('')}</ul>` : `<p class="rien">${rien}</p>`}</div>`;
  $('#plan').innerHTML =
    col('c-rec', 0, '↓', 'À récupérer', 'On copie tout dans Stabl.', p.recuperer.map((x, j) => `<li style="--j:${j}"><b>${esc(x.nom)}</b><small>${esc(x.quoi)}${x.garde ? ' (l’outil est gardé)' : ''}</small></li>`), 'Rien : vous partez de zéro.') +
    col('c-bra', 1, '⇄', 'À brancher', 'Vous les gardez, on les relie.', p.brancher.map((x, j) => `<li style="--j:${j}"><b>${esc(x.nom)}</b><small>${esc(x.effet)}</small></li>`), 'Aucun outil à garder.') +
    col('c-res', 2, '✕', 'À résilier', 'Une fois la reprise vérifiée.', p.resilier.map(itemResil), 'Rien à résilier.');
  $('#etape-bonus').hidden = true;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-lettre]'); if (!b) return;
  const zone = $('#etape-bonus');
  b.closest('.ecran').append(zone);
  zone.hidden = false; $('#lettre-zone').hidden = true;
  $('#lettre-pour').textContent = b.dataset.nom;
  $('#r-logiciel').value = b.dataset.lettre ? b.dataset.nom : ''; $('#r-editeur').value = b.dataset.editeur;
  zone.scrollIntoView({ behavior: calme() ? 'auto' : 'smooth', block: 'start' });
});

// ---------- 6. Récupération (logiciel principal) ----------
const MODES = {
  robot: { badge: 'Rien à installer', titre: 'Connexion assistée', icone: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2.5"/><path d="M3 8h18M8.5 13.5l2 2 4.5-4.5"/></svg>' },
  ordinateur: { badge: 'Logiciel installé', titre: 'Le robot pour ordinateur', icone: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>' },
  codes: { badge: 'Sans rien faire', titre: 'Donnez-nous vos codes', icone: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/></svg>' },
  export: { badge: 'Le plus sûr', titre: 'Export de fichier', icone: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14"/></svg>' },
};
const EXPORT_GENERIQUE = ['Dans votre logiciel, cherchez Exporter, Excel ou CSV sur la liste des clients ou cavaliers.', 'Faites de même pour les chevaux, les tarifs, les factures et le planning.', 'Déposez les fichiers ici.'];
function carteMode(mode, corps, i) {
  const m = MODES[mode];
  return `<article class="mode m-${mode}" style="--i:${i}"><header><span class="mi" aria-hidden="true">${m.icone}</span><div><span class="badge">${m.badge}</span><h3>${m.titre}</h3></div></header>${corps}</article>`;
}
const ASSISTEE = 'Le robot Stabl ouvre votre logiciel sur nos serveurs ; vous vous connectez ici même, dans cette page, double authentification comprise ; il copie tout et vous montre le résultat. Rien à installer.';
function blocAssistee(nom, adresse, inconnu) {
  return `<p>${ASSISTEE}</p>${inconnu ? `<p class="fine">Nous ne connaissons pas encore ce logiciel : le robot explore seul les menus de <b>${esc(adresse)}</b>, et garde le chemin pour le prochain club.</p>` : ''}
    <p class="actions-m"><button class="bouton" type="button" id="ouvrir-robot" data-adresse="${esc(adresse || '')}" data-nom="${esc(nom)}">Ouvrir mon logiciel</button></p><div id="robot-distant"></div><p class="fine" id="robot-info"></p>`;
}
function cartesModes(l) {
  const adresse = rep.adresse || (l.site ? 'https://' + l.site : '');
  const blocs = {
    robot: blocAssistee(l.nom, adresse, false),
    ordinateur: `<ol><li>Téléchargez le robot Stabl pour Windows sur l’ordinateur où ${esc(l.nom)} est installé.</li><li>Il repère tout seul les exports et le dossier de données, et n’en lit qu’une copie.</li><li>Il prépare le paquet Stabl et le rapport, puis vous les déposez ici.</li></ol><p class="fine">Version Windows signée bientôt disponible. En attendant, utilisez l’export de fichier.</p>`,
    codes: (() => {
      const actif = robotEnLigne() || SERVEUR_MIGRATION, off = actif ? '' : 'disabled';
      return `<p>Confiez-nous l’accès : le robot Stabl se connecte à ${esc(l.nom)} à votre place, copie tout en lecture seule, puis efface vos identifiants.</p>
      ${actif ? '' : '<p class="bientot">Bientôt disponible. Rien n’est envoyé depuis cette page pour l’instant.</p>'}
      <form id="codes" class="codes" autocomplete="off" data-adresse="${esc(adresse || '')}" data-nom="${esc(l.nom)}"><input name="identifiant" placeholder="Identifiant ${esc(l.nom)}" required ${off}><input name="motDePasse" type="password" placeholder="Mot de passe" required ${off}>
      <label class="plein"><input type="checkbox" name="consentement" required ${off}> J’autorise Stabl à se connecter à mon compte ${esc(l.nom)} pour copier mes données, une seule fois.</label>
      <p class="fine plein">Double authentification (code par SMS ou application) : le robot vous demandera le code ici même, au bon moment.</p>
      <button class="bouton second plein" ${off}>Lancer la copie</button><p class="fine plein" id="codes-sortie">Envoyé par connexion sécurisée, chiffré sur nos serveurs, effacé dès la connexion faite.</p></form><div id="codes-robot"></div>`;
    })(),
    export: `<ol>${l.voies[0].etapes.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` +
      (l.famille === 'equestre' ? `<p class="astuce">Ajoutez aussi la liste des licenciés exportée de FFE Club SIF : Stabl rapproche les licences et complète les fiches.</p>` : '') +
      (!l.confirme ? `<p class="fine">Les noms de menus peuvent varier selon votre version : déposez ce que vous avez, Stabl reconnaît les colonnes tout seul.</p>` : ''),
  };
  return `<div class="modes">${['robot', 'ordinateur', 'codes', 'export'].filter(m => l.modes.includes(m)).map((m, i) => carteMode(m, blocs[m], i)).join('')}</div>`;
}
function dessinerRecuperation() {
  const l = rep.principal && LOGICIELS[rep.principal];
  const plan = planDeBascule(rep);
  if (l) { $('#guide-titre').textContent = `Récupérer vos données de ${l.nom}`; $('#guide').innerHTML = cartesModes(l); }
  else if (rep.adresse && rep.depart !== 'zero') { $('#guide-titre').textContent = 'Récupérer vos données'; $('#guide').innerHTML = `<div class="modes">${carteMode('robot', blocAssistee('votre logiciel', rep.adresse, true), 0)}${carteMode('export', `<ol>${EXPORT_GENERIQUE.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`, 1)}</div>`; }
  else { $('#guide-titre').textContent = plan.recuperer.length ? 'Récupérer vos autres outils' : 'Rien à récupérer'; $('#guide').innerHTML = plan.recuperer.length ? '' : '<p class="bravo">Vous partez de zéro : il n’y a rien à reprendre. Vous pouvez tout de même déposer un fichier si vous en avez un.</p>'; }
  const autres = plan.recuperer.filter(x => !x.principal && x.id);
  $('#autres').innerHTML = autres.length ? `<div class="bloc"><h3>Et vos autres outils</h3><p class="sous">Un export suffit pour chacun ; déposez-les avec le reste.</p>${autres.map(x => `<details class="voie"><summary>${esc(x.nom)} : ${esc(x.quoi)}</summary><ol>${LOGICIELS[x.id].voies[0].etapes.map(e => `<li>${esc(e)}</li>`).join('')}</ol></details>`).join('')}</div>` : '';
  const aResilier = integre ? plan.resilier : [];
  $('#resil-integre').innerHTML = aResilier.length ? `<div class="bloc col c-res" style="--i:0"><h3><i>✕</i>À résilier ensuite</h3><p>Une fois la reprise vérifiée, la lettre est prête.</p><ul>${aResilier.map(itemResil).join('')}</ul></div>` : '';
  $('#importer-zone').hidden = !integre; $('#envoi-details').hidden = integre;
}
document.addEventListener('click', async e => {
  const b = e.target.closest('#ouvrir-robot'); if (!b) return;
  const robot = globalThis.PiaffeRobot;
  if (robot?.ouvrir) { b.disabled = true; try { await robot.ouvrir(b.dataset.adresse, { nom: b.dataset.nom }); } finally { b.disabled = false; } }
  else $('#robot-info').textContent = 'Bientôt disponible. En attendant, utilisez l’export de fichier ci-dessous.';
});
window.addEventListener('piaffe:capture', async e => {
  if (!e.detail?.fichier) return;
  const avant = etat.tables.length;
  await ajouter([e.detail.fichier]);
  // Job déjà ouvert en simulation par le robot : réutilisable tant qu'aucun autre fichier n'a été ajouté.
  etat.jobRobot = e.detail.job?.job_id && e.detail.job.confirmer ? { ...e.detail.job, tables: etat.tables.length, seul: avant === 0 } : null;
});
const jobRobotUtilisable = () => etat.jobRobot?.seul && etat.jobRobot.tables === etat.tables.length;
async function confirmerJobRobot() {
  const { chemin, corps } = etat.jobRobot.confirmer;
  if (!/^\/api\/v1\/import\/jobs\/[\w-]+\/commit$/.test(chemin)) throw new Error('Confirmation inattendue.');
  const r = await fetch(location.origin + chemin, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json', 'x-requested-with': 'piaffe' }, body: JSON.stringify(corps || { dry_run: false }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error?.message || `Le serveur a répondu ${r.status}.`);
  return { job_id: etat.jobRobot.job_id, ...j };
}
document.addEventListener('submit', async e => {
  if (e.target.id !== 'codes') return;
  e.preventDefault();
  const f = new FormData(e.target), s = $('#codes-sortie');
  const acces = { identifiant: String(f.get('identifiant') || ''), mot_de_passe: String(f.get('motDePasse') || '') };
  if (!f.get('consentement')) { s.textContent = 'Cochez la case pour autoriser la connexion.'; return; }
  e.target.reset();
  if (robotEnLigne()) {
    // Le robot en ligne se connecte tout de suite ; l'écran s'affiche juste en dessous, le code de vérification y sera demandé.
    s.textContent = 'Connexion en cours…';
    await globalThis.PiaffeRobot.ouvrir(e.target.dataset.adresse || rep.adresse, { nom: e.target.dataset.nom, acces, cible: $('#codes-robot') });
    s.textContent = 'Vos identifiants ont été effacés. Pensez à changer votre mot de passe dans votre ancien logiciel.';
    return;
  }
  try {
    const r = await envoyerAcces(SERVEUR_MIGRATION, { logiciel: rep.principal, adresse: rep.adresse, identifiant: acces.identifiant, motDePasse: acces.mot_de_passe, doubleAuth: true });
    s.textContent = 'Reçu et chiffré. Nous vous prévenons dès que la migration est prête (' + (r.statut || 'en attente') + ').';
  } catch (err) { s.textContent = err.code === 'indisponible' ? 'Bientôt disponible : rien n’a été envoyé.' : 'Échec : ' + err.message; }
});

// Lettre de résiliation
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
$('#dl-lettre').addEventListener('click', () => telecharger('lettre-resiliation-' + cleRecherche($('#r-logiciel').value || 'logiciel').replace(/[^a-z0-9]+/g, '-') + '.txt', $('#lettre').value, 'text/plain'));

// Fin du parcours intégré : on prévient l'appli (iframe) ou on y retourne.
function signaler(etatFin, job_id = null, controle = null) {
  if (window.parent !== window) {
    try { window.parent.postMessage({ type: 'piaffe-migration', etat: etatFin, job_id, controle }, location.origin); } catch {}
    return;
  }
  const retour = params.get('retour'); if (!retour) return;
  try {
    const u = new URL(retour, location.href);
    if (u.origin !== location.origin) return;           // pas de redirection vers un autre site
    u.searchParams.set('migration', etatFin); if (job_id) u.searchParams.set('job', job_id);
    location.href = u.href;
  } catch {}
}
$('#importer').addEventListener('click', async () => {
  const s = $('#importer-sortie'), b = $('#importer'); b.disabled = true; s.textContent = 'Essai en cours…';
  try {
    const r = jobRobotUtilisable() ? (s.textContent += '\nLe robot a déjà fait l’essai (' + etat.jobRobot.job_id + ').', etat.jobRobot)
      : await envoyer(etat.paquet, { essai: true, journal: m => { s.textContent += '\n' + m; } });
    s.textContent += '\nEssai réussi : rien n’a encore été enregistré. Vérifiez les chiffres, puis confirmez.';
    $('#confirmer').hidden = false; b.hidden = true; etat.essai = r;
  } catch (err) { s.textContent += '\nÉchec : ' + err.message; b.disabled = false; }
});
$('#confirmer').addEventListener('click', async () => {
  const s = $('#importer-sortie'), b = $('#confirmer'); b.disabled = true; s.textContent = 'Import en cours…';
  try {
    const r = jobRobotUtilisable() ? await confirmerJobRobot()
      : await envoyer(etat.paquet, { essai: false, journal: m => { s.textContent += '\n' + m; } });
    s.textContent += '\nC’est fait : vos données sont dans Stabl.';
    signaler('termine', r.job_id, etat.paquet.controle);
  } catch (err) { s.textContent += '\nÉchec : ' + err.message; b.disabled = false; }
});

aller(ici);

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
        if (rep.principal && LOGICIELS[rep.principal]?.famille === 'equestre' && !/ffe|sif|licenci/i.test(f.name)) t.logiciel = rep.principal;
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
