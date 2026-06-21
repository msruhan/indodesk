#!/usr/bin/env bash
# Patch variabel Tripay di .env.production (jalankan di VPS).
# Usage:
#   TRIPAY_API_KEY='...' \
#   TRIPAY_PRIVATE_KEY='...' \
#   TRIPAY_MERCHANT_CODE='T51024' \
#   TRIPAY_MODE='production' \
#   TRIPAY_CALLBACK_URL='https://bantoo.in/api/payments/tripay/callback' \
#   bash deploy/tripay-vps-env.sh
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/indoteknizi}"
ENV_FILE="${ENV_FILE:-.env.production}"
PATH_FILE="$INSTALL_DIR/$ENV_FILE"

TRIPAY_API_KEY="${TRIPAY_API_KEY:?TRIPAY_API_KEY wajib}"
TRIPAY_PRIVATE_KEY="${TRIPAY_PRIVATE_KEY:?TRIPAY_PRIVATE_KEY wajib}"
TRIPAY_MERCHANT_CODE="${TRIPAY_MERCHANT_CODE:?TRIPAY_MERCHANT_CODE wajib}"
TRIPAY_MODE="${TRIPAY_MODE:-production}"
TRIPAY_CALLBACK_URL="${TRIPAY_CALLBACK_URL:-https://bantoo.in/api/payments/tripay/callback}"

[[ -f "$PATH_FILE" ]] || { echo "ERROR: $PATH_FILE tidak ditemukan"; exit 1; }

upsert() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$PATH_FILE" 2>/dev/null; then
    sed -i.bak "s|^${key}=.*|${key}=\"${val}\"|" "$PATH_FILE"
  else
    printf '\n%s="%s"\n' "$key" "$val" >> "$PATH_FILE"
  fi
}

upsert TRIPAY_API_KEY "$TRIPAY_API_KEY"
upsert TRIPAY_PRIVATE_KEY "$TRIPAY_PRIVATE_KEY"
upsert TRIPAY_MERCHANT_CODE "$TRIPAY_MERCHANT_CODE"
upsert TRIPAY_MODE "$TRIPAY_MODE"
upsert TRIPAY_CALLBACK_URL "$TRIPAY_CALLBACK_URL"

echo "✅ Tripay env diperbarui di $PATH_FILE"
grep -E '^TRIPAY_' "$PATH_FILE" | sed 's/\(API_KEY=\|PRIVATE_KEY=\).*/\1***redacted***/'
