import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const reactBaseUrl = process.env.VISUAL_REACT_URL ?? 'http://127.0.0.1:4174';
const angularBaseUrl = process.env.VISUAL_ANGULAR_URL ?? 'http://127.0.0.1:4210';
const reportDir = join(process.cwd(), 'reports', 'visual-parity');

const routes = [
  { id: 'dashboard', reactSection: 'Dashboard', angularPath: '/app/dashboard', angularReadySelector: '#dashboard-title' },
  { id: 'compliance', reactSection: 'Compliance', angularPath: '/app/compliance', angularReadySelector: '#incidents-title' },
  { id: 'development', reactSection: 'Desenvolvimento', angularPath: '/app/development', angularReadySelector: '#development-title' },
  { id: 'applause', reactSection: 'Aplause', angularPath: '/app/applause', angularReadySelector: '#applause-title' },
  { id: 'people', reactSection: 'Pessoas', angularPath: '/app/people', angularReadySelector: '#people-title' },
  { id: 'users', reactSection: 'Usuarios', angularPath: '/app/users', angularReadySelector: '#users-title' },
] as const;

async function loginReact(page: Page): Promise<void> {
  await page.goto(reactBaseUrl, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill('admin@demo.local');
  await page.getByLabel('Senha').fill('demo123');
  await page.getByRole('button', { name: 'Entrar no ambiente' }).click();
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
}

async function loginAngular(page: Page): Promise<void> {
  await page.goto(`${angularBaseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('E-mail').fill('admin@demo.local');
  await page.getByLabel('Senha').fill('demo123');
  await page.getByRole('button', { name: 'Acessar', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/dashboard$/);
}

async function captureStable(page: Page, path: string): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
}

test.describe('comparacao visual React x Angular', () => {
  test.beforeAll(() => {
    mkdirSync(reportDir, { recursive: true });
  });

  for (const route of routes) {
    test(`captura ${route.id}`, async ({ browser }) => {
      const reactPage = await browser.newPage();
      const angularPage = await browser.newPage();

      await loginReact(reactPage);
      await reactPage.getByRole('button', { name: route.reactSection }).click();
      await expect(reactPage.getByRole('heading', { name: route.reactSection, exact: true })).toBeVisible();

      await loginAngular(angularPage);
      await angularPage.goto(`${angularBaseUrl}${route.angularPath}`, { waitUntil: 'networkidle' });
      await expect(angularPage.locator(route.angularReadySelector)).toBeVisible();
      if (route.id === 'people') {
        await angularPage.locator('.people__table-wrap tbody tr').first().getByRole('button', { name: 'Editar' }).click();
        await expect(angularPage.locator('.people__inline-form')).toBeVisible();
      }
      if (route.id === 'users') {
        await angularPage.locator('.table tbody tr').first().getByRole('button', { name: 'Editar' }).click();
        await expect(angularPage.locator('.inline-edit')).toBeVisible();
      }

      await captureStable(reactPage, join(reportDir, `${route.id}-react.png`));
      await captureStable(angularPage, join(reportDir, `${route.id}-angular.png`));

      await reactPage.close();
      await angularPage.close();
    });
  }
});
