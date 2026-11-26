// node migration/test/tests.mjs : contrôle de bout en bout sur les fichiers d'exemple.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import { lireFichier } from '../core/lire.mjs';
import { construirePaquet } from '../core/paquet.mjs';
import { versLots } from '../core/vers-api.mjs';
import * as V from '../core/valeurs.mjs';
import { lireCSV } from '../core/csv.mjs';
import { planDeBascule, decisionRecommandee, decisionsPossibles } from '../core/parcours.mjs';

const ici = path.dirname(new URL(import.meta.url).pathname);
const inflate = async b => new Uint8Array(zlib.inflateRawSync(b));
let n = 0; const t = (nom, f) => { f(); n++; };

// Valeurs
t('dates', () => { assert.equal(V.date('14/03/2012'), '2012-03-14'); assert.equal(V.date('2012-03-14'), '2012-03-14'); assert.equal(V.date('5/1/88'), '1988-01-05'); assert.equal(V.date('45000'), '2023-03-15'); assert.equal(V.date('31/02/x'), null); });
t('téléphones', () => { assert.equal(V.telephone('06 12 34 56 78'), '+33612345678'); assert.equal(V.telephone('612345678'), '+33612345678'); assert.equal(V.telephone('+33 6 12 34 56 78'), '+33612345678'); assert.equal(V.telephone('12'), null); });
t('montants', () => { assert.equal(V.montant('1 390,00 €'), 1390); assert.equal(V.montant('-195,00'), -195); assert.equal(V.montant('1,390.50'), 1390.5); assert.equal(V.montant('(38,00)'), -38); });
t('noms', () => { assert.deepEqual(V.separerNom('MARTIN Léa'), { nom: 'MARTIN', prenom: 'Léa' }); assert.deepEqual(V.separerNom('Martin, Léa'), { nom: 'Martin', prenom: 'Léa' }); assert.equal(V.joliNom('ULYSSE DE LA ROCHE'), 'Ulysse de la Roche'); assert.equal(V.joliNom('LE GOFF'), 'Le Goff'); });
t('csv guillemets', () => { const r = lireCSV('a;b\n"x;y";"il dit ""oui"""\n'); assert.equal(r.lignes[1][0], 'x;y'); assert.equal(r.lignes[1][1], 'il dit "oui"'); });
t('moyens', () => { assert.equal(V.moyen('Prélèvement'), 'prelevement'); assert.equal(V.moyen('Chèques vacances'), 'cheque_vacances'); assert.equal(V.moyen('CB'), 'carte'); });

// De bout en bout
const tables = [];
for (const f of fs.readdirSync(path.join(ici, '../fixtures'))) tables.push(...await lireFichier(f, fs.readFileSync(path.join(ici, '../fixtures', f)), { inflate }));
const p = construirePaquet(tables, { aujourdhui: '2026-11-24' });
t('types reconnus', () => { for (const s of p.sources) assert.ok(s.type, s.fichier + ' non reconnu'); });
t('accents Windows-1252', () => assert.ok(p.personnes.some(x => x.prenom === 'Chloé')));
t('fusion Kavalog + FFE', () => { const lea = p.personnes.filter(x => x.prenom === 'Léa'); assert.equal(lea.length, 1); assert.equal(lea[0].licence.type, 'Pratiquant'); assert.equal(lea[0].galop, 4); });
t('famille Martin', () => { const m = p.personnes.filter(x => x.nom === 'Martin'); assert.equal(m.length, 3); assert.equal(new Set(m.map(x => x.foyer)).size, 1); });
t('propriétaire relié', () => { const u = p.chevaux.find(c => c.nom === 'Ulysse de la Roche'); const o = p.personnes.find(x => x.ref === u.proprietaire); assert.equal(o.prenom, 'Chloé'); });
t('factures', () => { assert.equal(p.factures.length, 5); assert.equal(p.controle.impayes_factures_ttc, 673); assert.equal(p.factures.find(f => f.numero === 'FA2026-0412').lignes.length, 2); assert.equal(p.factures.find(f => f.numero.startsWith('AV')).statut, 'avoir'); });
t('facture au payeur', () => { const f = p.factures.find(f => f.numero === 'FA2026-0412'); assert.equal(p.personnes.find(x => x.ref === f.client).prenom, 'Sophie'); });
t('reprises', () => { const r = p.reprises.find(x => x.libelle === 'Galop 3-4'); assert.equal(r.jour, 3); assert.equal(r.inscrits.length, 3); assert.equal(r.duree_min, 60); });
t('excel dates', () => assert.equal(p.soins.find(s => s.type === 'vaccin').prochain, '2027-04-02'));
t('avertissements', () => { const c = p.avertissements.map(a => a.code); for (const k of ['email_invalide', 'mineur_sans_contact', 'soin_cheval_inconnu', 'cheval_sans_sire']) assert.ok(c.includes(k), k); });
t('lots API stables', () => {
  const a = versLots(p, '2026-11-24'), b = versLots(construirePaquet([...tables].reverse(), { aujourdhui: '2026-11-24' }), '2026-11-24');
  const ids = l => l.flatMap(x => x.items.map(i => x.coll + i.external_id)).sort();
  assert.deepEqual(ids(a.map(x => ({ ...x, items: x.items.map(i => ({ ...i, coll: x.coll })) }))), ids(b.map(x => ({ ...x, items: x.items.map(i => ({ ...i, coll: x.coll })) }))));
  const refs = JSON.stringify(a).match(/"ext:[^"]+"/g).map(s => s.slice(5, -1));
  const connus = new Set(a.flatMap(x => x.items.map(i => i.external_id)));
  for (const r of refs) assert.ok(connus.has(r), 'référence orpheline ' + r);
});
// Parcours : plan de bascule
t('plan : Pennylane cochée est branchée, pas résiliée', () => {
  const pl = planDeBascule({ depart: 'oui', principal: 'kavalog', outils: ['pennylane'] });
  assert.ok(pl.brancher.some(x => x.id === 'pennylane')); assert.ok(!pl.resilier.some(x => x.id === 'pennylane')); assert.ok(!pl.recuperer.some(x => x.id === 'pennylane'));
});
t('plan : Kavalog + Google Agenda changé sont récupérés et résiliés', () => {
  const pl = planDeBascule({ depart: 'oui', principal: 'kavalog', outils: ['google-agenda'], choix: { 'google-agenda': 'changer' } });
  for (const id of ['kavalog', 'google-agenda']) { assert.ok(pl.recuperer.some(x => x.id === id), id); assert.ok(pl.resilier.some(x => x.id === id), id); }
  assert.equal(pl.brancher.length, 0);
});
t('choix recommandés et interdits', () => {
  assert.equal(decisionRecommandee('sumup'), 'integrer'); assert.equal(decisionRecommandee('ffe'), 'integrer'); assert.equal(decisionRecommandee('calendly'), 'changer');
  assert.equal(decisionRecommandee('helloasso'), 'integrer'); assert.deepEqual(decisionsPossibles('helloasso'), ['changer', 'integrer']);
  for (const id of ['ffe', 'sire', 'payfit', 'silae', 'pennylane']) assert.ok(!decisionsPossibles(id).includes('changer'), id);
});
console.log(`${n} contrôles réussis.`);

// Agenda .ics et capture du robot navigateur
{
  const ics = await lireFichier('agenda.ics', fs.readFileSync(path.join(ici, '../essais/agenda.ics')), { inflate });
  const cap = await lireFichier('capture-piaffe.json', fs.readFileSync(path.join(ici, '../essais/exemple-capture-robot.json')), { inflate });
  const q = construirePaquet([...ics, ...cap], { aujourdhui: '2026-11-24' });
  t('ics', () => { const r = q.reprises.find(x => x.libelle === 'Galop 5-6'); assert.equal(r.jour, 3); assert.equal(r.debut, '18:00'); assert.equal(r.duree_min, 60); });
  t('capture robot', () => { assert.equal(q.controle.cavaliers, 62); assert.equal(q.controle.chevaux, 12); assert.equal(q.controle.factures, 34); assert.ok(q.personnes.find(p => p.adresse?.ville)); });
  t('homonymes non fusionnés', () => assert.equal(q.personnes.filter(p => p.prenom === 'Léa' && p.nom === 'Martin').length, 2));
  console.log(`${n} contrôles réussis (avec agenda et robot).`);
}

// FEC, HelloAsso, catalogue, robot sans recette (garde-fous, classement des listes, recettes propres)
{
  const { tablesDesJeux, classerJeu } = await import('../robot/jeux.mjs');
  const G = await import('../robot/garde-fous.mjs');
  const { nettoyerRecette, valeursDuClub } = await import('../robot/recettes.mjs');
  const { scriptRobot } = await import('../robot/ecoute.mjs');
  const { LOGICIELS } = await import('../core/logiciels.mjs');
  const fec = await lireFichier('fec-exemple.txt', fs.readFileSync(path.join(ici, '../essais/fec-exemple.txt')), { inflate });
  const qf = construirePaquet(fec, { aujourdhui: '2026-11-24' });
  t('FEC : résumé comptable', () => {
    const c = qf.comptabilite; assert.equal(c.format, 'fec'); assert.equal(c.equilibre, true); assert.ok(c.journaux.some(j => j.code === 'VT'));
    assert.ok(c.chiffre_affaires_ht > 1000); assert.ok(c.tva.collectee > 0 && c.tva.deductible > 0);
  });
  t('FEC : clients, factures lettrées, règlements, fournisseurs', () => {
    assert.equal(qf.factures.length, 2); assert.ok(qf.factures.some(f => f.reste === 0)); assert.ok(qf.factures.some(f => f.reste > 0));
    assert.equal(qf.reglements.length, 1); assert.equal(qf.fournisseurs.length, 1); assert.ok(qf.personnes.some(p => /martin/i.test(p.nom)));
  });
  const ha = await lireFichier('helloasso-adhesions.csv', fs.readFileSync(path.join(ici, '../essais/helloasso-adhesions.csv')), { inflate });
  const qh = construirePaquet(ha, { aujourdhui: '2026-11-24' });
  t('HelloAsso : adhérents, payeur parent, paiements validés seulement', () => {
    assert.ok(qh.sources.every(s => s.logiciel === 'helloasso'));
    assert.equal(qh.controle.encaisse_ttc, 235); assert.ok(qh.personnes.some(p => p.prenom === 'Zoé')); assert.ok(qh.personnes.some(p => p.prenom === 'Claire'));
  });
  t('catalogue : 60 logiciels au moins, Pennylane / SumUp / FFE jamais remplacés', () => {
    assert.ok(Object.keys(LOGICIELS).length >= 60);
    for (const id of ['kavalog', 'equimondo', 'isibox', 'pegase', 'horsemanager', 'clubeo', 'helloasso', 'pennylane', 'tiime', 'indy', 'quickbooks', 'sage', 'ebp', 'cegid', 'dougs', 'fec']) assert.ok(LOGICIELS[id], id);
    for (const id of ['pennylane', 'sumup', 'ffe']) assert.ok(!decisionsPossibles(id).includes('changer'), id);
  });
  t('robot : listes JSON classées dans le monde équestre', () => {
    const j = (key, fields, label = '') => ({ key, fields, label, rows: [Object.fromEntries(fields.map(f => [f, 'x']))], n: 1 });
    assert.equal(classerJeu(j('api:h/api/horses#items', ['name', 'breed', 'sire number'])).genre, 'chevaux');
    assert.equal(classerJeu(j('api:h/api/riders#data', ['first name', 'last name', 'galop'])).genre, 'cavaliers');
    assert.equal(classerJeu(j('api:h/api/invoices#', ['number', 'total', 'due date'])).genre, 'factures');
    assert.equal(classerJeu(j('api:h/api/care-events#', ['horse name', 'type', 'next date'])).genre, 'soins');
    assert.equal(classerJeu(j('api:h/api/ledger/entries#', ['journal', 'account', 'debit', 'credit'])).genre, 'comptabilite');
    assert.equal(classerJeu(j('api:h/api/stock#', ['article', 'quantity', 'unit'])).genre, 'stocks');
  });
  t('robot : écritures lues en JSON -> même lecture que le FEC', () => {
    const rows = [{ journal: 'VT', 'entry number': '1', date: '2026-09-05', account: '411000', 'aux label': 'MARTIN Léa', debit: 120, credit: 0 }, { journal: 'VT', 'entry number': '1', date: '2026-09-05', account: '706000', debit: 0, credit: 120 }];
    const r = tablesDesJeux([{ key: 'api:h/api/ledger/entries#', fields: Object.keys(rows[0]), rows, n: 2 }], 'essai');
    assert.equal(r.comptabilite.equilibre, true); assert.equal(r.comptabilite.chiffre_affaires_ht, 120);
  });
  t('garde-fous : décidés par le code', () => {
    const s = new G.Sites('https://app.logiciel.fr/accueil');
    for (const x of ['Supprimer', 'Déconnexion', 'Ajouter un cavalier', 'Payer maintenant', 'Envoyer la facture', 'Vider la corbeille', 'Annuler la réservation']) assert.ok(G.interdit(x), x);
    for (const x of ['Cavaliers', 'Rechercher', 'Page suivante', 'Factures', 'Paiements', 'Abonnements']) assert.ok(!G.interdit(x), x);
    assert.ok(!G.clicPermis({ quoi: 'Facebook', href: 'https://facebook.com/x' }, s));
    assert.ok(!G.clicPermis({ quoi: 'Valider', post: true }, s)); assert.ok(G.clicPermis({ quoi: 'Rechercher', post: true }, s));
    assert.ok(!G.adressePermise('https://app.logiciel.fr/cavaliers/12/edit', s)); assert.ok(!G.adressePermise('https://autre.fr/', s)); assert.ok(G.adressePermise('https://app.logiciel.fr/cavaliers?page=2', s));
    assert.ok(!G.filtresPermis([{ n: 'token', v: 'x' }])); assert.ok(G.filtresPermis([{ n: 'from', v: '2025-01-01' }]));
    const d = G.ecartDate('2026-12-01', new Date('2026-11-26T10:00:00Z')); assert.equal(d.ecart, 5); assert.equal(G.dateDe(d, new Date('2027-01-01T00:00:00Z')), '2027-01-06');
  });
  t('recette : aucune donnée du club', () => {
    const jeux = [{ rows: [{ nom: 'DURAND', prenom: 'Alice', email: 'alice@exemple.fr' }] }];
    const r = nettoyerRecette({ origine: 'https://app.logiciel.fr/accueil', script: [{ a: 'clic', t: 'Cavaliers', h: '/cavaliers' }, { a: 'clic', t: 'DURAND' }, { a: 'champ', t: 'Recherche', v: 'Alice' }, { a: 'champ', t: 'Du', v: '2026-01-01' }, { a: 'aller', url: '/cavaliers/123456789/fiche?jeton=abc' }, { a: 'clic', t: 'Supprimer' }], etapes: [{ chemin: '/cavaliers?page=2', titre: 'Cavaliers', signature: 'nom|prénom' }], genres: ['cavaliers', 'inconnu'] }, { valeursClub: valeursDuClub(jeux) });
    const txt = JSON.stringify(r);
    for (const x of ['DURAND', 'Alice', 'alice@', '123456789', 'jeton', 'Supprimer', 'inconnu']) assert.ok(!txt.includes(x), x);
    assert.deepEqual(r.script.map(s => s.a), ['clic', 'champ']); assert.equal(r.script[1].d.f, 'iso'); assert.equal(r.etapes[0].chemin, '/cavaliers');
  });
  t('robot de la page : autonome et injectable', () => { const s = scriptRobot({ historiqueJours: 99999 }); assert.ok(s.includes('__stablMxHist=3650')); assert.ok(s.includes('var __name')); new Function(s); });
  console.log(`${n} contrôles réussis (avec FEC, HelloAsso et robot sans recette).`);
}
