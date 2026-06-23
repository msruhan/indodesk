'use client'

import { useEffect } from 'react'
import { ErrorPageView } from '@/components/error/error-page-view'
import { classifyError } from '@/lib/error-pages'

type AppErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error('[APP_ERROR]', error)
  }, [error])

  return (
    <ErrorPageView
      content={classifyError(error)}
      digest={error.digest}
      error={error}
      onRetry={reset}
    />
  )
}
