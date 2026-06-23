import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Laptop } from '@/lib/icons'

export type IndodeskDownloadItem = {
  platform: 'windows' | 'macos'
  role: 'user' | 'teknisi'
  platformLabel: string
  roleLabel: string
  downloadUrl: string
  version: string
  fileSize: string | null
}

const ROLE_SECTIONS: Array<{
  role: IndodeskDownloadItem['role']
  title: string
  hint: string
}> = [
  {
    role: 'user',
    title: 'Pelanggan',
    hint: 'Install di perangkat Anda saat memesan konsultasi remote.',
  },
  {
    role: 'teknisi',
    title: 'Teknisi',
    hint: 'Install di laptop teknisi untuk melayani sesi remote.',
  },
]

const PLATFORM_ORDER: IndodeskDownloadItem['platform'][] = ['windows', 'macos']

function sortByPlatform(items: IndodeskDownloadItem[]): IndodeskDownloadItem[] {
  return PLATFORM_ORDER.map((platform) => items.find((item) => item.platform === platform)).filter(
    (item): item is IndodeskDownloadItem => item != null,
  )
}

type Props = {
  downloads: IndodeskDownloadItem[]
  latestVersion: string
  loading?: boolean
}

export function IndodeskDownloadLinks({ downloads, latestVersion, loading = false }: Props) {
  const hasDownloads = downloads.length > 0

  return (
    <div className="space-y-4">
      <p className="text-[12px] leading-relaxed text-surface-600">
        IndoDesk tersedia dalam dua versi: <strong className="font-semibold text-ink">Pelanggan</strong>{' '}
        untuk perangkat Anda dan <strong className="font-semibold text-ink">Teknisi</strong> untuk
        laptop teknisi. Pilih sesuai peran dan sistem operasi Anda.
      </p>

      {ROLE_SECTIONS.map((section) => {
        const items = sortByPlatform(downloads.filter((item) => item.role === section.role))

        return (
          <div
            key={section.role}
            className="rounded-xl border border-surface-200/70 bg-surface-50/60 p-3"
          >
            <div className="mb-2">
              <p className="text-xs font-semibold text-ink">{section.title}</p>
              <p className="text-[11px] leading-relaxed text-surface-500">{section.hint}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!hasDownloads || loading ? (
                PLATFORM_ORDER.map((platform) => (
                  <Button
                    key={`${section.role}-${platform}`}
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5"
                    disabled
                  >
                    <Laptop className="h-3.5 w-3.5" />
                    {platform === 'windows' ? 'Windows' : 'macOS'}
                  </Button>
                ))
              ) : items.length === 0 ? (
                <p className="text-[11px] text-surface-500">Link unduhan belum tersedia.</p>
              ) : (
                items.map((item) => (
                  <a
                    key={`${item.role}-${item.platform}`}
                    href={item.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-9')}
                  >
                    <span className="relative z-10 inline-flex items-center gap-1.5">
                      <Laptop className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                      {item.platformLabel}
                    </span>
                  </a>
                ))
              )}
            </div>
          </div>
        )
      })}

      <p className="text-[11px] text-surface-500">
        Versi terbaru:{' '}
        <span className="font-mono text-ink">v{latestVersion.replace(/^v/i, '')}</span>
        {downloads[0]?.fileSize ? ` · Ukuran: ${downloads[0].fileSize}` : ''} · Gratis
      </p>
    </div>
  )
}
