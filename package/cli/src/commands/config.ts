import chalk    from 'chalk'
import inquirer from 'inquirer'
import { spawnSync } from 'child_process'
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

const CLI_MODELS = [
  { name: 'Padrão do Claude Code CLI', value: '' },
  { name: 'Opus    (mais capaz)',      value: 'opus' },
  { name: 'Sonnet  (recomendado)',     value: 'sonnet' },
  { name: 'Haiku   (mais rápido)',     value: 'haiku' },
]

// Exemplo de prompt pronto pra ajudar quem não sabe por onde começar.
export const EXAMPLE_PROMPT =
  'Crie um estudo completo sobre o padrão Observer: explique o problema que ele resolve, ' +
  'compare com Pub/Sub e Mediator, gere um exemplo de código em C# e um quiz de fixação.'

function checkClaudeCli(): { found: boolean; message: string } {
  try {
    const res = spawnSync('claude', ['--version'], { stdio: 'pipe', encoding: 'utf-8' })
    if (res.error || res.status !== 0) {
      return { found: false, message: 'Binário `claude` não encontrado ou não autenticado no PATH.' }
    }
    return { found: true, message: `Encontrado: ${res.stdout.trim()}` }
  } catch {
    return { found: false, message: 'Binário `claude` não encontrado no PATH.' }
  }
}

export async function cmdConfig(): Promise<void> {
  console.log()
  console.log(chalk.bold('⚙  Configuração do StudyDash'))
  console.log(chalk.dim('   As configurações são salvas em ~/.studydash/config.json\n'))

  const current = readConfig()

  const answers = await inquirer.prompt<{
    provider:    'anthropic' | 'google' | 'cli'
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
        { name: 'Anthropic (Claude) — requer API key',           value: 'anthropic' },
        { name: 'Google (Gemini) — requer API key',              value: 'google' },
        { name: 'Claude Code CLI local — sem API key',           value: 'cli' },
      ],
      default: current.ai.provider,
    },
    {
      type:    'password',
      name:    'apiKey',
      message: (a) => a.provider === 'anthropic' ? 'Anthropic API Key:' : 'Google AI API Key:',
      mask:    '*',
      default: current.ai.apiKey || undefined,
      when:    (a) => a.provider !== 'cli',
      validate: (v) => v?.trim().length > 10 || 'API key inválida',
    },
    {
      type:    'list',
      name:    'model',
      message: 'Modelo:',
      choices: (a) => a.provider === 'anthropic' ? ANTHROPIC_MODELS : a.provider === 'google' ? GOOGLE_MODELS : CLI_MODELS,
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
      apiKey:   answers.apiKey ?? '',
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

  if (answers.provider === 'cli') {
    const check = checkClaudeCli()
    if (check.found) {
      console.log(chalk.dim(`  ${check.message}`))
    } else {
      console.log(chalk.yellow(`  ⚠ ${check.message}`))
      console.log(chalk.dim('    Instale com `npm install -g @anthropic-ai/claude-code` e rode `claude login`.'))
    }
    console.log()
    console.log(chalk.dim('  Prompt de exemplo pra testar a geração de estudos:'))
    console.log(chalk.dim(`  "${EXAMPLE_PROMPT}"`))
  }

  console.log(chalk.dim('  Execute `studydash up` para iniciar.'))
  console.log()
}
