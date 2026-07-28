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
      // HITL (Noah Java) — mais específico primeiro
      '^/api/v1/pj/opinions/.*/(submit|approve|trail)': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // GenAI Copiloto PJ (Emilly Python)
      '/api/v1/pj': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
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
