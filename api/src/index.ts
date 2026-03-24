import { serve }   from '@hono/node-server'
import { Hono }    from 'hono'
import { cors }    from 'hono/cors'
import { logger }  from 'hono/logger'
import { catalog } from './routes/catalog.js'
import { config }  from './routes/config.js'
import { ai }      from './routes/ai.js'
import { initDatabase } from './db/client.js'
import { readConfig }   from './utils/config.js'

// ── Init ──────────────────────────────────────────────────────────────────────
initDatabase()

const cfg  = readConfig()
const port = Number(process.env.PORT ?? cfg.backend.port)

// ── App ───────────────────────────────────────────────────────────────────────
const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: (origin) => {
    // permite qualquer localhost (dev + frontend standalone)
    if (!origin) return origin
    try { return new URL(origin).hostname === 'localhost' ? origin : null }
    catch { return null }
  },
  allowHeaders:  ['Content-Type', 'Authorization'],
  allowMethods:  ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))

// ── Routes ────────────────────────────────────────────────────────────────────
app.route('/api/catalog', catalog)   // mantido para compatibilidade
app.route('/api/sections', catalog)  // alias direto
app.route('/api/studies',  catalog)
app.route('/api/config',   config)
app.route('/api/ai',       ai)

app.get('/health', (c) => c.json({ ok: true, version: '0.1.0' }))

// ── Start ─────────────────────────────────────────────────────────────────────
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`StudyDash API  →  http://localhost:${info.port}`)
})
