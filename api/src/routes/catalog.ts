import { Hono }           from 'hono'
import { eq }             from 'drizzle-orm'
import { db }             from '../db/client.js'
import { sections, studies } from '../db/schema.js'

export const catalog = new Hono()

// ── Sections ──────────────────────────────────────────────────────────────────

catalog.get('/sections', async (c) => {
  const rows = await db.select().from(sections).orderBy(sections.order)
  return c.json(rows.map(s => ({ ...s, categories: JSON.parse(s.categories) })))
})

catalog.post('/sections', async (c) => {
  const body = await c.req.json()
  const [row] = await db.insert(sections).values({
    ...body,
    categories: JSON.stringify(body.categories ?? []),
  }).returning()
  return c.json({ ...row, categories: JSON.parse(row.categories) }, 201)
})

catalog.put('/sections/:id', async (c) => {
  const id   = Number(c.req.param('id'))
  const body = await c.req.json()
  const [row] = await db.update(sections)
    .set({ ...body, categories: JSON.stringify(body.categories ?? []) })
    .where(eq(sections.id, id))
    .returning()
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json({ ...row, categories: JSON.parse(row.categories) })
})

catalog.delete('/sections/:id', async (c) => {
  const id = Number(c.req.param('id'))
  await db.delete(sections).where(eq(sections.id, id))
  return c.body(null, 204)
})

// ── Studies ───────────────────────────────────────────────────────────────────

catalog.get('/studies', async (c) => {
  const sectionSlug = c.req.query('section')
  let rows = await db.select().from(studies).orderBy(studies.order)

  if (sectionSlug) {
    // filtra studies pela categoria que pertence à section
    const [section] = await db.select().from(sections).where(eq(sections.slug, sectionSlug))
    if (!section) return c.json([])
    const cats: string[] = JSON.parse(section.categories)
    rows = rows.filter(s => cats.includes(s.category))
  }

  return c.json(rows)
})

catalog.post('/studies', async (c) => {
  const body  = await c.req.json()
  const [row] = await db.insert(studies).values(body).returning()
  return c.json(row, 201)
})

catalog.put('/studies/:id', async (c) => {
  const id    = Number(c.req.param('id'))
  const body  = await c.req.json()
  const [row] = await db.update(studies).set(body).where(eq(studies.id, id)).returning()
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(row)
})

catalog.delete('/studies/:id', async (c) => {
  const id = Number(c.req.param('id'))
  await db.delete(studies).where(eq(studies.id, id))
  return c.body(null, 204)
})
