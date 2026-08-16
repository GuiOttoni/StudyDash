import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { HOME_DIR, CONFIG_FILE } from './paths.js'

export interface StudydashConfig {
  backend:  { port: number; host: string }
  frontend: { port: number }
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

export const DEFAULT_CONFIG: StudydashConfig = {
  backend:  { port: 5055, host: 'localhost' },
  frontend: { port: 8085 },
  ai: {
    provider: 'anthropic',
    apiKey:   '',
    model:    'claude-sonnet-4-6',
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
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

// Faz merge por cima do arquivo existente em vez de sobrescrever — StudydashConfig
// aqui é um subconjunto do shape usado pela API (que também guarda codePath e
// ai.fallbacks); sobrescrever direto apagaria esses campos.
export function writeConfig(cfg: StudydashConfig): void {
  if (!existsSync(HOME_DIR)) mkdirSync(HOME_DIR, { recursive: true })

  let raw: Record<string, any> = {}
  if (existsSync(CONFIG_FILE)) {
    try { raw = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) } catch { /* arquivo corrompido, ignora */ }
  }

  const merged = { ...raw, ...cfg, ai: { ...raw.ai, ...cfg.ai } }
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2))
}

export function isConfigured(): boolean {
  const cfg = readConfig()
  return cfg.ai.provider === 'cli' || !!cfg.ai.apiKey
}
