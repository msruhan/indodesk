/** Base URL untuk Auth.js (tanpa trailing slash). */
export function getAuthBaseUrl(): string {
  const fromEnv =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return 'http://localhost:3000'
}

export function getGoogleOAuthRedirectUri(): string {
  return `${getAuthBaseUrl()}/api/auth/callback/google`
}
