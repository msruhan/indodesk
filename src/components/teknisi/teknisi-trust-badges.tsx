'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  describeTopTeknisiCriteria,
  getTeknisiBadgeLabel,
  TEKNISI_BADGE_DISPLAY,
  type TeknisiBadgeTier,
} from '@/lib/teknisi-badge'
import { Award, CheckCircle, Radio } from '@/lib/icons'

type Props = {
  badge: TeknisiBadgeTier
  isVerified: boolean
  isOnline: boolean
  showOnlineStatus?: boolean
  showCriteriaHint?: boolean
  className?: string
}

export function TeknisiTrustBadges({
  badge,
  isVerified,
  isOnline,
  showOnlineStatus = true,
  showCriteriaHint = false,
  className,
}: Props) {
  return (
    <div className={cn('space-y-4', className)}>
      {badge === 'top-teknisi' && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <Award className="h-8 w-8 text-yellow-600" />
          <div>
            <div className="flex items-center gap-2 font-semibold">
              {TEKNISI_BADGE_DISPLAY['top-teknisi'].label}
              <Badge variant="warning">Aktif</Badge>
            </div>
            <p className="text-sm text-surface-500">{TEKNISI_BADGE_DISPLAY['top-teknisi'].description}</p>
          </div>
        </div>
      )}

      {isVerified && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div>
            <div className="flex items-center gap-2 font-semibold">
              {TEKNISI_BADGE_DISPLAY.verified.label}
              {badge !== 'top-teknisi' ? <Badge variant="success">Aktif</Badge> : null}
            </div>
            <p className="text-sm text-surface-500">{TEKNISI_BADGE_DISPLAY.verified.description}</p>
          </div>
        </div>
      )}

      {showOnlineStatus && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg border p-4',
            isOnline ? 'border-blue-200 bg-blue-50' : 'border-surface-200 bg-surface-50',
          )}
        >
          <Radio className={cn('h-8 w-8', isOnline ? 'text-blue-600' : 'text-surface-400')} />
          <div>
            <div className="font-semibold">{isOnline ? 'Online' : 'Offline'}</div>
            <p className="text-sm text-surface-500">
              {isOnline ? 'Sedang online di platform' : 'Tidak aktif saat ini'}
            </p>
          </div>
        </div>
      )}

      {showCriteriaHint && (
        <p className="text-xs text-surface-500">
          Badge: {getTeknisiBadgeLabel(badge)}. Syarat Top Teknisi: {describeTopTeknisiCriteria()}.
          Status online diatur otomatis saat Anda aktif di dashboard.
        </p>
      )}
    </div>
  )
}
