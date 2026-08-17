import { Hono } from 'hono'
import type { StudyRepository } from '../../../domain/ports/StudyRepository.js'
import type { SectionRepository } from '../../../domain/ports/SectionRepository.js'
import type { AiStudyContentRepository } from '../../../domain/ports/AiStudyContentRepository.js'

export function studiesRoutes(
  studyRepo:   StudyRepository,
  sectionRepo: SectionRepository,
  contentRepo: AiStudyContentRepository,
): Hono {
  const app = new Hono()

  app.get('/', (c) => {
    const sectionSlug = c.req.query('section')
    let studies = studyRepo.findAll()

    if (sectionSlug) {
      const section = sectionRepo.findBySlug(sectionSlug)
      if (!section) return c.json([])
      studies = studies.filter((s) =>
        section.matchesCategory(s.category) ||
        s.category.toLowerCase().replace(/\s+/g, '-') === section.slug
      )
    }

    return c.json(studies)
  })

  app.post('/reset', (c) => {
    studyRepo.deleteAll()
    contentRepo.deleteAll()
    return c.json([])
  })

  app.post('/', async (c) => {
    const body = await c.req.json()
    const study = studyRepo.create({
      slug: body.slug, title: body.title, icon: body.icon, category: body.category,
      description: body.description, available: !!body.available, order: body.order ?? 0,
    })
    return c.json(study, 201)
  })

  app.put('/:id', async (c) => {
    const id   = Number(c.req.param('id'))
    const body = await c.req.json()
    const study = studyRepo.update(id, {
      slug: body.slug, title: body.title, icon: body.icon, category: body.category,
      description: body.description, available: !!body.available, order: body.order ?? 0,
    })
    if (!study) return c.json({ error: 'Not found' }, 404)
    return c.json(study)
  })

  app.delete('/:id', (c) => {
    studyRepo.delete(Number(c.req.param('id')))
    return c.body(null, 204)
  })

  return app
}
