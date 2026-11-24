# E-mails du changement de logiciel (adhérents)

Quand un club passe à Piaffe, tous ses adhérents changent d'outil le même jour. Ces e-mails les accompagnent pour que ce soit simple et rassurant. Variables : `{{prenom}}`, `{{club}}`, `{{ancien_logiciel}}`, `{{date_bascule}}`, `{{lien_activation}}` (lien magique, valable 14 jours), `{{forfait}}`, `{{solde}}`, `{{prochaine_reprise}}`, `{{cheval}}`, `{{contact_club}}`, `{{gerant}}`. Les mineurs ne reçoivent rien : c'est le responsable légal qui reçoit l'e-mail, avec un compte famille qui regroupe ses enfants (`{{enfants}}`).

Côté gérant : écran « Prévenir mes adhérents » après l'import. Aperçu de chaque e-mail, choix de la date d'envoi (par défaut le lendemain à 18 h), envoi test à soi-même, puis suivi en direct : envoyés, ouverts, comptes activés, rebonds (adresse fausse, à corriger dans la fiche), et bouton « relancer ceux qui n'ont pas activé ».

---

## 1. Annonce (J0, envoyée par le club)

**Objet** : {{club}} change d'outil : rien à refaire de votre côté

Bonjour {{prenom}},

À partir du {{date_bascule}}, {{club}} passe de {{ancien_logiciel}} à Piaffe pour les inscriptions, le planning et les paiements.

Bonne nouvelle : tout a déjà été transféré. Votre fiche, votre forfait, votre historique et {{enfants_ou_vous}} sont prêts. Vous n'avez rien à ressaisir.

Il vous reste une seule chose à faire, en 30 secondes :

[Activer mon espace]({{lien_activation}})

Avec votre espace Piaffe, vous pourrez réserver ou annuler une reprise, payer en ligne, retrouver vos factures et suivre votre progression, depuis votre téléphone.

À très vite au club,
{{gerant}}, {{club}}

---

## 2. Activation en un clic (page d'arrivée du lien)

Le lien ouvre l'espace déjà rempli. Une seule page : « Vérifiez vos informations » (nom, e-mail, téléphone, enfants rattachés, forfait), un bouton « Tout est juste », un lien « Quelque chose est faux ? » qui prévient le club. Mot de passe facultatif : connexion par lien e-mail ou Google. Rien d'autre n'est demandé.

---

## 3. Confirmation (dès l'activation)

**Objet** : C'est fait, votre espace {{club}} est prêt

Bonjour {{prenom}},

Votre espace est activé. Voici ce que nous avons repris de {{ancien_logiciel}} :

- Forfait : {{forfait}}
- Solde : {{solde}}
- Prochaine reprise : {{prochaine_reprise}}
- Cheval : {{cheval}}

Si quelque chose ne correspond pas, répondez simplement à cet e-mail : il arrive directement au club.

Bonne équitation,
{{club}}

---

## 4. Relance J+3 (non activés)

**Objet** : Votre espace {{club}} vous attend

Bonjour {{prenom}},

Petit rappel : votre espace {{club}} est prêt, il ne reste qu'à l'activer. C'est là que vous réserverez vos reprises à partir du {{date_bascule}}.

[Activer mon espace]({{lien_activation}})

---

## 5. Relance J+7 (dernière, non activés)

**Objet** : Dernier rappel pour réserver vos reprises en ligne

Bonjour {{prenom}},

Sans activation, vous ne pourrez pas réserver ni annuler vos reprises en ligne. Cela prend 30 secondes, tout est déjà rempli.

[Activer mon espace]({{lien_activation}})

Un souci ? Appelez le club au {{contact_club}}, on vous aide.

---

## 6. Aide (lien « Quelque chose est faux ? » et réponses)

Message reçu par le gérant : « {{prenom}} {{nom}} signale une erreur sur sa fiche : {{message}} », avec un bouton qui ouvre la fiche à corriger. L'adhérent reçoit : « Merci, le club a reçu votre message et corrige votre fiche. Vous pouvez déjà utiliser votre espace. »

---

## 7. Récapitulatif au gérant (J+1, J+3, J+7)

**Objet** : Bascule vers Piaffe : {{actives}} adhérents sur {{total}} ont activé leur espace

Bonjour {{gerant}},

{{actives}} comptes activés, {{ouverts}} e-mails ouverts, {{rebonds}} adresses à corriger. [Voir le suivi]({{lien_suivi}})
