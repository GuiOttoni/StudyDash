import type { DatabaseSync } from 'node:sqlite'
import type { SectionRepository } from '../../../domain/ports/SectionRepository.js'
import { Section, type NewSectionData } from '../../../domain/entities/Section.js'

interface SectionRow {
  id: number; slug: string; title: string; icon: string
  description: string; categories: string; order: number
}

function toEntity(row: SectionRow): Section {
  return new Section(row.id, row.slug, row.title, row.icon, row.description, JSON.parse(row.categories), row.order)
}

export class SqliteSectionRepository implements SectionRepository {
  constructor(private readonly db: DatabaseSync) {}

  findAll(): Section[] {
    const rows = this.db.prepare('SELECT * FROM sections ORDER BY "order" ASC').all() as unknown as SectionRow[]
    return rows.map(toEntity)
  }

  findBySlug(slug: string): Section | null {
    const row = this.db.prepare('SELECT * FROM sections WHERE slug = ?').get(slug) as SectionRow | undefined
    return row ? toEntity(row) : null
  }

  create(data: NewSectionData): Section {
    const result = this.db.prepare(`
      INSERT INTO sections (slug, title, icon, description, categories, "order")
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.slug, data.title, data.icon, data.description, JSON.stringify(data.categories), data.order)
    return toEntity(this.db.prepare('SELECT * FROM sections WHERE id = ?').get(result.lastInsertRowid) as SectionRow)
  }

  update(id: number, data: NewSectionData): Section | null {
    this.db.prepare(`
      UPDATE sections SET slug=?, title=?, icon=?, description=?, categories=?, "order"=? WHERE id=?
    `).run(data.slug, data.title, data.icon, data.description, JSON.stringify(data.categories), data.order, id)
    const row = this.db.prepare('SELECT * FROM sections WHERE id = ?').get(id) as SectionRow | undefined
    return row ? toEntity(row) : null
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM sections WHERE id = ?').run(id)
  }

  deleteAll(): void {
    this.db.exec('DELETE FROM sections')
  }

  save(section: Section): void {
    this.db.prepare('UPDATE sections SET categories = ? WHERE id = ?')
      .run(JSON.stringify(section.categories), section.id)
  }

  createIfMissing(data: NewSectionData): void {
    this.db.prepare(`
      INSERT OR IGNORE INTO sections (slug, title, icon, description, categories, "order")
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.slug, data.title, data.icon, data.description, JSON.stringify(data.categories), data.order)
  }
}
