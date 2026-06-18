import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BenchmarkResultView } from '@/components/marketplace/benchmark-result-view'

type SearchParams = Promise<{ a?: string; b?: string }>

export default async function BandingkanPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { a, b } = await searchParams

  if (!a || !b) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-50 px-4">
        <p className="text-sm text-surface-600">Pilih 2 produk untuk dibandingkan.</p>
        <Link href="/marketplace">
          <Button variant="primary">Ke Marketplace</Button>
        </Link>
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-surface-500">Memuat...</div>}>
      <BenchmarkResultView idA={a} idB={b} />
    </Suspense>
  )
}
