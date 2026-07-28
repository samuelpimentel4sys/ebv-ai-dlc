import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Único backend público = Noah Java :8080 (BFF GenAI → Emilly interno)
      // HITL + GenAI paths iguais; Java roteia. Ver HANDOFF_SOFIA_BFF_GENAI.md
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/actuator': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    // Testes de UI usam mocks locais; live exige BE Noah e quebra a suíte offline.
    env: {
      VITE_DATA_MODE: 'mock',
    },
  },
});
