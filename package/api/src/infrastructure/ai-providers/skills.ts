// Definições concretas das skills (tools) oferecidas aos providers de IA —
// detalhe de infraestrutura de como cada provider é instruído a construir
// um GeneratedStudy via tool-calling.

import type { Skill, EnabledSkills } from '../../domain/value-objects/Skill.js'

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

export const SKILL_ADD_RUNNABLE: Skill = {
  name:        'add_runnable_code',
  description: 'Gera um script Node.js auto-contido (sem requires externos) que demonstra o padrão em ação com console.log detalhados em cada etapa.',
  input_schema: {
    type: 'object',
    properties: {
      filename:    { type: 'string', description: 'Nome do arquivo, ex: singleton-pattern.js' },
      code:        { type: 'string', description: 'Script Node.js completo, auto-contido (sem require/import de pacotes externos), com console.log mostrando cada etapa do padrão em ação. Deve ser educativo e executável diretamente com node.' },
      description: { type: 'string', description: 'O que o script demonstra ao ser executado' },
    },
    required: ['filename', 'code'],
  },
}

export function buildSkillList(enabled: EnabledSkills): Skill[] {
  const skills: Skill[] = [SKILL_SET_METADATA]
  if (enabled.explanation) skills.push(SKILL_ADD_EXPLANATION)
  if (enabled.codeSnippet) skills.push(SKILL_ADD_CODE)
  if (enabled.comparison)  skills.push(SKILL_ADD_COMPARISON)
  if (enabled.quiz)        skills.push(SKILL_ADD_QUIZ)
  skills.push(SKILL_ADD_RUNNABLE)
  return skills
}
