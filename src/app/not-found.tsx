import type { Metadata } from 'next'
import { ErrorPageView } from '@/components/error/error-page-view'
import { NOT_FOUND_CONTENT } from '@/lib/error-pages'

export const metadata: Metadata = {
  title: 'Halaman tidak ditemukan — Bantoo',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return <ErrorPageView content={NOT_FOUND_CONTENT} />
}
