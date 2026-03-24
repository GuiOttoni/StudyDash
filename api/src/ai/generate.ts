import type { StudydashConfig }   from '../utils/config.js'
import type { GeneratedStudy }    from './skills.js'
import { buildSkillList }         from './skills.js'
import { generateWithClaude }     from './providers/claude.js'
import { generateWithGemini }     from './providers/gemini.js'

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
`.trim()

// ── Dispatcher de providers ───────────────────────────────────────────────────
// Aplica uma skill call ao objeto study em construção.
// Exportado para os providers usarem (evita duplicação de lógica).
export function applySkillCall(
  study: GeneratedStudy,
  name:  string,
  args:  Record<string, unknown>,
): void {
  switch (name) {
    case 'set_metadata':
      study.metadata = args as GeneratedStudy['metadata']
      break
    case 'add_explanation':
      study.explanations.push(args as GeneratedStudy['explanations'][0])
      break
    case 'add_code_snippet':
      study.codeSnippets.push(args as GeneratedStudy['codeSnippets'][0])
      break
    case 'add_comparison':
      study.comparisons.push(args as GeneratedStudy['comparisons'][0])
      break
    case 'add_quiz':
      study.quiz = (args as { questions: GeneratedStudy['quiz'] }).questions
      break
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────
export async function generateStudy(
  prompt: string,
  config: StudydashConfig,
): Promise<GeneratedStudy> {
  const skills = buildSkillList(config.ai.skills)

  if (config.ai.provider === 'anthropic') {
    return generateWithClaude(prompt, config.ai.model, config.ai.apiKey, skills, SYSTEM_PROMPT)
  }

  return generateWithGemini(prompt, config.ai.model, config.ai.apiKey, skills, SYSTEM_PROMPT)
}
