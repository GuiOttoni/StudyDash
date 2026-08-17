import { spawn } from 'child_process'
import type { CodeRunner, CodeRunEvent } from '../../domain/ports/CodeRunner.js'

const TIMEOUT_MS = 30_000

export class NodeCodeRunner implements CodeRunner {
  async *run(filePath: string): AsyncIterable<CodeRunEvent> {
    const queue: Array<CodeRunEvent | null> = []
    let notify: (() => void) | null = null
    const push = (item: CodeRunEvent | null) => {
      queue.push(item)
      if (notify) { notify(); notify = null }
    }

    const proc = spawn('node', [filePath])
    proc.stdout.on('data', (d: Buffer) => push({ type: 'stdout', data: d.toString() }))
    proc.stderr.on('data', (d: Buffer) => push({ type: 'stderr', data: d.toString() }))
    proc.on('close', (code) => { push({ type: 'done', exitCode: code ?? 0 }); push(null) })
    proc.on('error', (err)  => { push({ type: 'error', message: err.message }); push(null) })

    const timeout = setTimeout(() => {
      proc.kill()
      push({ type: 'stderr', data: '\n[Timeout: execução cancelada após 30s]' })
      push({ type: 'done', exitCode: -1 })
      push(null)
    }, TIMEOUT_MS)

    try {
      while (true) {
        if (queue.length > 0) {
          const item = queue.shift()!
          if (item === null) break
          yield item
        } else {
          await new Promise<void>((r) => { notify = r })
        }
      }
    } finally {
      clearTimeout(timeout)
    }
  }
}
