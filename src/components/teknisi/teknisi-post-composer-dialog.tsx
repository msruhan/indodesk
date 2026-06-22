'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useConfirm } from '@/components/ui/confirm-dialog'
import type { TeknisiPostDto } from '@/lib/teknisi-post'
import { TEKNISI_POST_LIMITS } from '@/lib/teknisi-post'
import { parseVideoEmbedUrl } from '@/lib/video-embed-url'
import { TeknisiPostMedia } from '@/components/teknisi/teknisi-post-media'
import {
  EmojiPickerButton,
  focusTextCursor,
  insertAtTextCursor,
} from '@/components/ui/emoji-picker'
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  X,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type PendingAttachment = {
  type: 'image' | 'pdf'
  url: string
  fileName: string
  mimeType: string
  sizeBytes: number
  previewUrl?: string
}

type TeknisiPostComposerDialogProps = {
  open: boolean
  onClose: () => void
  authorName: string
  authorAvatar: string | null
  editingPost?: TeknisiPostDto | null
  onPublished: (post: TeknisiPostDto) => void
}

export function TeknisiPostComposerDialog({
  open,
  onClose,
  authorName,
  authorAvatar,
  editingPost,
  onPublished,
}: TeknisiPostComposerDialogProps) {
  const confirm = useConfirm()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const [content, setContent] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVideoInput, setShowVideoInput] = useState(false)

  const isEditing = Boolean(editingPost)

  useEffect(() => {
    if (!open) return

    if (editingPost) {
      setContent(editingPost.content)
      setVideoUrl(editingPost.videoUrl ?? '')
      setShowVideoInput(Boolean(editingPost.videoUrl))
      setAttachments(
        editingPost.attachments.map((a) => ({
          type: a.type,
          url: a.url,
          fileName: a.fileName ?? (a.type === 'pdf' ? 'dokumen.pdf' : 'foto'),
          mimeType: a.type === 'pdf' ? 'application/pdf' : 'image/jpeg',
          sizeBytes: 0,
          previewUrl: a.type === 'image' ? a.url : undefined,
        })),
      )
    } else {
      setContent('')
      setVideoUrl('')
      setAttachments([])
      setShowVideoInput(false)
    }
    setError(null)
  }, [open, editingPost])

  const imageCount = attachments.filter((a) => a.type === 'image').length
  const pdfCount = attachments.filter((a) => a.type === 'pdf').length

  const videoEmbed = useMemo(() => parseVideoEmbedUrl(videoUrl), [videoUrl])

  const hasDraft =
    content.trim().length > 0 || attachments.length > 0 || videoUrl.trim().length > 0

  const handleClose = async () => {
    if (hasDraft && !submitting) {
      const ok = await confirm({
        title: 'Buang perubahan?',
        description: 'Konten yang belum dipublikasikan akan hilang.',
        variant: 'warning',
        confirmLabel: 'Buang',
      })
      if (!ok) return
    }
    onClose()
  }

  const uploadFile = async (file: File, kind: 'image' | 'pdf') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('kind', kind)

    const res = await fetch('/api/teknisi/posts/upload', { method: 'POST', body: formData })
    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.error ?? 'Gagal mengunggah file')
    }

    return json.data as {
      url: string
      type: 'image' | 'pdf'
      fileName: string
      mimeType: string
      sizeBytes: number
    }
  }

  const handleImagePick = async (files: FileList | null) => {
    if (!files?.length) return

    const remaining = TEKNISI_POST_LIMITS.maxImages - imageCount
    if (remaining <= 0) {
      toast.error(`Maksimal ${TEKNISI_POST_LIMITS.maxImages} foto`)
      return
    }

    const selected = Array.from(files).slice(0, remaining)
    setUploading(true)
    setError(null)

    try {
      const uploaded: PendingAttachment[] = []
      for (const file of selected) {
        const saved = await uploadFile(file, 'image')
        uploaded.push({
          ...saved,
          previewUrl: URL.createObjectURL(file),
        })
      }
      setAttachments((prev) => [...prev, ...uploaded])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Gagal mengunggah foto'
      setError(message)
      toast.error(message)
    } finally {
      setUploading(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handlePdfPick = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    if (pdfCount >= TEKNISI_POST_LIMITS.maxPdf) {
      toast.error('Maksimal 1 PDF per posting')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const saved = await uploadFile(file, 'pdf')
      setAttachments((prev) => [...prev.filter((a) => a.type !== 'pdf'), saved])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Gagal mengunggah PDF'
      setError(message)
      toast.error(message)
    } finally {
      setUploading(false)
      if (pdfInputRef.current) pdfInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const insertEmoji = (emoji: string) => {
    const result = insertAtTextCursor(
      content,
      emoji,
      contentRef.current,
      TEKNISI_POST_LIMITS.maxContentLength,
    )
    if (!result) return
    setContent(result.nextValue)
    focusTextCursor(contentRef.current, result.cursor)
  }

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (trimmed.length < TEKNISI_POST_LIMITS.minContentLength) {
      setError(`Minimal ${TEKNISI_POST_LIMITS.minContentLength} karakter`)
      return
    }
    if (videoUrl.trim() && !videoEmbed) {
      setError('URL video tidak valid (YouTube, Vimeo, atau TikTok)')
      return
    }

    setSubmitting(true)
    setError(null)

    const payload = {
      content: trimmed,
      videoUrl: videoUrl.trim() || null,
      attachments: attachments.map((item, index) => ({
        type: item.type,
        url: item.url,
        fileName: item.fileName,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        sortOrder: index,
      })),
    }

    try {
      const url = isEditing ? `/api/teknisi/posts/${editingPost!.id}` : '/api/teknisi/posts'
      const method = isEditing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Gagal menyimpan posting')
        return
      }

      toast.success(isEditing ? 'Posting diperbarui' : 'Posting dipublikasikan')
      onPublished(json.data)
      onClose()
    } catch {
      setError('Gagal menghubungi server')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const previewAttachments = attachments.map((a, index) => ({
    id: `draft-${index}`,
    type: a.type,
    url: a.previewUrl ?? a.url,
    fileName: a.fileName,
    sortOrder: index,
  }))

  return (
    <motion.div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Tutup"
        onClick={() => void handleClose()}
      />

      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-surface-200/80 bg-white shadow-soft-lg sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-surface-200/70 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              {isEditing ? 'Edit Postingan' : 'Buat Postingan'}
            </h2>
            <p className="text-xs text-surface-500">Bagikan update, tips, atau dokumentasi kerja</p>
          </div>
          <button
            type="button"
            onClick={() => void handleClose()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-surface-500 hover:bg-surface-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-50 text-sm font-semibold text-primary-700">
              {authorAvatar ? (
                <img src={authorAvatar} alt="" className="h-full w-full object-cover" />
              ) : (
                authorName.slice(0, 1).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{authorName}</p>
              <p className="text-xs text-surface-500">Publik di profil teknisi</p>
            </div>
          </div>

          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Apa yang ingin Anda bagikan?"
            rows={5}
            maxLength={TEKNISI_POST_LIMITS.maxContentLength}
            className="mt-4 w-full resize-none rounded-2xl border border-transparent bg-transparent px-0 py-2 text-sm leading-relaxed text-ink placeholder:text-surface-400 focus:border-transparent focus:outline-none focus:ring-0"
          />

          <div className="mb-2 text-right text-[11px] text-surface-400">
            {content.trim().length}/{TEKNISI_POST_LIMITS.maxContentLength}
          </div>

          {attachments.length > 0 || videoEmbed ? (
            <TeknisiPostMedia
              attachments={previewAttachments}
              videoEmbed={videoEmbed}
              className="mb-4"
            />
          ) : null}

          {attachments.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {attachments.map((item, index) => (
                <div
                  key={`${item.url}-${index}`}
                  className="inline-flex items-center gap-2 rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs text-surface-600"
                >
                  <span className="max-w-[10rem] truncate">{item.fileName}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-surface-400 hover:text-rose-600"
                    aria-label="Hapus lampiran"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {showVideoInput ? (
            <div className="mb-4 space-y-2">
              <label className="text-xs font-medium text-surface-600">Link video (YouTube / Vimeo / TikTok)</label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          ) : null}

          {error ? (
            <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="border-t border-surface-200/70 px-5 py-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => void handleImagePick(e.target.files)}
            />
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => void handlePdfPick(e.target.files)}
            />

            <button
              type="button"
              disabled={uploading || imageCount >= TEKNISI_POST_LIMITS.maxImages}
              onClick={() => imageInputRef.current?.click()}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition',
                imageCount >= TEKNISI_POST_LIMITS.maxImages
                  ? 'cursor-not-allowed border-surface-200 text-surface-400'
                  : 'border-surface-200 text-surface-600 hover:border-primary-200 hover:text-primary-700',
              )}
            >
              <ImageIcon className="h-4 w-4" />
              Foto
            </button>

            <button
              type="button"
              disabled={uploading || pdfCount >= TEKNISI_POST_LIMITS.maxPdf}
              onClick={() => pdfInputRef.current?.click()}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition',
                pdfCount >= TEKNISI_POST_LIMITS.maxPdf
                  ? 'cursor-not-allowed border-surface-200 text-surface-400'
                  : 'border-surface-200 text-surface-600 hover:border-primary-200 hover:text-primary-700',
              )}
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>

            <button
              type="button"
              onClick={() => setShowVideoInput((v) => !v)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition',
                showVideoInput
                  ? 'border-primary-200 bg-primary-50 text-primary-700'
                  : 'border-surface-200 text-surface-600 hover:border-primary-200 hover:text-primary-700',
              )}
            >
              <ExternalLink className="h-4 w-4" />
              Link Video
            </button>

            <EmojiPickerButton
              onPick={insertEmoji}
              disabled={submitting || uploading}
            />

            {uploading ? (
              <span className="inline-flex items-center gap-1 text-xs text-surface-500">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Mengunggah…
              </span>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => void handleClose()}>
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              disabled={submitting || uploading}
              onClick={() => void handleSubmit()}
            >
              {submitting ? 'Menyimpan…' : isEditing ? 'Simpan Perubahan' : 'Publikasikan'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
