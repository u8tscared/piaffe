#!/usr/bin/env bash
# Met Stabl en ligne sur Cloudflare, en une commande, et peut être relancé sans risque.
#
#   export CLOUDFLARE_API_TOKEN=…      # jeton « Modifier Cloudflare Workers » + D1 + R2 (dash.cloudflare.com › Mon profil › Jetons d'API)
#   export CLOUDFLARE_ACCOUNT_ID=…     # identifiant du compte (colonne de droite du tableau de bord)
#   export APP_URL=https://app.stablapp.fr   # adresse publique de l'appli (facultatif : sinon celle de wrangler.jsonc)
#   bash app/api/scripts/deployer.sh            # ou --essai pour tout vérifier sans rien publier
#
# Ce que fait le script, dans l'ordre :
#   1. installe les dépendances si besoin ;
#   2. crée la base D1 « piaffe » en juridiction UE si elle n'existe pas, et écrit son identifiant dans wrangler.jsonc ;
#   3. crée le stockage R2 « piaffe-files » en juridiction UE s'il n'existe pas ;
#   4. crée le secret SESSION_SECRET (aléatoire, 64 caractères) s'il n'existe pas encore ;
#   5. applique les migrations de la base ;
#   6. construit l'application web (app/web/dist) ;
#   7. publie le Worker.
# Les autres secrets (Stripe, Google, e-mail…) restent facultatifs : sans eux, l'appli affiche des messages clairs
# (« le paiement en ligne n'est pas encore activé… »). Voir app/COMPTES-A-CREER.md.
set -euo pipefail

ESSAI=0
[ "${1:-}" = "--essai" ] && ESSAI=1

ICI="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # app/api
WEB="$ICI/../web"
CONF="$ICI/wrangler.jsonc"
DB_NAME="piaffe"
BUCKET="piaffe-files"
export CI=1                  # wrangler : pas de question interactive
export WRANGLER_SEND_METRICS=false

etape() { printf '\n\033[1m▶ %s\033[0m\n' "$1"; }
fin()   { printf '\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

[ -n "${CLOUDFLARE_API_TOKEN:-}" ]  || fin "CLOUDFLARE_API_TOKEN manquant (jeton d'API Cloudflare)."
[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ] || fin "CLOUDFLARE_ACCOUNT_ID manquant (identifiant du compte Cloudflare)."
command -v node >/dev/null || fin "Node.js 20 ou plus est nécessaire."
cd "$ICI"

etape "Dépendances"
if [ ! -d node_modules ]; then npm ci --legacy-peer-deps --no-audit --no-fund; else echo "déjà installées"; fi
W="npx --no-install wrangler"

etape "Base de données D1 ($DB_NAME, UE)"
id_base() { $W d1 list --json 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const l=JSON.parse(s);const b=l.find(x=>x.name===process.argv[1]);process.stdout.write(b?(b.uuid||b.id||""):"")}catch{process.stdout.write("")}})' "$DB_NAME"; }
DB_ID="$(id_base)"
if [ -z "$DB_ID" ]; then
  if [ $ESSAI = 1 ]; then echo "(essai) la base serait créée"; DB_ID="ESSAI"; else
    $W d1 create "$DB_NAME" --jurisdiction eu
    DB_ID="$(id_base)"; [ -n "$DB_ID" ] || fin "La base a été demandée mais son identifiant est introuvable : relancez le script."
  fi
else echo "existe déjà ($DB_ID)"; fi
if [ $ESSAI = 0 ] && ! grep -q "\"database_id\": \"$DB_ID\"" "$CONF"; then
  node -e 'const fs=require("fs");const f=process.argv[1];const t=fs.readFileSync(f,"utf8").replace(/("database_name": "piaffe", "database_id": ")[^"]*(")/,"$1"+process.argv[2]+"$2");fs.writeFileSync(f,t)' "$CONF" "$DB_ID"
  echo "identifiant écrit dans wrangler.jsonc (à commiter)"
fi

etape "Stockage R2 ($BUCKET, UE)"
if $W r2 bucket list --jurisdiction eu 2>/dev/null | grep -q "^name:[[:space:]]*$BUCKET\$\|\"$BUCKET\"\|[[:space:]]$BUCKET\$"; then echo "existe déjà"
elif [ $ESSAI = 1 ]; then echo "(essai) le stockage serait créé"
else $W r2 bucket create "$BUCKET" --jurisdiction eu; fi

etape "Secret SESSION_SECRET"
if $W secret list 2>/dev/null | grep -q '"SESSION_SECRET"\|SESSION_SECRET'; then echo "existe déjà (jamais régénéré : cela invaliderait les liens envoyés)"
elif [ $ESSAI = 1 ]; then echo "(essai) le secret serait créé"
else
  SECRET="$(node -e 'process.stdout.write(require("crypto").randomBytes(32).toString("hex"))')"
  printf '%s' "$SECRET" | $W secret put SESSION_SECRET >/dev/null
  unset SECRET; echo "créé"
fi

etape "Migrations de la base"
if [ $ESSAI = 1 ]; then $W d1 migrations list "$DB_NAME" --remote || true; else $W d1 migrations apply "$DB_NAME" --remote; fi

etape "Application web"
node "$WEB/build.js"

etape "Publication"
VARS=()
[ -n "${APP_URL:-}" ] && VARS=(--var "APP_URL:$APP_URL")
if [ $ESSAI = 1 ]; then $W deploy --dry-run "${VARS[@]}"; echo; echo "Essai terminé : rien n'a été publié."; exit 0; fi
$W deploy "${VARS[@]}"

printf '\n\033[32m✓ Stabl est en ligne.\033[0m Vérifiez %s/api/health puis créez votre compte.\n' "${APP_URL:-l'adresse affichée ci-dessus}"
grep -q '"APP_URL": "http://localhost' "$CONF" && [ -z "${APP_URL:-}" ] && echo "Attention : APP_URL vaut encore http://localhost:8787 ; relancez avec APP_URL=https://… pour que les liens des e-mails soient justes." || true
