// Uma "skill" é uma capacidade que o AiProvider pode usar ao gerar um estudo
// (equivalente a uma tool/function-calling). A definição concreta de cada
// skill é um detalhe de infraestrutura (como cada provider fala com o LLM) —
// aqui só o formato do contrato.

export interface Skill {
  name:        string
  description: string
  input_schema: {
    type:       'object'
    properties: Record<string, unknown>
    required?:  string[]
  }
}

export interface EnabledSkills {
  codeSnippet:  boolean
  comparison:   boolean
  quiz:         boolean
  diagram:      boolean
  explanation:  boolean
}
