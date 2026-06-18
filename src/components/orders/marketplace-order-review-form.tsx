'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Star } from '@/lib/icons'
import { cn } from '@/lib/utils'

type MarketplaceOrderReviewFormProps = {
  productId: string
  productName: string
  orderId: string
  onSubmitted: () => void
}

export function MarketplaceOrderReviewForm({
  productId,
  productName,
  orderId,
  onSubmitted,
}: MarketplaceOrderReviewFormProps) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/marketplace/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, rating, comment }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal mengirim ulasan')
        return
      }
      setDone(true)
      onSubmitted()
    } catch {
      setError('Gagal mengirim ulasan')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <p className="rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-700">
        Review terkirim untuk {productName}
      </p>
    )
  }

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50/80 p-3 space-y-3">
      <p className="text-xs font-semibold text-ink">Beri review — {productName}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className="rounded p-0.5 transition-colors hover:bg-white"
            aria-label={`${n} bintang`}
          >
            <Star
              className={cn(
                'h-5 w-5',
                n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-surface-300',
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Ceritakan pengalaman Anda (min. 10 karakter)"
        rows={3}
        className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-surface-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
      />
      {error && (
        <p className="text-xs text-rose-600">{error}</p>
      )}
      <Button
        variant="primary"
        size="sm"
        disabled={loading || comment.trim().length < 10}
        onClick={() => void submit()}
      >
        {loading ? 'Mengirim…' : 'Kirim review'}
      </Button>
    </div>
  )
}
