import { Hono }        from 'hono'
import { readConfig, writeConfig } from '../utils/config.js'

export const config = new Hono()

// GET /api/config — retorna config pública (sem API keys completas)
config.get('/', (c) => {
  const cfg = readConfig()
  return c.json({
    frontend:  cfg.frontend,
    backend:   cfg.backend,
    codePath:  cfg.codePath,
    ai: {
      provider:    cfg.ai.provider,
      model:       cfg.ai.model,
      hasApiKey:   !!cfg.ai.apiKey,
      // envia apenas os últimos 6 chars para confirmar qual chave está configurada
      apiKeyHint:  cfg.ai.apiKey ? `…${cfg.ai.apiKey.slice(-6)}` : null,
      skills:      cfg.ai.skills,
      fallbacks: (cfg.ai.fallbacks ?? []).map((f) => ({
        label:      f.label ?? '',
        provider:   f.provider,
        model:      f.model,
        hasApiKey:  !!f.apiKey,
        apiKeyHint: f.apiKey ? `…${f.apiKey.slice(-6)}` : null,
      })),
    },
  })
})

// PATCH /api/config — atualiza campos específicos
config.patch('/', async (c) => {
  const body   = await c.req.json()
  const current = readConfig()

  const aiPatch = body.ai ?? {}

  // Se o provider mudou sem um model explícito, resetar o model para o default do provider
  const providerDefault: Record<string, string> = {
    anthropic: 'claude-sonnet-4-6',
    google:    'gemini-2.5-flash',
    cli:       '',
  }
  if (aiPatch.provider && aiPatch.provider !== current.ai.provider && !aiPatch.model) {
    aiPatch.model = providerDefault[aiPatch.provider] ?? ''
  }

  if (Array.isArray(body.ai?.fallbacks)) {
    const currentFallbacks: { apiKey: string }[] = current.ai.fallbacks ?? []
    aiPatch.fallbacks = (body.ai.fallbacks as Record<string, string>[]).map((fb, i) => ({
      label:    fb.label ?? '',
      provider: fb.provider ?? 'google',
      model:    fb.model ?? '',
      apiKey:   fb.apiKey?.trim() ? fb.apiKey.trim() : (currentFallbacks[i]?.apiKey ?? ''),
    }))
  }

  const updated = {
    ...current,
    frontend:  { ...current.frontend, ...(body.frontend ?? {}) },
    backend:   { ...current.backend,  ...(body.backend  ?? {}) },
    codePath:  body.codePath !== undefined ? String(body.codePath) : current.codePath,
    ai: { ...current.ai, ...aiPatch },
  }

  writeConfig(updated)
  return c.json({ ok: true })
})
