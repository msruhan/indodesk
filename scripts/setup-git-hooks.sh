#!/usr/bin/env bash
# One-time setup: enable repo git hooks (release tag guard).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

chmod +x .githooks/pre-push
git config core.hooksPath .githooks

echo "Git hooks aktif: core.hooksPath=.githooks"
echo "  - pre-push: blokir tag v* ke remote indodesk"
