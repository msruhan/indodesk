'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { TeknisiPostDto } from '@/lib/teknisi-post'
import { TeknisiPostCard } from '@/components/teknisi/teknisi-post-card'
import { TeknisiPostComposerDialog } from '@/components/teknisi/teknisi-post-composer-dialog'
import { Plus, RefreshCw } from '@/lib/icons'

type TeknisiPostsFeedProps = {
  teknisiId: string
  authorName: string
  authorAvatar: string | null
  isOwner: boolean
  initialCount?: number
  onCountChange?: (count: number) => void
}

export function TeknisiPostsFeed({
  teknisiId,
  authorName,
  authorAvatar,
  isOwner,
  initialCount = 0,
  onCountChange,
}: TeknisiPostsFeedProps) {
  const [posts, setPosts] = useState<TeknisiPostDto[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<TeknisiPostDto | null>(null)
  const [total, setTotal] = useState(initialCount)

  const fetchPosts = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) setLoadingMore(true)
      else setLoading(true)

      setError(null)
      try {
        const res = await fetch(`/api/teknisi/${teknisiId}/posts?page=${pageNum}&limit=10`)
        const json = await res.json()
        if (!res.ok || !json.success) {
          setError(json.error ?? 'Gagal memuat posting')
          return
        }

        const items = json.data.items as TeknisiPostDto[]
        setPosts((prev) => (append ? [...prev, ...items] : items))
        setHasMore(Boolean(json.data.pagination?.hasMore))
        const nextTotal = Number(json.data.pagination?.total ?? 0)
        setTotal(nextTotal)
        onCountChange?.(nextTotal)
      } catch {
        setError('Gagal menghubungi server')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [teknisiId, onCountChange],
  )

  useEffect(() => {
    void fetchPosts(1, false)
    setPage(1)
  }, [fetchPosts])

  const handlePublished = (post: TeknisiPostDto) => {
    setPosts((prev) => {
      const exists = prev.some((p) => p.id === post.id)
      if (exists) return prev.map((p) => (p.id === post.id ? post : p))
      return [post, ...prev]
    })
    if (!editingPost) {
      const next = total + 1
      setTotal(next)
      onCountChange?.(next)
    }
    setEditingPost(null)
  }

  const handleDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    const next = Math.max(0, total - 1)
    setTotal(next)
    onCountChange?.(next)
  }

  const handleEngagementUpdate = (
    patch: Pick<TeknisiPostDto, 'id' | 'likeCount' | 'commentCount' | 'likedByViewer'>,
  ) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === patch.id
          ? {
              ...p,
              likeCount: patch.likeCount,
              commentCount: patch.commentCount,
              likedByViewer: patch.likedByViewer,
            }
          : p,
      ),
    )
  }

  const openCreate = () => {
    setEditingPost(null)
    setComposerOpen(true)
  }

  const openEdit = (post: TeknisiPostDto) => {
    setEditingPost(post)
    setComposerOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Postingan</h2>
          <p className="text-sm text-surface-500">
            Update aktivitas, tips, dan dokumentasi dari teknisi.
          </p>
        </div>
        {isOwner ? (
          <Button variant="primary" size="sm" className="shrink-0" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Buat Postingan
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-3xl border border-surface-200/70 bg-white/80 py-16 text-sm text-surface-500">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Memuat postingan…
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-8 text-center text-sm text-rose-700">
          {error}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-surface-200 bg-white/70 px-5 py-12 text-center">
          <p className="text-sm text-surface-600">
            {isOwner ? 'Belum ada postingan. Bagikan update pertama Anda.' : 'Belum ada postingan.'}
          </p>
          {isOwner ? (
            <Button variant="outline" size="sm" className="mt-4" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Buat Postingan
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <TeknisiPostCard
              key={post.id}
              post={post}
              onEdit={isOwner ? openEdit : undefined}
              onDeleted={handleDeleted}
              onEngagementUpdate={handleEngagementUpdate}
            />
          ))}

          {hasMore ? (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loadingMore}
                onClick={() => {
                  const next = page + 1
                  setPage(next)
                  void fetchPosts(next, true)
                }}
              >
                {loadingMore ? 'Memuat…' : 'Muat lebih banyak'}
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <TeknisiPostComposerDialog
        open={composerOpen}
        onClose={() => {
          setComposerOpen(false)
          setEditingPost(null)
        }}
        authorName={authorName}
        authorAvatar={authorAvatar}
        editingPost={editingPost}
        onPublished={handlePublished}
      />
    </div>
  )
}
