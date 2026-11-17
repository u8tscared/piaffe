# Piaffe

La plateforme tout-en-un des centres équestres et des écuries : club, chevaux, pensions, adhérents, planning, facturation, comptabilité, RH, compétitions, coachs, entretien, caméras, assistant IA, API et serveur MCP.

## Contenu du dépôt

- `research/` : audit des concurrents (France et international), intégrations et reprise des données, références de design et de mouvement.
- `demo/` : démo cliquable des quatre vues (gérant, employé, adhérent, coach) sur ordinateur, tablette et téléphone.
  - `core/` : design system, icônes dessinées pour Piaffe, données de démonstration, moteur.
  - `modules/` : un fichier par groupe d'écrans.
  - `MODULES.md` : le contrat que suit chaque écran.
  - `tools/build.js` assemble la démo en un seul fichier `demo/dist/piaffe.html`.
- `brand/` : logo et identité.

## Lancer la démo

```
cd demo
node tools/build.js
```

Puis ouvrir `demo/dist/preview.html` dans un navigateur.

Toutes les données de la démo sont fictives.
