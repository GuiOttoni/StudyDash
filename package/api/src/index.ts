import { serve } from '@hono/node-server'
import { join } from 'path'
import { existsSync } from 'fs'
import { openSqliteConnection } from './infrastructure/persistence/sqlite/SqliteConnection.js'
import { SqliteSectionRepository } from './infrastructure/persistence/sqlite/SqliteSectionRepository.js'
import { SqliteStudyRepository } from './infrastructure/persistence/sqlite/SqliteStudyRepository.js'
import { SqliteAiStudyContentRepository } from './infrastructure/persistence/sqlite/SqliteAiStudyContentRepository.js'
import { FileConfigStore, STUDYDASH_DIR } from './infrastructure/config/FileConfigStore.js'
import { InMemoryGenerationJobStore } from './infrastructure/jobs/InMemoryGenerationJobStore.js'
import { NodeCodeRunner } from './infrastructure/code-execution/NodeCodeRunner.js'
import { createServer } from './presentation/http/server.js'

// ── Composition root ─────────────────────────────────────────────────────────
// Único lugar que conhece implementações concretas de infraestrutura e as
// injeta nas camadas de aplicação/apresentação.

const configStore = new FileConfigStore()
const config = configStore.read()

const db = openSqliteConnection(join(STUDYDASH_DIR, 'studydash.db'))

const publicDir = join(__dirname, 'public')

const app = createServer({
  sectionRepo: new SqliteSectionRepository(db),
  studyRepo:   new SqliteStudyRepository(db),
  contentRepo: new SqliteAiStudyContentRepository(db),
  configStore,
  jobStore:    new InMemoryGenerationJobStore(),
  codeRunner:  new NodeCodeRunner(),
  publicDir:   existsSync(publicDir) ? publicDir : null,
})

const port = Number(process.env.PORT ?? config.server.port)

// 127.0.0.1: sem autenticação própria, o StudyDash nunca deve ficar
// acessível para outras máquinas na rede.
serve({ fetch: app.fetch, port, hostname: '127.0.0.1' }, (info) => {
  console.log(`StudyDash → http://localhost:${info.port}`)
})
