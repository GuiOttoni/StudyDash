import Anthropic from '@anthropic-ai/sdk'
import type { Skill, GeneratedStudy } from '../skills.js'
import { applySkillCall }             from '../generate.js'

// Chama a API da Anthropic com tool_use (Agent SDK pattern).
// A IA itera pelas skills disponíveis para montar o estudo peça a peça.
export async function generateWithClaude(
  prompt:   string,
  model:    string,
  apiKey:   string,
  skills:   Skill[],
  system:   string,
): Promise<GeneratedStudy> {
  const client = new Anthropic({ apiKey })

  const study: GeneratedStudy = {
    metadata:     {} as GeneratedStudy['metadata'],
    explanations: [],
    codeSnippets: [],
    comparisons:  [],
    quiz:         [],
  }

  // Converte Skill[] para o formato Tool do Claude
  const tools: Anthropic.Tool[] = skills.map(s => ({
    name:         s.name,
    description:  s.description,
    input_schema: s.input_schema,
  }))

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: prompt },
  ]

  // Loop de agentic tool use — o modelo continua enquanto quiser usar tools
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await client.messages.create({
      model,
      max_tokens: 8192,
      system,
      tools,
      tool_choice: { type: 'auto' },
      messages,
    })

    // Adiciona a resposta do assistente ao histórico
    messages.push({ role: 'assistant', content: response.content })

    // Coleta os tool_use blocks desta resposta
    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    )

    if (toolUses.length === 0 || response.stop_reason === 'end_turn') break

    // Aplica cada skill call ao objeto study
    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const use of toolUses) {
      applySkillCall(study, use.name, use.input as Record<string, unknown>)
      toolResults.push({
        type:        'tool_result',
        tool_use_id: use.id,
        content:     'ok',
      })
    }

    // Retorna resultados das tools para continuar o loop
    messages.push({ role: 'user', content: toolResults })

    if (response.stop_reason === 'tool_use' && toolUses.length === 0) break
  }

  return study
}
