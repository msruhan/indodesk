#!/bin/bash

# Telegram Manual Linking Helper Script
# Usage: ./scripts/link-telegram-manual.sh

echo "🔗 Telegram Manual Linking Helper"
echo "=================================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3001 > /dev/null; then
    echo "❌ Dev server tidak running!"
    echo "   Jalankan: npm run dev"
    exit 1
fi

echo "✅ Dev server running"
echo ""

# Get inputs
echo "📝 Masukkan informasi berikut:"
echo ""

read -p "1. Verification Token (dari deep link): " TOKEN
read -p "2. Telegram Chat ID (dari @userinfobot): " CHAT_ID
read -p "3. Telegram Username (tanpa @): " USERNAME
read -p "4. Session Token (dari browser DevTools): " SESSION_TOKEN

echo ""
echo "📤 Mengirim request..."
echo ""

# Make API call
RESPONSE=$(curl -s -X POST http://localhost:3001/api/teknisi/telegram/verify-manual \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d "{
    \"token\": \"$TOKEN\",
    \"chatId\": \"$CHAT_ID\",
    \"username\": \"$USERNAME\"
  }")

echo "📥 Response:"
echo "$RESPONSE" | python3 -m json.tool

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "✅ Berhasil!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Kembali ke browser"
    echo "2. Klik 'Cek Status'"
    echo "3. Status seharusnya 'Terhubung'"
    echo ""
    echo "🧪 Test kirim notifikasi:"
    echo "curl -X POST https://api.telegram.org/bot8632013694:AAFthrm3CrM-h8vN_SeS7eMDQQPPe9S2EhA/sendMessage \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"chat_id\":\"$CHAT_ID\",\"text\":\"✅ Test notifikasi dari IndoTeknizi!\"}'"
else
    echo ""
    echo "❌ Gagal!"
    echo "Cek error message di atas."
fi
