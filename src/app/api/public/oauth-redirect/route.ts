import { NextResponse } from 'next/server'
import { getAuthBaseUrl, getGoogleOAuthRedirectUri } from '@/lib/auth/auth-base-url'
import { isGoogleAuthEnabled } from '@/lib/google-auth-enabled'

/** Menampilkan redirect URI OAuth yang dipakai server (untuk setup Google Cloud Console). */
export async function GET() {
  const baseUrl = getAuthBaseUrl()
  const redirectUri = getGoogleOAuthRedirectUri()

  return NextResponse.json({
    success: true,
    data: {
      googleAuthEnabled: isGoogleAuthEnabled,
      authBaseUrl: baseUrl,
      googleRedirectUri: redirectUri,
      javascriptOrigins: [baseUrl],
      setupHint:
        'Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client → tambahkan googleRedirectUri ke Authorized redirect URIs dan authBaseUrl ke Authorized JavaScript origins.',
    },
  })
}
