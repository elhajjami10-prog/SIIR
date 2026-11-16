#!/usr/bin/env sh
# Assemble index.html (page autonome) à partir de src/siir.html
set -e
cd "$(dirname "$0")"
{
  printf '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<link rel="icon" href="assets/siir-mark.svg">\n<link rel="manifest" href="manifest.webmanifest">\n</head>\n<body>\n'
  cat src/siir.html
  printf '\n</body>\n</html>\n'
} > index.html
echo "index.html généré"
