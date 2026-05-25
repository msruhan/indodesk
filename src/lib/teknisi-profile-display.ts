import type { PublicTeknisiDetailDto } from '@/lib/teknisi-public-detail'
import {
  DEFAULT_BRAND_FOCUS,
  DEFAULT_ISSUES_HANDLED,
  DEFAULT_WORK_APPROACH,
  resolveProfileTagline,
} from '@/lib/teknisi-profile-content'

export function getProfileSummaryFields(teknisi: PublicTeknisiDetailDto) {
  return {
    tagline: resolveProfileTagline(teknisi.tagline, teknisi.specialty),
    issuesHandled: teknisi.issuesHandled ?? DEFAULT_ISSUES_HANDLED,
    brandFocus: teknisi.brandFocus ?? DEFAULT_BRAND_FOCUS,
    workApproach: teknisi.workApproach ?? DEFAULT_WORK_APPROACH,
  }
}
