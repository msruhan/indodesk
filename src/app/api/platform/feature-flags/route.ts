import { NextResponse } from 'next/server'
import {
  DEFAULT_PUBLIC_FEATURE_FLAGS,
  getPublicFeatureFlags,
} from '@/lib/platform-settings'
import { isGoogleAuthEnabled } from '@/lib/google-auth-enabled'

export const dynamic = 'force-dynamic'

/**
 * Endpoint publik (tanpa auth) untuk mengambil feature flag yang aman dibaca
 * client. Saat ini hanya men-expose `imeiServiceEnabled` agar UI di navbar
 * bisa memutuskan apakah menampilkan menu "Layanan Perangkat".
 */
export async function GET() {
  try {
    const flags = await getPublicFeatureFlags()
    return NextResponse.json({
      success: true,
      data: { ...flags, googleAuthEnabled: isGoogleAuthEnabled },
    })
  } catch (e) {
    console.error('[PUBLIC_FEATURE_FLAGS_GET]', e)
    // Fallback ke default supaya client tidak macet bila DB belum siap.
    return NextResponse.json({
      success: true,
      data: { ...DEFAULT_PUBLIC_FEATURE_FLAGS, googleAuthEnabled: isGoogleAuthEnabled },
    })
  }
}
