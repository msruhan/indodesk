'use client'

import { cn } from '@/lib/utils'
import type { TeknisiPostAttachmentDto } from '@/lib/teknisi-post'
import type { ParsedVideoEmbed } from '@/lib/video-embed-url'
import { ExternalLink, FileText, Play } from '@/lib/icons'

type TeknisiPostMediaProps = {
  attachments: TeknisiPostAttachmentDto[]
  videoEmbed: ParsedVideoEmbed | null
  className?: string
}

export function TeknisiPostMedia({ attachments, videoEmbed, className }: TeknisiPostMediaProps) {
  const images = attachments.filter((a) => a.type === 'image')
  const pdfs = attachments.filter((a) => a.type === 'pdf')

  if (images.length === 0 && pdfs.length === 0 && !videoEmbed) return null

  return (
    <div className={cn('space-y-3', className)}>
      {images.length > 0 ? (
        <div
          className={cn(
            'grid gap-2 overflow-hidden rounded-2xl',
            images.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
          )}
        >
          {images.map((img) => (
            <a
              key={img.id}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden rounded-xl border border-surface-200/70 bg-surface-50"
            >
              <img
                src={img.url}
                alt={img.fileName ?? 'Lampiran foto'}
                className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            </a>
          ))}
        </div>
      ) : null}

      {pdfs.map((pdf) => (
        <a
          key={pdf.id}
          href={pdf.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-surface-200/80 bg-surface-50/80 px-4 py-3 transition hover:border-primary-200 hover:bg-primary-50/40"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary-700 shadow-soft-sm">
            <FileText className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">
              {pdf.fileName ?? 'Dokumen PDF'}
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-xs text-surface-500">
              PDF
              <ExternalLink className="h-3 w-3" />
            </span>
          </span>
        </a>
      ))}

      {videoEmbed ? (
        <div className="overflow-hidden rounded-2xl border border-surface-200/80 bg-black/5">
          <div className="relative aspect-video w-full">
            <iframe
              src={videoEmbed.embedUrl}
              title="Video posting"
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <a
            href={videoEmbed.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border-t border-surface-200/70 px-4 py-2.5 text-xs text-surface-600 hover:text-primary-700"
          >
            <Play className="h-3.5 w-3.5" />
            Buka di {videoEmbed.platform === 'youtube' ? 'YouTube' : videoEmbed.platform === 'vimeo' ? 'Vimeo' : 'TikTok'}
          </a>
        </div>
      ) : null}
    </div>
  )
}
