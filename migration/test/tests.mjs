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
console.log(`${n} contrôles réussis.`);
