import { existsSync } from 'fs'
import type { CodeRunner, CodeRunEvent } from '../../domain/ports/CodeRunner.js'
import { Slug } from '../../domain/value-objects/Slug.js'
import { CodeFilePath } from '../../domain/value-objects/CodeFilePath.js'

export type RunGeneratedCodeResult =
  | { kind: 'invalid-slug' }
  | { kind: 'not-found' }
  | { kind: 'running'; events: AsyncIterable<CodeRunEvent> }

/** Executa o arquivo .js gerado pela IA para um estudo, dentro da pasta de código do usuário. */
export class RunGeneratedCode {
  constructor(private readonly codeRunner: CodeRunner) {}

  execute(codePath: string, rawSlug: string): RunGeneratedCodeResult {
    const slug = Slug.tryParse(rawSlug)
    if (!slug) return { kind: 'invalid-slug' }

    const filePath = CodeFilePath.resolveWithin(codePath, slug)
    if (!filePath) return { kind: 'invalid-slug' }

    if (!existsSync(filePath.toString())) return { kind: 'not-found' }

    return { kind: 'running', events: this.codeRunner.run(filePath.toString()) }
  }
}
