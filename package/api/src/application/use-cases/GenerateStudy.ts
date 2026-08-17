import { basename } from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import type { AiProvider } from '../../domain/ports/AiProvider.js'
import type { SectionRepository } from '../../domain/ports/SectionRepository.js'
import type { StudyRepository } from '../../domain/ports/StudyRepository.js'
import type { AiStudyContentRepository } from '../../domain/ports/AiStudyContentRepository.js'
import type { GenerationLogger } from '../../domain/ports/GenerationJobStore.js'
import type { Skill } from '../../domain/value-objects/Skill.js'
import type { GeneratedStudy } from '../../domain/value-objects/GeneratedStudy.js'
import { Slug } from '../../domain/value-objects/Slug.js'
import { CodeFilePath } from '../../domain/value-objects/CodeFilePath.js'

export interface GenerateStudyDeps {
  providers:   AiProvider[]   // ordem de tentativa: principal primeiro, depois fallbacks
  sectionRepo: SectionRepository
  studyRepo:   StudyRepository
  contentRepo: AiStudyContentRepository
  codePath:    string
  skills:      Skill[]
  systemPrompt: string
}

function isRetriableError(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('429') || m.includes('quota') || m.includes('rate limit')
    || m.includes('too many requests') || m.includes('no longer available')
    || m.includes('service unavailable') || m.includes('503') || m.includes('overloaded')
}

/** Orquestra a geração de um estudo: chama o(s) provider(s) de IA, normaliza o
 *  slug, grava o código executável e persiste estudo/seção/conteúdo. */
export class GenerateStudy {
  constructor(private readonly deps: GenerateStudyDeps) {}

  async execute(prompt: string, logger: GenerationLogger): Promise<void> {
    let generated: GeneratedStudy
    let usedProvider: AiProvider
    try {
      const result = await this.generateWithFallback(prompt, logger)
      generated = result.generated
      usedProvider = result.provider
    } catch (err) {
      logger.fail(err instanceof Error ? err.message : String(err))
      return
    }

    const slug = Slug.fromFreeText(generated.metadata.slug) ?? Slug.fromFreeText(generated.metadata.title)
    if (!slug) {
      logger.fail('A IA não retornou um slug/título válido para o estudo.')
      return
    }
    generated.metadata.slug = slug.toString()

    this.saveRunnableCode(generated, slug, logger)

    logger.log('💾 Salvando no banco de dados...')
    this.deps.contentRepo.upsert({
      studySlug:   generated.metadata.slug,
      content:     generated,
      generatedBy: `${usedProvider.label}:${usedProvider.model}`,
      prompt,
      createdAt:   Date.now(),
    })

    const study = this.deps.studyRepo.upsertBySlug({
      slug:        generated.metadata.slug,
      title:       generated.metadata.title,
      icon:        generated.metadata.icon,
      category:    generated.metadata.category,
      description: generated.metadata.description,
      available:   true,
      order:       Date.now(),
    })

    this.linkOrCreateSection(generated.metadata.category, logger)

    logger.log('✅ Estudo gerado com sucesso!')
    logger.finish(JSON.stringify({ study, content: generated }))
  }

  private async generateWithFallback(prompt: string, logger: GenerationLogger): Promise<{ generated: GeneratedStudy; provider: AiProvider }> {
    let lastError: Error | null = null

    for (let i = 0; i < this.deps.providers.length; i++) {
      const provider = this.deps.providers[i]
      try {
        logger.log(`🚀 Tentando ${provider.label}`)
        const generated = await provider.generate(prompt, this.deps.skills, this.deps.systemPrompt, logger.log.bind(logger))
        return { generated, provider }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        logger.log(`⚠️ Falhou: ${lastError.message.substring(0, 150)}`)
        if (!isRetriableError(lastError.message) || i === this.deps.providers.length - 1) throw lastError
        logger.log('⏭️ Tentando próximo provedor...')
      }
    }

    throw lastError ?? new Error('Todos os provedores falharam')
  }

  private saveRunnableCode(generated: GeneratedStudy, fallbackSlug: Slug, logger: GenerationLogger): void {
    if (!generated.runnableCode) return
    try {
      mkdirSync(this.deps.codePath, { recursive: true })
      // Ignora o filename sugerido pela IA se não for seguro — usa só o
      // basename, e cai no slug do estudo se mesmo assim não sobrar nada seguro.
      const suggested = basename(generated.runnableCode.filename || '')
      const suggestedSlug = suggested.endsWith('.js') ? Slug.tryParse(suggested.slice(0, -3)) : null

      const filePath =
        (suggestedSlug && CodeFilePath.resolveWithin(this.deps.codePath, suggestedSlug)) ??
        CodeFilePath.resolveWithin(this.deps.codePath, fallbackSlug)

      if (!filePath) throw new Error('Nome de arquivo inválido retornado pela IA')
      writeFileSync(filePath.toString(), generated.runnableCode.code, 'utf-8')
      logger.log(`💾 Código salvo: ${filePath}`)
    } catch (err) {
      logger.log(`⚠️ Falha ao salvar código: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  private linkOrCreateSection(category: string, logger: GenerationLogger): void {
    const categorySlug = Slug.fromFreeText(category)
    if (!categorySlug) return

    const existing = this.deps.sectionRepo.findBySlug(categorySlug.toString())
    if (existing) {
      if (!existing.matchesCategory(category)) {
        this.deps.sectionRepo.save(existing.withCategory(category))
      }
      logger.log(`📂 Categoria vinculada à seção "${existing.title}"`)
      return
    }

    this.deps.sectionRepo.createIfMissing({
      slug: categorySlug.toString(), title: category, icon: 'Layers',
      description: '', categories: [category], order: Date.now(),
    })
    logger.log(`📂 Nova seção criada: "${category}"`)
  }
}
