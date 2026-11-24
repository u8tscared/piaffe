// Rapport de migration lisible par le gérant : ce qui a été repris, ce qu'il faut vérifier.
import { TYPES } from './champs.mjs';
import { LOGICIELS } from './logiciels.mjs';

const eur = n => (n ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function resumeTexte(p) {
  const c = p.controle;
  const l = [
    `Paquet Piaffe prêt (${p.sources.length} tableaux lus).`,
    `  ${c.cavaliers} cavaliers, ${c.responsables} responsables, ${c.foyers} familles (${c.fiches_fusionnees} fiches fusionnées entre fichiers)`,
    `  ${c.chevaux} chevaux dont ${c.chevaux_proprietaires} de propriétaires, ${c.soins} soins`,
    `  ${c.prestations} forfaits et tarifs, ${c.reprises} reprises au planning`,
    `  ${c.factures} factures pour ${eur(c.chiffre_factures_ttc)}, dont ${eur(c.impayes_factures_ttc)} restant à encaisser`,
  ];
  const n = { erreur: 0, attention: 0, info: 0 };
  for (const a of p.avertissements) n[a.niveau]++;
  l.push(`  À vérifier : ${n.attention} points importants, ${n.info} remarques.`);
  return l.join('\n');
}

export function rapportHTML(p) {
  const c = p.controle;
  const tuiles = [
    ['Cavaliers', c.cavaliers, `${c.foyers} familles reliées`, 'rd'],
    ['Chevaux', c.chevaux, `${c.chevaux_proprietaires} de propriétaires`, 'hz'],
    ['Factures', c.factures, eur(c.chiffre_factures_ttc), 'mo'],
    ['Reste à encaisser', eur(c.impayes_factures_ttc), 'à comparer avec l’ancien logiciel', 'cr'],
    ['Forfaits et tarifs', c.prestations, `${c.reprises} reprises au planning`, 'tm'],
  ];
  const groupe = { attention: [], info: [], erreur: [] };
  for (const a of p.avertissements) groupe[a.niveau].push(a);
  const ligneAv = a => `<li><span>${esc(a.message)}</span>${a.fichier ? `<small>${esc(a.fichier)}${a.ligne ? ', ligne ' + a.ligne : ''}</small>` : ''}</li>`;
  const sources = p.sources.map(s => `<tr><td><b>${esc(s.fichier)}</b>${s.feuille ? ` › ${esc(s.feuille)}` : ''}<br><small>${s.logiciel ? esc(LOGICIELS[s.logiciel]?.nom || s.logiciel) + ' · ' : ''}${s.lignes} lignes</small></td>
    <td>${s.type ? esc(TYPES[s.type].libelle) : '<em>non reconnu</em>'}</td>
    <td>${Object.entries(s.colonnes).map(([e, ch]) => `<span class="tag">${esc(e)} → ${esc(ch)}</span>`).join(' ')}${s.ignorees.length ? `<br><small>Non reprises : ${s.ignorees.map(esc).join(', ')}</small>` : ''}</td></tr>`).join('');
  const personnes = p.personnes.filter(x => x.roles.includes('cavalier')).slice(0, 400).map(x => {
    const resp = x.responsables.map(r => p.personnes.find(y => y.ref === r)).filter(Boolean).map(y => `${y.prenom || ''} ${y.nom}`).join(', ');
    return `<tr><td>${esc(x.prenom)} ${esc(x.nom)}</td><td>${x.naissance ? x.naissance.split('-').reverse().join('/') : '—'}</td><td>${esc(x.licence?.numero || '—')}${x.licence?.annee ? ' · ' + x.licence.annee : ''}</td><td>${x.galop ?? '—'}</td><td>${esc(x.email || '—')}</td><td>${esc(resp || '—')}</td><td>${x.foyer || ''}</td></tr>`;
  }).join('');
  const chevaux = p.chevaux.map(x => {
    const pr = x.proprietaire ? p.personnes.find(y => y.ref === x.proprietaire) : null;
    return `<tr><td>${esc(x.nom)}</td><td>${esc(x.sire || x.ueln || '—')}</td><td>${esc(x.race || '—')}</td><td>${x.naissance || '—'}</td><td>${esc({ club: 'Club', proprietaire: 'Propriétaire', demi_pension: 'Demi-pension' }[x.type] || x.type)}</td><td>${pr ? esc((pr.prenom || '') + ' ' + pr.nom) : '—'}</td></tr>`;
  }).join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rapport de migration</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--ink:#0a1636;--mut:#59627c;--line:#e6e9f0;--bg:#f2f4f8;--acc:#2448d8;--hz-bg:#dcf3e4;--hz-ink:#0d5532;--rd-bg:#ece5ff;--rd-ink:#43249f;--mo-bg:#ffedcf;--mo-ink:#773f00;--tm-bg:#dbebff;--tm-ink:#0b448d;--cr-bg:#ffe3de;--cr-ink:#972414}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 Inter,system-ui,sans-serif}
main{max-width:1120px;margin:0 auto;padding:32px 16px 64px}h1,h2,.big{font-family:'Bricolage Grotesque',Inter,sans-serif;font-weight:800;letter-spacing:-.02em}
h1{font-size:34px;margin:0 0 4px}h2{font-size:22px;margin:36px 0 12px}.sub{color:var(--mut);margin:0 0 24px}
.tuiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}
.t{border-radius:20px;padding:18px;animation:mont .5s cubic-bezier(.2,.8,.2,1) both}.t:nth-child(2){animation-delay:.06s}.t:nth-child(3){animation-delay:.12s}.t:nth-child(4){animation-delay:.18s}.t:nth-child(5){animation-delay:.24s}
.t .big{font-size:34px;line-height:1.1;margin:6px 0 2px}.t small{opacity:.85}
@keyframes mont{from{opacity:0;transform:translateY(10px)}}
@media (prefers-reduced-motion:reduce){.t{animation:none}}
.rd{background:var(--rd-bg);color:var(--rd-ink)}.hz{background:var(--hz-bg);color:var(--hz-ink)}.mo{background:var(--mo-bg);color:var(--mo-ink)}.tm{background:var(--tm-bg);color:var(--tm-ink)}.cr{background:var(--cr-bg);color:var(--cr-ink)}
.carte{background:#fff;border:1px solid var(--line);border-radius:20px;padding:4px 0;overflow:auto}
table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--mut);font-weight:600;font-size:13px}tr:last-child td{border:0}
small{color:var(--mut);font-size:13px}.tag{display:inline-block;background:var(--bg);border-radius:8px;padding:2px 8px;margin:2px 0;font-size:13px}
ul.av{list-style:none;margin:0;padding:0}ul.av li{background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px 14px;margin:0 0 8px;display:flex;flex-direction:column;gap:2px}
ul.av.attention li{border-left:4px solid #a85d00}
.ctrl{background:#0a1636;color:#fff;border-radius:20px;padding:20px 22px}.ctrl b{font-family:'Bricolage Grotesque',Inter,sans-serif;font-weight:800}
details summary{cursor:pointer;font-weight:600;margin:8px 0}
</style></head><body><main>
<h1>Rapport de migration</h1>
<p class="sub">Préparé par la passerelle Piaffe le ${new Date(p.genere_le).toLocaleString('fr-FR')}. Tout a été lu sur votre ordinateur ; vos fichiers d’origine n’ont pas été modifiés.</p>
<div class="tuiles">${tuiles.map(([t, v, s, k]) => `<div class="t ${k}"><div>${t}</div><div class="big">${v}</div><small>${s}</small></div>`).join('')}</div>
<h2>Les trois chiffres à comparer avec votre ancien logiciel</h2>
<div class="ctrl">Ouvrez votre ancien logiciel à côté et vérifiez : <b>${c.cavaliers}</b> cavaliers actifs, <b>${c.chevaux}</b> chevaux, <b>${eur(c.impayes_factures_ttc)}</b> restant dû sur les factures${c.soldes_negatifs_fiches ? ` (les fiches adhérents indiquent ${eur(-c.soldes_negatifs_fiches)} de soldes débiteurs)` : ''}. S’ils sont identiques, la reprise est complète.</div>
<h2>À vérifier avant d’importer (${groupe.attention.length})</h2>
${groupe.attention.length ? `<ul class="av attention">${groupe.attention.map(ligneAv).join('')}</ul>` : '<p>Rien de bloquant.</p>'}
${groupe.info.length ? `<details><summary>Remarques (${groupe.info.length})</summary><ul class="av">${groupe.info.map(ligneAv).join('')}</ul></details>` : ''}
<h2>Fichiers lus</h2><div class="carte"><table><tr><th>Fichier</th><th>Contenu reconnu</th><th>Colonnes reprises</th></tr>${sources}</table></div>
<h2>Cavaliers (${c.cavaliers})</h2><div class="carte"><table><tr><th>Cavalier</th><th>Naissance</th><th>Licence</th><th>Galop</th><th>E-mail</th><th>Responsable</th><th>Famille</th></tr>${personnes}</table></div>
<h2>Chevaux (${c.chevaux})</h2><div class="carte"><table><tr><th>Nom</th><th>SIRE</th><th>Race</th><th>Né en</th><th>Statut</th><th>Propriétaire</th></tr>${chevaux}</table></div>
</main></body></html>`;
}
