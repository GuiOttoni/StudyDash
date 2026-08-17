import { describe, it, expect } from 'vitest'
import { Slug } from './Slug.js'

describe('Slug.fromFreeText', () => {
  it('normaliza acentos, espaços e maiúsculas', () => {
    expect(Slug.fromFreeText('Algoritmos de Ordenação')?.toString()).toBe('algoritmos-de-ordenacao')
    expect(Slug.fromFreeText('Concorrência')?.toString()).toBe('concorrencia')
  })

  it('remove caracteres não [a-z0-9-] e colapsa hífens', () => {
    expect(Slug.fromFreeText('Observer / Pub-Sub!!')?.toString()).toBe('observer-pub-sub')
  })

  it('retorna null para texto que normaliza pra vazio', () => {
    expect(Slug.fromFreeText('   ')).toBeNull()
    expect(Slug.fromFreeText('!!!')).toBeNull()
  })
})

describe('Slug.tryParse', () => {
  it('aceita slugs já seguros', () => {
    expect(Slug.tryParse('observer-pattern')?.toString()).toBe('observer-pattern')
    expect(Slug.tryParse('Some_Slug123')?.toString()).toBe('Some_Slug123')
  })

  it('rejeita tentativas de path traversal', () => {
    expect(Slug.tryParse('../../etc/passwd')).toBeNull()
    expect(Slug.tryParse('foo/bar')).toBeNull()
    expect(Slug.tryParse('foo\\bar')).toBeNull()
  })

  it('rejeita espaços, acentos e string vazia', () => {
    expect(Slug.tryParse('has spaces')).toBeNull()
    expect(Slug.tryParse('ação')).toBeNull()
    expect(Slug.tryParse('')).toBeNull()
  })
})
