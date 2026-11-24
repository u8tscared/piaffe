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
- `migration/` : passerelle de migration (page web et robot pour ordinateur) qui reprend les données d'un club depuis Kavalog, Equimondo, la FFE ou Excel. Voir `migration/README.md`.

## Lancer la démo

```
cd demo
node tools/build.js
```

Puis ouvrir `demo/dist/preview.html` dans un navigateur.

Toutes les données de la démo sont fictives.

## Le logiciel (app/)

`app/` contient le vrai logiciel vendu aux écuries : un Worker Cloudflare (`app/api`, Hono, D1, R2) qui sert l'API et l'application web (`app/web`, les écrans de la démo branchés sur les vraies données).

- Architecture et contrats : `app/ARCHITECTURE.md`
- Comptes à créer et mise en ligne : `app/COMPTES-A-CREER.md`
- Tests : `cd app/api && npm ci && npx vitest run`
- Lancer en local : `node app/web/build.js`, puis dans `app/api` : `npx wrangler d1 migrations apply piaffe --local` et `npx wrangler dev`
