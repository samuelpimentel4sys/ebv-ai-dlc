import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const modulo = process.env.QA_MODULO ?? 'contestacao';
const version = process.env.QA_VERSION ?? '1';
const channel = process.env.PLAYWRIGHT_CHANNEL; // chrome | msedge | (bundled chromium)
const relatorios = path.join(__dirname, '..', modulo, 'relatorios');
const screenshots = path.join(__dirname, '..', modulo, 'screenshots');

export default defineConfig({
  testDir: path.join(__dirname, '..', modulo, 'specs'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 90_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: relatorios, open: 'never' }],
    ['json', { outputFile: path.join(relatorios, `qa-${modulo}-v${version}.json`) }],
    ['junit', { outputFile: path.join(relatorios, `qa-${modulo}-v${version}.junit.xml`) }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    launchOptions: {
      slowMo: Number(process.env.PLAYWRIGHT_SLOWMO ?? 150),
    },
  },
  outputDir: screenshots,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(channel ? { channel } : {}),
      },
    },
  ],
});
