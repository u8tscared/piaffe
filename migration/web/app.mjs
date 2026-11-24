// Passerelle Piaffe dans le navigateur : rien n'est envoyé, tout est lu sur place.
import { lireFichier } from '../core/lire.mjs';
import { construirePaquet, analyserTable } from '../core/paquet.mjs';
import { TYPES } from '../core/champs.mjs';
import { LOGICIELS } from '../core/logiciels.mjs';
import { rapportHTML } from '../core/rapport.mjs';
import { envoyer } from '../core/vers-api.mjs';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const eur = n => (n ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const inflate = async b => new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());

const etat = { logiciel: null, tables: [], paquet: null };

// 1. D'où venez-vous ?
const ORDRE = ['kavalog', 'equimondo', 'cavasoft', 'gecurie', 'hoofplanner', 'ffe', 'tableur'];
$('#logiciels').innerHTML = ORDRE.map(id => `<button class="chip" data-l="${id}"><span class="pastille">${esc(LOGICIELS[id].nom[0])}</span>${esc(LOGICIELS[id].nom.replace(/ \(.*/, ''))}</button>`).join('');
$('#logiciels').addEventListener('click', e => {
  const b = e.target.closest('[data-l]'); if (!b) return;
  etat.logiciel = b.dataset.l;
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
  const l = LOGICIELS[etat.logiciel];
  $('#guide').innerHTML = l.voies.map(v => `<div class="voie"><h3>${esc(v.titre)}</h3><ol>${v.etapes.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>`).join('') +
    (etat.logiciel !== 'ffe' ? `<p class="astuce">Ajoutez aussi la liste des licenciés exportée de FFE Club SIF : Piaffe rapproche les licences et complète les fiches.</p>` : '') +
    (!l.confirme ? `<p class="astuce discret">Les noms de menus peuvent varier selon votre version. En cas de doute, déposez ce que vous avez : la passerelle reconnaît les colonnes toute seule.</p>` : '');
  $('#etape-guide').hidden = false; $('#etape-depot').hidden = false;
  $('#etape-guide').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

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
        if (etat.logiciel && etat.logiciel !== 'tableur' && !/ffe|sif|licenci/i.test(f.name)) t.logiciel = etat.logiciel;
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

function telecharger(nom, contenu, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([contenu], { type })); a.download = nom; a.click();
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
