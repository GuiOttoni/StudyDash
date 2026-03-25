import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// ── Sections (grupos do catálogo) ─────────────────────────────────────────────
export const sections = sqliteTable('sections', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  slug:        text('slug').notNull().unique(),
  title:       text('title').notNull(),
  icon:        text('icon').notNull(),
  description: text('description').notNull(),
  categories:  text('categories').notNull(),  // JSON string[]
  order:       integer('order').notNull().default(0),
})

// ── Studies (itens individuais do catálogo) ───────────────────────────────────
export const studies = sqliteTable('studies', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  slug:        text('slug').notNull().unique(),
  title:       text('title').notNull(),
  icon:        text('icon').notNull(),
  category:    text('category').notNull(),
  description: text('description').notNull(),
  available:   integer('available', { mode: 'boolean' }).notNull().default(true),
  order:       integer('order').notNull().default(0),
  // null = estudo manual (sem conteúdo gerado); non-null = gerado por IA
  aiContentId: integer('ai_content_id'),
})

// ── AI Study Content ──────────────────────────────────────────────────────────
// Conteúdo estruturado gerado via AI skills — sem precisar de arquivos de código.
// Cada linha é o conteúdo completo de um study gerado por IA.
export const aiStudyContent = sqliteTable('ai_study_content', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  studySlug:   text('study_slug').notNull().unique(),
  content:     text('content').notNull(),   // JSON: GeneratedStudyContent
  generatedBy: text('generated_by').notNull(),  // "anthropic:claude-sonnet-4-6"
  prompt:      text('prompt').notNull(),    // prompt original do usuário
  createdAt:   integer('created_at').notNull().$defaultFn(() => Date.now()),
})

// ── Types derivados ───────────────────────────────────────────────────────────
export type Section         = typeof sections.$inferSelect
export type InsertSection   = typeof sections.$inferInsert
export type Study           = typeof studies.$inferSelect
export type InsertStudy     = typeof studies.$inferInsert
export type AiStudyContent  = typeof aiStudyContent.$inferSelect
