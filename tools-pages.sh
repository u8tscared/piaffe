#!/bin/sh
# Construit le site GitHub Pages dans _pages/ : landing en racine, démo dans demo/
set -e
cd "$(dirname "$0")"
node demo/tools/build.js >/dev/null
PIAFFE_DEMO=pages node site/build.js >/dev/null
rm -rf _pages && mkdir -p _pages/demo
META='<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Stabl"><meta name="application-name" content="Stabl"><meta name="theme-color" content="#0a1636">'
H1='<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Stabl</title>'"$META"'<link rel="icon" href="icons/favicon.svg" type="image/svg+xml"><link rel="icon" href="icons/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="icons/apple-touch-icon-180.png"><link rel="manifest" href="manifest.webmanifest"><style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'
H2='<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Stabl · démo</title>'"$META"'<link rel="icon" href="../icons/favicon.svg" type="image/svg+xml"><link rel="icon" href="../icons/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="../icons/apple-touch-icon-180.png"><link rel="manifest" href="manifest.webmanifest"><style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'
{ printf '%s\n' "$H1"; cat site/dist/landing.html; printf '\n</body></html>\n'; } > _pages/index.html
{ printf '%s\n' "$H2"; cat demo/dist/piaffe.html; printf '\n</body></html>\n'; } > _pages/demo/index.html
mkdir -p _pages/icons && cp brand/stabl/icone/favicon.svg brand/stabl/icone/favicon.ico brand/stabl/icone/apple-touch-icon-180.png brand/stabl/icone/pwa-192.png brand/stabl/icone/pwa-512.png brand/stabl/icone/pwa-maskable-512.png _pages/icons/
cp brand/stabl/web/manifest-site.webmanifest _pages/manifest.webmanifest && cp brand/stabl/web/manifest-demo.webmanifest _pages/demo/manifest.webmanifest
cp -r site/shots _pages/shots && rm -rf _pages/shots/_png
node migration/tools/construire.mjs >/dev/null && mkdir -p _pages/passerelle && cp migration/dist/passerelle.html _pages/passerelle/index.html
touch _pages/.nojekyll
node site/build.js >/dev/null
echo "OK _pages"
