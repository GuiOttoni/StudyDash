import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { SectionRepository } from '../../domain/ports/SectionRepository.js'
import type { StudyRepository } from '../../domain/ports/StudyRepository.js'
import type { AiStudyContentRepository } from '../../domain/ports/AiStudyContentRepository.js'
import { sectionsRoutes } from './routes/sections.routes.js'
import { studiesRoutes } from './routes/studies.routes.js'
import { configRoutes } from './routes/config.routes.js'
import { aiRoutes, type AiRoutesDeps } from './routes/ai.routes.js'
import type { FileConfigStore } from '../../infrastructure/config/FileConfigStore.js'

export interface ServerDeps extends AiRoutesDeps {
  sectionRepo: SectionRepository
  studyRepo:   StudyRepository
  contentRepo: AiStudyContentRepository
  configStore: FileConfigStore
  /** Pasta com o build estático do frontend (Vite) — null desativa o serving de assets (ex: testes). */
  publicDir:   string | null
}

export function createServer(deps: ServerDeps): Hono {
  const app = new Hono()

  app.use('*', logger())

  app.route('/api/sections', sectionsRoutes(deps.sectionRepo))
  app.route('/api/studies',  studiesRoutes(deps.studyRepo, deps.sectionRepo, deps.contentRepo))
  app.route('/api/config',   configRoutes(deps.configStore))
  app.route('/api/ai',       aiRoutes(deps))

  app.get('/health', (c) => c.json({ ok: true, version: '0.3.0' }))

  if (deps.publicDir) {
    const publicDir = deps.publicDir
    app.use('/*', serveStatic({ root: publicDir }))
    // SPA fallback: qualquer rota não-API que não bateu em um arquivo estático
    // vira index.html (roteamento client-side do react-router).
    app.get('*', (c) => {
      const indexPath = join(publicDir, 'index.html')
      if (!existsSync(indexPath)) return c.notFound()
      return c.html(readFileSync(indexPath, 'utf-8'))
    })
  }

  return app
}
