import { defineConfig, devices } from "@playwright/test";

const FRONTEND_PORT = 4173;
const BACKEND_PORT = 4000;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${FRONTEND_PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: [
    {
      command: "npm run start",
      cwd: "../backend",
      url: `http://127.0.0.1:${BACKEND_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        PORT: String(BACKEND_PORT),
        STORAGE_MODE: "memory",
        AUTH_SECRET: process.env.AUTH_SECRET || "smart-compliance-dev-secret",
        CORS_ORIGIN: `http://127.0.0.1:${FRONTEND_PORT}`
      }
    },
    {
      command: `npx vite --host 127.0.0.1 --port ${FRONTEND_PORT}`,
      cwd: ".",
      url: `http://127.0.0.1:${FRONTEND_PORT}`,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        VITE_API_URL: `http://127.0.0.1:${BACKEND_PORT}`
      }
    }
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
