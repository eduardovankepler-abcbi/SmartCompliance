import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const BACKEND_PORT = 4001;
const FRONTEND_PORT = 4201;
const chromiumExecutablePath = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((candidate) => candidate && existsSync(candidate));

export default defineConfig({
  testDir: './e2e',
  testIgnore: ['visual-parity.spec.ts', 'published-readonly.spec.ts'],
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ...(chromiumExecutablePath ? { launchOptions: { executablePath: chromiumExecutablePath } } : {}),
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
        CORS_ORIGIN: `http://localhost:${FRONTEND_PORT}`,
      },
    },
    {
      command: `npm run start -- --configuration=e2e --host localhost --port ${FRONTEND_PORT}`,
      cwd: '.',
      url: `http://localhost:${FRONTEND_PORT}`,
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
