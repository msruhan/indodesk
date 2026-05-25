#!/bin/bash

# Telegram Webhook Setup with ngrok
# Usage: ./scripts/setup-telegram-webhook.sh

BOT_TOKEN="8632013694:AAFthrm3CrM-h8vN_SeS7eMDQQPPe9S2EhA"

echo "🚀 Telegram Webhook Setup dengan ngrok"
echo "======================================="
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Dev server tidak running!"
    echo ""
    echo "Buka terminal baru dan jalankan:"
    echo "  cd indoteknizi"
    echo "  npm run dev"
    echo ""
    echo "Lalu jalankan script ini lagi."
    exit 1
fi

echo "✅ Dev server running"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok belum terinstall!"
    echo ""
    echo "Install dengan:"
    echo "  brew install ngrok/ngrok/ngrok"
    exit 1
fi

echo "✅ ngrok terinstall ($(ngrok version))"
echo ""

echo "📝 Langkah-langkah:"
echo "1. Script ini akan start ngrok di background"
echo "2. Mendapatkan public URL dari ngrok"
echo "3. Set webhook Telegram ke URL tersebut"
echo "4. Anda bisa test linking flow seperti biasa"
echo ""

read -p "Lanjutkan? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Dibatalkan."
    exit 0
fi

echo ""
echo "🔄 Starting ngrok..."

# Start ngrok in background
ngrok http 3000 > /dev/null &
NGROK_PID=$!

echo "   PID: $NGROK_PID"
echo "   Waiting for ngrok to start..."
sleep 3

# Get ngrok public URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])" 2>/dev/null)

if [ -z "$NGROK_URL" ]; then
    echo ""
    echo "❌ Gagal mendapatkan ngrok URL!"
    echo "   Coba jalankan manual:"
    echo "   ngrok http 3000"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo ""
echo "✅ ngrok running!"
echo "   Public URL: $NGROK_URL"
echo ""

# Set webhook
WEBHOOK_URL="$NGROK_URL/api/telegram/webhook"
echo "📤 Setting webhook..."
echo "   URL: $WEBHOOK_URL"
echo ""

RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$WEBHOOK_URL\"}")

echo "📥 Response:"
echo "$RESPONSE" | python3 -m json.tool

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo ""
    echo "✅ Webhook berhasil di-set!"
    echo ""
    echo "🎯 Sekarang Anda bisa test:"
    echo "1. Buka browser: http://localhost:3000"
    echo "2. Login sebagai TEKNISI"
    echo "3. Buka Settings → Pengaturan"
    echo "4. Klik 'Hubungkan Telegram'"
    echo "5. Klik 'Buka Telegram'"
    echo "6. Bot akan otomatis merespon! ✅"
    echo "7. Klik 'Cek Status' di browser"
    echo "8. Status: 'Terhubung' ✅"
    echo ""
    echo "📊 Monitor ngrok traffic:"
    echo "   http://localhost:4040"
    echo ""
    echo "⚠️  PENTING:"
    echo "   - Jangan close terminal ini!"
    echo "   - ngrok running di background (PID: $NGROK_PID)"
    echo "   - Untuk stop: ./scripts/stop-telegram-webhook.sh"
    echo ""
    
    # Save PID for cleanup
    echo $NGROK_PID > /tmp/ngrok-telegram.pid
    echo "$NGROK_URL" > /tmp/ngrok-telegram.url
    
else
    echo ""
    echo "❌ Gagal set webhook!"
    echo "   Cek error message di atas."
    kill $NGROK_PID 2>/dev/null
    exit 1
fi
