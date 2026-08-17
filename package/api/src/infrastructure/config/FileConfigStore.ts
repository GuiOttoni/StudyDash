import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

export const STUDYDASH_DIR = join(homedir(), '.studydash')
const CONFIG_PATH = join(STUDYDASH_DIR, 'config.json')

export interface FallbackProviderConfig {
  label?:   string
  provider: 'anthropic' | 'google' | 'cli'
  apiKey:   string
  model:    string
}

export interface StudydashConfig {
  // Um único processo/porta desde a migração pra Vite (era backend+frontend separados).
  server: {
    port: number
    host: string
  }
  codePath: string
  ai: {
    // 'cli' usa o Claude Code CLI já instalado/autenticado na máquina —
    // não precisa de apiKey.
    provider: 'anthropic' | 'google' | 'cli'
    apiKey:   string
    model:    string
    // Linguagem principal dos exemplos de código dos estudos gerados (o
    // código executável interativo continua sempre em Node.js).
    codeLanguage: string
    skills: {
      codeSnippet:  boolean
      comparison:   boolean
      quiz:         boolean
      diagram:      boolean
      explanation:  boolean
    }
    fallbacks: FallbackProviderConfig[]
  }
}

// 'cli' como default: funciona sem nenhuma configuração prévia, usando o
// Claude Code CLI já autenticado na máquina — zero fricção no primeiro uso.
const DEFAULT_CONFIG: StudydashConfig = {
  server:   { port: 5055, host: 'localhost' },
  codePath: join(STUDYDASH_DIR, 'code'),
  ai: {
    provider: 'cli',
    apiKey:   '',
    model:    '',
    codeLanguage: 'csharp',
    fallbacks: [],
    skills: {
      codeSnippet:  true,
      comparison:   true,
      quiz:         true,
      diagram:      false,
      explanation:  true,
    },
  },
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

/** Lê/escreve ~/.studydash/config.json — único ponto de acesso a esse arquivo. */
export class FileConfigStore {
  read(): StudydashConfig {
    if (!existsSync(CONFIG_PATH)) return { ...DEFAULT_CONFIG }
    try {
      const parsed = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
      // Config de antes da v0.3.0 (processo separado de frontend) tinha
      // `backend.port` em vez de `server.port` — migra pra não perder a
      // porta customizada ao atualizar.
      if (!parsed.server && parsed.backend) parsed.server = parsed.backend
      delete parsed.frontend

      const merged = deepMerge(DEFAULT_CONFIG, parsed)
      // codePath nunca é configurável pelo usuário (mesmo em configs antigos
      // salvos antes dessa regra) — todo dado gerado sempre mora em ~/.studydash.
      merged.codePath = DEFAULT_CONFIG.codePath
      return merged
    } catch {
      return { ...DEFAULT_CONFIG }
    }
  }

  write(config: StudydashConfig): void {
    if (!existsSync(STUDYDASH_DIR)) mkdirSync(STUDYDASH_DIR, { recursive: true })
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
  }
}
