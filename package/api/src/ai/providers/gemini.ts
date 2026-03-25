import { GoogleGenerativeAI, FunctionCallingMode } from '@google/generative-ai'
import type { Skill, GeneratedStudy }              from '../skills.js'
import { applySkillCall }                          from '../generate.js'

// Converte o formato Skill (baseado no Claude SDK) para FunctionDeclaration do Gemini
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

// Mapeia tipos JSON Schema → tipos Gemini
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
    string:  'STRING',
    number:  'NUMBER',
    boolean: 'BOOLEAN',
    integer: 'INTEGER',
  }
  return {
    type:        typeMap[prop.type as string] ?? 'STRING',
    description: prop.description,
    enum:        prop.enum,
  }
}

export async function generateWithGemini(
  prompt:  string,
  model:   string,
  apiKey:  string,
  skills:  Skill[],
  system:  string,
): Promise<GeneratedStudy> {
  const genAI    = new GoogleGenerativeAI(apiKey)
  const gemModel = genAI.getGenerativeModel({
    model,
    systemInstruction: system,
    tools: [{ functionDeclarations: toGeminiFunctions(skills) }],
    toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
  })

  const study: GeneratedStudy = {
    metadata:     {} as GeneratedStudy['metadata'],
    explanations: [],
    codeSnippets: [],
    comparisons:  [],
    quiz:         [],
  }

  const chat = gemModel.startChat()
  let result = await chat.sendMessage(prompt)

  // Loop de function calling — equivalente ao tool_use loop do Claude
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const calls = result.response.functionCalls()
    if (!calls || calls.length === 0) break

    const responses = []
    for (const call of calls) {
      applySkillCall(study, call.name, call.args as Record<string, unknown>)
      responses.push({ name: call.name, response: { result: 'ok' } })
    }

    result = await chat.sendMessage(
      responses.map(r => ({ functionResponse: r }))
    )
  }

  return study
}
