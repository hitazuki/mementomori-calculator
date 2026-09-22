import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  timeout: 60000,
  reporter: 'list',
  use: {
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    launchOptions: { args: ['--no-proxy-server'] },
    baseURL: 'http://127.0.0.1:5173/mementomori-calculator/',
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: process.env.E2E_PRODUCTION
      ? 'npm run preview -- --host 127.0.0.1 --port 5173 --strictPort'
      : 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173/mementomori-calculator/',
    reuseExistingServer: !process.env.CI && !process.env.E2E_PRODUCTION,
    timeout: 60000,
  },
})
