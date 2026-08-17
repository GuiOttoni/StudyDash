import chalk from 'chalk'
import ora   from 'ora'
import { readPids, clearPids, killProcess, isRunning } from '../utils/process-manager.js'

export function cmdDown(): void {
  const pids = readPids()

  if (!pids) {
    console.log(chalk.dim('StudyDash não está rodando.'))
    return
  }

  const spinner = ora('Encerrando StudyDash...').start()

  let killed = 0
  for (const [name, pid] of Object.entries(pids) as [string, number][]) {
    if (isRunning(pid)) {
      killProcess(pid)
      killed++
    }
  }

  clearPids()
  spinner.succeed(killed > 0
    ? chalk.green('StudyDash encerrado.')
    : chalk.dim('Processos já haviam encerrado — PIDs limpos.')
  )
}
