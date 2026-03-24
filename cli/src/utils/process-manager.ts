import { spawn, type ChildProcess } from 'child_process'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs'
import { PIDS_FILE } from './paths.js'

interface PidsFile { api: number; frontend: number }

export function savePids(api: number, frontend: number): void {
  writeFileSync(PIDS_FILE, JSON.stringify({ api, frontend }))
}

export function readPids(): PidsFile | null {
  if (!existsSync(PIDS_FILE)) return null
  try { return JSON.parse(readFileSync(PIDS_FILE, 'utf-8')) }
  catch { return null }
}

export function clearPids(): void {
  if (existsSync(PIDS_FILE)) unlinkSync(PIDS_FILE)
}

export function isRunning(pid: number): boolean {
  try { process.kill(pid, 0); return true }
  catch { return false }
}

export function killProcess(pid: number): void {
  try { process.kill(pid, 'SIGTERM') } catch { /* já morreu */ }
}

// Aguarda um processo HTTP subir (health check com retry)
export async function waitForPort(port: number, timeoutMs = 15_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${port}/health`, { signal: AbortSignal.timeout(500) })
      if (res.ok) return true
    } catch { /* ainda não está pronto */ }
    await new Promise(r => setTimeout(r, 300))
  }
  return false
}

export function spawnProcess(
  command: string,
  args:    string[],
  env:     Record<string, string> = {},
): ChildProcess {
  return spawn(command, args, {
    detached: true,
    stdio:    'ignore',
    env:      { ...process.env, ...env },
  })
}
