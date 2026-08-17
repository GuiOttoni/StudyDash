import { Hono } from 'hono'
import type { SectionRepository } from '../../../domain/ports/SectionRepository.js'

export function sectionsRoutes(repo: SectionRepository): Hono {
  const app = new Hono()

  app.get('/', (c) => c.json(repo.findAll()))

  app.post('/reset', (c) => {
    repo.deleteAll()
    return c.json([])
  })

  app.post('/', async (c) => {
    const body = await c.req.json()
    const section = repo.create({
      slug: body.slug, title: body.title, icon: body.icon,
      description: body.description, categories: body.categories ?? [], order: body.order ?? 0,
    })
    return c.json(section, 201)
  })

  app.put('/:id', async (c) => {
    const id   = Number(c.req.param('id'))
    const body = await c.req.json()
    const section = repo.update(id, {
      slug: body.slug, title: body.title, icon: body.icon,
      description: body.description, categories: body.categories ?? [], order: body.order ?? 0,
    })
    if (!section) return c.json({ error: 'Not found' }, 404)
    return c.json(section)
  })

  app.delete('/:id', (c) => {
    repo.delete(Number(c.req.param('id')))
    return c.body(null, 204)
  })

  return app
}
