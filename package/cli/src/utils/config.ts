import { existsSync, readFileSync } from 'fs'
import { CONFIG_FILE } from './paths.js'

export interface StudydashConfig {
  // Processo único desde a migração pra Vite (era backend+frontend separados).
  server: { port: number; host: string }
  ai: {
    // 'cli' usa o Claude Code CLI já instalado/autenticado na máquina —
    // não precisa de apiKey.
    provider: 'anthropic' | 'google' | 'cli'
    apiKey:   string
    model:    string
    skills: {
      codeSnippet:  boolean
      comparison:   boolean
      quiz:         boolean
      diagram:      boolean
      explanation:  boolean
    }
  }
}

// 'cli' como default: só reflete o config.json real depois que a API grava um
// (via tela de Configurações) — antes disso, é o mesmo default zero-fricção
// usado pela API (api/src/infrastructure/config/FileConfigStore.ts).
export const DEFAULT_CONFIG: StudydashConfig = {
  server: { port: 5055, host: 'localhost' },
  ai: {
    provider: 'cli',
    apiKey:   '',
    model:    '',
    skills: {
      codeSnippet:  true,
      comparison:   true,
      quiz:         true,
      diagram:      false,
      explanation:  true,
    },
  },
}

export function readConfig(): StudydashConfig {
  if (!existsSync(CONFIG_FILE)) return { ...DEFAULT_CONFIG }
  try {
    const raw = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
    // Config de antes da v0.3.0 (processo separado de frontend) tinha
    // `backend.port` em vez de `server.port` — migra pra não perder a porta
    // customizada, e pra sempre ter `server` definido (evita crash no `up`).
    const server = raw.server ?? raw.backend ?? DEFAULT_CONFIG.server
    return { ...DEFAULT_CONFIG, ...raw, server, ai: { ...DEFAULT_CONFIG.ai, ...raw.ai } }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function isConfigured(): boolean {
  const cfg = readConfig()
  return cfg.ai.provider === 'cli' || !!cfg.ai.apiKey
}
