import type { DatabaseSync } from 'node:sqlite'
import type { AiStudyContentRepository } from '../../../domain/ports/AiStudyContentRepository.js'
import { AiStudyContent, type NewAiStudyContentData } from '../../../domain/entities/AiStudyContent.js'

interface AiStudyContentRow {
  id: number; study_slug: string; content: string
  generated_by: string; prompt: string; created_at: number
}

function toEntity(row: AiStudyContentRow): AiStudyContent {
  return new AiStudyContent(row.id, row.study_slug, JSON.parse(row.content), row.generated_by, row.prompt, row.created_at)
}

export class SqliteAiStudyContentRepository implements AiStudyContentRepository {
  constructor(private readonly db: DatabaseSync) {}

  findByStudySlug(slug: string): AiStudyContent | null {
    const row = this.db.prepare('SELECT * FROM ai_study_content WHERE study_slug = ?').get(slug) as AiStudyContentRow | undefined
    return row ? toEntity(row) : null
  }

  upsert(data: NewAiStudyContentData): void {
    this.db.prepare(`
      INSERT INTO ai_study_content (study_slug, content, generated_by, prompt, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(study_slug) DO UPDATE SET
        content      = excluded.content,
        generated_by = excluded.generated_by,
        prompt       = excluded.prompt,
        created_at   = excluded.created_at
    `).run(data.studySlug, JSON.stringify(data.content), data.generatedBy, data.prompt, data.createdAt)
  }

  deleteAll(): void {
    this.db.exec('DELETE FROM ai_study_content')
  }
}
