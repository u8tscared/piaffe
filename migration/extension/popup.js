const $ = s => document.querySelector(s);
const CONNUS = { 'kavalog': 'Kavalog', 'equimondo': 'Equimondo', 'cavasoft': 'Cavasoft', 'gecurie': 'Gecurie', 'hoofplanner': 'HoofPlanner', 'cavalio': 'Cavalio', 'ffe.com': 'FFE Club SIF', 'helloasso': 'HelloAsso', 'assoconnect': 'AssoConnect' };

// L'onglet visé : celui d'où la fenêtre a été ouverte (ou ?onglet=ID pour les essais).
const param = new URLSearchParams(location.search).get('onglet');
const [onglet] = param ? [await chrome.tabs.get(+param)] : await chrome.tabs.query({ active: true, lastFocusedWindow: true });
const origine = onglet?.url?.startsWith('http') ? new URL(onglet.url).origin : null;
const adresse = new URLSearchParams(location.search).get('adresse');
if (adresse) $('#adresse').value = adresse;

if (origine) {
  const nom = Object.entries(CONNUS).find(([k]) => origine.includes(k))?.[1];
  $('#nom').textContent = nom || 'Logiciel non répertorié';
  $('#ini').textContent = (nom || new URL(origine).hostname.replace(/^www\./, ''))[0].toUpperCase();
  $('#origine').textContent = origine;
  if (!nom) { $('#alerte').hidden = false; $('#alerte').textContent = 'Pas encore dans notre liste : le robot va explorer le logiciel tout seul, en lecture seule.'; }
} else {
  $('#nom').textContent = 'Ouvrez votre ancien logiciel'; $('#origine').textContent = 'Allez sur sa page, connectez-vous, puis rouvrez Stabl.';
  $('#actions').hidden = true;
}

// Le robot a besoin d'accéder à ce site pour passer de page en page : on le demande une fois, pour ce site seulement.
async function autoriser() {
  if (!origine) return false;
  const o = { origins: [origine + '/*'] };
  return (await chrome.permissions.contains(o)) || chrome.permissions.request(o);
}
const envoyer = m => chrome.runtime.sendMessage({ tabId: onglet.id, ...m });

$('#explorer').onclick = async () => { if (await autoriser()) envoyer({ action: 'explorer', fiches: $('#fiches').checked }); };
$('#copier').onclick = async () => { if (await autoriser()) envoyer({ action: 'copier' }); };
$('#rejouer').onclick = async () => { if (await autoriser()) envoyer({ action: 'rejouer' }); };
$('#arreter').onclick = () => envoyer({ action: 'arreter' });
$('#vider').onclick = () => envoyer({ action: 'vider' });
$('#ouvrir').onclick = async () => {
  const u = $('#adresse').value.trim(); if (!/^https?:\/\//.test(u)) return;
  await chrome.tabs.create({ url: u }); window.close();
};

$('#telecharger').onclick = async () => {
  const { etat, recettes = {} } = await chrome.storage.local.get(['etat', 'recettes']);
  const capture = {
    format: 'piaffe-capture', version: '1.0', capture_le: new Date().toISOString(), origine: etat.origine, logiciel: $('#nom').textContent,
    tables: etat.tables.map(t => ({ titre: t.titre, url: t.url, entetes: t.entetes, lignes: t.lignes, pages: t.pages })),
    fiches: etat.fiches.map(f => ({ titre: f.titre, url: f.url, champs: f.champs })),
    recette: recettes[etat.origine] || null, incidents: etat.incidents,
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(capture)], { type: 'application/json' }));
  a.download = 'capture-piaffe.json'; a.click();
};

async function afficher() {
  const { etat, recettes = {} } = await chrome.storage.local.get(['etat', 'recettes']);
  $('#rejouer').hidden = !(origine && recettes[origine]);
  if (!etat) return;
  $('#encours').hidden = !etat.progression; $('#progtexte').textContent = etat.progression?.texte || '';
  document.querySelectorAll('#explorer,#copier,#rejouer').forEach(b => b.disabled = !!etat.progression);
  const lignes = etat.tables.reduce((a, t) => a + t.lignes.length, 0);
  $('#resultat').hidden = !etat.tables.length && !etat.fiches.length;
  $('#nbl').textContent = lignes; $('#nbt').textContent = etat.tables.length; $('#nbf').textContent = etat.fiches.length;
  $('#tables').innerHTML = '';
  for (const t of etat.tables) { const li = document.createElement('li'); const s = document.createElement('span'); s.textContent = t.titre || t.url; const b = document.createElement('b'); b.textContent = t.lignes.length; li.append(s, b); $('#tables').append(li); }
  $('#journal').textContent = etat.journal.slice(-8).join('\n');
}
chrome.storage.onChanged.addListener(afficher);
afficher();
