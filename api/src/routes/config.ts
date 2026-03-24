import { Hono }        from 'hono'
import { readConfig, writeConfig } from '../utils/config.js'

export const config = new Hono()

// GET /api/config — retorna config pública (sem API keys completas)
config.get('/', (c) => {
  const cfg = readConfig()
  return c.json({
    frontend:  cfg.frontend,
    backend:   cfg.backend,
    ai: {
      provider:    cfg.ai.provider,
      model:       cfg.ai.model,
      hasApiKey:   !!cfg.ai.apiKey,
      // envia apenas os últimos 6 chars para confirmar qual chave está configurada
      apiKeyHint:  cfg.ai.apiKey ? `…${cfg.ai.apiKey.slice(-6)}` : null,
      skills:      cfg.ai.skills,
    },
  })
})

// PATCH /api/config — atualiza campos específicos
config.patch('/', async (c) => {
  const body   = await c.req.json()
  const current = readConfig()

  const updated = {
    ...current,
    frontend: { ...current.frontend, ...(body.frontend ?? {}) },
    backend:  { ...current.backend,  ...(body.backend  ?? {}) },
    ai: {
      ...current.ai,
      ...(body.ai ?? {}),
    },
  }

  writeConfig(updated)
  return c.json({ ok: true })
})
