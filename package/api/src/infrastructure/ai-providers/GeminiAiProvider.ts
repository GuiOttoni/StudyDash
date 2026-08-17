import { GoogleGenerativeAI, FunctionCallingMode } from '@google/generative-ai'
import type { AiProvider, GenerationLogFn } from '../../domain/ports/AiProvider.js'
import type { Skill } from '../../domain/value-objects/Skill.js'
import type { GeneratedStudy } from '../../domain/value-objects/GeneratedStudy.js'
import { applySkillCall, emptyGeneratedStudy } from './applySkillCall.js'

function toGeminiFunctions(skills: Skill[]) {
  return skills.map(s => ({
    name:        s.name,
    description: s.description,
    parameters:  {
      type:       'OBJECT' as const,
      properties: Object.fromEntries(
        Object.entries(s.input_schema.properties).map(([k, v]) => [
          k,
          geminiType(v as Record<string, unknown>),
        ])
      ),
      required: s.input_schema.required ?? [],
    },
  }))
}

function geminiType(prop: Record<string, unknown>): Record<string, unknown> {
  if (prop.type === 'array') {
    return {
      type:  'ARRAY',
      items: prop.items ? geminiType(prop.items as Record<string, unknown>) : { type: 'STRING' },
      description: prop.description,
    }
  }
  if (prop.type === 'object') {
    return {
      type:       'OBJECT',
      properties: prop.properties
        ? Object.fromEntries(
            Object.entries(prop.properties as Record<string, unknown>).map(([k, v]) => [
              k, geminiType(v as Record<string, unknown>),
            ])
          )
        : {},
      description: prop.description,
    }
  }
  const typeMap: Record<string, string> = {
    string: 'STRING', number: 'NUMBER', boolean: 'BOOLEAN', integer: 'INTEGER',
  }
  return { type: typeMap[prop.type as string] ?? 'STRING', description: prop.description, enum: prop.enum }
}

export class GeminiAiProvider implements AiProvider {
  readonly label = 'google'

  constructor(
    private readonly apiKey: string,
    readonly model: string,
  ) {}

  async generate(prompt: string, skills: Skill[], systemPrompt: string, log?: GenerationLogFn): Promise<GeneratedStudy> {
    const genAI    = new GoogleGenerativeAI(this.apiKey)
    const gemModel = genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: toGeminiFunctions(skills) }],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
    })

    const study = emptyGeneratedStudy()

    log?.('📡 Consultando Gemini...')

    const chat = gemModel.startChat()
    let result = await chat.sendMessage(prompt)

    while (true) {
      const calls = result.response.functionCalls()
      if (!calls || calls.length === 0) break

      const responses = []
      for (const call of calls) {
        applySkillCall(study, call.name, call.args as Record<string, unknown>, log)
        responses.push({ name: call.name, response: { result: 'ok' } })
      }

      result = await chat.sendMessage(responses.map(r => ({ functionResponse: r })))
    }

    return study
  }
}
