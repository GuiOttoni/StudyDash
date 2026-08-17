import type { Study, NewStudyData } from '../entities/Study.js'

export interface StudyRepository {
  findAll(): Study[]
  findBySlug(slug: string): Study | null
  upsertBySlug(data: NewStudyData): Study
  create(data: NewStudyData): Study
  update(id: number, data: NewStudyData): Study | null
  delete(id: number): void
  deleteAll(): void
}
