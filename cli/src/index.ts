#!/usr/bin/env node
import { Command }   from 'commander'
import chalk         from 'chalk'
import { readPids, isRunning } from './utils/process-manager.js'
import { readConfig }          from './utils/config.js'
import { cmdUp }     from './commands/up.js'
import { cmdDown }   from './commands/down.js'
import { cmdConfig } from './commands/config.js'

const program = new Command()

program
  .name('studydash')
  .description('Self-hosted learning dashboard with AI-powered study generation')
  .version('0.1.0')

// ── studydash up ──────────────────────────────────────────────────────────────
program
  .command('up')
  .description('Inicia o StudyDash (API + frontend)')
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

// ── studydash config ──────────────────────────────────────────────────────────
program
  .command('config')
  .description('Configura API keys, modelo e skills')
  .action(async () => {
    await cmdConfig()
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
      const apiOk   = isRunning(pids.api)
      const frontOk = isRunning(pids.frontend)
      console.log(`  API      ${apiOk   ? chalk.green('● rodando') : chalk.red('● parado')}  →  http://localhost:${cfg.backend.port}`)
      console.log(`  Frontend ${frontOk ? chalk.green('● rodando') : chalk.red('● parado')}  →  http://localhost:${cfg.frontend.port}`)
    }

    console.log()
    console.log(chalk.dim(`  Provider: ${cfg.ai.provider}  |  Modelo: ${cfg.ai.model}  |  API key: ${cfg.ai.apiKey ? '✓ configurada' : '✗ não configurada'}`))
    console.log()
  })

program.parse()
