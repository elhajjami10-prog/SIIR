#!/usr/bin/env sh
# Assemble index.html (page autonome) à partir de src/siir.html.
# Variables optionnelles (GitHub › Settings › Secrets and variables › Actions › Variables) :
#   GOOGLE_MAPS_KEY  clé Google Maps (carte, recherche, itinéraires)
#   FIREBASE_CONFIG  objet firebaseConfig copié depuis la console Firebase (SMS + temps réel)
#   ADMIN_PHONES     numéros autorisés sur la console admin, séparés par des virgules
set -e
cd "$(dirname "$0")"
INJECT=""
if [ -n "$GOOGLE_MAPS_KEY" ]; then
  case "$GOOGLE_MAPS_KEY" in *[!A-Za-z0-9_-]*) echo "GOOGLE_MAPS_KEY invalide" >&2; exit 1;; esac
  INJECT="$INJECT<script>window.SIIR_GMAPS_KEY=\"$GOOGLE_MAPS_KEY\"</script>"
fi
if [ -n "$FIREBASE_CONFIG" ]; then
  # Accepte le JSON ou l'extrait JavaScript de la console ; ne garde que les champs connus.
  FBJSON=$(node -e '
    const s=process.env.FIREBASE_CONFIG,keep=["apiKey","authDomain","projectId","storageBucket","messagingSenderId","appId","measurementId"],o={};
    for(const m of s.matchAll(/["\x27]?(\w+)["\x27]?\s*:\s*["\x27]([^"\x27]*)["\x27]/g)) if(keep.includes(m[1])&&/^[\w.:\/-]*$/.test(m[2])) o[m[1]]=m[2];
    if(!o.apiKey||!o.projectId||!o.appId){console.error("FIREBASE_CONFIG incomplet (apiKey, projectId, appId requis)");process.exit(1)}
    if(!o.authDomain)o.authDomain=o.projectId+".firebaseapp.com";
    process.stdout.write(JSON.stringify(o))')
  INJECT="$INJECT<script>window.SIIR_FIREBASE=$FBJSON</script>"
fi
if [ -n "$ADMIN_PHONES" ]; then
  case "$ADMIN_PHONES" in *[!0-9+,\ \;]*) echo "ADMIN_PHONES invalide" >&2; exit 1;; esac
  INJECT="$INJECT<script>window.SIIR_ADMIN_PHONES=\"$ADMIN_PHONES\"</script>"
fi
{
  printf '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<link rel="icon" href="assets/siir-mark.svg">\n<link rel="manifest" href="manifest.webmanifest">\n%s\n</head>\n<body>\n' "$INJECT"
  cat src/siir.html
  printf '\n</body>\n</html>\n'
} > index.html
echo "index.html généré${GOOGLE_MAPS_KEY:+ · Google Maps}${FIREBASE_CONFIG:+ · Firebase}${ADMIN_PHONES:+ · admins}"
