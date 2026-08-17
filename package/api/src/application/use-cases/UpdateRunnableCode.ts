import { mkdirSync, writeFileSync } from 'fs'
import type { AiStudyContentRepository } from '../../domain/ports/AiStudyContentRepository.js'
import { Slug } from '../../domain/value-objects/Slug.js'
import { CodeFilePath } from '../../domain/value-objects/CodeFilePath.js'

export type UpdateRunnableCodeResult =
  | { ok: true; filePath: string }
  | { ok: false; reason: string }

/** Salva edições feitas pelo desenvolvedor no arquivo .js executável de um
 *  estudo — grava em disco e mantém o conteúdo espelhado em `ai_study_content`. */
export class UpdateRunnableCode {
  constructor(
    private readonly codePath:   string,
    private readonly contentRepo: AiStudyContentRepository,
  ) {}

  execute(rawSlug: string, code: string): UpdateRunnableCodeResult {
    const slug = Slug.tryParse(rawSlug)
    if (!slug) return { ok: false, reason: 'Slug inválido' }

    const filePath = CodeFilePath.resolveWithin(this.codePath, slug)
    if (!filePath) return { ok: false, reason: 'Caminho inválido' }

    const existing = this.contentRepo.findByStudySlug(slug.toString())
    if (!existing) return { ok: false, reason: 'Estudo não encontrado' }

    mkdirSync(this.codePath, { recursive: true })
    writeFileSync(filePath.toString(), code, 'utf-8')

    this.contentRepo.upsert({
      studySlug:   slug.toString(),
      content:     {
        ...existing.content,
        runnableCode: { ...existing.content.runnableCode, filename: `${slug}.js`, code },
      },
      generatedBy: existing.generatedBy,
      prompt:      existing.prompt,
      createdAt:   existing.createdAt,
    })

    return { ok: true, filePath: filePath.toString() }
  }
}
