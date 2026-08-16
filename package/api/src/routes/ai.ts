import { Hono }                                from 'hono'
import { streamSSE }                           from 'hono/streaming'
import { spawn }                               from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { basename, resolve, sep }              from 'path'
import { db }                                  from '../db/client.js'
import type { Study, Section, AiStudyContent } from '../db/schema.js'
import { generateStudy }                       from '../ai/generate.js'
import type { LogFn }                          from '../ai/generate.js'
import { readConfig }                          from '../utils/config.js'

export const ai = new Hono()

// Normaliza texto livre (ex: categoria/slug vindos da IA) em um slug seguro
// pra URL: sem acentos, minúsculo, apenas [a-z0-9-].
function slugify(text: string): string {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Aceita apenas nomes simples em kebab/snake case — bloqueia path traversal
// (../, separadores de diretório, caminhos absolutos) tanto no slug vindo da
// URL quanto no filename retornado pelo modelo de IA.
const SAFE_SLUG = /^[a-zA-Z0-9_-]+$/

// Garante que o caminho final ainda está dentro de codePath, mesmo depois de
// normalizado — segunda camada de defesa além do SAFE_SLUG.
function resolveCodeFile(codePath: string, slug: string): string | null {
  if (!SAFE_SLUG.test(slug)) return null
  const base = resolve(codePath)
  const target = resolve(base, `${slug}.js`)
  if (target !== base && !target.startsWith(base + sep)) return null
  return target
}

// ── In-memory job store ───────────────────────────────────────────────────────
interface Job {
  events:  Array<{ type: string; data: string }>
  notify:  (() => void) | null
  done:    boolean
  timer:   ReturnType<typeof setTimeout>
}
const jobs = new Map<string, Job>()

function createJob(): { jobId: string; log: LogFn; finish: (result: unknown) => void; fail: (msg: string) => void } {
  const jobId = crypto.randomUUID()
  const job: Job = { events: [], notify: null, done: false, timer: setTimeout(() => jobs.delete(jobId), 300_000) }
  jobs.set(jobId, job)

  const push = (type: string, data: string) => {
    job.events.push({ type, data })
    if (job.notify) { job.notify(); job.notify = null }
  }

  return {
    jobId,
    log:    (msg)    => push('log', msg),
    finish: (result) => { push('result', JSON.stringify(result)); job.done = true; if (job.notify) { job.notify(); job.notify = null } },
    fail:   (msg)    => { push('error', msg);                     job.done = true; if (job.notify) { job.notify(); job.notify = null } },
  }
}

// ── POST /api/ai/generate — inicia geração em background, retorna jobId ───────
ai.post('/generate', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>()

  if (!prompt?.trim()) return c.json({ error: 'prompt é obrigatório' }, 400)

  const cfg = readConfig()
  if (cfg.ai.provider !== 'cli' && !cfg.ai.apiKey) {
    return c.json({ error: 'API key não configurada. Execute: studydash config' }, 400)
  }
  if (!cfg.codePath) return c.json({ error: 'Configure a pasta de código em Configurações → Backend antes de gerar estudos.' }, 400)

  const { jobId, log, finish, fail } = createJob()

  // Geração em background — não bloqueia a resposta HTTP
  void (async () => {
    try {
      log('🔍 Validando configuração...')

      let result
      try {
        result = await generateStudy(prompt, cfg, log)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        fail(message)
        return
      }

      // Normaliza o slug retornado pela IA (pode vir com acentos/espaços) —
      // ele é usado direto em rotas de URL e nomes de arquivo.
      result.metadata.slug = slugify(result.metadata.slug) || slugify(result.metadata.title) || crypto.randomUUID().slice(0, 8)

      if (result.runnableCode) {
        try {
          mkdirSync(cfg.codePath, { recursive: true })
          // Ignora o filename sugerido pela IA se não for um nome de arquivo
          // seguro (ex: contiver "../") — usa apenas o basename, e cai no
          // slug do estudo se mesmo assim não sobrar nada seguro.
          const suggested = basename(result.runnableCode.filename || '')
          const slugForFile = suggested.endsWith('.js') ? suggested.slice(0, -3) : result.metadata.slug
          const filePath = resolveCodeFile(cfg.codePath, slugForFile) ?? resolveCodeFile(cfg.codePath, result.metadata.slug)
          if (!filePath) throw new Error('Nome de arquivo inválido retornado pela IA')
          writeFileSync(filePath, result.runnableCode.code, 'utf-8')
          log(`💾 Código salvo: ${filePath}`)
        } catch (err) {
          log(`⚠️ Falha ao salvar código: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      log('💾 Salvando no banco de dados...')

      db.prepare(`
        INSERT INTO ai_study_content (study_slug, content, generated_by, prompt, created_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(study_slug) DO UPDATE SET
          content      = excluded.content,
          generated_by = excluded.generated_by,
          prompt       = excluded.prompt,
          created_at   = excluded.created_at
      `).run(
        result.metadata.slug,
        JSON.stringify(result),
        `${cfg.ai.provider}:${cfg.ai.model}`,
        prompt,
        Date.now(),
      )

      db.prepare(`
        INSERT INTO studies (slug, title, icon, category, description, available, "order")
        VALUES (?, ?, ?, ?, ?, 1, ?)
        ON CONFLICT(slug) DO UPDATE SET
          title       = excluded.title,
          icon        = excluded.icon,
          category    = excluded.category,
          description = excluded.description
      `).run(
        result.metadata.slug,
        result.metadata.title,
        result.metadata.icon,
        result.metadata.category,
        result.metadata.description,
        Date.now(),
      )

      const categorySlug = slugify(result.metadata.category)
      const matchingSection = db.prepare('SELECT * FROM sections WHERE slug = ?').get(categorySlug) as Section | undefined
      if (matchingSection) {
        const cats: string[] = JSON.parse(matchingSection.categories)
        if (!cats.includes(result.metadata.category)) {
          cats.push(result.metadata.category)
          db.prepare('UPDATE sections SET categories = ? WHERE id = ?').run(JSON.stringify(cats), matchingSection.id)
        }
        log(`📂 Categoria vinculada à seção "${matchingSection.title}"`)
      } else {
        db.prepare(`
          INSERT OR IGNORE INTO sections (slug, title, icon, description, categories, "order")
          VALUES (?, ?, 'Layers', '', ?, ?)
        `).run(categorySlug, result.metadata.category, JSON.stringify([result.metadata.category]), Date.now())
        log(`📂 Nova seção criada: "${result.metadata.category}"`)
      }

      const study = db.prepare('SELECT * FROM studies WHERE slug = ?').get(result.metadata.slug) as Study
      log('✅ Estudo gerado com sucesso!')
      finish({ study, content: result })
    } catch (err: unknown) {
      fail(err instanceof Error ? err.message : String(err))
    }
  })()

  return c.json({ jobId })
})

// ── GET /api/ai/generate/stream/:jobId — SSE de logs do job ──────────────────
ai.get('/generate/stream/:jobId', (c) => {
  return streamSSE(c, async (stream) => {
    const jobId = c.req.param('jobId')
    const job   = jobs.get(jobId)

    if (!job) {
      await stream.writeSSE({ event: 'error', data: 'Job não encontrado' })
      return
    }

    while (true) {
      while (job.events.length > 0) {
        const evt = job.events.shift()!
        await stream.writeSSE({ event: evt.type, data: evt.data })
        if (evt.type === 'result' || evt.type === 'error') {
          clearTimeout(job.timer)
          jobs.delete(jobId)
          return
        }
      }
      if (job.done) break
      await new Promise<void>((r) => { job.notify = r })
    }
  })
})

// ── GET /api/ai/run/:slug — executa código e transmite via SSE ────────────────
ai.get('/run/:slug', (c) => {
  return streamSSE(c, async (stream) => {
    const cfg = readConfig()
    if (!cfg.codePath) {
      await stream.writeSSE({ event: 'error', data: 'Pasta de código não configurada' })
      return
    }

    const slug     = c.req.param('slug')
    const filePath = resolveCodeFile(cfg.codePath, slug)

    if (!filePath) {
      await stream.writeSSE({ event: 'error', data: 'Slug inválido' })
      return
    }

    if (!existsSync(filePath)) {
      await stream.writeSSE({ event: 'error', data: 'Arquivo de código não encontrado para este estudo' })
      return
    }

    const queue: Array<{ event: string; data: string } | null> = []
    let notify: (() => void) | null = null
    const push = (item: { event: string; data: string } | null) => {
      queue.push(item)
      if (notify) { notify(); notify = null }
    }

    const proc = spawn('node', [filePath])
    proc.stdout.on('data', (d: Buffer) => push({ event: 'stdout', data: d.toString() }))
    proc.stderr.on('data', (d: Buffer) => push({ event: 'stderr', data: d.toString() }))
    proc.on('close', (code) => { push({ event: 'done', data: String(code ?? 0) }); push(null) })
    proc.on('error', (err)  => { push({ event: 'error', data: err.message });       push(null) })

    const timeout = setTimeout(() => {
      proc.kill()
      push({ event: 'stderr', data: '\n[Timeout: execução cancelada após 30s]' })
      push({ event: 'done',   data: '-1' })
      push(null)
    }, 30000)

    while (true) {
      if (queue.length > 0) {
        const item = queue.shift()!
        if (item === null) break
        await stream.writeSSE(item)
      } else {
        await new Promise<void>((r) => { notify = r })
      }
    }
    clearTimeout(timeout)
  })
})

// ── GET /api/ai/study/:slug ───────────────────────────────────────────────────
ai.get('/study/:slug', (c) => {
  const slug = c.req.param('slug')
  const row  = db.prepare('SELECT * FROM ai_study_content WHERE study_slug = ?').get(slug) as AiStudyContent | undefined
  if (!row) return c.json({ error: 'Study não encontrado' }, 404)
  return c.json({ ...row, content: JSON.parse(row.content) })
})

// ── GET /api/ai/models ────────────────────────────────────────────────────────
ai.get('/models', (c) => {
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
      { id: '',      label: 'Padrão do Claude Code CLI' },
      { id: 'opus',   label: 'Opus (mais capaz)' },
      { id: 'sonnet', label: 'Sonnet (recomendado)' },
      { id: 'haiku',  label: 'Haiku (mais rápido)' },
    ],
  })
})
