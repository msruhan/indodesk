#!/usr/bin/env bash
# Patch variabel Telegram di .env.production (jalankan di VPS).
# Usage:
#   TELEGRAM_BOT_TOKEN='...' \
#   TELEGRAM_WEBHOOK_SECRET='...' \
#   NEXT_PUBLIC_TELEGRAM_BOT_USERNAME='bantoo_bot' \
#   bash deploy/telegram-vps-env.sh
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/indoteknizi}"
ENV_FILE="${ENV_FILE:-.env.production}"
PATH_FILE="$INSTALL_DIR/$ENV_FILE"

TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN wajib}"
TELEGRAM_WEBHOOK_SECRET="${TELEGRAM_WEBHOOK_SECRET:?TELEGRAM_WEBHOOK_SECRET wajib}"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="${NEXT_PUBLIC_TELEGRAM_BOT_USERNAME:-bantoo_bot}"

[[ -f "$PATH_FILE" ]] || { echo "ERROR: $PATH_FILE tidak ditemukan"; exit 1; }

upsert() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$PATH_FILE" 2>/dev/null; then
    sed -i.bak "s|^${key}=.*|${key}=\"${val}\"|" "$PATH_FILE"
  else
    printf '\n%s="%s"\n' "$key" "$val" >> "$PATH_FILE"
  fi
}

upsert TELEGRAM_BOT_TOKEN "$TELEGRAM_BOT_TOKEN"
upsert TELEGRAM_WEBHOOK_SECRET "$TELEGRAM_WEBHOOK_SECRET"
upsert NEXT_PUBLIC_TELEGRAM_BOT_USERNAME "$NEXT_PUBLIC_TELEGRAM_BOT_USERNAME"

echo "✅ Telegram env diperbarui di $PATH_FILE"
grep -E '^TELEGRAM_|^NEXT_PUBLIC_TELEGRAM' "$PATH_FILE" | sed 's/\(TOKEN=\|SECRET=\).*/\1***redacted***/'
