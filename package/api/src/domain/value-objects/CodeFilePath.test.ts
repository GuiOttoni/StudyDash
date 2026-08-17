import { describe, it, expect } from 'vitest'
import { join, resolve } from 'path'
import { Slug } from './Slug.js'
import { CodeFilePath } from './CodeFilePath.js'

const BASE = resolve('C:/fake/studydash/code')

describe('CodeFilePath.resolveWithin', () => {
  it('resolve um slug seguro pra dentro da pasta base', () => {
    const slug = Slug.tryParse('observer-pattern')!
    const path = CodeFilePath.resolveWithin(BASE, slug)
    expect(path).not.toBeNull()
    expect(path!.toString()).toBe(join(BASE, 'observer-pattern.js'))
  })

  it('nunca escapa da pasta base mesmo com traversal disfarçado', () => {
    // Slug.tryParse já bloqueia isso a montante, mas o teste garante que
    // CodeFilePath por si só também não confia cegamente no valor.
    const fakeSlug = { toString: () => '../../../etc/passwd' } as Slug
    const path = CodeFilePath.resolveWithin(BASE, fakeSlug)
    expect(path).toBeNull()
  })

  it('rejeita um caminho absoluto disfarçado de slug', () => {
    // '/etc/passwd' é absoluto tanto no POSIX quanto no Windows (raiz da
    // unidade atual) — ao contrário de algo como 'C:/...', que só é
    // absoluto no Windows e faria esse teste variar por plataforma/CI.
    const fakeSlug = { toString: () => '/etc/passwd' } as Slug
    expect(CodeFilePath.resolveWithin(BASE, fakeSlug)).toBeNull()
  })
})
