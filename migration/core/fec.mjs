// FEC : le fichier des écritures comptables (format légal français, article A47 A-1 du livre des procédures fiscales).
// Tout logiciel de comptabilité sait l'exporter (Pennylane, Tiime, Indy, QuickBooks, Sage, EBP, Cegid, Dougs, Isagri…).
// On en tire, sans rien inventer :
//   - le résumé comptable : exercice, journaux, plan de comptes, TVA, chiffre d'affaires, équilibre des écritures ;
//   - les clients (comptes 411 et comptes auxiliaires) avec ce qu'ils doivent encore ;
//   - les factures de vente (journal qui débite un compte client) et leur état (lettrée = réglée) ;
//   - les règlements reçus (crédit d'un compte client hors journal de ventes) ;
//   - les fournisseurs (comptes 401).
// Ces tables passent ensuite par la même passerelle que les autres fichiers (types fixés, colonnes fixées).
import { lireCSV } from './csv.mjs';
import { cle } from './texte.mjs';

export const COLONNES_FEC = ['JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate', 'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
  'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit', 'EcritureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise'];

const premiereLigne = t => String(t || '').replace(/^﻿/, '').split(/\r?\n/, 1)[0] || '';
export function estFEC(texte) {
  const l = cle(premiereLigne(texte));
  return /journalcode/.test(l) && /ecriturenum/.test(l) && /comptenum/.test(l);
}

const nombre = v => {
  const s = String(v ?? '').trim().replace(/\s/g, '');
  if (!s) return 0;
  const n = parseFloat(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s);
  return Number.isFinite(n) ? n : 0;
};
const jour = v => { const s = String(v ?? '').trim(); const m = /^(\d{4})(\d{2})(\d{2})$/.exec(s) || /^(\d{4})-(\d{2})-(\d{2})/.exec(s); if (m) return `${m[1]}-${m[2]}-${m[3]}`; const f = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s); return f ? `${f[3]}-${f[2]}-${f[1]}` : null; };
const arrondi = n => Math.round(n * 100) / 100;
const euros = n => arrondi(n).toFixed(2).replace('.', ',');

// Texte du FEC -> lignes objets. Séparateur tabulation ou barre verticale (les deux sont légaux), parfois point-virgule.
export function lireFEC(texte) {
  const t = String(texte || '').replace(/^﻿/, '');
  const tete = premiereLigne(t);
  const sep = tete.includes('\t') ? '\t' : tete.includes('|') ? '|' : ';';
  const { lignes } = lireCSV(t, sep);
  if (lignes.length < 2) return { lignes: [], erreurs: ['Le FEC ne contient aucune écriture.'] };
  const h = lignes[0].map(x => String(x).toLowerCase().replace(/[^a-z]/g, ''));
  const idx = Object.fromEntries(COLONNES_FEC.map(c => [c, h.indexOf(c.toLowerCase())]));
  // Variante des BNC / micro-entreprises : Montant + Sens au lieu de Débit / Crédit.
  const iMontant = h.indexOf('montant'), iSens = h.indexOf('sens');
  const manquent = ['JournalCode', 'EcritureNum', 'CompteNum'].filter(c => idx[c] < 0);
  if (manquent.length) return { lignes: [], erreurs: ['Colonnes obligatoires absentes : ' + manquent.join(', ') + '.'] };
  const g = (l, c) => idx[c] >= 0 ? String(l[idx[c]] ?? '').trim() : '';
  const out = [];
  for (const l of lignes.slice(1)) {
    if (!l.some(v => String(v).trim())) continue;
    let debit = nombre(g(l, 'Debit')), credit = nombre(g(l, 'Credit'));
    if (idx.Debit < 0 && iMontant >= 0) { const m = nombre(l[iMontant]); if (/^c/i.test(String(l[iSens] || ''))) credit = m; else debit = m; }
    out.push({
      journal: g(l, 'JournalCode'), journalLib: g(l, 'JournalLib'), num: g(l, 'EcritureNum'), date: jour(g(l, 'EcritureDate')),
      compte: g(l, 'CompteNum'), compteLib: g(l, 'CompteLib'), aux: g(l, 'CompAuxNum'), auxLib: g(l, 'CompAuxLib'),
      piece: g(l, 'PieceRef'), pieceDate: jour(g(l, 'PieceDate')), libelle: g(l, 'EcritureLib'), debit, credit,
      lettrage: g(l, 'EcritureLet'), dateLet: jour(g(l, 'DateLet')),
    });
  }
  return { lignes: out, erreurs: [] };
}

const estClient = l => /^411/.test(l.compte) || (/^41/.test(l.compte) && !!l.aux);
const estFournisseur = l => /^401/.test(l.compte) || /^40[0-8]/.test(l.compte);
const tiersDe = l => ({ code: l.aux || l.compte, nom: l.auxLib || l.compteLib || l.aux || l.compte });

export function analyserFEC(texte, nom = 'FEC.txt') {
  const { lignes, erreurs } = lireFEC(texte);
  const journaux = new Map(), comptes = new Map(), clients = new Map(), fournisseurs = new Map(), ecritures = new Map();
  for (const l of lignes) {
    const j = journaux.get(l.journal) || { code: l.journal, libelle: l.journalLib || l.journal, lignes: 0, debit: 0, credit: 0 };
    j.lignes++; j.debit += l.debit; j.credit += l.credit; journaux.set(l.journal, j);
    const c = comptes.get(l.compte) || { numero: l.compte, libelle: l.compteLib, classe: l.compte.slice(0, 1), debit: 0, credit: 0 };
    c.debit += l.debit; c.credit += l.credit; comptes.set(l.compte, c);
    const k = l.journal + '#' + l.num;
    const e = ecritures.get(k) || { journal: l.journal, num: l.num, date: l.date, debit: 0, credit: 0, lignes: [] };
    e.debit += l.debit; e.credit += l.credit; e.lignes.push(l); ecritures.set(k, e);
    const T = estClient(l) ? clients : estFournisseur(l) ? fournisseurs : null;
    if (T) { const t = tiersDe(l); const x = T.get(t.code) || { ...t, debit: 0, credit: 0 }; x.debit += l.debit; x.credit += l.credit; T.set(t.code, x); }
  }
  const desequilibres = [...ecritures.values()].filter(e => Math.abs(e.debit - e.credit) > 0.009).slice(0, 20).map(e => ({ journal: e.journal, ecriture: e.num, ecart: arrondi(e.debit - e.credit) }));
  // Journal de ventes : le code VT/VE/VEN, sinon le journal qui débite le plus souvent un compte client.
  const ventes = new Set([...journaux.keys()].filter(j => /^(v|ve|vt|ven|vte|ventes?)$/i.test(j) || /vente/i.test(journaux.get(j).libelle)));
  if (!ventes.size) {
    const n = new Map(); for (const l of lignes) if (estClient(l) && l.debit > 0) n.set(l.journal, (n.get(l.journal) || 0) + 1);
    const best = [...n.entries()].sort((a, b) => b[1] - a[1])[0]; if (best) ventes.add(best[0]);
  }
  const somme = (re, sens) => arrondi([...comptes.values()].filter(c => re.test(c.numero)).reduce((a, c) => a + (sens === 'c' ? c.credit - c.debit : c.debit - c.credit), 0));
  const dates = lignes.map(l => l.date).filter(Boolean).sort();
  const comptabilite = {
    format: 'fec', fichier: nom, exercice: dates.length ? { debut: dates[0], fin: dates[dates.length - 1] } : null,
    lignes: lignes.length, ecritures: ecritures.size, equilibre: !desequilibres.length, desequilibres,
    total_debit: arrondi(lignes.reduce((a, l) => a + l.debit, 0)), total_credit: arrondi(lignes.reduce((a, l) => a + l.credit, 0)),
    journaux: [...journaux.values()].map(j => ({ ...j, debit: arrondi(j.debit), credit: arrondi(j.credit) })),
    comptes: [...comptes.values()].sort((a, b) => a.numero.localeCompare(b.numero)).map(c => ({ numero: c.numero, libelle: c.libelle, classe: c.classe, solde: arrondi(c.debit - c.credit) })),
    chiffre_affaires_ht: somme(/^70/, 'c'),
    tva: { collectee: somme(/^4457/, 'c'), deductible: somme(/^4456/, 'd') },
    clients: clients.size, fournisseurs: fournisseurs.size, erreurs,
  };

  // Clients : solde négatif = ce que le client doit encore (même convention que les fiches adhérents).
  const tClients = [['Code client', 'Client', 'Solde'], ...[...clients.values()].map(c => [c.code, c.nom, euros(-(c.debit - c.credit))])];
  // Factures : une écriture du journal de ventes qui touche un compte client.
  const tFactures = [['N° facture', 'Date', 'Code client', 'Client', 'Désignation', 'Montant TTC', 'Reste dû']];
  const tReglements = [['Date', 'Code client', 'Client', 'Montant', 'Référence']];
  for (const e of ecritures.values()) {
    const cl = e.lignes.filter(estClient);
    if (!cl.length) continue;
    if (ventes.has(e.journal)) {
      for (const l of cl) {
        const ttc = arrondi(l.debit - l.credit); if (!ttc) continue;
        const t = tiersDe(l);
        tFactures.push([l.piece || e.num, l.pieceDate || l.date, t.code, t.nom, l.libelle || 'Facture', euros(ttc), euros(l.lettrage ? 0 : Math.max(0, ttc))]);
      }
    } else {
      for (const l of cl) if (l.credit > 0) { const t = tiersDe(l); tReglements.push([l.date, t.code, t.nom, euros(l.credit - l.debit), l.piece || e.num]); }
    }
  }
  const tFournisseurs = [['Fournisseur', 'Compte fournisseur', 'Catégorie'], ...[...fournisseurs.values()].map(f => [f.nom, f.code, 'Fournisseur'])];
  const base = nom.replace(/\.[^.]+$/, '');
  const tables = [
    { fichier: nom, feuille: 'clients', lignes: tClients, type: 'adherents', logiciel: 'fec' },
    { fichier: nom, feuille: 'factures', lignes: tFactures, type: 'factures', logiciel: 'fec' },
    { fichier: nom, feuille: 'règlements', lignes: tReglements, type: 'reglements', logiciel: 'fec' },
    { fichier: nom, feuille: 'fournisseurs', lignes: tFournisseurs, type: 'fournisseurs', logiciel: 'fec' },
  ].filter(t => t.lignes.length > 1);
  if (!tables.length) tables.push({ fichier: nom, feuille: base, lignes: [], logiciel: 'fec' });
  tables[0].comptabilite = comptabilite;
  return { comptabilite, tables };
}
