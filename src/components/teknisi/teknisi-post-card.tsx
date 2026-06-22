'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { TeknisiPostDto } from '@/lib/teknisi-post'
import { TeknisiPostMedia } from '@/components/teknisi/teknisi-post-media'
import { TeknisiPostEngagement } from '@/components/teknisi/teknisi-post-engagement'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { Edit, MoreVertical, Trash2 } from '@/lib/icons'
import { toast } from 'sonner'

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const diffMs = date.getTime() - Date.now()
  const rtf = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })

  const minutes = Math.round(diffMs / 60_000)
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')

  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')

  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return rtf.format(days, 'day')

  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

type TeknisiPostCardProps = {
  post: TeknisiPostDto
  onEdit?: (post: TeknisiPostDto) => void
  onDeleted?: (postId: string) => void
  onEngagementUpdate?: (
    patch: Pick<TeknisiPostDto, 'id' | 'likeCount' | 'commentCount' | 'likedByViewer'>,
  ) => void
}

export function TeknisiPostCard({ post, onEdit, onDeleted, onEngagementUpdate }: TeknisiPostCardProps) {
  const confirm = useConfirm()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Hapus postingan?',
      description: 'Postingan akan dihapus dari profil publik Anda.',
      variant: 'danger',
      confirmLabel: 'Hapus',
    })
    if (!ok) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/teknisi/posts/${post.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Gagal menghapus posting')
        return
      }
      toast.success('Posting dihapus')
      onDeleted?.(post.id)
    } catch {
      toast.error('Gagal menghubungi server')
    } finally {
      setDeleting(false)
      setMenuOpen(false)
    }
  }

  return (
    <article className="rounded-3xl border border-surface-200/80 bg-white/90 p-5 shadow-soft backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-50 text-sm font-semibold text-primary-700">
            {post.author.avatarUrl ? (
              <img src={post.author.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              post.author.name.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{post.author.name}</p>
            <p className="text-xs text-surface-500">{formatRelativeTime(post.publishedAt)}</p>
          </div>
        </div>

        {post.isOwner ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-surface-500 transition hover:bg-surface-100 hover:text-ink"
              aria-label="Menu posting"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  aria-label="Tutup menu"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-2xl border border-surface-200/80 bg-white py-1 shadow-soft-lg">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface-50"
                    onClick={() => {
                      setMenuOpen(false)
                      onEdit?.(post)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                    onClick={() => void handleDelete()}
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className={cn('mt-4 whitespace-pre-wrap text-sm leading-relaxed text-surface-700')}>
        {post.content}
      </p>

      <TeknisiPostMedia
        attachments={post.attachments}
        videoEmbed={post.videoEmbed}
        className="mt-4"
      />

      <TeknisiPostEngagement post={post} onUpdate={onEngagementUpdate} />
    </article>
  )
}
