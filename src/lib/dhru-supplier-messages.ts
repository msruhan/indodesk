/**
 * Pesan user-facing untuk kegagalan koneksi/sync ke supplier Dhru Fusion.
 */

const IP_WHITELIST_MESSAGE =
  'IP publik server harus di-whitelist oleh supplier sebelum API dapat digunakan. ' +
  'Hubungi penyedia (hosting / Imunify360 / firewall) dengan IP deployment Anda, lalu coba lagi.'

const HOST_URL_MESSAGE =
  'Tidak dapat menjangkau API Dhru di host ini. Periksa URL host — banyak panel memakai path /dhru ' +
  '(contoh: https://example.com/dhru) — lalu uji koneksi lagi.'

function matchesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n))
}

export function formatDhruSupplierUserMessage(raw: string): string {
  const msg = raw.trim()
  if (!msg) return 'Koneksi supplier gagal. Periksa host, username, dan API key.'

  const lower = msg.toLowerCase()

  if (
    matchesAny(lower, [
      'imunify',
      'bot protection',
      'bot-protection',
      'whitelist',
      'humans_',
      'automation should be whitelisted',
      '415 unsupported',
      'returned 415',
      'unsupported media type',
      'access denied',
    ])
  ) {
    return IP_WHITELIST_MESSAGE
  }

  if (
    matchesAny(lower, [
      'endpoint not found',
      'invalid json',
      'rest api pro',
      'html',
      'could not reach',
    ])
  ) {
    return HOST_URL_MESSAGE
  }

  if (matchesAny(lower, ['authentication failed', 'invalid api key', 'api key is invalid', 'username'])) {
    return msg
  }

  return msg.replace(/^DhruFusion API returned \d+:\s*/i, 'Error API supplier: ')
}

export function dhruSupplierErrorTitle(raw: string): string {
  const lower = raw.toLowerCase()
  if (
    matchesAny(lower, [
      'imunify',
      'bot protection',
      'whitelist',
      '415',
      'unsupported media type',
      'humans_',
      'access denied',
    ])
  ) {
    return 'Perlu whitelist IP supplier'
  }
  return 'Koneksi gagal'
}
