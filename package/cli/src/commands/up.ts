import chalk from 'chalk'
import ora   from 'ora'
import open  from 'open'
import { readConfig, isConfigured } from '../utils/config.js'
import { API_JS, FRONTEND_SERVER }  from '../utils/paths.js'
import {
  savePids, readPids, isRunning,
  waitForPort, spawnProcess,
} from '../utils/process-manager.js'

export async function cmdUp(): Promise<void> {
  const cfg = readConfig()

  // ── Verifica se já está rodando ────────────────────────────────────────────
  const existing = readPids()
  if (existing && isRunning(existing.api) && isRunning(existing.frontend)) {
    console.log(chalk.yellow('StudyDash já está rodando.'))
    console.log(chalk.dim(`  Frontend → http://localhost:${cfg.frontend.port}`))
    console.log(chalk.dim(`  API      → http://localhost:${cfg.backend.port}`))
    return
  }

  // ── Aviso se AI não estiver configurada ────────────────────────────────────
  if (!isConfigured()) {
    console.log(chalk.yellow('⚠  AI não configurada. Execute `studydash config` para adicionar sua API key.'))
  }

  const spinner = ora('Iniciando StudyDash...').start()

  // ── API (Hono + SQLite) ────────────────────────────────────────────────────
  spinner.text = 'Iniciando API...'
  const apiProc = spawnProcess('node', [API_JS], {
    PORT: String(cfg.backend.port),
  })
  apiProc.unref()

  const apiReady = await waitForPort(cfg.backend.port, 10_000)
  if (!apiReady) {
    spinner.fail('API não iniciou a tempo.')
    apiProc.kill()
    process.exit(1)
  }

  // ── Frontend (Next.js standalone) ─────────────────────────────────────────
  spinner.text = 'Iniciando frontend...'
  const frontProc = spawnProcess('node', [FRONTEND_SERVER], {
    PORT:                String(cfg.frontend.port),
    HOSTNAME:            '0.0.0.0',
    NEXT_PUBLIC_API_URL: `http://localhost:${cfg.backend.port}`,
  })
  frontProc.unref()

  const frontReady = await waitForPort(cfg.frontend.port, 15_000)
  if (!frontReady) {
    spinner.fail('Frontend não iniciou a tempo.')
    apiProc.kill()
    frontProc.kill()
    process.exit(1)
  }

  savePids(apiProc.pid!, frontProc.pid!)
  spinner.succeed(chalk.green('StudyDash está no ar!'))

  console.log()
  console.log(`  ${chalk.bold('Dashboard')}  →  ${chalk.cyan(`http://localhost:${cfg.frontend.port}`)}`)
  console.log(`  ${chalk.bold('API')}         →  ${chalk.dim(`http://localhost:${cfg.backend.port}`)}`)
  console.log()
  console.log(chalk.dim('  Para parar: studydash down'))
  console.log()

  await open(`http://localhost:${cfg.frontend.port}`)
}
