import type { HelpArticle } from '@prisma/client'

export type HelpArticleDto = {
  id: string
  audience: string
  question: string
  answer: string
  sortOrder: number
  isActive: boolean
}

export function serializeHelpArticle(row: HelpArticle): HelpArticleDto {
  return {
    id: row.id,
    audience: row.audience,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  }
}
