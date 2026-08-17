import { Hono } from 'hono'
import type { FileConfigStore } from '../../../infrastructure/config/FileConfigStore.js'

const MODEL_DEFAULTS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-6',
  google:    'gemini-2.5-flash',
  cli:       '',
}

export function configRoutes(store: FileConfigStore): Hono {
  const app = new Hono()

  app.get('/', (c) => {
    const cfg = store.read()
    return c.json({
      server:   cfg.server,
      codePath: cfg.codePath,
      ai: {
        provider:     cfg.ai.provider,
        model:        cfg.ai.model,
        codeLanguage: cfg.ai.codeLanguage,
        hasApiKey:  !!cfg.ai.apiKey,
        // envia apenas os últimos 6 chars para confirmar qual chave está configurada
        apiKeyHint: cfg.ai.apiKey ? `…${cfg.ai.apiKey.slice(-6)}` : null,
        skills:     cfg.ai.skills,
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

  app.patch('/', async (c) => {
    const body    = await c.req.json()
    const current = store.read()

    const aiPatch = body.ai ?? {}

    if (aiPatch.provider && aiPatch.provider !== current.ai.provider && !aiPatch.model) {
      aiPatch.model = MODEL_DEFAULTS[aiPatch.provider] ?? ''
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

    store.write({
      ...current,
      server: { ...current.server, ...(body.server ?? {}) },
      // codePath não é configurável pelo cliente — sempre fica dentro de ~/.studydash.
      codePath: current.codePath,
      ai: { ...current.ai, ...aiPatch },
    })

    return c.json({ ok: true })
  })

  return app
}
