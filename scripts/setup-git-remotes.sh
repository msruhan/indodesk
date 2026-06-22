#!/usr/bin/env bash
# Ensure origin = bantoo (production), indodesk = legacy mirror.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BANTOO_URL="https://github.com/msruhan/bantoo.git"
INDODESK_URL="https://github.com/msruhan/indodesk.git"

origin_url="$(git remote get-url origin 2>/dev/null || true)"

if [[ "$origin_url" == "$BANTOO_URL" ]]; then
  echo "origin sudah menunjuk ke bantoo."
elif [[ "$origin_url" == "$INDODESK_URL" ]]; then
  echo "Menyusun ulang remote: origin → bantoo, indodesk → indodesk"
  git remote rename origin indodesk
  if git remote | grep -qx bantoo; then
    git remote rename bantoo origin
  else
    git remote add origin "$BANTOO_URL"
  fi
else
  echo "Menyetel origin ke bantoo..."
  if git remote | grep -qx origin; then
    git remote set-url origin "$BANTOO_URL"
  else
    git remote add origin "$BANTOO_URL"
  fi
  if ! git remote | grep -qx indodesk; then
    git remote add indodesk "$INDODESK_URL"
  fi
fi

git branch --set-upstream-to=origin/main main 2>/dev/null || true
if git show-ref --verify --quiet refs/heads/dev; then
  git branch --set-upstream-to=indodesk/dev dev 2>/dev/null || true
fi

echo ""
echo "Remote saat ini:"
git remote -v
echo ""
echo "Release production: npm run release -- v0.1.53"
