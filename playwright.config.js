/* eslint-env node */
// playwright.config.js — tests de bout en bout (front en mode api + back-end simulé)
// Lancement : npm run e2e   (ou tâche VS Code « E2E : tests de bout en bout »)
// Les deux serveurs sont démarrés automatiquement s'ils ne tournent pas déjà.
import { defineConfig, devices } from '@playwright/test';

const isWindows = process.platform === 'win32';
const python = isWindows ? '.venv\\Scripts\\python.exe' : '.venv/bin/python';
const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './e2e',
  timeout: 90 * 1000,
  expect: { timeout: 15 * 1000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    locale: 'fr-FR',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'bureau',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 860 },
      },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      grep: /@mobile/,
    },
  ],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : [
        {
          command: `${python} -m uvicorn app.main:app --host 127.0.0.1 --port 3001`,
          cwd: 'backend',
          url: 'http://127.0.0.1:3001/api/health',
          reuseExistingServer: true,
          timeout: 60 * 1000,
          env: { OMUSIKI_AFTA_DELAY: '3' },
        },
        {
          command: 'npm run dev:api',
          url: baseURL,
          reuseExistingServer: true,
          timeout: 60 * 1000,
        },
      ],
});
