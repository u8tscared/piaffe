#!/bin/sh
# Construit le site GitHub Pages dans _pages/ : landing en racine, démo dans demo/
set -e
cd "$(dirname "$0")"
node demo/tools/build.js >/dev/null
PIAFFE_DEMO=pages node site/build.js >/dev/null
rm -rf _pages && mkdir -p _pages/demo
H='<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect width=%2232%22 height=%2232%22 rx=%228%22 fill=%22%230a1636%22/%3E%3C/svg%3E"><style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'
{ printf '%s\n' "$H"; cat site/dist/landing.html; printf '\n</body></html>\n'; } > _pages/index.html
{ printf '%s\n' "$H"; cat demo/dist/piaffe.html; printf '\n</body></html>\n'; } > _pages/demo/index.html
cp -r site/shots _pages/shots && rm -rf _pages/shots/_png
touch _pages/.nojekyll
node site/build.js >/dev/null
echo "OK _pages"
