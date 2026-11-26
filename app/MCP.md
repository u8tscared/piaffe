# Connecter Stabl à Claude ou ChatGPT

Votre assistant peut lire les données de votre club dans Stabl et répondre avec vos vrais chiffres : « Quels chevaux ont un soin en retard ? », « Combien d'impayés de plus de 30 jours ? », « Reste-t-il de la place mercredi en Galop 3 ? ».

## L'adresse à retenir

```
https://app.stablapp.fr/mcp
```

## Dans Claude (claude.ai, appli ordinateur ou téléphone)

1. Ouvrez **Paramètres › Connecteurs**, puis **Ajouter un connecteur personnalisé**.
2. Nom : `Stabl`. Adresse : `https://app.stablapp.fr/mcp`. Validez.
3. Cliquez sur **Se connecter**. Une page Stabl s'ouvre : connectez-vous si besoin, choisissez votre club, puis **Autoriser**.
4. Dans une conversation, activez Stabl dans le menu des outils et posez votre question.

## Dans ChatGPT

1. Ouvrez **Paramètres › Applications et connecteurs**, puis **Créer** (selon votre offre, il faut parfois activer le mode développeur dans les paramètres avancés).
2. Nom : `Stabl`. Adresse du serveur MCP : `https://app.stablapp.fr/mcp`. Authentification : **OAuth**.
3. Connectez-vous à Stabl sur la page qui s'ouvre, choisissez votre club, puis **Autoriser**.

Les menus changent parfois de nom : cherchez « Connecteurs » ou « Applications ».

## Ce que l'assistant peut faire

- **Lire** : le club en bref, les chevaux, les soins à venir et en retard, les pensions, les adhérents, le planning, les places libres, les impayés, le chiffre d'affaires, les présences, les stocks, l'équipe, les concours, les contrats et les tâches.
- **Ajouter**, seulement si vous cochez « Permettre aussi les ajouts » au moment d'autoriser : un soin, une place dans une reprise, une tâche cochée. L'assistant vous montre toujours ce qu'il va enregistrer et attend votre « oui ». Il ne peut rien supprimer.

L'assistant voit exactement ce que vous voyez dans Stabl. Un employé ne voit ni les factures ni le chiffre d'affaires. Les adhérents et les coachs ne peuvent pas relier d'assistant.

## Retirer l'accès

Dans Stabl, **Réglages › Connecteurs** : la liste des assistants reliés, qui les a reliés, leur dernier usage et le journal de leurs questions. **Retirer** coupe l'accès tout de suite.

## Sans compte Claude ou ChatGPT relié : la clé d'API

Pour un outil qui ne gère pas la connexion OAuth, créez une clé dans **Réglages › Clés d'API** avec le droit « read » (et « write » pour les ajouts), puis donnez-la comme en-tête `Authorization: Bearer pk_live_…`. Gardez-la secrète : elle donne accès aux données du club.

## Bon à savoir

- Les chiffres sont lus en direct. Chaque réponse indique l'heure de lecture et la date de la dernière saisie dans Stabl.
- L'assistant réfléchit chez Claude ou ChatGPT : Stabl ne paie et ne facture aucune IA pour ce service.
- Au plus 60 questions par minute et par assistant.
