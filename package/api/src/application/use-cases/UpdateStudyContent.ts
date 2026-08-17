import type { SectionRepository } from '../../domain/ports/SectionRepository.js'
import type { StudyRepository } from '../../domain/ports/StudyRepository.js'
import type { AiStudyContentRepository } from '../../domain/ports/AiStudyContentRepository.js'
import type { GeneratedStudy } from '../../domain/value-objects/GeneratedStudy.js'
import { Slug } from '../../domain/value-objects/Slug.js'

export type UpdateStudyContentResult =
  | { ok: true }
  | { ok: false; reason: string }

/** Salva edições feitas pelo desenvolvedor no conteúdo de um estudo já gerado
 *  (texto, código, comparações, quiz) — mantém `studies`/`ai_study_content` em sincronia. */
export class UpdateStudyContent {
  constructor(
    private readonly sectionRepo: SectionRepository,
    private readonly studyRepo:   StudyRepository,
    private readonly contentRepo: AiStudyContentRepository,
  ) {}

  execute(rawSlug: string, content: GeneratedStudy): UpdateStudyContentResult {
    const slug = Slug.tryParse(rawSlug)
    if (!slug) return { ok: false, reason: 'Slug inválido' }

    const existing = this.contentRepo.findByStudySlug(slug.toString())
    if (!existing) return { ok: false, reason: 'Estudo não encontrado' }

    this.contentRepo.upsert({
      studySlug:   slug.toString(),
      content,
      generatedBy: existing.generatedBy,
      prompt:      existing.prompt,
      createdAt:   existing.createdAt,
    })

    this.studyRepo.upsertBySlug({
      slug:        slug.toString(),
      title:       content.metadata.title,
      icon:        content.metadata.icon,
      category:    content.metadata.category,
      description: content.metadata.description,
      available:   true,
      order:       Date.now(),
    })

    const categorySlug = Slug.fromFreeText(content.metadata.category)
    if (categorySlug) {
      const section = this.sectionRepo.findBySlug(categorySlug.toString())
      if (section && !section.matchesCategory(content.metadata.category)) {
        this.sectionRepo.save(section.withCategory(content.metadata.category))
      }
    }

    return { ok: true }
  }
}
