import chalk    from 'chalk'
import inquirer from 'inquirer'
import { readConfig, writeConfig, type StudydashConfig } from '../utils/config.js'

const ANTHROPIC_MODELS = [
  { name: 'Claude Sonnet 4.6  (recomendado)', value: 'claude-sonnet-4-6' },
  { name: 'Claude Opus 4.6    (mais capaz)',   value: 'claude-opus-4-6' },
  { name: 'Claude Haiku 4.5   (mais rápido)',  value: 'claude-haiku-4-5-20251001' },
]

const GOOGLE_MODELS = [
  { name: 'Gemini 2.0 Flash           (recomendado)', value: 'gemini-2.0-flash' },
  { name: 'Gemini 2.0 Flash Thinking',                value: 'gemini-2.0-flash-thinking' },
  { name: 'Gemini 1.5 Pro',                           value: 'gemini-1.5-pro' },
]

export async function cmdConfig(): Promise<void> {
  console.log()
  console.log(chalk.bold('⚙  Configuração do StudyDash'))
  console.log(chalk.dim('   As configurações são salvas em ~/.studydash/config.json\n'))

  const current = readConfig()

  const answers = await inquirer.prompt<{
    provider:    'anthropic' | 'google'
    apiKey:      string
    model:       string
    backendPort: number
    frontPort:   number
    skills:      string[]
  }>([
    {
      type:    'list',
      name:    'provider',
      message: 'Provider de IA:',
      choices: [
        { name: 'Anthropic (Claude)', value: 'anthropic' },
        { name: 'Google (Gemini)',    value: 'google' },
      ],
      default: current.ai.provider,
    },
    {
      type:    'password',
      name:    'apiKey',
      message: (a) => a.provider === 'anthropic' ? 'Anthropic API Key:' : 'Google AI API Key:',
      mask:    '*',
      default: current.ai.apiKey || undefined,
      validate: (v) => v?.trim().length > 10 || 'API key inválida',
    },
    {
      type:    'list',
      name:    'model',
      message: 'Modelo:',
      choices: (a) => a.provider === 'anthropic' ? ANTHROPIC_MODELS : GOOGLE_MODELS,
      default: current.ai.model,
    },
    {
      type:    'checkbox',
      name:    'skills',
      message: 'Skills que a IA pode usar para gerar estudos:',
      choices: [
        { name: 'Snippets de código',    value: 'codeSnippet',  checked: current.ai.skills.codeSnippet },
        { name: 'Tabelas de comparação', value: 'comparison',   checked: current.ai.skills.comparison },
        { name: 'Quiz de fixação',       value: 'quiz',         checked: current.ai.skills.quiz },
        { name: 'Seções de explicação',  value: 'explanation',  checked: current.ai.skills.explanation },
        { name: 'Diagramas (texto)',     value: 'diagram',      checked: current.ai.skills.diagram },
      ],
    },
    {
      type:    'number',
      name:    'backendPort',
      message: 'Porta da API backend:',
      default: current.backend.port,
    },
    {
      type:    'number',
      name:    'frontPort',
      message: 'Porta do frontend:',
      default: current.frontend.port,
    },
  ])

  const updated: StudydashConfig = {
    backend:  { port: answers.backendPort, host: 'localhost' },
    frontend: { port: answers.frontPort },
    ai: {
      provider: answers.provider,
      apiKey:   answers.apiKey,
      model:    answers.model,
      skills: {
        codeSnippet:  answers.skills.includes('codeSnippet'),
        comparison:   answers.skills.includes('comparison'),
        quiz:         answers.skills.includes('quiz'),
        explanation:  answers.skills.includes('explanation'),
        diagram:      answers.skills.includes('diagram'),
      },
    },
  }

  writeConfig(updated)

  console.log()
  console.log(chalk.green('✓ Configuração salva.'))
  console.log(chalk.dim('  Execute `studydash up` para iniciar.'))
  console.log()
}
