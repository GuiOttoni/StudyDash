import Anthropic from '@anthropic-ai/sdk'
import type { AiProvider, GenerationLogFn } from '../../domain/ports/AiProvider.js'
import type { Skill } from '../../domain/value-objects/Skill.js'
import type { GeneratedStudy } from '../../domain/value-objects/GeneratedStudy.js'
import { applySkillCall, emptyGeneratedStudy } from './applySkillCall.js'

export class ClaudeAiProvider implements AiProvider {
  readonly label = 'anthropic'

  constructor(
    private readonly apiKey: string,
    readonly model: string,
  ) {}

  async generate(prompt: string, skills: Skill[], systemPrompt: string, log?: GenerationLogFn): Promise<GeneratedStudy> {
    const client = new Anthropic({ apiKey: this.apiKey })
    const study = emptyGeneratedStudy()

    const tools: Anthropic.Tool[] = skills.map(s => ({
      name:         s.name,
      description:  s.description,
      input_schema: s.input_schema,
    }))

    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }]

    log?.('📡 Consultando Claude...')

    while (true) {
      const response = await client.messages.create({
        model: this.model,
        max_tokens: 8192,
        system: systemPrompt,
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
}
