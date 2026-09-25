import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // Porta fixa e exclusiva do Search Image: 5173 é o padrão do Vite
    // e costuma colidir com outros projetos abertos ao mesmo tempo.
    // strictPort falha alto (em vez de trocar de porta em silêncio) se
    // 5183 já estiver ocupada, para nunca abrir o app errado sem avisar.
    port: 5183,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
