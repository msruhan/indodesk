#!/usr/bin/env node

/**
 * Test Telegram Webhook Locally
 * Simulates a Telegram webhook call to test the linking flow
 * 
 * Usage: node scripts/test-telegram-webhook.js <verification-token> <chat-id> <username>
 */

const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('🧪 Telegram Webhook Local Tester\n')

  // Get inputs
  const token = await question('Paste verification token (dari deep link): ')
  const chatId = await question('Telegram Chat ID Anda: ')
  const username = await question('Telegram username Anda (tanpa @): ')

  console.log('\n📤 Sending webhook request...\n')

  // Simulate Telegram webhook payload
  const webhookPayload = {
    update_id: Date.now(),
    message: {
      message_id: Date.now(),
      from: {
        id: parseInt(chatId),
        is_bot: false,
        first_name: 'Test User',
        username: username,
        language_code: 'id'
      },
      chat: {
        id: parseInt(chatId),
        type: 'private'
      },
      date: Math.floor(Date.now() / 1000),
      text: `/start ${token}`
    }
  }

  try {
    const response = await fetch('http://localhost:3001/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    })

    const result = await response.json()

    console.log('📥 Response:', JSON.stringify(result, null, 2))

    if (response.ok) {
      console.log('\n✅ Webhook processed successfully!')
      console.log('\n🎯 Next steps:')
      console.log('1. Kembali ke browser')
      console.log('2. Klik "Cek Status"')
      console.log('3. Status seharusnya "Terhubung"')
    } else {
      console.log('\n❌ Webhook failed!')
      console.log('Check the error message above.')
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.log('\nMake sure:')
    console.log('1. Dev server is running (npm run dev)')
    console.log('2. Server is accessible at http://localhost:3001')
  }

  rl.close()
}

main()
