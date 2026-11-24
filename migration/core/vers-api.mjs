// Traduit un paquet piaffe-import 1.0 en lots pour l'API d'import du serveur Piaffe
// (POST /api/v1/import/jobs/:id/items {coll, items:[{external_id, data}]}, voir app/ARCHITECTURE.md).
// `data` suit la forme de demo/core/data.js ; les références s'écrivent "ext:<external_id>".
// Les external_id sont stables d'une passe à l'autre (licence, SIRE, numéro de facture…) pour que
// relancer la migration mette à jour au lieu de créer des doublons.
import { cle } from './texte.mjs';

const SEXE = { hongre: 'Hongre', jument: 'Jument', etalon: 'Étalon' };
const KIND = { club: 'club', proprietaire: 'proprietaire', demi_pension: 'demi' };
const SOIN = { vaccin: 'Vaccin', vermifuge: 'Vermifuge', marechal: 'Maréchal', dentiste: 'Dentiste', osteopathe: 'Ostéopathe', veterinaire: 'Vétérinaire', autre: 'Autre' };
const MOYEN = { carte: 'Carte bancaire', prelevement: 'Prélèvement SEPA', virement: 'Virement', cheque: 'Chèque', especes: 'Espèces', cheque_vacances: 'Chèques-vacances ANCV', coupon_sport: 'Coupon sport', pass_sport: "Pass'Sport", en_ligne: 'Paiement en ligne', autre: 'Autre' };
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function idPersonne(p) {
  if (p.licence?.numero) return 'lic:' + p.licence.numero;
  if (p.ids_source?.length) return 'src:' + cle(p.ids_source[0]).replace(/ /g, '-');
  return 'np:' + cle([p.nom, p.prenom, p.naissance].filter(Boolean).join(' ')).replace(/ /g, '-');
}
export function idCheval(c) { return c.sire ? 'sire:' + c.sire : c.ueln ? 'ueln:' + c.ueln : 'nom:' + cle(c.nom).replace(/ /g, '-'); }

export function versLots(paquet, aujourdhui = new Date().toISOString().slice(0, 10)) {
  const P = new Map(paquet.personnes.map(p => [p.ref, idPersonne(p)]));
  const C = new Map(paquet.chevaux.map(c => [c.ref, idCheval(c)]));
  const F = new Map(paquet.prestations.map(f => [f.ref, 'tarif:' + cle(f.libelle).replace(/ /g, '-')]));
  const ext = (m, ref) => ref && m.get(ref) ? 'ext:' + m.get(ref) : null;
  const an = +aujourdhui.slice(0, 4);
  const age = d => d ? an - +d.slice(0, 4) - (aujourdhui.slice(5) < d.slice(5) ? 1 : 0) : null;
  const equipe = new Set(paquet.equipe.map(e => e.personne));

  const members = paquet.personnes.filter(p => !(equipe.has(p.ref) && p.roles.length === 1)).map(p => {
    const ab = paquet.abonnements.find(a => a.personne === p.ref);
    return { external_id: P.get(p.ref), data: clean({
      first: p.prenom, last: p.nom, birth: p.naissance, age: age(p.naissance), minor: p.mineur, sex: p.sexe,
      email: p.email, phone: p.telephone, phone2: p.telephone2, address: p.adresse,
      galop: typeof p.galop === 'number' ? p.galop : null, lic: p.licence?.numero, licence: p.licence?.annee ? String(p.licence.annee) : (p.licence ? 'À renouveler' : null),
      licenceType: p.licence?.type, cert: p.certificat_medical ? true : null, certDate: /^\d{4}/.test(p.certificat_medical || '') ? p.certificat_medical : null,
      photo: p.droit_image, fam: p.foyer, guardians: p.responsables.map(r => ext(P, r)).filter(Boolean),
      roles: p.roles, forfait: ab ? ext(F, ab.prestation) : null, balance: p.solde ?? 0,
      since: p.inscription ? +p.inscription.slice(0, 4) : null, notes: p.notes,
    }) };
  });
  const horses = paquet.chevaux.map(c => ({ external_id: C.get(c.ref), data: clean({
    name: c.nom, breed: c.race, coat: c.robe, sex: SEXE[c.sexe], born: c.naissance, age: c.naissance ? an - c.naissance : null,
    height: c.taille_cm, pony: c.taille_cm ? c.taille_cm <= 148 : null, kind: KIND[c.type] || 'club', owner: ext(P, c.proprietaire),
    box: c.box, sire: c.sire || c.ueln, chip: c.puce, since: c.arrivee, pension: c.pension, notes: c.notes,
  }) }));
  const staff = paquet.equipe.map(e => { const p = paquet.personnes.find(x => x.ref === e.personne); return { external_id: P.get(e.personne), data: clean({
    first: p.prenom, last: p.nom, role: e.poste, contract: e.contrat, hours: e.heures_semaine, dip: e.diplomes, email: p.email, phone: p.telephone, since: e.entree }) }; });
  const forfaits = paquet.prestations.map(f => ({ external_id: F.get(f.ref), data: clean({
    name: f.libelle, price: f.prix_ttc, vat: f.tva, kind: f.type === 'forfait' ? 'annuel' : f.type, sessions: f.seances, category: f.categorie, account: f.compte_comptable, toComplete: f.prix_ttc === null }) }));
  const lessons = paquet.reprises.filter(r => r.jour).map(r => ({ external_id: 'reprise:' + cle([r.libelle, r.jour, r.debut].join(' ')).replace(/ /g, '-'), data: clean({
    dow: r.jour % 7, day: JOURS[r.jour - 1], start: r.debut, dur: r.duree_min, title: r.libelle, coachName: r.moniteur, arenaName: r.lieu, level: r.niveau,
    cap: r.places || Math.max(r.inscrits.length, 8), riders: r.inscrits.map(i => ext(P, i.personne)).filter(Boolean),
    horses: Object.fromEntries(r.inscrits.filter(i => i.cheval).map(i => [ext(P, i.personne), ext(C, i.cheval)])), status: 'prévue' }) }));
  const care = paquet.soins.map((s, i) => ({ external_id: 'soin:' + C.get(s.cheval) + ':' + (s.date || i) + ':' + s.type, data: clean({
    horse: ext(C, s.cheval), kind: SOIN[s.type], who: s.intervenant, date: s.date, note: s.detail, next: s.prochain, cost: s.cout, status: s.date && s.date > aujourdhui ? 'planifié' : 'fait' }) }));
  const invoices = paquet.factures.map(f => ({ external_id: 'facture:' + f.numero, data: clean({
    id: f.numero, member: ext(P, f.client), label: f.lignes.map(l => l.libelle).join(', '), amount: f.total_ttc,
    vat: f.lignes.length === 1 ? f.lignes[0].tva : null, lines: f.lignes, date: f.date, due: f.echeance || f.date,
    status: f.statut === 'payee' ? 'payée' : f.statut === 'annulee' ? 'annulée' : f.avoir ? 'avoir' : (f.echeance || f.date) < aujourdhui ? 'en retard' : 'envoyée',
    paid: f.paye, rest: f.reste, method: MOYEN[f.moyen] || null, imported: true }) }));
  const payments = paquet.reglements.map(r => ({ external_id: 'reglement:' + [r.date, r.montant, r.reference || r.ref].join(':'), data: clean({
    date: r.date, member: ext(P, r.client), amount: r.montant, method: MOYEN[r.moyen] || null, invoice: r.facture ? 'ext:facture:' + r.facture : null, ref: r.reference, deposit: r.remise }) }));
  // Ordre d'envoi : ce qui est référencé avant ce qui référence.
  return [['staff', staff], ['forfaits', forfaits], ['members', members], ['horses', horses], ['lessons', lessons], ['care', care], ['invoices', invoices], ['payments', payments]]
    .filter(([, items]) => items.length).map(([coll, items]) => ({ coll, items }));
}

function clean(o) {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && !v.length) && !(typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)));
}

// Envoi vers le serveur : crée le job, pousse par paquets de 500, valide. `fetch` est celui de l'hôte.
export async function envoyer(paquet, { url = null, cle: cleApi = null, essai = true, source = 'passerelle', journal = () => {} }) {
  // Sans clé (page ouverte depuis l'appli, même origine) : la session du gérant sert d'authentification.
  const h = { 'content-type': 'application/json' };
  if (cleApi) h.authorization = 'Bearer ' + cleApi;
  const base = (url || globalThis.location?.origin || '').replace(/\/$/, '');
  const appel = async (chemin, corps) => {
    const r = await fetch(base + chemin, { method: 'POST', headers: h, body: JSON.stringify(corps || {}), ...(cleApi ? {} : { credentials: 'include' }) });
    const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = { brut: t }; }
    if (!r.ok) throw new Error(`${chemin} → ${r.status} ${j.error?.message || (typeof j.error === "string" ? j.error : "") || j.message || t.slice(0, 200)}`);
    return j;
  };
  const logiciel = paquet.sources.find(s => s.logiciel)?.logiciel || 'csv';
  const { job_id } = await appel('/api/v1/import/jobs', { source: source === 'passerelle' ? logiciel : source, dry_run: essai });
  journal(`Import ${job_id} ouvert (${essai ? 'essai, rien ne sera enregistré' : 'réel'}).`);
  for (const { coll, items } of versLots(paquet)) {
    for (let i = 0; i < items.length; i += 500) {
      await appel(`/api/v1/import/jobs/${job_id}/items`, { coll, items: items.slice(i, i + 500) });
      journal(`  ${coll} : ${Math.min(i + 500, items.length)}/${items.length}`);
    }
  }
  const res = await appel(`/api/v1/import/jobs/${job_id}/commit`);
  return { job_id, ...res };
}
