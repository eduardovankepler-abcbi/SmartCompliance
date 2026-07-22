import { defineConfig, devices } from '@playwright/test';

const BACKEND_PORT = 4001;
const REACT_PORT = 4174;
const ANGULAR_PORT = 4210;
const backendUrl = `http://127.0.0.1:${BACKEND_PORT}`;
const reactUrl = `http://127.0.0.1:${REACT_PORT}`;
const angularUrl = `http://127.0.0.1:${ANGULAR_PORT}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: ['visual-parity.spec.ts'],
  fullyParallel: false,
  workers: 1,
  timeout: 180000,
  reporter: 'list',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 1000 },
  },
  webServer: [
    {
      command: 'npm run start',
      cwd: '../backend',
      url: `${backendUrl}/health`,
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        ...process.env,
        PORT: String(BACKEND_PORT),
        STORAGE_MODE: 'memory',
        AUTH_SECRET: process.env.AUTH_SECRET || 'smart-compliance-dev-secret',
        CORS_ORIGIN: `${reactUrl},${angularUrl}`,
        CORS_ADDITIONAL_ORIGINS: `${reactUrl},${angularUrl}`,
      },
    },
    {
      command: `npx vite --host 127.0.0.1 --port ${REACT_PORT}`,
      cwd: '../frontend',
      url: reactUrl,
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        ...process.env,
        VITE_API_URL: backendUrl,
      },
    },
    {
      command: `npx ng serve --configuration=e2e --host 127.0.0.1 --port ${ANGULAR_PORT}`,
      cwd: '.',
      url: angularUrl,
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: angularUrl,
        launchOptions: { args: ['--disable-dev-shm-usage'] },
      },
    },
  ],
});
