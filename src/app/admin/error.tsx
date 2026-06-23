'use client'

import { useEffect } from 'react'
import { ErrorPageView } from '@/components/error/error-page-view'
import { classifyError } from '@/lib/error-pages'

type AdminErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error('[ADMIN_ERROR]', error)
  }, [error])

  return (
    <ErrorPageView
      content={classifyError(error)}
      digest={error.digest}
      error={error}
      onRetry={reset}
      showLogo={false}
    />
  )
}
