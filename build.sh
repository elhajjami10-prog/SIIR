#!/usr/bin/env sh
# Assemble index.html (page autonome) à partir de src/siir.html.
# Si GOOGLE_MAPS_KEY est défini (variable GitHub Actions), la carte Google Maps est activée.
set -e
cd "$(dirname "$0")"
KEYTAG=""
if [ -n "$GOOGLE_MAPS_KEY" ]; then
  case "$GOOGLE_MAPS_KEY" in *[!A-Za-z0-9_-]*) echo "GOOGLE_MAPS_KEY invalide" >&2; exit 1;; esac
  KEYTAG="<script>window.SIIR_GMAPS_KEY=\"$GOOGLE_MAPS_KEY\"</script>"
fi
{
  printf '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<link rel="icon" href="assets/siir-mark.svg">\n<link rel="manifest" href="manifest.webmanifest">\n%s\n</head>\n<body>\n' "$KEYTAG"
  cat src/siir.html
  printf '\n</body>\n</html>\n'
} > index.html
echo "index.html généré${KEYTAG:+ (Google Maps activé)}"
