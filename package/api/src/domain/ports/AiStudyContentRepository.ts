import type { AiStudyContent, NewAiStudyContentData } from '../entities/AiStudyContent.js'

export interface AiStudyContentRepository {
  findByStudySlug(slug: string): AiStudyContent | null
  upsert(data: NewAiStudyContentData): void
  deleteAll(): void
}
