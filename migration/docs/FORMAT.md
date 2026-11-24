# Format du paquet Piaffe (piaffe-import 1.0)

Le paquet est un fichier JSON produit par la passerelle. Il décrit le club tel qu'il était dans l'ancien logiciel, déjà nettoyé et dédoublonné. Les références internes (`p0001`, `c0001`, `f001`…) ne valent que dans le paquet ; pour l'API, `core/vers-api.mjs` les remplace par des identifiants stables.

```jsonc
{
  "format": "piaffe-import", "version": "1.0", "genere_le": "2026-11-24T16:30:00Z",
  "outil": { "nom": "Passerelle Piaffe", "version": "0.1.0" },
  "sources": [ { "fichier": "kavalog-cavaliers.csv", "feuille": null, "logiciel": "kavalog", "type": "adherents",
                 "lignes": 8, "ligne_entete": 3, "colonnes": { "N° licence": "licence" }, "ignorees": [], "candidats": [] } ],
  "personnes": [ { "ref": "p0001", "prenom": "Léa", "nom": "Martin", "naissance": "2012-03-14", "sexe": "F",
                   "email": "…", "telephone": "+33612345678", "telephone2": null,
                   "adresse": { "ligne1": "…", "ligne2": null, "code_postal": "78730", "ville": "…" },
                   "roles": ["cavalier"],               // cavalier, responsable, proprietaire, client, equipe
                   "licence": { "numero": "1234567A", "annee": 2027, "type": "Pratiquant" },
                   "galop": 4, "certificat_medical": "2026-09-01" | "fourni" | null, "droit_image": true,
                   "responsables": ["p0006"], "foyer": "F001", "mineur": true, "solde": -195,
                   "inscription": null, "notes": null, "ids_source": ["kavalog-cavaliers.csv#C0001"],
                   "origine": [ { "fichier": "…", "ligne": 4 } ] } ],
  "chevaux": [ { "ref": "c0001", "nom": "Ulysse de la Roche", "sire": "15012345K", "ueln": null, "puce": null,
                 "naissance": 2015, "sexe": "hongre|jument|etalon", "race": "…", "robe": "…", "taille_cm": 168,
                 "type": "club|proprietaire|demi_pension", "proprietaire": "p0003", "box": "B01",
                 "arrivee": null, "pension": null, "notes": null, "origine": [] } ],
  "prestations": [ { "ref": "f001", "libelle": "Forfait annuel 1 h / semaine", "categorie": "Enseignement",
                     "type": "forfait|carte|pension|demi_pension|stage|licence|cotisation|cours|autre",
                     "prix_ttc": 780, "tva": 5.5, "seances": 33, "validite": null, "compte_comptable": null,
                     "deduite": true /* trouvée sur une fiche, sans tarif */ } ],
  "abonnements": [ { "personne": "p0001", "prestation": "f001", "libelle": "…" } ],
  "factures": [ { "ref": "fa00001", "numero": "FA2026-0412", "date": "2026-09-01", "echeance": null,
                  "client": "p0006", "client_nom": "MARTIN Sophie",
                  "lignes": [ { "libelle": "…", "quantite": 1, "prix_unitaire_ttc": 780, "tva": 5.5, "total_ttc": 780 } ],
                  "total_ttc": 805, "paye": 805, "reste": 0,
                  "statut": "payee|partielle|due|annulee|avoir|inconnu", "moyen": "prelevement", "avoir": false } ],
  "reglements": [ { "ref": "rg00001", "date": "…", "client": "p0006", "montant": 780,
                    "moyen": "carte|prelevement|virement|cheque|especes|cheque_vacances|coupon_sport|pass_sport|en_ligne|autre",
                    "facture": "FA2026-0412", "reference": null, "remise": null } ],
  "reprises": [ { "ref": "r0001", "libelle": "Galop 3-4", "jour": 3 /* 1 = lundi */, "date": null, "debut": "14:00",
                  "duree_min": 60, "moniteur": "Hugo", "niveau": "Galop 3-4", "lieu": "Grand manège", "places": null,
                  "inscrits": [ { "personne": "p0001", "cheval": "c0002" } ] } ],
  "equipe": [ { "personne": "p0012", "poste": "Moniteur", "contrat": "CDI", "heures_semaine": 35, "diplomes": null, "entree": null } ],
  "soins": [ { "cheval": "c0001", "date": "2026-10-02", "type": "vaccin|vermifuge|marechal|dentiste|osteopathe|veterinaire|autre",
               "detail": "Equilis Prequenza", "intervenant": "Dr Leroy", "prochain": "2027-04-02", "cout": null } ],
  "controle": { "cavaliers": 9, "chevaux": 5, "impayes_factures_ttc": 673, "…": "…" },
  "avertissements": [ { "niveau": "attention|info", "code": "mineur_sans_contact", "message": "…", "fichier": "…", "ligne": 7 } ]
}
```

## Passage à l'API d'import (app/ARCHITECTURE.md)

`versLots(paquet)` produit, dans l'ordre, des lots `{coll, items:[{external_id, data}]}` pour `staff`, `forfaits`, `members`, `horses`, `lessons`, `care`, `invoices`, `payments`. `data` suit la forme de `demo/core/data.js` ; les références s'écrivent `ext:<external_id>`.

Identifiants stables, pour que relancer la passerelle mette à jour au lieu de dupliquer :

| Objet | external_id |
|---|---|
| Personne | `lic:<licence>` sinon `src:<fichier#code>` sinon `np:<nom-prenom-naissance>` |
| Cheval | `sire:<SIRE>` sinon `ueln:<UELN>` sinon `nom:<nom>` |
| Forfait | `tarif:<libellé>` |
| Reprise | `reprise:<libellé-jour-heure>` |
| Facture | `facture:<numéro>` |
| Règlement | `reglement:<date:montant:référence>` |

Champs ajoutés à la forme de la démo (à prendre en compte côté serveur) : `members.birth`, `sex`, `phone2`, `address`, `licenceType`, `certDate`, `guardians` (références des responsables), `roles` ; `horses.since`, `pension`, `notes` ; `forfaits.vat`, `sessions`, `category`, `account`, `toComplete` ; `lessons.coachName`, `arenaName`, `level` (noms en clair, à rapprocher de l'équipe et des installations) ; `invoices.lines`, `paid`, `rest`, `imported` ; `care.next`, `cost`.
