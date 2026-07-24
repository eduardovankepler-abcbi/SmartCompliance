import { defineConfig, devices } from '@playwright/test';

const BACKEND_PORT = 4001;
const FRONTEND_PORT = 4201;

export default defineConfig({
  testDir: './e2e',
  testIgnore: ['visual-parity.spec.ts'],
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${FRONTEND_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm run start',
      cwd: '../backend',
      url: `http://127.0.0.1:${BACKEND_PORT}/health`,
      reuseExistingServer: false,
      env: {
        ...process.env,
        PORT: String(BACKEND_PORT),
        STORAGE_MODE: 'memory',
        AUTH_SECRET: process.env.AUTH_SECRET || 'smart-compliance-dev-secret',
        CORS_ORIGIN: `http://127.0.0.1:${FRONTEND_PORT}`,
      },
    },
    {
      command: `npx ng serve --configuration=e2e --host 127.0.0.1 --port ${FRONTEND_PORT}`,
      cwd: '.',
      url: `http://127.0.0.1:${FRONTEND_PORT}`,
      reuseExistingServer: false,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
