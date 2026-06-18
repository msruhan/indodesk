#!/usr/bin/env bash
# Jalankan password strength checker
# Usage:
#   ./scripts/run-passwordchecker.sh
#   ./scripts/run-passwordchecker.sh "MyP@ssw0rd123"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CHECKER="${PASSWORD_CHECKER:-$PROJECT_DIR/src/passwordchecker_simple.py}"

if [[ ! -f "$CHECKER" ]]; then
  echo "File tidak ditemukan: $CHECKER" >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 tidak ditemukan. Install Python 3 terlebih dahulu." >&2
  exit 1
fi

exec python3 "$CHECKER" "$@"
