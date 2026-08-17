import type { DatabaseSync } from 'node:sqlite'
import type { StudyRepository } from '../../../domain/ports/StudyRepository.js'
import { Study, type NewStudyData } from '../../../domain/entities/Study.js'

interface StudyRow {
  id: number; slug: string; title: string; icon: string; category: string
  description: string; available: number; order: number; ai_content_id: number | null
}

function toEntity(row: StudyRow): Study {
  return new Study(row.id, row.slug, row.title, row.icon, row.category, row.description, row.available === 1, row.order)
}

export class SqliteStudyRepository implements StudyRepository {
  constructor(private readonly db: DatabaseSync) {}

  findAll(): Study[] {
    const rows = this.db.prepare('SELECT * FROM studies ORDER BY "order" ASC').all() as unknown as StudyRow[]
    return rows.map(toEntity)
  }

  findBySlug(slug: string): Study | null {
    const row = this.db.prepare('SELECT * FROM studies WHERE slug = ?').get(slug) as StudyRow | undefined
    return row ? toEntity(row) : null
  }

  upsertBySlug(data: NewStudyData): Study {
    this.db.prepare(`
      INSERT INTO studies (slug, title, icon, category, description, available, "order")
      VALUES (?, ?, ?, ?, ?, 1, ?)
      ON CONFLICT(slug) DO UPDATE SET
        title       = excluded.title,
        icon        = excluded.icon,
        category    = excluded.category,
        description = excluded.description
    `).run(data.slug, data.title, data.icon, data.category, data.description, data.order)
    return toEntity(this.db.prepare('SELECT * FROM studies WHERE slug = ?').get(data.slug) as StudyRow)
  }

  create(data: NewStudyData): Study {
    const result = this.db.prepare(`
      INSERT INTO studies (slug, title, icon, category, description, available, "order")
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data.slug, data.title, data.icon, data.category, data.description, data.available ? 1 : 0, data.order)
    return toEntity(this.db.prepare('SELECT * FROM studies WHERE id = ?').get(result.lastInsertRowid) as StudyRow)
  }

  update(id: number, data: NewStudyData): Study | null {
    this.db.prepare(`
      UPDATE studies SET slug=?, title=?, icon=?, category=?, description=?, available=?, "order"=? WHERE id=?
    `).run(data.slug, data.title, data.icon, data.category, data.description, data.available ? 1 : 0, data.order, id)
    const row = this.db.prepare('SELECT * FROM studies WHERE id = ?').get(id) as StudyRow | undefined
    return row ? toEntity(row) : null
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM studies WHERE id = ?').run(id)
  }

  deleteAll(): void {
    this.db.exec('DELETE FROM studies')
  }
}
