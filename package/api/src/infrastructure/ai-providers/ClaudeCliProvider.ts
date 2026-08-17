import { spawn } from 'child_process'
import type { AiProvider, GenerationLogFn } from '../../domain/ports/AiProvider.js'
import type { Skill } from '../../domain/value-objects/Skill.js'
import type { GeneratedStudy } from '../../domain/value-objects/GeneratedStudy.js'

// Mapeia cada skill (tool) para o campo correspondente em GeneratedStudy —
// o CLI do Claude Code não tem tool-calling customizado como a Anthropic SDK,
// então pedimos o estudo inteiro de uma vez, validado por --json-schema.
const FIELD_MAP: Record<string, { field: keyof GeneratedStudy; kind: 'object' | 'array' | 'quiz' }> = {
  set_metadata:      { field: 'metadata',     kind: 'object' },
  add_explanation:   { field: 'explanations', kind: 'array'  },
  add_code_snippet:  { field: 'codeSnippets', kind: 'array'  },
  add_comparison:    { field: 'comparisons',  kind: 'array'  },
  add_quiz:          { field: 'quiz',         kind: 'quiz'   },
  add_runnable_code: { field: 'runnableCode', kind: 'object' },
}

function buildJsonSchema(skills: Skill[]): Record<string, unknown> {
  const properties: Record<string, unknown> = {}
  const required: string[] = []

  for (const skill of skills) {
    const map = FIELD_MAP[skill.name]
    if (!map) continue

    if (map.kind === 'quiz') {
      properties[map.field] = skill.input_schema.properties.questions
    } else if (map.kind === 'array') {
      properties[map.field] = { type: 'array', items: skill.input_schema }
    } else {
      properties[map.field] = skill.input_schema
    }
    required.push(map.field)
  }

  return { type: 'object', properties, required }
}

const TIMEOUT_MS = 4 * 60_000

export class ClaudeCliProvider implements AiProvider {
  readonly label = 'cli'
  readonly model: string

  constructor(model?: string) {
    this.model = model ?? ''
  }

  async generate(prompt: string, skills: Skill[], systemPrompt: string, log?: GenerationLogFn): Promise<GeneratedStudy> {
    const schema = buildJsonSchema(skills)

    const args = [
      '-p',
      '--output-format', 'json',
      '--json-schema', JSON.stringify(schema),
      '--system-prompt', systemPrompt,
      // dontAsk nega qualquer tool não pré-aprovada (não passamos --allowedTools,
      // então nenhuma tool roda) — sem usar --bare, que isola ~/.claude e quebra
      // a sessão já autenticada do usuário, exatamente o que este provider evita pedir de novo.
      '--permission-mode', 'dontAsk',
    ]
    if (this.model) args.push('--model', this.model)

    log?.('📡 Consultando Claude Code CLI local (sem API key)...')

    const stdout = await new Promise<string>((resolve, reject) => {
      const proc = spawn('claude', args, { stdio: ['pipe', 'pipe', 'pipe'] })

      let out = ''
      let err = ''
      const timer = setTimeout(() => {
        proc.kill()
        reject(new Error('Timeout: o Claude Code CLI não respondeu em 4 minutos.'))
      }, TIMEOUT_MS)

      proc.stdout.on('data', (d: Buffer) => { out += d.toString() })
      proc.stderr.on('data', (d: Buffer) => { err += d.toString() })

      proc.on('error', (spawnErr: NodeJS.ErrnoException) => {
        clearTimeout(timer)
        if (spawnErr.code === 'ENOENT') {
          reject(new Error(
            'Claude Code CLI não encontrado no PATH. Instale com `npm install -g @anthropic-ai/claude-code` ' +
            'e rode `claude login` antes de usar este provider.'
          ))
        } else {
          reject(spawnErr)
        }
      })

      proc.on('close', (code) => {
        clearTimeout(timer)
        if (code !== 0) {
          reject(new Error(`Claude Code CLI saiu com código ${code}: ${err.trim() || '(sem stderr)'}`))
          return
        }
        resolve(out)
      })

      proc.stdin.write(prompt)
      proc.stdin.end()
    })

    let envelope: Record<string, unknown>
    try {
      envelope = JSON.parse(stdout)
    } catch {
      throw new Error(`Claude Code CLI retornou uma resposta que não é JSON válido: ${stdout.slice(0, 300)}`)
    }

    const structured = (envelope.structured_output ?? envelope.result) as unknown
    const study: Partial<GeneratedStudy> =
      typeof structured === 'string' ? JSON.parse(structured) : (structured as Partial<GeneratedStudy>)

    if (!study?.metadata) {
      throw new Error('Claude Code CLI não retornou os metadados do estudo (resposta fora do formato esperado).')
    }

    const result: GeneratedStudy = {
      metadata:     study.metadata,
      explanations: study.explanations ?? [],
      codeSnippets: study.codeSnippets ?? [],
      comparisons:  study.comparisons  ?? [],
      quiz:         study.quiz         ?? [],
      runnableCode: study.runnableCode,
    }

    log?.(`📋 Metadados: "${result.metadata.title}" [${result.metadata.category}]`)
    result.explanations.forEach(e => log?.(`📖 Explicação: "${e.title}"`))
    result.codeSnippets.forEach(c => log?.(`💻 Código: "${c.title}" [${c.language}]`))
    result.comparisons.forEach(c  => log?.(`⚖️ Comparação: "${c.title}"`))
    if (result.quiz.length) log?.(`❓ Quiz: ${result.quiz.length} questões`)
    if (result.runnableCode) log?.(`🏃 Código executável: ${result.runnableCode.filename}`)

    return result
  }
}
