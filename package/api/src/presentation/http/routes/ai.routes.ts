import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { AiStudyContentRepository } from '../../../domain/ports/AiStudyContentRepository.js'
import type { SectionRepository } from '../../../domain/ports/SectionRepository.js'
import type { StudyRepository } from '../../../domain/ports/StudyRepository.js'
import type { GenerationJobStore } from '../../../domain/ports/GenerationJobStore.js'
import type { CodeRunner } from '../../../domain/ports/CodeRunner.js'
import type { FileConfigStore } from '../../../infrastructure/config/FileConfigStore.js'
import { GenerateStudy } from '../../../application/use-cases/GenerateStudy.js'
import { RunGeneratedCode } from '../../../application/use-cases/RunGeneratedCode.js'
import { UpdateStudyContent } from '../../../application/use-cases/UpdateStudyContent.js'
import { UpdateRunnableCode } from '../../../application/use-cases/UpdateRunnableCode.js'
import type { GeneratedStudy } from '../../../domain/value-objects/GeneratedStudy.js'
import { buildProviderChain } from '../../../infrastructure/ai-providers/AiProviderFactory.js'
import { buildSkillList } from '../../../infrastructure/ai-providers/skills.js'
import { buildStudyGenerationSystemPrompt, languageLabel } from '../../../infrastructure/ai-providers/prompts.js'

export interface AiRoutesDeps {
  configStore: FileConfigStore
  sectionRepo: SectionRepository
  studyRepo:   StudyRepository
  contentRepo: AiStudyContentRepository
  jobStore:    GenerationJobStore
  codeRunner:  CodeRunner
}

export function aiRoutes(deps: AiRoutesDeps): Hono {
  const app = new Hono()
  const runGeneratedCode  = new RunGeneratedCode(deps.codeRunner)
  const updateStudyContent = new UpdateStudyContent(deps.sectionRepo, deps.studyRepo, deps.contentRepo)

  // ── POST /generate — inicia geração em background, retorna jobId ────────────
  app.post('/generate', async (c) => {
    const { prompt } = await c.req.json<{ prompt: string }>()
    if (!prompt?.trim()) return c.json({ error: 'prompt é obrigatório' }, 400)

    const cfg = deps.configStore.read()
    if (cfg.ai.provider !== 'cli' && !cfg.ai.apiKey) {
      return c.json({ error: 'API key não configurada. Acesse Configurações no dashboard.' }, 400)
    }

    const generateStudy = new GenerateStudy({
      providers:    buildProviderChain(cfg),
      sectionRepo:  deps.sectionRepo,
      studyRepo:    deps.studyRepo,
      contentRepo:  deps.contentRepo,
      codePath:     cfg.codePath,
      skills:       buildSkillList(cfg.ai.skills),
      systemPrompt: buildStudyGenerationSystemPrompt(cfg.ai.codeLanguage),
    })

    const { jobId, logger } = deps.jobStore.createJob()
    logger.log('🔍 Validando configuração...')
    void generateStudy.execute(prompt, logger)

    return c.json({ jobId })
  })

  // ── GET /generate/stream/:jobId — SSE dos logs do job ────────────────────────
  app.get('/generate/stream/:jobId', (c) => {
    return streamSSE(c, async (stream) => {
      const events = deps.jobStore.drain(c.req.param('jobId'))
      if (!events) {
        await stream.writeSSE({ event: 'error', data: 'Job não encontrado' })
        return
      }
      for await (const event of events) {
        await stream.writeSSE({ event: event.type, data: event.data })
      }
    })
  })

  // ── GET /run/:slug — executa o código gerado e transmite via SSE ────────────
  app.get('/run/:slug', (c) => {
    return streamSSE(c, async (stream) => {
      const cfg    = deps.configStore.read()
      const result = runGeneratedCode.execute(cfg.codePath, c.req.param('slug'))

      if (result.kind === 'invalid-slug') {
        await stream.writeSSE({ event: 'error', data: 'Slug inválido' })
        return
      }
      if (result.kind === 'not-found') {
        await stream.writeSSE({ event: 'error', data: 'Arquivo de código não encontrado para este estudo' })
        return
      }

      for await (const event of result.events) {
        if (event.type === 'done')  await stream.writeSSE({ event: 'done',  data: String(event.exitCode) })
        else if (event.type === 'error') await stream.writeSSE({ event: 'error', data: event.message })
        else await stream.writeSSE({ event: event.type, data: event.data })
      }
    })
  })

  // ── GET /study/:slug ──────────────────────────────────────────────────────────
  app.get('/study/:slug', (c) => {
    const content = deps.contentRepo.findByStudySlug(c.req.param('slug'))
    if (!content) return c.json({ error: 'Study não encontrado' }, 404)
    return c.json({
      generatedBy: content.generatedBy,
      prompt:      content.prompt,
      content:     content.content,
    })
  })

  // ── PUT /study/:slug — salva edições do desenvolvedor no conteúdo do estudo ──
  app.put('/study/:slug', async (c) => {
    const { content } = await c.req.json<{ content: GeneratedStudy }>()
    if (!content?.metadata) return c.json({ error: 'content é obrigatório' }, 400)

    const result = updateStudyContent.execute(c.req.param('slug'), content)
    if (!result.ok) return c.json({ error: result.reason }, result.reason === 'Estudo não encontrado' ? 404 : 400)
    return c.json({ ok: true })
  })

  // ── PUT /study/:slug/code — salva edições do desenvolvedor no código executável ──
  app.put('/study/:slug/code', async (c) => {
    const { code } = await c.req.json<{ code: string }>()
    if (typeof code !== 'string') return c.json({ error: 'code é obrigatório' }, 400)

    const cfg = deps.configStore.read()
    const updateRunnableCode = new UpdateRunnableCode(cfg.codePath, deps.contentRepo)
    const result = updateRunnableCode.execute(c.req.param('slug'), code)
    if (!result.ok) return c.json({ error: result.reason }, result.reason === 'Estudo não encontrado' ? 404 : 400)
    return c.json({ ok: true })
  })

  // ── GET /models ────────────────────────────────────────────────────────────────
  app.get('/models', (c) => {
    return c.json({
      anthropic: [
        { id: 'claude-opus-4-6',           label: 'Claude Opus 4.6 (mais capaz)' },
        { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6 (recomendado)' },
        { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (mais rápido)' },
      ],
      google: [
        { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (recomendado)' },
        { id: 'gemini-2.5-pro',   label: 'Gemini 2.5 Pro (mais capaz)' },
        { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
        { id: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro' },
      ],
      cli: [
        { id: '',       label: 'Padrão do Claude Code CLI' },
        { id: 'opus',   label: 'Opus (mais capaz)' },
        { id: 'sonnet', label: 'Sonnet (recomendado)' },
        { id: 'haiku',  label: 'Haiku (mais rápido)' },
      ],
    })
  })

  // ── GET /code-languages — linguagens disponíveis pros exemplos de código ────
  app.get('/code-languages', (c) => {
    const ids = ['csharp', 'typescript', 'javascript', 'python', 'java', 'kotlin', 'go', 'rust']
    return c.json(ids.map((id) => ({ id, label: languageLabel(id) })))
  })

  return app
}
