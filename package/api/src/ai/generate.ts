import type { StudydashConfig }   from '../utils/config.js'
import type { GeneratedStudy }    from './skills.js'
import { buildSkillList }         from './skills.js'
import { generateWithClaude }     from './providers/claude.js'
import { generateWithGemini }     from './providers/gemini.js'
import { generateWithCli }        from './providers/cli.js'

export type LogFn = (message: string) => void

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
Você é um especialista em engenharia de software criando conteúdo educacional
para o StudyDash, uma plataforma de aprendizado interativo para desenvolvedores.

Seu objetivo é gerar um estudo completo e didático sobre o tópico solicitado.

Regras:
1. Comece SEMPRE chamando set_metadata para definir os metadados do estudo.
2. Use add_explanation para seções de contexto, "o que é", "por que usar", trade-offs.
3. Use add_code_snippet para exemplos práticos — prefira C# mas adapte à linguagem mais relevante.
4. Use add_comparison quando houver múltiplas abordagens ou alternativas a comparar.
5. Finalize com add_quiz (2-4 questões) para fixação do conteúdo.
6. Seja direto, técnico e prático — evite formalidades excessivas.
7. Slug deve ser kebab-case, único, descritivo (ex: "observer-pattern", "cqrs-pattern").
8. Ícone deve ser um nome válido de ícone Lucide (ex: "Eye", "Layers", "Radio", "Puzzle", "Zap").
9. Sempre finalize chamando add_runnable_code com um script Node.js auto-contido que demonstre o padrão passo a passo. O script deve ser educativo — mostrar criação, uso e resultado com console.log claros. Nunca use require() de pacotes externos, apenas módulos nativos do Node.js (path, fs, etc.) se necessário.
`.trim()

// ── Dispatcher de providers ───────────────────────────────────────────────────
export function applySkillCall(
  study: GeneratedStudy,
  name:  string,
  args:  Record<string, unknown>,
  log?:  LogFn,
): void {
  switch (name) {
    case 'set_metadata':
      study.metadata = args as GeneratedStudy['metadata']
      log?.(`📋 Metadados: "${(args as Record<string,string>).title}" [${(args as Record<string,string>).category}]`)
      break
    case 'add_explanation':
      study.explanations.push(args as GeneratedStudy['explanations'][0])
      log?.(`📖 Explicação: "${(args as Record<string,string>).title}"`)
      break
    case 'add_code_snippet':
      study.codeSnippets.push(args as GeneratedStudy['codeSnippets'][0])
      log?.(`💻 Código: "${(args as Record<string,string>).title}" [${(args as Record<string,string>).language}]`)
      break
    case 'add_comparison':
      study.comparisons.push(args as GeneratedStudy['comparisons'][0])
      log?.(`⚖️ Comparação: "${(args as Record<string,string>).title}"`)
      break
    case 'add_quiz': {
      const qs = ((args as Record<string, unknown[]>).questions ?? []).length
      study.quiz = (args as { questions: GeneratedStudy['quiz'] }).questions
      log?.(`❓ Quiz: ${qs} questões`)
      break
    }
    case 'add_runnable_code':
      study.runnableCode = args as GeneratedStudy['runnableCode']
      log?.(`🏃 Código executável: ${(args as Record<string,string>).filename}`)
      break
  }
}

// ── Fallback helper ───────────────────────────────────────────────────────────
function isRetriableError(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('429')
    || m.includes('quota')
    || m.includes('rate limit')
    || m.includes('too many requests')
    || m.includes('no longer available')
    || m.includes('service unavailable')
    || m.includes('503')
    || m.includes('overloaded')
}

// ── Entry point ───────────────────────────────────────────────────────────────
export async function generateStudy(
  prompt: string,
  config: StudydashConfig,
  log?:   LogFn,
): Promise<GeneratedStudy> {
  const skills = buildSkillList(config.ai.skills)

  const providers = [
    { provider: config.ai.provider, apiKey: config.ai.apiKey, model: config.ai.model, label: '' },
    ...(config.ai.fallbacks ?? [])
      .filter(f => f.apiKey || f.provider === 'cli')
      .map((f, i) => ({ provider: f.provider, apiKey: f.apiKey, model: f.model, label: f.label || `fallback ${i + 1}` })),
  ]

  let lastError: Error | null = null

  for (let i = 0; i < providers.length; i++) {
    const p = providers[i]
    const label = p.label ? ` (${p.label})` : ''
    try {
      log?.(`🚀 Tentando ${p.provider}:${p.model}${label}`)
      const result =
        p.provider === 'anthropic' ? await generateWithClaude(prompt, p.model, p.apiKey, skills, SYSTEM_PROMPT, log) :
        p.provider === 'google'    ? await generateWithGemini(prompt, p.model, p.apiKey, skills, SYSTEM_PROMPT, log) :
        await generateWithCli(prompt, p.model, skills, SYSTEM_PROMPT, log)
      return result
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      log?.(`⚠️ Falhou: ${lastError.message.substring(0, 150)}`)
      if (!isRetriableError(lastError.message) || i === providers.length - 1) throw lastError
      log?.('⏭️ Tentando próximo provedor...')
    }
  }

  throw lastError ?? new Error('Todos os provedores falharam')
}
