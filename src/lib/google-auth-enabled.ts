/** Google OAuth aktif jika kredensial env terisi (dipakai server & feature flags API). */
export const isGoogleAuthEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim(),
)
