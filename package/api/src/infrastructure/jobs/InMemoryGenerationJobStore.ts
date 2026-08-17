import type { GenerationJobStore, GenerationLogger, JobEvent } from '../../domain/ports/GenerationJobStore.js'

interface Job {
  events: JobEvent[]
  notify: (() => void) | null
  done:   boolean
  timer:  ReturnType<typeof setTimeout>
}

const JOB_TTL_MS = 5 * 60_000

/** Guarda jobs de geração em memória do processo — a geração roda em background
 *  enquanto o cliente acompanha via SSE, então o job precisa sobreviver entre
 *  a requisição POST (que só retorna o jobId) e a requisição GET (que drena). */
export class InMemoryGenerationJobStore implements GenerationJobStore {
  private readonly jobs = new Map<string, Job>()

  createJob(): { jobId: string; logger: GenerationLogger } {
    const jobId = crypto.randomUUID()
    const job: Job = { events: [], notify: null, done: false, timer: setTimeout(() => this.jobs.delete(jobId), JOB_TTL_MS) }
    this.jobs.set(jobId, job)

    const push = (event: JobEvent) => {
      job.events.push(event)
      if (job.notify) { job.notify(); job.notify = null }
    }

    const logger: GenerationLogger = {
      log:    (msg)  => push({ type: 'log', data: msg }),
      finish: (json) => { push({ type: 'result', data: json }); job.done = true; if (job.notify) { job.notify(); job.notify = null } },
      fail:   (msg)  => { push({ type: 'error', data: msg });   job.done = true; if (job.notify) { job.notify(); job.notify = null } },
    }

    return { jobId, logger }
  }

  drain(jobId: string): AsyncIterable<JobEvent> | null {
    const job = this.jobs.get(jobId)
    if (!job) return null
    return this.drainJob(jobId, job)
  }

  private async *drainJob(jobId: string, job: Job): AsyncIterable<JobEvent> {
    while (true) {
      while (job.events.length > 0) {
        const evt = job.events.shift()!
        yield evt
        if (evt.type === 'result' || evt.type === 'error') {
          clearTimeout(job.timer)
          this.jobs.delete(jobId)
          return
        }
      }
      if (job.done) return
      await new Promise<void>((r) => { job.notify = r })
    }
  }
}
