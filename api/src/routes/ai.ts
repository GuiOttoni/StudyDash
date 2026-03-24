import { Hono }          from 'hono'
import { streamText }    from 'hono/streaming'
import { eq }            from 'drizzle-orm'
import { db }            from '../db/client.js'
import { studies, aiStudyContent } from '../db/schema.js'
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

  // Persiste conteúdo gerado
  await db.insert(aiStudyContent).values({
    studySlug:   result.metadata.slug,
    content:     JSON.stringify(result),
    generatedBy: `${cfg.ai.provider}:${cfg.ai.model}`,
    prompt,
    createdAt:   Date.now(),
  }).onConflictDoUpdate({
    target: aiStudyContent.studySlug,
    set: {
      content:     JSON.stringify(result),
      generatedBy: `${cfg.ai.provider}:${cfg.ai.model}`,
      prompt,
      createdAt:   Date.now(),
    },
  })

  // Upsert no catálogo
  const [study] = await db.insert(studies).values({
    slug:        result.metadata.slug,
    title:       result.metadata.title,
    icon:        result.metadata.icon,
    category:    result.metadata.category,
    description: result.metadata.description,
    available:   true,
    order:       Date.now(), // novo study aparece no final
  }).onConflictDoUpdate({
    target: studies.slug,
    set: {
      title:       result.metadata.title,
      icon:        result.metadata.icon,
      category:    result.metadata.category,
      description: result.metadata.description,
    },
  }).returning()

  return c.json({ study, content: result })
})

// GET /api/ai/study/:slug — retorna conteúdo gerado por IA para o renderer dinâmico
ai.get('/study/:slug', async (c) => {
  const slug = c.req.param('slug')
  const [row] = await db.select().from(aiStudyContent).where(eq(aiStudyContent.studySlug, slug))
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
