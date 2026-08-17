import type { GeneratedStudy } from '../../domain/value-objects/GeneratedStudy.js'
import type { GenerationLogFn } from '../../domain/ports/AiProvider.js'

/** Aplica uma tool call (vinda de um provider tool-calling, ex: Claude/Gemini) ao estudo sendo montado. */
export function applySkillCall(
  study: GeneratedStudy,
  name:  string,
  args:  Record<string, unknown>,
  log?:  GenerationLogFn,
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

export function emptyGeneratedStudy(): GeneratedStudy {
  return {
    metadata:     {} as GeneratedStudy['metadata'],
    explanations: [],
    codeSnippets: [],
    comparisons:  [],
    quiz:         [],
  }
}
