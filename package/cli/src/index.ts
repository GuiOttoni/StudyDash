import { Command }   from 'commander'
import chalk         from 'chalk'
import { readPids, isRunning } from './utils/process-manager.js'
import { readConfig }          from './utils/config.js'
import { cmdUp }     from './commands/up.js'
import { cmdDown }   from './commands/down.js'

const program = new Command()

program
  .name('studydash')
  .description('Self-hosted learning dashboard with AI-powered study generation')
  .version('0.3.0')

// ── studydash up ──────────────────────────────────────────────────────────────
program
  .command('up')
  .description('Inicia o StudyDash')
  .action(async () => {
    await cmdUp()
  })

// ── studydash down ────────────────────────────────────────────────────────────
program
  .command('down')
  .description('Para o StudyDash')
  .action(() => {
    cmdDown()
  })

// ── studydash status ──────────────────────────────────────────────────────────
program
  .command('status')
  .description('Exibe o status dos processos')
  .action(() => {
    const cfg  = readConfig()
    const pids = readPids()

    console.log()
    console.log(chalk.bold('StudyDash status'))
    console.log()

    if (!pids) {
      console.log(`  ${chalk.red('●')} Parado`)
    } else {
      const ok = isRunning(pids.pid)
      console.log(`  ${ok ? chalk.green('● rodando') : chalk.red('● parado')}  →  http://localhost:${cfg.server.port}`)
    }

    console.log()
    const authStatus = cfg.ai.provider === 'cli'
      ? '✓ usando Claude Code CLI local (sem API key)'
      : cfg.ai.apiKey ? '✓ configurada' : '✗ não configurada'
    console.log(chalk.dim(`  Provider: ${cfg.ai.provider}  |  Modelo: ${cfg.ai.model || '(padrão)'}  |  API key: ${authStatus}`))
    console.log()
  })

program.parse()
