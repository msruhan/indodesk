#!/bin/bash

# Stop ngrok and delete Telegram webhook
# Usage: ./scripts/stop-telegram-webhook.sh

BOT_TOKEN="8632013694:AAFthrm3CrM-h8vN_SeS7eMDQQPPe9S2EhA"

echo "🛑 Stopping Telegram Webhook"
echo "============================="
echo ""

# Check if ngrok is running
if [ -f /tmp/ngrok-telegram.pid ]; then
    NGROK_PID=$(cat /tmp/ngrok-telegram.pid)
    
    if ps -p $NGROK_PID > /dev/null 2>&1; then
        echo "🔄 Stopping ngrok (PID: $NGROK_PID)..."
        kill $NGROK_PID
        echo "✅ ngrok stopped"
    else
        echo "⚠️  ngrok sudah tidak running"
    fi
    
    rm /tmp/ngrok-telegram.pid
else
    echo "⚠️  Tidak ada ngrok PID file"
    echo "   ngrok mungkin sudah di-stop atau tidak pernah di-start"
fi

echo ""
echo "🔄 Deleting webhook..."

RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook")

echo "📥 Response:"
echo "$RESPONSE" | python3 -m json.tool

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo ""
    echo "✅ Webhook berhasil dihapus!"
    echo ""
    echo "ℹ️  Bot sekarang tidak akan merespon di local development."
    echo "   Untuk test lagi, jalankan: ./scripts/setup-telegram-webhook.sh"
else
    echo ""
    echo "⚠️  Gagal hapus webhook (mungkin sudah tidak ada)"
fi

# Cleanup
rm -f /tmp/ngrok-telegram.url

echo ""
echo "✅ Cleanup selesai!"
