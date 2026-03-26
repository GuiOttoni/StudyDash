import { Hono } from 'hono'
import { db }   from '../db/client.js'
import type { Section, Study } from '../db/schema.js'

export const catalog = new Hono()

// ── Sections ──────────────────────────────────────────────────────────────────

catalog.get('/sections', (c) => {
  const rows = db.prepare('SELECT * FROM sections ORDER BY "order" ASC').all() as Section[]
  return c.json(rows.map(s => ({ ...s, categories: JSON.parse(s.categories) })))
})

catalog.post('/sections', async (c) => {
  const body = await c.req.json()
  const result = db.prepare(`
    INSERT INTO sections (slug, title, icon, description, categories, "order")
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(body.slug, body.title, body.icon, body.description, JSON.stringify(body.categories ?? []), body.order ?? 0)
  const row = db.prepare('SELECT * FROM sections WHERE id = ?').get(result.lastInsertRowid) as Section
  return c.json({ ...row, categories: JSON.parse(row.categories) }, 201)
})

catalog.put('/sections/:id', async (c) => {
  const id   = Number(c.req.param('id'))
  const body = await c.req.json()
  db.prepare(`
    UPDATE sections SET slug=?, title=?, icon=?, description=?, categories=?, "order"=? WHERE id=?
  `).run(body.slug, body.title, body.icon, body.description, JSON.stringify(body.categories ?? []), body.order ?? 0, id)
  const row = db.prepare('SELECT * FROM sections WHERE id = ?').get(id) as Section | undefined
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json({ ...row, categories: JSON.parse(row.categories) })
})

catalog.delete('/sections/:id', (c) => {
  const id = Number(c.req.param('id'))
  db.prepare('DELETE FROM sections WHERE id = ?').run(id)
  return c.body(null, 204)
})

// ── Studies ───────────────────────────────────────────────────────────────────

catalog.get('/studies', (c) => {
  const sectionSlug = c.req.query('section')
  let rows = db.prepare('SELECT * FROM studies ORDER BY "order" ASC').all() as Study[]

  if (sectionSlug) {
    const section = db.prepare('SELECT * FROM sections WHERE slug = ?').get(sectionSlug) as Section | undefined
    if (!section) return c.json([])
    const cats: string[] = JSON.parse(section.categories)
    rows = rows.filter(s => cats.includes(s.category))
  }

  return c.json(rows)
})

catalog.post('/studies', async (c) => {
  const body   = await c.req.json()
  const result = db.prepare(`
    INSERT INTO studies (slug, title, icon, category, description, available, "order")
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(body.slug, body.title, body.icon, body.category, body.description, body.available ? 1 : 0, body.order ?? 0)
  const row = db.prepare('SELECT * FROM studies WHERE id = ?').get(result.lastInsertRowid) as Study
  return c.json(row, 201)
})

catalog.put('/studies/:id', async (c) => {
  const id   = Number(c.req.param('id'))
  const body = await c.req.json()
  db.prepare(`
    UPDATE studies SET slug=?, title=?, icon=?, category=?, description=?, available=?, "order"=? WHERE id=?
  `).run(body.slug, body.title, body.icon, body.category, body.description, body.available ? 1 : 0, body.order ?? 0, id)
  const row = db.prepare('SELECT * FROM studies WHERE id = ?').get(id) as Study | undefined
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(row)
})

catalog.delete('/studies/:id', (c) => {
  const id = Number(c.req.param('id'))
  db.prepare('DELETE FROM studies WHERE id = ?').run(id)
  return c.body(null, 204)
})
