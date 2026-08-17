import type { AiProvider } from '../../domain/ports/AiProvider.js'
import type { StudydashConfig, FallbackProviderConfig } from '../config/FileConfigStore.js'
import { ClaudeAiProvider } from './ClaudeAiProvider.js'
import { GeminiAiProvider } from './GeminiAiProvider.js'
import { ClaudeCliProvider } from './ClaudeCliProvider.js'

function build(provider: 'anthropic' | 'google' | 'cli', apiKey: string, model: string): AiProvider {
  if (provider === 'anthropic') return new ClaudeAiProvider(apiKey, model)
  if (provider === 'google')    return new GeminiAiProvider(apiKey, model)
  return new ClaudeCliProvider(model)
}

/** Monta a cadeia de providers a tentar (principal primeiro, depois fallbacks
 *  com apiKey configurada — 'cli' não precisa de apiKey). */
export function buildProviderChain(config: StudydashConfig): AiProvider[] {
  const fallbacks: FallbackProviderConfig[] = config.ai.fallbacks ?? []
  return [
    build(config.ai.provider, config.ai.apiKey, config.ai.model),
    ...fallbacks
      .filter(f => f.apiKey || f.provider === 'cli')
      .map(f => build(f.provider, f.apiKey, f.model)),
  ]
}
