'use client'

import { useEffect } from 'react'
import { Outfit } from 'next/font/google'
import { ErrorPageView } from '@/components/error/error-page-view'
import { classifyError } from '@/lib/error-pages'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/** Menangani error di root layout — harus menyertakan html/body sendiri. */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[GLOBAL_ERROR]', error)
  }, [error])

  return (
    <html lang="id" className={outfit.variable}>
      <body className={outfit.className}>
        <ErrorPageView
          content={classifyError(error)}
          digest={error.digest}
          error={error}
          onRetry={reset}
        />
      </body>
    </html>
  )
}
