export type JobEvent =
  | { type: 'log';    data: string }
  | { type: 'result'; data: string }
  | { type: 'error';  data: string }

export interface GenerationLogger {
  log(message: string): void
  finish(resultJson: string): void
  fail(message: string): void
}

/**
 * Guarda o progresso de gerações de estudo em background (a geração roda
 * fora do ciclo de vida da requisição HTTP; o cliente acompanha via SSE).
 */
export interface GenerationJobStore {
  createJob(): { jobId: string; logger: GenerationLogger }
  /** Drena os eventos de um job conforme chegam, até `result`/`error`. Null se o job não existe. */
  drain(jobId: string): AsyncIterable<JobEvent> | null
}
