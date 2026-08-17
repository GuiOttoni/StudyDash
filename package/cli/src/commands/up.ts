import chalk from 'chalk'
import ora   from 'ora'
import open  from 'open'
import { readConfig, isConfigured } from '../utils/config.js'
import { API_JS }                   from '../utils/paths.js'
import {
  savePid, readPids, isRunning,
  waitForPort, spawnProcess,
} from '../utils/process-manager.js'

export async function cmdUp(): Promise<void> {
  const cfg = readConfig()

  // ── Verifica se já está rodando ────────────────────────────────────────────
  const existing = readPids()
  if (existing && isRunning(existing.pid)) {
    console.log(chalk.yellow('StudyDash já está rodando.'))
    console.log(chalk.dim(`  Dashboard → http://localhost:${cfg.server.port}`))
    return
  }

  // ── Aviso se AI não estiver configurada ────────────────────────────────────
  if (!isConfigured()) {
    console.log(chalk.yellow('⚠  AI não configurada. Acesse Configurações no dashboard para adicionar sua API key ou usar o Claude Code CLI local.'))
  }

  const spinner = ora('Iniciando StudyDash...').start()

  const proc = spawnProcess('node', [API_JS], {
    PORT: String(cfg.server.port),
  })
  proc.unref()

  const ready = await waitForPort(cfg.server.port, 10_000)
  if (!ready) {
    spinner.fail('StudyDash não iniciou a tempo.')
    proc.kill()
    process.exit(1)
  }

  savePid(proc.pid!)
  spinner.succeed(chalk.green('StudyDash está no ar!'))

  console.log()
  console.log(`  ${chalk.bold('Dashboard')}  →  ${chalk.cyan(`http://localhost:${cfg.server.port}`)}`)
  console.log()
  console.log(chalk.dim('  Para parar: studydash down'))
  console.log()

  await open(`http://localhost:${cfg.server.port}`)
}
