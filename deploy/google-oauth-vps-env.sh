#!/usr/bin/env bash
# Patch Google OAuth di .env.production (jalankan di VPS).
# Usage:
#   AUTH_GOOGLE_ID='....apps.googleusercontent.com' \
#   AUTH_GOOGLE_SECRET='GOCSPX-...' \
#   bash deploy/google-oauth-vps-env.sh
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/indoteknizi}"
ENV_FILE="${ENV_FILE:-.env.production}"
PATH_FILE="$INSTALL_DIR/$ENV_FILE"

AUTH_GOOGLE_ID="${AUTH_GOOGLE_ID:?AUTH_GOOGLE_ID wajib}"
AUTH_GOOGLE_SECRET="${AUTH_GOOGLE_SECRET:?AUTH_GOOGLE_SECRET wajib}"

[[ -f "$PATH_FILE" ]] || { echo "ERROR: $PATH_FILE tidak ditemukan"; exit 1; }

upsert() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$PATH_FILE" 2>/dev/null; then
    sed -i.bak "s|^${key}=.*|${key}=\"${val}\"|" "$PATH_FILE"
  else
    printf '\n%s="%s"\n' "$key" "$val" >> "$PATH_FILE"
  fi
}

upsert AUTH_GOOGLE_ID "$AUTH_GOOGLE_ID"
upsert AUTH_GOOGLE_SECRET "$AUTH_GOOGLE_SECRET"

echo "✅ Google OAuth env diperbarui di $PATH_FILE"
grep -E '^AUTH_GOOGLE_' "$PATH_FILE" | sed 's/\(SECRET=\).*/\1***redacted***/'
