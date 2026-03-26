import { Hono }          from 'hono'
import { db }            from '../db/client.js'
import type { Study, AiStudyContent } from '../db/schema.js'
import { generateStudy } from '../ai/generate.js'
import { readConfig }    from '../utils/config.js'

export const ai = new Hono()

// POST /api/ai/generate
// Body: { prompt: string }
// Gera um estudo completo usando AI skills e persiste no banco.
ai.post('/generate', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>()

  if (!prompt?.trim()) {
    return c.json({ error: 'prompt é obrigatório' }, 400)
  }

  const cfg = readConfig()
  if (!cfg.ai.apiKey) {
    return c.json({ error: 'API key não configurada. Execute: studydash config' }, 400)
  }

  const result = await generateStudy(prompt, cfg)

  // Upsert conteúdo gerado
  db.prepare(`
    INSERT INTO ai_study_content (study_slug, content, generated_by, prompt, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(study_slug) DO UPDATE SET
      content      = excluded.content,
      generated_by = excluded.generated_by,
      prompt       = excluded.prompt,
      created_at   = excluded.created_at
  `).run(
    result.metadata.slug,
    JSON.stringify(result),
    `${cfg.ai.provider}:${cfg.ai.model}`,
    prompt,
    Date.now(),
  )

  // Upsert no catálogo
  db.prepare(`
    INSERT INTO studies (slug, title, icon, category, description, available, "order")
    VALUES (?, ?, ?, ?, ?, 1, ?)
    ON CONFLICT(slug) DO UPDATE SET
      title       = excluded.title,
      icon        = excluded.icon,
      category    = excluded.category,
      description = excluded.description
  `).run(
    result.metadata.slug,
    result.metadata.title,
    result.metadata.icon,
    result.metadata.category,
    result.metadata.description,
    Date.now(),
  )

  const study = db.prepare('SELECT * FROM studies WHERE slug = ?').get(result.metadata.slug) as Study

  return c.json({ study, content: result })
})

// GET /api/ai/study/:slug — retorna conteúdo gerado por IA para o renderer dinâmico
ai.get('/study/:slug', (c) => {
  const slug = c.req.param('slug')
  const row  = db.prepare('SELECT * FROM ai_study_content WHERE study_slug = ?').get(slug) as AiStudyContent | undefined
  if (!row) return c.json({ error: 'Study não encontrado' }, 404)
  return c.json({ ...row, content: JSON.parse(row.content) })
})

// GET /api/ai/models — lista modelos disponíveis por provider
ai.get('/models', (c) => {
  return c.json({
    anthropic: [
      { id: 'claude-opus-4-6',           label: 'Claude Opus 4.6 (mais capaz)' },
      { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6 (recomendado)' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (mais rápido)' },
    ],
    google: [
      { id: 'gemini-2.0-flash',          label: 'Gemini 2.0 Flash (recomendado)' },
      { id: 'gemini-2.0-flash-thinking', label: 'Gemini 2.0 Flash Thinking' },
      { id: 'gemini-1.5-pro',            label: 'Gemini 1.5 Pro' },
    ],
  })
})
