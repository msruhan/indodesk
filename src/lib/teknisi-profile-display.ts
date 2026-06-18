import type { PublicTeknisiDetailDto } from '@/lib/teknisi-public-detail'
import { resolveProfileTagline } from '@/lib/teknisi-profile-content'

export function getProfileSummaryFields(teknisi: PublicTeknisiDetailDto) {
  return {
    tagline: resolveProfileTagline(teknisi.tagline),
    issuesHandled: teknisi.issuesHandled?.trim() || null,
    brandFocus: teknisi.brandFocus?.trim() || null,
    workApproach: teknisi.workApproach?.trim() || null,
  }
}
