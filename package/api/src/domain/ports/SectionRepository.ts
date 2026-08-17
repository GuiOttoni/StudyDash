import type { Section, NewSectionData } from '../entities/Section.js'

export interface SectionRepository {
  findAll(): Section[]
  findBySlug(slug: string): Section | null
  create(data: NewSectionData): Section
  update(id: number, data: NewSectionData): Section | null
  delete(id: number): void
  deleteAll(): void
  save(section: Section): void
  /** Cria a seção só se ainda não existir (usado pela auto-criação por categoria da IA). */
  createIfMissing(data: NewSectionData): void
}
