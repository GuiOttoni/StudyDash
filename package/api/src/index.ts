import { serve }   from '@hono/node-server'
import { Hono }    from 'hono'
import { cors }    from 'hono/cors'
import { logger }  from 'hono/logger'
import { sections, studies } from './routes/catalog.js'
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
app.route('/api/sections', sections)
app.route('/api/studies',  studies)
app.route('/api/config',   config)
app.route('/api/ai',       ai)

app.get('/health', (c) => c.json({ ok: true, version: '0.1.0' }))

// ── Start ─────────────────────────────────────────────────────────────────────
// hostname fixo em 127.0.0.1: a API não tem autenticação, então nunca deve
// ficar acessível para outras máquinas na rede.
serve({ fetch: app.fetch, port, hostname: '127.0.0.1' }, (info) => {
  console.log(`StudyDash API  →  http://localhost:${info.port}`)
})
