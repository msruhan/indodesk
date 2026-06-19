import type { TeknisiCertification } from '@prisma/client'
import { resolveDisplayImageUrl } from '@/lib/image-url-utils'

export type TeknisiCertificationFileType = 'image' | 'pdf'

export type TeknisiCertificationItemDto = {
  id: string
  title: string
  fileUrl: string
  fileType: TeknisiCertificationFileType
}

export function serializeTeknisiCertification(
  row: TeknisiCertification,
): TeknisiCertificationItemDto {
  const fileType = row.fileType === 'pdf' ? 'pdf' : 'image'
  return {
    id: row.id,
    title: row.title,
    fileUrl: resolveDisplayImageUrl(row.fileUrl) ?? row.fileUrl,
    fileType,
  }
}
