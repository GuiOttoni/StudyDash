import Anthropic from '@anthropic-ai/sdk'
import type { Skill, GeneratedStudy } from '../skills.js'
import { applySkillCall }             from '../generate.js'
import type { LogFn }                 from '../generate.js'

export async function generateWithClaude(
  prompt:   string,
  model:    string,
  apiKey:   string,
  skills:   Skill[],
  system:   string,
  log?:     LogFn,
): Promise<GeneratedStudy> {
  const client = new Anthropic({ apiKey })

  const study: GeneratedStudy = {
    metadata:     {} as GeneratedStudy['metadata'],
    explanations: [],
    codeSnippets: [],
    comparisons:  [],
    quiz:         [],
  }

  const tools: Anthropic.Tool[] = skills.map(s => ({
    name:         s.name,
    description:  s.description,
    input_schema: s.input_schema,
  }))

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: prompt },
  ]

  log?.('📡 Consultando Claude...')

  while (true) {
    const response = await client.messages.create({
      model,
      max_tokens: 8192,
      system,
      tools,
      tool_choice: { type: 'auto' },
      messages,
    })

    messages.push({ role: 'assistant', content: response.content })

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    )

    if (toolUses.length === 0 || response.stop_reason === 'end_turn') break

    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const use of toolUses) {
      applySkillCall(study, use.name, use.input as Record<string, unknown>, log)
      toolResults.push({ type: 'tool_result', tool_use_id: use.id, content: 'ok' })
    }

    messages.push({ role: 'user', content: toolResults })

    if (response.stop_reason === 'tool_use' && toolUses.length === 0) break
  }

  return study
}
