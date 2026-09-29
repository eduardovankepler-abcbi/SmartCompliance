import { expect, test } from '@playwright/test';

const adminEmail = process.env.HOMOLOGATION_ADMIN_EMAIL || 'admin@demo.local';
const employeeEmail = process.env.HOMOLOGATION_EMPLOYEE_EMAIL || 'colaborador1@demo.local';
const complianceEmail = process.env.HOMOLOGATION_COMPLIANCE_EMAIL || 'compliance@demo.local';
const password = process.env.HOMOLOGATION_PASSWORD || 'demo123';

async function login(page: import('@playwright/test').Page, email: string, expectedUrl: RegExp) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Acessar', exact: true }).click();
  await expect(page).toHaveURL(expectedUrl, { timeout: 60000 });
}

test('valida dashboard e auditoria publicados sem mutacao funcional', async ({ page }) => {
  await login(page, adminEmail, /\/app\/dashboard$/);

  await expect(page.locator('#dashboard-title')).toHaveText('Gestao Executiva');
  await expect(page.getByRole('navigation', { name: 'Navegacao do dashboard' })).toBeVisible();

  await page.goto('/app/audit');
  await expect(page.getByRole('heading', { name: 'Auditoria' })).toBeVisible();
  await expect(page.getByLabel('Filtros de auditoria')).toBeVisible();
  await expect(page.getByLabel('Eventos de auditoria')).toBeVisible();
});

test('bloqueia colaborador no dashboard publicado', async ({ page }) => {
  await login(page, employeeEmail, /\/app\/compliance$/);

  await page.goto('/app/dashboard');
  await expect(page).toHaveURL(/\/app\/compliance$/);
  await page.goto('/app/audit');
  await expect(page).toHaveURL(/\/app\/compliance$/);
});

test('bloqueia compliance nos workspaces restritos publicados', async ({ page }) => {
  await login(page, complianceEmail, /\/app\/compliance$/);

  for (const path of [
    '/app/evaluations/company/respond',
    '/app/development',
    '/app/applause',
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/app\/compliance$/);
  }
});
