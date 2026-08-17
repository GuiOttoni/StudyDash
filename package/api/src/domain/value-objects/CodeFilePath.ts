import { resolve, sep } from 'path'
import type { Slug } from './Slug.js'

// CodeFilePath — único jeito de transformar (pasta base + slug) num caminho de
// arquivo .js absoluto, garantindo que o resultado nunca escapa da pasta base
// (proteção contra path traversal — ../../, symlink resolution etc via path.resolve).
export class CodeFilePath {
  private constructor(public readonly absolutePath: string) {}

  static resolveWithin(baseDir: string, slug: Slug): CodeFilePath | null {
    const base = resolve(baseDir)
    const target = resolve(base, `${slug.toString()}.js`)
    if (target !== base && !target.startsWith(base + sep)) return null
    return new CodeFilePath(target)
  }

  toString(): string {
    return this.absolutePath
  }
}
