#!/usr/bin/env node

/**
 * Telegram Integration Setup Verification Script
 * 
 * Usage: node scripts/verify-telegram-setup.js
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Verifying Telegram Integration Setup...\n')

let hasErrors = false

// 1. Check .env file
console.log('1️⃣ Checking environment variables...')
const envPath = path.join(__dirname, '..', '.env')
if (!fs.existsSync(envPath)) {
  console.log('   ❌ .env file not found!')
  console.log('   → Copy .env.example to .env and add your Telegram credentials')
  hasErrors = true
} else {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  
  const hasBotToken = envContent.includes('TELEGRAM_BOT_TOKEN=')
  const hasBotUsername = envContent.includes('NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=')
  
  if (!hasBotToken) {
    console.log('   ❌ TELEGRAM_BOT_TOKEN not found in .env')
    console.log('   → Add: TELEGRAM_BOT_TOKEN="your-bot-token"')
    hasErrors = true
  } else {
    const tokenMatch = envContent.match(/TELEGRAM_BOT_TOKEN="?([^"\n]+)"?/)
    if (tokenMatch && tokenMatch[1] && tokenMatch[1].length > 10) {
      console.log('   ✅ TELEGRAM_BOT_TOKEN is set')
    } else {
      console.log('   ⚠️  TELEGRAM_BOT_TOKEN is empty or invalid')
      hasErrors = true
    }
  }
  
  if (!hasBotUsername) {
    console.log('   ❌ NEXT_PUBLIC_TELEGRAM_BOT_USERNAME not found in .env')
    console.log('   → Add: NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="YourBotName"')
    hasErrors = true
  } else {
    const usernameMatch = envContent.match(/NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="?([^"\n]+)"?/)
    if (usernameMatch && usernameMatch[1] && usernameMatch[1].length > 0) {
      console.log('   ✅ NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is set')
    } else {
      console.log('   ⚠️  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is empty')
      hasErrors = true
    }
  }
}

// 2. Check required files
console.log('\n2️⃣ Checking required files...')
const requiredFiles = [
  'src/lib/telegram.ts',
  'src/components/telegram/telegram-link-card.tsx',
  'src/app/api/teknisi/telegram/link/route.ts',
  'src/app/api/teknisi/telegram/status/route.ts',
  'src/app/api/teknisi/telegram/unlink/route.ts',
  'src/app/api/telegram/webhook/route.ts',
]

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`)
  } else {
    console.log(`   ❌ ${file} not found!`)
    hasErrors = true
  }
})

// 3. Check providers.tsx has Toaster
console.log('\n3️⃣ Checking Toaster in providers...')
const providersPath = path.join(__dirname, '..', 'src/components/providers.tsx')
if (fs.existsSync(providersPath)) {
  const providersContent = fs.readFileSync(providersPath, 'utf-8')
  const hasToasterImport = providersContent.includes("import { Toaster } from 'sonner'")
  const hasToasterComponent = providersContent.includes('<Toaster')
  
  if (hasToasterImport && hasToasterComponent) {
    console.log('   ✅ Toaster properly configured')
  } else {
    if (!hasToasterImport) {
      console.log('   ❌ Toaster import missing')
      hasErrors = true
    }
    if (!hasToasterComponent) {
      console.log('   ❌ Toaster component not rendered')
      hasErrors = true
    }
  }
} else {
  console.log('   ❌ providers.tsx not found!')
  hasErrors = true
}

// 4. Check package.json has sonner
console.log('\n4️⃣ Checking dependencies...')
const packagePath = path.join(__dirname, '..', 'package.json')
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
  if (packageJson.dependencies && packageJson.dependencies.sonner) {
    console.log(`   ✅ sonner installed (${packageJson.dependencies.sonner})`)
  } else {
    console.log('   ❌ sonner not installed!')
    console.log('   → Run: npm install sonner')
    hasErrors = true
  }
} else {
  console.log('   ❌ package.json not found!')
  hasErrors = true
}

// 5. Check TelegramLinkCard integration
console.log('\n5️⃣ Checking component integration...')
const akunViewPath = path.join(__dirname, '..', 'src/components/teknisi/teknisi-akun-view.tsx')
if (fs.existsSync(akunViewPath)) {
  const akunViewContent = fs.readFileSync(akunViewPath, 'utf-8')
  const hasImport = akunViewContent.includes("import { TelegramLinkCard } from '@/components/telegram/telegram-link-card'")
  const hasComponent = akunViewContent.includes('<TelegramLinkCard')
  
  if (hasImport && hasComponent) {
    console.log('   ✅ TelegramLinkCard integrated in teknisi-akun-view')
  } else {
    if (!hasImport) {
      console.log('   ❌ TelegramLinkCard import missing')
      hasErrors = true
    }
    if (!hasComponent) {
      console.log('   ❌ TelegramLinkCard component not used')
      hasErrors = true
    }
  }
} else {
  console.log('   ❌ teknisi-akun-view.tsx not found!')
  hasErrors = true
}

// Summary
console.log('\n' + '='.repeat(50))
if (hasErrors) {
  console.log('❌ Setup verification FAILED')
  console.log('\nPlease fix the issues above and run this script again.')
  console.log('\nFor detailed troubleshooting, see:')
  console.log('   ../TELEGRAM_TROUBLESHOOTING.md')
  process.exit(1)
} else {
  console.log('✅ Setup verification PASSED')
  console.log('\nNext steps:')
  console.log('1. Restart dev server: npm run dev')
  console.log('2. Hard refresh browser (Cmd+Shift+R)')
  console.log('3. Login as TEKNISI')
  console.log('4. Navigate to Settings → Pengaturan')
  console.log('5. Test Telegram linking flow')
  console.log('\nFor detailed testing guide, see:')
  console.log('   ../TELEGRAM_TROUBLESHOOTING.md')
  process.exit(0)
}
