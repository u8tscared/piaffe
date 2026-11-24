// Assemble les tableaux lus en un « paquet Piaffe » (format piaffe-import 1.0) :
// une seule fiche par personne, familles reliées, chevaux reliés à leur propriétaire, factures regroupées.
import { cle, vide } from './texte.mjs';
import * as V from './valeurs.mjs';
import { TYPES, associer, devinerType, ligneEntete } from './champs.mjs';
import { reconnaitreLogiciel } from './logiciels.mjs';

export const VERSION_FORMAT = '1.0';
export const VERSION_OUTIL = '0.1.0';

// tables : [{ fichier, feuille?, lignes: string[][], type?, colonnes?: {index: champ} }]
export function construirePaquet(tables, options = {}) {
  const aujourdhui = options.aujourdhui || new Date().toISOString().slice(0, 10);
  const P = new Paquet(aujourdhui);
  const lues = [];
  for (const t of tables) {
    const r = analyserTable(t);
    if (!r) { P.avertir('info', 'table_vide', `« ${nomTable(t)} » ne contient pas de tableau exploitable.`, t.fichier); continue; }
    P.sources.push(r.source);
    if (r.source.type === null) { P.avertir('attention', 'type_inconnu', `Je n’ai pas reconnu le contenu de « ${nomTable(t)} ». Choisissez son type à la main.`, t.fichier); continue; }
    lues.push(r);
  }
  // Ordre utile : les personnes d'abord, puis ce qui s'y rattache.
  const ordre = ['adherents', 'equipe', 'prestations', 'chevaux', 'factures', 'reglements', 'reprises', 'soins'];
  lues.sort((a, b) => ordre.indexOf(a.source.type) - ordre.indexOf(b.source.type));
  for (const r of lues) P['ajouter_' + r.source.type](r);
  P.finaliser();
  return P.json();
}

function nomTable(t) { return t.feuille ? `${t.fichier} › ${t.feuille}` : t.fichier; }

export function analyserTable(t) {
  const lignes = (t.lignes || []).filter(l => l.some(v => !vide(v)));
  if (lignes.length < 2) return null;
  const h = t.ligneEntete ?? ligneEntete(lignes);
  const entetes = lignes[h].map(v => String(v ?? '').trim());
  const candidats = devinerType(entetes, (t.fichier || '') + ' ' + (t.feuille || ''));
  let type = t.type || null, colonnes = t.colonnes || null;
  if (!type) {
    const [a, b] = candidats;
    if (a.score >= 3 && Object.keys(a.colonnes).length >= 2) type = a.type;
    if (b && a.score - b.score < 0.5 && !t.type) type = type; // ex aequo : on garde le premier mais on le signale
  }
  if (type && !colonnes) colonnes = associer(type, entetes).colonnes;
  const corps = lignes.slice(h + 1).map((l, i) => ({ l, n: h + i + 2 }));
  const ignorees = entetes.filter((e, i) => e && !(colonnes && i in colonnes));
  return {
    source: {
      fichier: t.fichier, feuille: t.feuille || null, logiciel: t.logiciel || reconnaitreLogiciel(t.fichier || '', entetes),
      type, lignes: corps.length, ligne_entete: h + 1,
      colonnes: colonnes ? Object.fromEntries(Object.entries(colonnes).map(([i, c]) => [entetes[i], c])) : {},
      ignorees, candidats: candidats.slice(0, 3).map(c => ({ type: c.type, score: Math.round(c.score * 10) / 10 })),
    },
    entetes, colonnes: colonnes || {}, corps, fichier: t.fichier,
  };
}

// Transforme une ligne brute en objet {champ: valeur brute}.
function enregistrement(r, ligne) {
  const o = {};
  for (const [i, champ] of Object.entries(r.colonnes)) if (!vide(ligne[i])) o[champ] = ligne[i];
  return o;
}

class Paquet {
  constructor(aujourdhui) {
    this.aujourdhui = aujourdhui;
    this.sources = []; this.avertissements = [];
    this.personnes = []; this.chevaux = []; this.prestations = []; this.abonnements = [];
    this.factures = []; this.reglements = []; this.reprises = []; this.equipe = []; this.soins = [];
    this.idx = { licence: new Map(), email: new Map(), nomNaiss: new Map(), nom: new Map(), idSource: new Map(), famille: new Map() };
    this.fusions = 0;
  }
  avertir(niveau, code, message, fichier = null, ligne = null) { this.avertissements.push({ niveau, code, message, fichier, ligne }); }

  // ---------- Personnes ----------
  trouverPersonne(c) {
    const k = [];
    if (c.licence?.numero) k.push(this.idx.licence.get(c.licence.numero));
    if (c._idSource) k.push(this.idx.idSource.get(c._idSource));
    if (c.nom && c.prenom && c.naissance) k.push(this.idx.nomNaiss.get(cle(c.nom + ' ' + c.prenom + ' ' + c.naissance)));
    if (c.email && c.prenom) k.push(this.idx.email.get(c.email + '|' + cle(c.prenom)));
    if (c.nom && c.prenom) {
      const p = this.idx.nom.get(cle(c.nom + ' ' + c.prenom));
      if (p && (!p.naissance || !c.naissance || p.naissance === c.naissance)) k.push(p);
    }
    // Deux homonymes ne sont pas la même personne si un identifiant les distingue.
    return k.filter(Boolean).find(p => !(
      (p.licence?.numero && c.licence?.numero && p.licence.numero !== c.licence.numero) ||
      (p.naissance && c.naissance && p.naissance !== c.naissance) ||
      (p.email && c.email && p.email !== c.email && !(c.licence?.numero && p.licence?.numero === c.licence.numero)) ||
      (c._origine && !c.licence?.numero && p.origine.some(o => o.fichier === c._origine.fichier && o.ligne !== c._origine.ligne) && !(c._idSource && p._idSources?.includes(c._idSource)))
    )) || null;
  }
  indexer(p) {
    if (p.licence?.numero) this.idx.licence.set(p.licence.numero, p);
    for (const s of p._idSources || []) this.idx.idSource.set(s, p);
    if (p.nom && p.prenom) {
      this.idx.nom.set(cle(p.nom + ' ' + p.prenom), p);
      if (p.naissance) this.idx.nomNaiss.set(cle(p.nom + ' ' + p.prenom + ' ' + p.naissance), p);
    }
    if (p.email && p.prenom) this.idx.email.set(p.email + '|' + cle(p.prenom), p);
  }
  fusionnerPersonne(c, origine) {
    let p = this.trouverPersonne({ ...c, _origine: c.roles?.includes('cavalier') ? origine : null });
    if (!p) {
      p = { ref: 'p' + String(this.personnes.length + 1).padStart(4, '0'), roles: [], responsables: [], origine: [], _idSources: [] };
      this.personnes.push(p);
    } else if (origine && !p.origine.some(o => o.fichier === origine.fichier)) this.fusions++;
    for (const [k, v] of Object.entries(c)) {
      if (k === '_idSource') { if (v && !p._idSources.includes(v)) p._idSources.push(v); continue; }
      if (v === null || v === undefined) continue;
      if (k === 'roles') { for (const r of v) if (!p.roles.includes(r)) p.roles.push(r); continue; }
      if (k === 'adresse' || k === 'licence') { p[k] = { ...(p[k] || {}), ...Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null)) }; continue; }
      if (p[k] === undefined || p[k] === null) p[k] = v;
      else if (JSON.stringify(p[k]) !== JSON.stringify(v) && ['naissance', 'email'].includes(k)) {
        this.avertir('attention', 'conflit', `${p.prenom || ''} ${p.nom || ''} : ${k} différent selon les fichiers (${p[k]} / ${v}). J’ai gardé ${p[k]}.`, origine?.fichier, origine?.ligne);
      }
    }
    if (origine) p.origine.push(origine);
    this.indexer(p);
    return p;
  }

  ajouter_adherents(r) {
    const annee = +this.aujourdhui.slice(0, 4);
    for (const { l, n } of r.corps) {
      const e = enregistrement(r, l);
      let nom = V.texte(e.nom), prenom = V.texte(e.prenom);
      if ((!nom || !prenom) && e.nom_complet) { const s = V.separerNom(e.nom_complet); nom = nom || s.nom; prenom = prenom || s.prenom; }
      if (!nom && !prenom) continue;
      const origine = { fichier: r.fichier, ligne: n };
      let cp = V.texte(e.code_postal), ville = V.texte(e.ville);
      if (cp && !ville && /^\d{5}\s+\S/.test(cp)) { ville = cp.slice(6).trim(); cp = cp.slice(0, 5); }
      const telBrut = V.telephone(e.telephone), tel2 = V.telephone(e.telephone2);
      const mail = V.email(e.email);
      if (e.email && !mail) this.avertir('attention', 'email_invalide', `${V.joliNom(prenom)} ${V.joliNom(nom)} : adresse e-mail illisible « ${e.email} ».`, r.fichier, n);
      const naissance = V.date(e.naissance);
      const licAnnee = V.annee(e.licence_annee) ?? (V.ouiNon(e.licence_annee) ? annee + (this.aujourdhui.slice(5) >= '09' ? 1 : 0) : null);
      const c = {
        _idSource: e.id_source ? r.fichier + '#' + e.id_source : null,
        nom: V.joliNom(nom), prenom: V.joliNom(prenom), naissance, sexe: V.sexePersonne(e.sexe),
        email: mail, telephone: telBrut || tel2, telephone2: telBrut ? tel2 : null,
        adresse: (e.adresse || cp || ville) ? { ligne1: V.texte(e.adresse), ligne2: V.texte(e.adresse2), code_postal: cp, ville: ville ? V.joliNom(ville) : null } : null,
        licence: V.licence(e.licence) ? { numero: V.licence(e.licence), annee: licAnnee, type: V.texte(e.licence_type) } : null,
        galop: V.galop(e.galop), certificat_medical: V.date(e.certificat) || (V.ouiNon(e.certificat) ? 'fourni' : null),
        droit_image: V.ouiNon(e.droit_image), inscription: V.date(e.inscription), solde: V.montant(e.solde),
        famille: V.texte(e.famille), notes: V.texte(e.notes), roles: ['cavalier'],
      };
      if (e.licence && !c.licence) this.avertir('info', 'licence_illisible', `${c.prenom} ${c.nom} : numéro de licence « ${e.licence} » au format inattendu, gardé en note.`, r.fichier, n);
      if (e.licence && !c.licence) c.notes = [c.notes, 'Licence : ' + e.licence].filter(Boolean).join(' · ');
      const p = this.fusionnerPersonne(c, origine);
      if (e.id_source) this.idx.idSource.set('id#' + V.texte(e.id_source), p);
      // Responsable légal ou payeur
      if (e.responsable_nom || e.responsable_email || e.responsable_telephone) {
        const s = V.separerNom(e.responsable_nom);
        const rp = this.fusionnerPersonne({
          nom: V.joliNom(s.nom || nom), prenom: V.joliNom(s.prenom || null), email: V.email(e.responsable_email),
          telephone: V.telephone(e.responsable_telephone), roles: ['responsable'],
        }, origine);
        if (rp !== p && !p.responsables.includes(rp.ref)) p.responsables.push(rp.ref);
      }
      if (e.forfait) this.abonnements.push({ personne: p.ref, libelle: V.texte(e.forfait), prestation: null, _o: origine });
    }
  }

  ajouter_equipe(r) {
    for (const { l, n } of r.corps) {
      const e = enregistrement(r, l);
      if (!e.nom && !e.prenom) continue;
      const p = this.fusionnerPersonne({ nom: V.joliNom(V.texte(e.nom)), prenom: V.joliNom(V.texte(e.prenom)), email: V.email(e.email), telephone: V.telephone(e.telephone), roles: ['equipe'] }, { fichier: r.fichier, ligne: n });
      this.equipe.push({ personne: p.ref, poste: V.texte(e.poste), contrat: V.texte(e.contrat), heures_semaine: V.montant(e.heures), diplomes: V.texte(e.diplome), entree: V.date(e.entree) });
    }
  }

  // ---------- Prestations ----------
  ajouter_prestations(r) {
    for (const { l, n } of r.corps) {
      const e = enregistrement(r, l);
      const libelle = V.texte(e.libelle); if (!libelle) continue;
      const tva = V.taux(e.tva);
      let ttc = V.montant(e.prix_ttc);
      const ht = V.montant(e.prix_ht);
      if (ttc === null && ht !== null) ttc = Math.round(ht * (1 + (tva ?? 20) / 100) * 100) / 100;
      this.prestations.push({
        ref: 'f' + String(this.prestations.length + 1).padStart(3, '0'), libelle, categorie: V.texte(e.categorie),
        type: typePrestation(libelle + ' ' + (e.categorie || '')), prix_ttc: ttc, tva, seances: V.entier(e.seances),
        validite: V.texte(e.duree_validite), compte_comptable: V.texte(e.compte), origine: [{ fichier: r.fichier, ligne: n }],
      });
    }
  }
  prestationParLibelle(libelle) {
    const k = cle(libelle);
    let f = this.prestations.find(p => cle(p.libelle) === k);
    if (!f) {
      f = { ref: 'f' + String(this.prestations.length + 1).padStart(3, '0'), libelle, categorie: null, type: typePrestation(libelle), prix_ttc: null, tva: null, seances: null, validite: null, compte_comptable: null, origine: [], deduite: true };
      this.prestations.push(f);
    }
    return f;
  }

  // ---------- Chevaux ----------
  ajouter_chevaux(r) {
    const annee = +this.aujourdhui.slice(0, 4);
    for (const { l, n } of r.corps) {
      const e = enregistrement(r, l);
      const nom = V.texte(e.nom); if (!nom) continue;
      let naissance = V.annee(e.naissance);
      if (!naissance && /^\d{1,2}\s*(ans)?$/.test(String(e.naissance || '').trim())) naissance = annee - parseInt(e.naissance);
      let sire = V.sire(e.sire), ueln = V.ueln(e.ueln) || (!sire ? V.ueln(e.sire) : null);
      if (e.sire && !sire && !ueln) this.avertir('attention', 'sire_illisible', `${nom} : numéro SIRE « ${e.sire} » au format inattendu.`, r.fichier, n);
      const typeTxt = cle(e.type || '') + ' ' + cle(e.pension || '');
      let type = /demi/.test(typeTxt) ? 'demi_pension' : /propri|pension|prive/.test(typeTxt) ? 'proprietaire' : /club|ecole|cavalerie|reprise/.test(typeTxt) ? 'club' : null;
      let proprietaire = null;
      if (e.proprietaire && !/club|ecurie|centre/i.test(cle(e.proprietaire))) {
        const s = V.separerNom(e.proprietaire);
        const p = this.fusionnerPersonne({ nom: V.joliNom(s.nom), prenom: V.joliNom(s.prenom || null), roles: ['proprietaire'] }, { fichier: r.fichier, ligne: n });
        proprietaire = p.ref; type = type || 'proprietaire';
      }
      const existant = this.chevaux.find(c => (sire && c.sire === sire) || cle(c.nom) === cle(nom));
      const c = existant || { ref: 'c' + String(this.chevaux.length + 1).padStart(4, '0'), origine: [] };
      Object.assign(c, Object.fromEntries(Object.entries({
        nom: V.joliNom(nom), sire, ueln, puce: V.puce(e.puce), naissance, sexe: V.sexeCheval(e.sexe), race: V.texte(e.race), robe: V.texte(e.robe),
        taille_cm: V.taille(e.taille), type: type || 'club', proprietaire, box: V.texte(e.box), arrivee: V.date(e.arrivee), pension: V.texte(e.pension), notes: V.texte(e.notes),
      }).filter(([k, v]) => v !== null && (c[k] === undefined || c[k] === null || k === 'proprietaire'))));
      c.origine.push({ fichier: r.fichier, ligne: n });
      if (!existant) this.chevaux.push(c);
      if (c.type === 'club' && c.pony === undefined && c.taille_cm) c.poney = c.taille_cm <= 148;
    }
  }
  chevalParNom(nom) {
    const k = cle(nom);
    return this.chevaux.find(c => cle(c.nom) === k) || this.chevaux.find(c => cle(c.nom).startsWith(k + ' ')) || null;
  }

  // ---------- Factures ----------
  client(e, fichier, ligne) {
    if (e.client_id) {
      const p = this.idx.idSource.get('id#' + V.texte(e.client_id));
      if (p && e.client_nom) {
        // Le code renvoie souvent au cavalier, le nom au payeur (parent) : on facture le payeur s'il est connu.
        const s = V.separerNom(e.client_nom);
        const payeur = s.nom && this.trouverPersonne({ nom: V.joliNom(s.nom), prenom: V.joliNom(s.prenom || '') });
        if (payeur && payeur !== p) return payeur;
      }
      if (p) return p;
    }
    if (e.client_nom) {
      const s = V.separerNom(e.client_nom);
      const homonymes = this.personnes.filter(x => s.nom && cle(x.nom) === cle(s.nom) && cle(x.prenom || '') === cle(s.prenom || ''));
      if (homonymes.length > 1) this.avertir('attention', 'client_homonyme', `« ${V.joliNom(String(e.client_nom))} » : ${homonymes.length} personnes portent ce nom, vérifiez à qui rattacher cette facture.`, fichier, ligne);
      if (s.nom) return this.fusionnerPersonne({ nom: V.joliNom(s.nom), prenom: V.joliNom(s.prenom || null), roles: ['client'] }, { fichier, ligne });
    }
    return null;
  }
  ajouter_factures(r) {
    const parNumero = new Map();
    for (const { l, n } of r.corps) {
      const e = enregistrement(r, l);
      const numero = V.texte(e.numero) || `sans-numero-${n}`;
      let f = parNumero.get(numero);
      if (!f) {
        const p = this.client(e, r.fichier, n);
        f = { ref: 'fa' + String(this.factures.length + 1).padStart(5, '0'), numero, date: V.date(e.date), echeance: V.date(e.echeance), client: p?.ref || null,
          client_nom: V.texte(e.client_nom), lignes: [], total_ttc: 0, paye: null, reste: null, statut: null, moyen: V.moyen(e.moyen), origine: [] };
        parNumero.set(numero, f); this.factures.push(f);
        if (!p) this.avertir('attention', 'facture_sans_client', `Facture ${numero} : client introuvable.`, r.fichier, n);
      }
      const q = V.montant(e.quantite) ?? 1, pu = V.montant(e.prix_unitaire), ttc = V.montant(e.total_ttc) ?? (pu !== null ? Math.round(pu * q * 100) / 100 : null);
      if (e.libelle || ttc !== null) f.lignes.push({ libelle: V.texte(e.libelle) || 'Prestation', quantite: q, prix_unitaire_ttc: pu ?? (ttc !== null ? Math.round(ttc / q * 100) / 100 : null), tva: V.taux(e.tva), total_ttc: ttc });
      if (e.paye !== undefined) f.paye = (f.paye || 0) + (V.montant(e.paye) || 0);
      if (e.reste !== undefined) f.reste = V.montant(e.reste);
      if (e.statut) f.statut = statutFacture(e.statut);
      f.origine.push({ fichier: r.fichier, ligne: n });
    }
    for (const f of parNumero.values()) {
      f.total_ttc = Math.round(f.lignes.reduce((a, x) => a + (x.total_ttc || 0), 0) * 100) / 100;
      if (f.reste === null && f.paye === null && f.statut === 'payee') f.paye = f.total_ttc;
      if (f.reste === null && f.paye === null && f.statut === 'due') f.reste = f.total_ttc;
      if (f.reste === null && f.paye !== null) f.reste = Math.round((f.total_ttc - f.paye) * 100) / 100;
      if (f.paye === null && f.reste !== null) f.paye = Math.round((f.total_ttc - f.reste) * 100) / 100;
      if (!f.statut) f.statut = f.reste === null ? 'inconnu' : f.reste <= 0.009 ? 'payee' : f.paye > 0 ? 'partielle' : 'due';
      if (f.total_ttc < 0) { f.avoir = true; f.statut = 'avoir'; f.reste = 0; }
    }
  }
  ajouter_reglements(r) {
    for (const { l, n } of r.corps) {
      const e = enregistrement(r, l);
      const montant = V.montant(e.montant); if (montant === null) continue;
      const p = this.client(e, r.fichier, n);
      this.reglements.push({ ref: 'rg' + String(this.reglements.length + 1).padStart(5, '0'), date: V.date(e.date), client: p?.ref || null, montant, moyen: V.moyen(e.moyen),
        facture: V.texte(e.facture), reference: V.texte(e.reference), remise: V.texte(e.remise), origine: [{ fichier: r.fichier, ligne: n }] });
    }
  }

  // ---------- Planning ----------
  ajouter_reprises(r) {
    const groupes = new Map();
    for (const { l, n } of r.corps) {
      const e = enregistrement(r, l);
      const date = V.date(e.date);
      const jour = V.jour(e.jour) ?? (date ? ((new Date(date + 'T12:00:00Z').getUTCDay() + 6) % 7) + 1 : null);
      const debut = V.heure(e.debut);
      const libelle = V.texte(e.libelle) || [V.texte(e.niveau), debut].filter(Boolean).join(' ') || null;
      if (!libelle && !debut) continue;
      const k = cle([libelle, jour, debut, e.moniteur].join('|'));
      let rep = groupes.get(k);
      if (!rep) {
        const fin = V.heure(e.fin);
        let duree = V.duree(e.duree);
        if (!duree && debut && fin) duree = (+fin.slice(0, 2) * 60 + +fin.slice(3)) - (+debut.slice(0, 2) * 60 + +debut.slice(3));
        rep = { ref: 'r' + String(this.reprises.length + 1).padStart(4, '0'), libelle, jour, date: e.jour ? null : date, debut, duree_min: duree || 60,
          moniteur: V.texte(e.moniteur), niveau: V.texte(e.niveau), lieu: V.texte(e.lieu), places: V.entier(e.places), inscrits: [], origine: [] };
        groupes.set(k, rep); this.reprises.push(rep);
      }
      const noms = e.cavalier ? [e.cavalier] : e.inscrits ? String(e.inscrits).split(/[,;\/]| et /) : [];
      for (const nm of noms) {
        const s = V.separerNom(nm); if (!s.nom) continue;
        const p = this.trouverPersonne({ nom: V.joliNom(s.nom), prenom: V.joliNom(s.prenom || '') }) ||
          this.personnes.find(x => cle(x.prenom + ' ' + x.nom) === cle(nm) || cle(x.nom + ' ' + x.prenom) === cle(nm));
        if (p) { if (!rep.inscrits.some(i => i.personne === p.ref)) rep.inscrits.push({ personne: p.ref, cheval: e.cheval ? this.chevalParNom(e.cheval)?.ref || null : null }); }
        else this.avertir('info', 'inscrit_inconnu', `Reprise « ${libelle} » : cavalier « ${String(nm).trim()} » absent des fiches adhérents.`, r.fichier, n);
      }
      rep.origine.push({ fichier: r.fichier, ligne: n });
    }
  }

  ajouter_soins(r) {
    for (const { l, n } of r.corps) {
      const e = enregistrement(r, l);
      const c = e.cheval ? this.chevalParNom(e.cheval) : null;
      if (!c) { if (e.cheval) this.avertir('info', 'soin_cheval_inconnu', `Soin pour « ${e.cheval} » : cheval absent de la liste des chevaux.`, r.fichier, n); continue; }
      this.soins.push({ cheval: c.ref, date: V.date(e.date), type: typeSoin(e.type || e.detail), detail: V.texte(e.detail) || V.texte(e.type), intervenant: V.texte(e.intervenant), prochain: V.date(e.prochain), cout: V.montant(e.cout), origine: [{ fichier: r.fichier, ligne: n }] });
    }
  }

  // ---------- Fin ----------
  finaliser() {
    // Familles : code famille commun, sinon même e-mail ou même responsable.
    const fam = new Map();
    const familleDe = p => p.famille || (p.responsables[0] && 'resp:' + p.responsables[0]) || (p.email && 'mail:' + p.email);
    for (const p of this.personnes) { const k = familleDe(p); if (k) { if (!fam.has(k)) fam.set(k, []); fam.get(k).push(p); } }
    let nf = 0;
    for (const [, membres] of fam) {
      const tous = new Set(membres.map(m => m.ref));
      for (const m of membres) for (const r of m.responsables) tous.add(r);
      if (tous.size < 2) continue;
      const code = 'F' + String(++nf).padStart(3, '0');
      for (const ref of tous) { const p = this.personnes.find(x => x.ref === ref); p.foyer = p.foyer || code; }
    }
    // Abonnements reliés aux prestations
    for (const a of this.abonnements) { a.prestation = this.prestationParLibelle(a.libelle).ref; delete a._o; }
    // Contrôles
    const age = d => d ? (+this.aujourdhui.slice(0, 4) - +d.slice(0, 4) - (this.aujourdhui.slice(5) < d.slice(5) ? 1 : 0)) : null;
    for (const p of this.personnes) {
      p.mineur = p.naissance ? age(p.naissance) < 18 : null;
      if (p.roles.includes('cavalier')) {
        if (p.mineur && !p.responsables.length && !p.email) this.avertir('attention', 'mineur_sans_contact', `${p.prenom} ${p.nom} est mineur et n’a ni responsable ni e-mail : la famille ne recevra pas son invitation.`, p.origine[0]?.fichier, p.origine[0]?.ligne);
        else if (!p.email && !p.telephone && !p.responsables.length) this.avertir('attention', 'sans_contact', `${p.prenom} ${p.nom} n’a ni e-mail ni téléphone.`, p.origine[0]?.fichier, p.origine[0]?.ligne);
        if (p.licence?.annee && p.licence.annee < +this.aujourdhui.slice(0, 4) + (this.aujourdhui.slice(5) >= '09' ? 1 : 0)) this.avertir('info', 'licence_ancienne', `${p.prenom} ${p.nom} : licence ${p.licence.annee}, à renouveler.`, p.origine[0]?.fichier, p.origine[0]?.ligne);
      }
      p.ids_source = p._idSources; delete p._idSources;
    }
    for (const c of this.chevaux) if (!c.sire && !c.ueln) this.avertir('info', 'cheval_sans_sire', `${c.nom} n’a pas de numéro SIRE : Piaffe ne pourra pas pré-remplir sa fiche IFCE.`, c.origine[0]?.fichier, c.origine[0]?.ligne);
    for (const f of this.prestations) if (f.deduite) this.avertir('info', 'tarif_manquant', `Forfait « ${f.libelle} » trouvé sur des fiches mais sans tarif : à compléter.`);
  }

  json() {
    const impayes = this.factures.filter(f => f.reste > 0).reduce((a, f) => a + f.reste, 0);
    const soldes = this.personnes.filter(p => p.solde < 0).reduce((a, p) => a + p.solde, 0);
    return {
      format: 'piaffe-import', version: VERSION_FORMAT, genere_le: new Date().toISOString(), outil: { nom: 'Passerelle Piaffe', version: VERSION_OUTIL },
      sources: this.sources,
      personnes: this.personnes, chevaux: this.chevaux, prestations: this.prestations, abonnements: this.abonnements,
      factures: this.factures, reglements: this.reglements, reprises: this.reprises, equipe: this.equipe, soins: this.soins,
      controle: {
        personnes: this.personnes.length, cavaliers: this.personnes.filter(p => p.roles.includes('cavalier')).length,
        responsables: this.personnes.filter(p => p.roles.includes('responsable')).length,
        foyers: new Set(this.personnes.map(p => p.foyer).filter(Boolean)).size,
        fiches_fusionnees: this.fusions,
        chevaux: this.chevaux.length, chevaux_proprietaires: this.chevaux.filter(c => c.type !== 'club').length,
        prestations: this.prestations.length, factures: this.factures.length,
        chiffre_factures_ttc: Math.round(this.factures.reduce((a, f) => a + f.total_ttc, 0) * 100) / 100,
        impayes_factures_ttc: Math.round(impayes * 100) / 100, soldes_negatifs_fiches: Math.round(soldes * 100) / 100,
        reglements: this.reglements.length, encaisse_ttc: Math.round(this.reglements.reduce((a, r) => a + r.montant, 0) * 100) / 100,
        reprises: this.reprises.length, soins: this.soins.length,
        sans_email: this.personnes.filter(p => p.roles.includes('cavalier') && !p.email && !p.responsables.length).length,
      },
      avertissements: this.avertissements,
    };
  }
}

function typePrestation(s) {
  const k = cle(s);
  if (/demi pension/.test(k)) return 'demi_pension';
  if (/pension|box|hebergement/.test(k)) return 'pension';
  if (/carte|seances|ticket/.test(k)) return 'carte';
  if (/stage|vacances/.test(k)) return 'stage';
  if (/licence/.test(k)) return 'licence';
  if (/cotisation|adhesion/.test(k)) return 'cotisation';
  if (/forfait|annuel|trimestre|abonnement|semaine/.test(k)) return 'forfait';
  if (/particulier|cours/.test(k)) return 'cours';
  return 'autre';
}
function statutFacture(s) {
  const k = cle(s);
  if (/partiel/.test(k)) return 'partielle';
  if (/regle|paye|solde|acquitte/.test(k) && !/non|impaye/.test(k)) return 'payee';
  if (/annul/.test(k)) return 'annulee';
  if (/avoir/.test(k)) return 'avoir';
  return 'due';
}
function typeSoin(s) {
  const k = cle(s);
  if (/vaccin|grippe|tetanos|rhino/.test(k)) return 'vaccin';
  if (/vermif/.test(k)) return 'vermifuge';
  if (/ferr|marechal|parage/.test(k)) return 'marechal';
  if (/dent/.test(k)) return 'dentiste';
  if (/osteo/.test(k)) return 'osteopathe';
  if (/veto|veterinaire|consult|visite/.test(k)) return 'veterinaire';
  return 'autre';
}
