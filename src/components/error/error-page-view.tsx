'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BrandLogo } from '@/components/brand/brand-logo'
import { AuroraBackground } from '@/components/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ErrorPageContent } from '@/lib/error-pages'
import { SUPPORT_EMAIL } from '@/lib/legal-content'
import {
  AlertCircle,
  AlertTriangle,
  Home,
  Mail,
  RefreshCw,
  Search,
} from '@/lib/icons'
import { cn } from '@/lib/utils'

type ErrorPageViewProps = {
  content: ErrorPageContent
  digest?: string
  error?: Error
  onRetry?: () => void
  showLogo?: boolean
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

function KindIcon({ kind }: { kind: ErrorPageContent['kind'] }) {
  const className = 'h-7 w-7'

  if (kind === 'not-found') {
    return <Search className={cn(className, 'text-primary-600')} />
  }
  if (kind === 'chunk-load' || kind === 'network') {
    return <RefreshCw className={cn(className, 'text-sky-600')} />
  }
  if (kind === 'server') {
    return <AlertCircle className={cn(className, 'text-rose-600')} />
  }
  return <AlertTriangle className={cn(className, 'text-amber-600')} />
}

function iconWrapClass(kind: ErrorPageContent['kind']): string {
  if (kind === 'not-found') return 'border-primary-200/80 bg-primary-50/80 text-primary-700'
  if (kind === 'chunk-load' || kind === 'network') return 'border-sky-200/80 bg-sky-50/80 text-sky-700'
  if (kind === 'server') return 'border-rose-200/80 bg-rose-50/80 text-rose-700'
  return 'border-amber-200/80 bg-amber-50/80 text-amber-700'
}

export function ErrorPageView({
  content,
  digest,
  error,
  onRetry,
  showLogo = true,
}: ErrorPageViewProps) {
  const isDev = process.env.NODE_ENV === 'development'
  const referenceCode = digest ?? (isDev ? error?.name : undefined)
  const preferReload =
    content.kind === 'chunk-load' || content.kind === 'client-crash' || content.kind === 'network'

  const handlePrimaryAction = () => {
    if (preferReload) {
      window.location.reload()
      return
    }
    if (onRetry) {
      onRetry()
      return
    }
    window.location.reload()
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-surface-50 text-ink">
      <AuroraBackground intensity="subtle" />

      {showLogo ? (
        <header className="relative z-10 flex w-full items-center justify-center px-6 pt-10 sm:pt-12">
          <Link href="/" className="transition-opacity hover:opacity-90">
            <BrandLogo
              variant="wordmark"
              size="default"
              align="center"
              wordmarkClassName="h-[3.5rem] sm:h-[4.25rem] sm:max-w-[18rem]"
            />
          </Link>
        </header>
      ) : null}

      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-10 sm:py-14">
        <motion.div
          className="flex w-full flex-col items-center text-center"
          initial={false}
          animate="animate"
          variants={{
            animate: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
          }}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <div
              className={cn(
                'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border shadow-soft backdrop-blur-sm',
                iconWrapClass(content.kind),
              )}
            >
              <KindIcon kind={content.kind} />
            </div>
          </motion.div>

          <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <Badge
              variant="outline"
              className="mt-5 border-surface-200/80 bg-white/70 px-3 py-1 text-surface-600"
            >
              {content.statusLabel}
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
          >
            {content.title}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 text-base leading-relaxed text-surface-600"
          >
            {content.description}
          </motion.p>

          {content.hint ? (
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 text-sm leading-relaxed text-surface-500"
            >
              {content.hint}
            </motion.p>
          ) : null}

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <Button variant="primary" size="lg" onClick={handlePrimaryAction} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4" />
              {preferReload ? 'Muat ulang halaman' : 'Coba lagi'}
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <Link href="/">
                <Home className="h-4 w-4" />
                Kembali ke beranda
              </Link>
            </Button>
          </motion.div>

          {referenceCode ? (
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 w-full rounded-2xl border border-surface-200/80 bg-white/75 px-4 py-3 text-left shadow-soft backdrop-blur-md"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-surface-500">
                Kode referensi
              </p>
              <p className="mt-1 font-mono text-sm text-surface-700">{referenceCode}</p>
              <p className="mt-2 text-xs leading-relaxed text-surface-500">
                Sertakan kode ini saat menghubungi dukungan agar kami dapat membantu lebih cepat.
              </p>
            </motion.div>
          ) : null}

          {isDev && error ? (
            <motion.details
              variants={fadeUp}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 w-full rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-left"
            >
              <summary className="cursor-pointer text-sm font-semibold text-amber-900">
                Detail teknis (development)
              </summary>
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-amber-950">
                {error.stack ?? error.message}
              </pre>
            </motion.details>
          ) : null}

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-col items-center gap-2"
          >
            <p className="text-xs text-surface-500">Butuh bantuan?</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Laporan error Bantoo${referenceCode ? ` — ${referenceCode}` : ''}`)}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 transition-colors hover:text-primary-800"
            >
              <Mail className="h-4 w-4" />
              {SUPPORT_EMAIL}
            </a>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
