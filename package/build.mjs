#!/usr/bin/env node
import { build } from 'esbuild'
import { execSync } from 'child_process'
import { cpSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'

const dist = 'dist'

console.log('🧹 Cleaning dist...')
rmSync(dist, { recursive: true, force: true })
mkdirSync(`${dist}/cli`, { recursive: true })

// ── API (Hono backend) ────────────────────────────────────────────────────────
console.log('⚙️  Building API...')
await build({
  entryPoints: ['api/src/index.ts'],
  bundle:      true,
  platform:    'node',
  target:      'node22',
  outfile:     `${dist}/api.js`,
  format:      'cjs',
  // node:sqlite é built-in; SDKs de AI ficam como external (instalados com o pacote)
  external: [
    '@anthropic-ai/sdk',
    '@google/generative-ai',
  ],
})

// ── CLI ───────────────────────────────────────────────────────────────────────
console.log('⚙️  Building CLI...')
await build({
  entryPoints: ['cli/src/index.ts'],
  bundle:      true,
  platform:    'node',
  target:      'node22',
  outfile:     `${dist}/cli/index.js`,
  format:      'cjs',
  // todos os pacotes npm ficam como require() — instalados como dependências
  packages:    'external',
  banner: {
    // shebang para que o arquivo seja executável como binário
    js: '#!/usr/bin/env node',
  },
})

// ── Frontend (Next.js standalone) ────────────────────────────────────────────
console.log('⚙️  Building frontend (this may take a minute)...')
execSync('npm run build', { cwd: '../frontend', stdio: 'inherit' })

const frontendDist = `${dist}/frontend`
mkdirSync(frontendDist, { recursive: true })

// standalone output: servidor Node.js auto-contido
cpSync('../frontend/.next/standalone/.', frontendDist, { recursive: true })
// static assets precisam ser copiados manualmente
cpSync('../frontend/.next/static', join(frontendDist, '.next', 'static'), { recursive: true })
cpSync('../frontend/public', join(frontendDist, 'public'), { recursive: true })

console.log('✅ Build complete → dist/')
