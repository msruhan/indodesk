#!/usr/bin/env bash
# Create and push a production release tag to origin (msruhan/bantoo).
# Usage: ./scripts/release-tag.sh v0.1.53
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TAG="${1:-}"
if [[ -z "$TAG" ]]; then
  echo "Usage: npm run release -- v0.1.53" >&2
  exit 1
fi

if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  echo "ERROR: Tag harus format semver, contoh v0.1.53" >&2
  exit 1
fi

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "ERROR: Tag $TAG sudah ada. Hapus dulu atau pilih versi baru." >&2
  exit 1
fi

if ! git remote get-url origin 2>/dev/null | grep -q 'msruhan/bantoo'; then
  echo "ERROR: remote 'origin' bukan msruhan/bantoo." >&2
  echo "Jalankan: npm run setup:git-remotes" >&2
  exit 1
fi

echo "Release $TAG → origin (msruhan/bantoo)"
git tag "$TAG"
git push origin main
git push origin "$TAG"
echo "Selesai. Pantau CI: https://github.com/msruhan/bantoo/actions"
