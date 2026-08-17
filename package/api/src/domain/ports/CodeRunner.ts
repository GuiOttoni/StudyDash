export type CodeRunEvent =
  | { type: 'stdout'; data: string }
  | { type: 'stderr'; data: string }
  | { type: 'done';   exitCode: number }
  | { type: 'error';  message: string }

/** Executa um arquivo e transmite sua saída em tempo real. */
export interface CodeRunner {
  run(filePath: string): AsyncIterable<CodeRunEvent>
}
