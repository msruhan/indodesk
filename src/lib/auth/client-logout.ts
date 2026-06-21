'use client'

import { getSession, signOut } from 'next-auth/react'

type ClientLogoutOptions = {
  callbackUrl?: string
}

/**
 * Clears Auth.js session cookies and client cache.
 * Falls back to hard navigation if the session cookie survives signOut.
 */
export async function completeClientLogout(options: ClientLogoutOptions = {}): Promise<void> {
  const callbackUrl = options.callbackUrl ?? '/'

  await signOut({ redirect: false })

  const session = await getSession()
  if (session?.user) {
    window.location.assign(callbackUrl)
  }
}
