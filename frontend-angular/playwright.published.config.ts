import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'published-readonly.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  reporter: 'list',
  use: {
    baseURL: process.env.HOMOLOGATION_FRONTEND_BASE_URL || 'https://smart-compliance-frontend.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
