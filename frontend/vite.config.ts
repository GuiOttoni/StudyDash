import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// StudyDash é uma SPA local, single-user, servida pelo próprio Hono (mesma
// origem, mesma porta) — sem necessidade de SSR/SEO. Em dev, o proxy abaixo
// aponta /api pra API rodando em paralelo (`npm run dev:api` no package/).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5055', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
  },
})
