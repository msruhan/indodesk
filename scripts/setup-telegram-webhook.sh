#!/usr/bin/env bash
# Telegram Webhook Setup (dev via ngrok or production URL)
# Usage:
#   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... ./scripts/setup-telegram-webhook.sh
#   WEBHOOK_BASE_URL=https://yourdomain.com ./scripts/setup-telegram-webhook.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -f "$PROJECT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_DIR/.env"
  set +a
fi

BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
WEBHOOK_SECRET="${TELEGRAM_WEBHOOK_SECRET:-}"
WEBHOOK_BASE="${WEBHOOK_BASE_URL:-}"

if [[ -z "$BOT_TOKEN" ]]; then
  echo "❌ TELEGRAM_BOT_TOKEN belum diset (export atau isi di .env)"
  exit 1
fi

if [[ -z "$WEBHOOK_SECRET" ]]; then
  echo "⚠️  TELEGRAM_WEBHOOK_SECRET kosong — generate dengan: openssl rand -hex 32"
  WEBHOOK_SECRET="$(openssl rand -hex 32)"
  echo "   Simpan ke .env: TELEGRAM_WEBHOOK_SECRET=$WEBHOOK_SECRET"
fi

if [[ -z "$WEBHOOK_BASE" ]]; then
  if ! curl -sf http://localhost:3000 >/dev/null 2>&1; then
    echo "❌ Dev server tidak running dan WEBHOOK_BASE_URL tidak diset"
    echo "   Jalankan: npm run dev   atau   export WEBHOOK_BASE_URL=https://yourdomain.com"
    exit 1
  fi

  if ! command -v ngrok >/dev/null 2>&1; then
    echo "❌ ngrok diperlukan untuk tunnel lokal (brew install ngrok)"
    exit 1
  fi

  echo "🔄 Starting ngrok..."
  ngrok http 3000 >/dev/null &
  NGROK_PID=$!
  sleep 3
  WEBHOOK_BASE="$(curl -sf http://localhost:4040/api/tunnels | python3 -c "import sys,json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])" 2>/dev/null || true)"
  if [[ -z "$WEBHOOK_BASE" ]]; then
    kill "$NGROK_PID" 2>/dev/null || true
    echo "❌ Gagal mendapatkan URL ngrok"
    exit 1
  fi
  echo "✅ ngrok: $WEBHOOK_BASE (PID $NGROK_PID)"
  echo "$NGROK_PID" >/tmp/ngrok-telegram.pid
fi

WEBHOOK_URL="${WEBHOOK_BASE%/}/api/telegram/webhook"
export WEBHOOK_URL WEBHOOK_SECRET
echo "📤 setWebhook → $WEBHOOK_URL"

PAYLOAD=$(python3 - <<PY
import json, os
print(json.dumps({
  "url": os.environ["WEBHOOK_URL"],
  "allowed_updates": ["message"],
  "secret_token": os.environ["WEBHOOK_SECRET"],
}))
PY
)
RESPONSE=$(curl -sf -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "$RESPONSE" | python3 -m json.tool

if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo ""
  echo "✅ Webhook OK. Pastikan server memakai TELEGRAM_WEBHOOK_SECRET yang sama."
  echo "   Header dari Telegram: X-Telegram-Bot-Api-Secret-Token"
else
  echo "❌ Gagal set webhook"
  exit 1
fi
