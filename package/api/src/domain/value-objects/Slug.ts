// Slug — identificador seguro pra URL e nome de arquivo.
// Único ponto do domínio que sabe normalizar texto livre (títulos/categorias
// vindos da IA) em algo que pode virar rota ou nome de arquivo com segurança.

const SAFE_PATTERN = /^[a-zA-Z0-9_-]+$/

export class Slug {
  private constructor(public readonly value: string) {}

  /** Normaliza texto livre: remove acentos, minúsculo, apenas [a-z0-9-]. */
  static fromFreeText(text: string): Slug | null {
    const normalized = text
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return normalized ? new Slug(normalized) : null
  }

  /** Valida um candidato já pronto (ex: vindo da URL) sem re-normalizar. */
  static tryParse(candidate: string): Slug | null {
    return SAFE_PATTERN.test(candidate) ? new Slug(candidate) : null
  }

  toString(): string {
    return this.value
  }
}
