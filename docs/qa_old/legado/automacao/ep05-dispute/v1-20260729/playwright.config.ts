import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const evidencias = process.env.PLAYWRIGHT_HTML_REPORT
  ?? path.join(__dirname, '../../../evidencias/runs/v1-20260729T182903Z/playwright-report');

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 45_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: evidencias, open: 'never' }],
    ['json', { outputFile: path.join(evidencias, '..', 'test-results.json') }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
