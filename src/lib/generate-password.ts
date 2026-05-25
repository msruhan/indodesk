/** Generate a random password suitable for admin-created accounts. */
export function generatePassword(length = 12): string {
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits = '23456789'
  const symbols = '!@#$%&*'
  const all = lower + upper + digits + symbols

  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)]

  const required = [pick(lower), pick(upper), pick(digits), pick(symbols)]
  const rest = Array.from({ length: Math.max(length - required.length, 0) }, () => pick(all))
  const combined = [...required, ...rest]

  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[combined[i], combined[j]] = [combined[j], combined[i]]
  }

  return combined.join('')
}
