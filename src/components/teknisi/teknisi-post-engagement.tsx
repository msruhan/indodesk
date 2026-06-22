'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import type { TeknisiPostDto } from '@/lib/teknisi-post'
import type { TeknisiPostCommentDto } from '@/lib/teknisi-post-comment'
import { Button } from '@/components/ui/button'
import {
  EmojiPickerButton,
  focusTextCursor,
  insertAtTextCursor,
} from '@/components/ui/emoji-picker'
import { Heart, MessageCircle } from '@/lib/icons'
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

type TeknisiPostEngagementProps = {
  post: TeknisiPostDto
  onUpdate?: (patch: Pick<TeknisiPostDto, 'id' | 'likeCount' | 'commentCount' | 'likedByViewer'>) => void
}

export function TeknisiPostEngagement({ post, onUpdate }: TeknisiPostEngagementProps) {
  const { data: session, status } = useSession()
  const [liked, setLiked] = useState(post.likedByViewer)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [commentCount, setCommentCount] = useState(post.commentCount)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<TeknisiPostCommentDto[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [likingPost, setLikingPost] = useState(false)
  const [likingCommentId, setLikingCommentId] = useState<string | null>(null)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  const isLoggedIn = status === 'authenticated' && !!session?.user?.id
  const loginHref = `/login?callbackUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/')}`

  useEffect(() => {
    setLiked(post.likedByViewer)
    setLikeCount(post.likeCount)
    setCommentCount(post.commentCount)
  }, [post.id, post.likedByViewer, post.likeCount, post.commentCount])

  const syncPost = useCallback(
    (patch: { liked?: boolean; likeCount?: number; commentCount?: number }) => {
      const next = {
        id: post.id,
        likedByViewer: patch.liked ?? liked,
        likeCount: patch.likeCount ?? likeCount,
        commentCount: patch.commentCount ?? commentCount,
      }
      if (patch.liked !== undefined) setLiked(patch.liked)
      if (patch.likeCount !== undefined) setLikeCount(patch.likeCount)
      if (patch.commentCount !== undefined) setCommentCount(patch.commentCount)
      onUpdate?.(next)
    },
    [post.id, liked, likeCount, commentCount, onUpdate],
  )

  const loadComments = useCallback(async () => {
    setCommentsLoading(true)
    try {
      const res = await fetch(`/api/teknisi/posts/${post.id}/comments?limit=50`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Gagal memuat komentar')
        return
      }
      setComments(json.data.items as TeknisiPostCommentDto[])
      setCommentsLoaded(true)
    } catch {
      toast.error('Gagal menghubungi server')
    } finally {
      setCommentsLoading(false)
    }
  }, [post.id])

  const toggleComments = () => {
    const next = !commentsOpen
    setCommentsOpen(next)
    if (next && !commentsLoaded) void loadComments()
  }

  const togglePostLike = async () => {
    if (!isLoggedIn) {
      toast.message('Login untuk menyukai postingan')
      return
    }

    setLikingPost(true)
    try {
      const res = await fetch(`/api/teknisi/posts/${post.id}/like`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Gagal memperbarui suka')
        return
      }
      syncPost({ liked: json.data.liked, likeCount: json.data.likeCount })
    } catch {
      toast.error('Gagal menghubungi server')
    } finally {
      setLikingPost(false)
    }
  }

  const toggleCommentLike = async (commentId: string) => {
    if (!isLoggedIn) {
      toast.message('Login untuk menyukai komentar')
      return
    }

    setLikingCommentId(commentId)
    try {
      const res = await fetch(`/api/teknisi/posts/comments/${commentId}/like`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Gagal memperbarui suka komentar')
        return
      }
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, likedByViewer: json.data.liked, likeCount: json.data.likeCount }
            : c,
        ),
      )
    } catch {
      toast.error('Gagal menghubungi server')
    } finally {
      setLikingCommentId(null)
    }
  }

  const insertCommentEmoji = (emoji: string) => {
    const result = insertAtTextCursor(draft, emoji, commentRef.current, 500)
    if (!result) return
    setDraft(result.nextValue)
    focusTextCursor(commentRef.current, result.cursor)
  }

  const submitComment = async () => {
    const content = draft.trim()
    if (!content) return

    if (!isLoggedIn) {
      toast.message('Login untuk menulis komentar')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/teknisi/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Gagal menambah komentar')
        return
      }
      const comment = json.data.comment as TeknisiPostCommentDto
      setComments((prev) => [...prev, comment])
      setDraft('')
      syncPost({ commentCount: json.data.commentCount })
      setCommentsOpen(true)
      setCommentsLoaded(true)
    } catch {
      toast.error('Gagal menghubungi server')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-4 border-t border-surface-200/70 pt-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={likingPost}
          onClick={() => void togglePostLike()}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition',
            liked
              ? 'text-rose-600 hover:bg-rose-50'
              : 'text-surface-600 hover:bg-surface-50 hover:text-rose-600',
          )}
          aria-pressed={liked}
          aria-label={liked ? 'Batalkan suka' : 'Suka postingan'}
        >
          <Heart className="h-4 w-4" weight={liked ? 'fill' : 'duotone'} />
          <span>{likeCount > 0 ? likeCount : 'Suka'}</span>
        </button>

        <button
          type="button"
          onClick={toggleComments}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-surface-600 transition hover:bg-surface-50 hover:text-primary-700',
            commentsOpen && 'bg-surface-50 text-primary-700',
          )}
          aria-expanded={commentsOpen}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{commentCount > 0 ? commentCount : 'Komentar'}</span>
        </button>
      </div>

      {commentsOpen ? (
        <div className="mt-3 space-y-3 rounded-2xl bg-surface-50/80 p-3">
          {commentsLoading ? (
            <p className="py-2 text-center text-xs text-surface-500">Memuat komentar…</p>
          ) : comments.length === 0 ? (
            <p className="py-1 text-center text-xs text-surface-500">Belum ada komentar. Jadilah yang pertama.</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((comment) => (
                <li key={comment.id} className="flex gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-xs font-semibold text-primary-700 shadow-soft-xs">
                    {comment.author.avatarUrl ? (
                      <img src={comment.author.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      comment.author.name.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="rounded-2xl bg-white px-3 py-2 shadow-soft-xs">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-xs font-semibold text-ink">{comment.author.name}</span>
                        <span className="text-[10px] text-surface-400">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-surface-700">
                        {comment.content}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={likingCommentId === comment.id}
                      onClick={() => void toggleCommentLike(comment.id)}
                      className={cn(
                        'mt-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition',
                        comment.likedByViewer
                          ? 'text-rose-600 hover:bg-rose-50'
                          : 'text-surface-500 hover:bg-white hover:text-rose-600',
                      )}
                      aria-pressed={comment.likedByViewer}
                    >
                      <Heart
                        className="h-3 w-3"
                        weight={comment.likedByViewer ? 'fill' : 'duotone'}
                      />
                      {comment.likeCount > 0 ? comment.likeCount : 'Suka'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {status === 'loading' ? (
            <p className="text-center text-xs text-surface-500">Memuat sesi…</p>
          ) : isLoggedIn ? (
            <div className="pt-1">
              <textarea
                ref={commentRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Tulis komentar…"
                rows={2}
                maxLength={500}
                className="min-h-[2.75rem] w-full resize-none rounded-2xl border border-surface-200/80 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <EmojiPickerButton
                  onPick={insertCommentEmoji}
                  disabled={submitting}
                  pickerClassName="left-0"
                />
                <Button
                  variant="primary"
                  size="sm"
                  className="shrink-0"
                  disabled={submitting || !draft.trim()}
                  onClick={() => void submitComment()}
                >
                  {submitting ? '…' : 'Kirim'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-2xl border border-surface-200/70 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-surface-600">Login untuk menulis komentar atau menyukai.</p>
              <Link href={loginHref}>
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
