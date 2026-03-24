// ── AI Skills ────────────────────────────────────────────────────────────────
// Cada skill é uma "tool" que a IA pode invocar para construir o estudo.
// O contrato é baseado no Claude Agent SDK (tool_use) — convertemos para
// Gemini FunctionDeclaration antes de chamar a API do Google.

export interface Skill {
  name:        string
  description: string
  input_schema: {
    type:       'object'
    properties: Record<string, unknown>
    required?:  string[]
  }
}

// ── Definições ────────────────────────────────────────────────────────────────

export const SKILL_SET_METADATA: Skill = {
  name:        'set_metadata',
  description: 'Define os metadados do estudo: título, slug, categoria, descrição e ícone Lucide.',
  input_schema: {
    type: 'object',
    properties: {
      title:       { type: 'string', description: 'Título do estudo (ex: "Observer Pattern")' },
      slug:        { type: 'string', description: 'Slug URL-friendly, kebab-case (ex: "observer-pattern")' },
      category:    { type: 'string', description: 'Categoria do estudo (ex: "Comportamental", "Arquitetura", "Performance")' },
      description: { type: 'string', description: 'Descrição concisa do conceito, 2-3 frases' },
      icon:        { type: 'string', description: 'Nome exato de um ícone Lucide (ex: "Eye", "Layers", "Radio", "Puzzle")' },
    },
    required: ['title', 'slug', 'category', 'description', 'icon'],
  },
}

export const SKILL_ADD_EXPLANATION: Skill = {
  name:        'add_explanation',
  description: 'Adiciona uma seção de explicação textual ao estudo.',
  input_schema: {
    type: 'object',
    properties: {
      title:   { type: 'string' },
      content: { type: 'string', description: 'Conteúdo da explicação — texto corrido' },
      type:    { type: 'string', enum: ['text', 'tip', 'warning'], description: 'Tipo visual da seção' },
      items:   {
        type:  'array',
        items: { type: 'string' },
        description: 'Itens de lista (use quando type=text e quiser bullets)',
      },
    },
    required: ['title', 'content', 'type'],
  },
}

export const SKILL_ADD_CODE: Skill = {
  name:        'add_code_snippet',
  description: 'Adiciona um exemplo de código comentado ao estudo.',
  input_schema: {
    type: 'object',
    properties: {
      language:    { type: 'string', description: 'Linguagem: csharp | typescript | python | java | go | rust' },
      title:       { type: 'string', description: 'Título do snippet' },
      code:        { type: 'string', description: 'Código completo e bem comentado' },
      description: { type: 'string', description: 'O que este snippet demonstra' },
    },
    required: ['language', 'title', 'code'],
  },
}

export const SKILL_ADD_COMPARISON: Skill = {
  name:        'add_comparison',
  description: 'Adiciona uma tabela de comparação entre conceitos, padrões ou abordagens.',
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name:        { type: 'string' },
            description: { type: 'string' },
            pros:        { type: 'array', items: { type: 'string' } },
            cons:        { type: 'array', items: { type: 'string' } },
          },
          required: ['name', 'description'],
        },
      },
    },
    required: ['title', 'items'],
  },
}

export const SKILL_ADD_QUIZ: Skill = {
  name:        'add_quiz',
  description: 'Adiciona questões de múltipla escolha para fixação do conteúdo.',
  input_schema: {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        minItems: 2,
        maxItems: 5,
        items: {
          type: 'object',
          properties: {
            question:    { type: 'string' },
            options:     { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 4 },
            answerIndex: { type: 'number', description: 'Índice 0-based da resposta correta' },
            explanation: { type: 'string', description: 'Explicação de por que a resposta está correta' },
          },
          required: ['question', 'options', 'answerIndex'],
        },
      },
    },
    required: ['questions'],
  },
}

// ── Seletor baseado nas skills habilitadas na config ─────────────────────────

export function buildSkillList(enabled: {
  codeSnippet:  boolean
  comparison:   boolean
  quiz:         boolean
  explanation:  boolean
}): Skill[] {
  const skills: Skill[] = [SKILL_SET_METADATA]
  if (enabled.explanation) skills.push(SKILL_ADD_EXPLANATION)
  if (enabled.codeSnippet) skills.push(SKILL_ADD_CODE)
  if (enabled.comparison)  skills.push(SKILL_ADD_COMPARISON)
  if (enabled.quiz)        skills.push(SKILL_ADD_QUIZ)
  return skills
}

// ── Tipos do conteúdo gerado ─────────────────────────────────────────────────

export interface StudyMetadata {
  title:       string
  slug:        string
  category:    string
  description: string
  icon:        string
}

export interface ExplanationSection {
  title:   string
  content: string
  type:    'text' | 'tip' | 'warning'
  items?:  string[]
}

export interface CodeSnippet {
  language:     string
  title:        string
  code:         string
  description?: string
}

export interface ComparisonTable {
  title: string
  items: { name: string; description: string; pros?: string[]; cons?: string[] }[]
}

export interface QuizQuestion {
  question:     string
  options:      string[]
  answerIndex:  number
  explanation?: string
}

export interface GeneratedStudy {
  metadata:     StudyMetadata
  explanations: ExplanationSection[]
  codeSnippets: CodeSnippet[]
  comparisons:  ComparisonTable[]
  quiz:         QuizQuestion[]
}
