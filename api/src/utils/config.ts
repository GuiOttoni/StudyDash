import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { join }    from 'path'

export const STUDYDASH_DIR = join(homedir(), '.studydash')
export const CONFIG_PATH   = join(STUDYDASH_DIR, 'config.json')

export interface StudydashConfig {
  backend: {
    port: number
    host: string
  }
  frontend: {
    port: number
  }
  ai: {
    provider: 'anthropic' | 'google'
    apiKey:   string
    model:    string
    // Skills que a IA pode usar ao gerar um estudo
    skills: {
      codeSnippet:   boolean
      comparison:    boolean
      quiz:          boolean
      diagram:       boolean
      explanation:   boolean
    }
  }
}

const DEFAULT_CONFIG: StudydashConfig = {
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
  if (!existsSync(CONFIG_PATH)) return { ...DEFAULT_CONFIG }
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8')
    // deep merge com defaults para tolerar configs parciais
    return deepMerge(DEFAULT_CONFIG, JSON.parse(raw))
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function writeConfig(config: StudydashConfig): void {
  if (!existsSync(STUDYDASH_DIR)) mkdirSync(STUDYDASH_DIR, { recursive: true })
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target }
  for (const key of Object.keys(source) as (keyof T)[]) {
    const s = source[key]
    const t = target[key]
    if (s !== undefined) {
      result[key] = (s && typeof s === 'object' && !Array.isArray(s) && t && typeof t === 'object')
        ? deepMerge(t as object, s as object) as T[keyof T]
        : s as T[keyof T]
    }
  }
  return result
}
