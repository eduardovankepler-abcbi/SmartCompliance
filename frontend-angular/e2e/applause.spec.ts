import { expect, Page, test } from '@playwright/test';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('demo123');
  await page.getByRole('button', { name: 'Acessar', exact: true }).click();
  await expect(page).toHaveURL(/\/app\//);
}

test('administrador cria e edita um Aplause', async ({ page }) => {
  const suffix = Date.now();
  const impact = `Impacto E2E ${suffix}`;
  const updatedImpact = `${impact} atualizado`;

  await login(page, 'admin@demo.local');
  await page.goto('/app/applause');
  await expect(page.getByRole('heading', { name: 'Reconhecimento entre pessoas' })).toBeVisible();

  const receiver = await page.getByLabel('Quem recebe').locator('option').nth(1).getAttribute('value');
  expect(receiver).not.toBeNull();
  await page.getByLabel('Quem recebe').selectOption(receiver!);
  await page.getByLabel('Impacto gerado').fill(impact);
  await page.getByLabel('Descricao do reconhecimento').fill('Reconhecimento criado pelo fluxo Playwright da fase 6.5.');
  await page.getByRole('button', { name: 'Registrar Aplause' }).click();

  const card = page.locator('.card').filter({ hasText: impact });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel('Impacto gerado').fill(updatedImpact);
  await page.getByRole('button', { name: 'Salvar alteracoes' }).click();
  await expect(page.getByText(updatedImpact, { exact: true })).toBeVisible();
});

test('administrador arquiva um Aplause', async ({ page }) => {
  const impact = `Arquivar Aplause ${Date.now()}`;

  await login(page, 'admin@demo.local');
  await page.goto('/app/applause');
  const receiver = await page.getByLabel('Quem recebe').locator('option').nth(1).getAttribute('value');
  await page.getByLabel('Quem recebe').selectOption(receiver!);
  await page.getByLabel('Impacto gerado').fill(impact);
  await page.getByLabel('Descricao do reconhecimento').fill('Reconhecimento temporario criado para validar arquivamento.');
  await page.getByRole('button', { name: 'Registrar Aplause' }).click();

  const card = page.locator('.card').filter({ hasText: impact });
  await card.getByRole('button', { name: 'Arquivar' }).click();
  await expect(card).toHaveCount(0);
});

test('exibe estado vazio quando nao ha reconhecimentos', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await page.route('**/api/applause', (route) => route.fulfill({ status: 200, json: [] }));
  await page.goto('/app/applause');

  await expect(page.getByText('Nenhum reconhecimento encontrado no seu escopo.')).toBeVisible();
});

test('exibe erro quando a consulta de Aplause falha', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await page.route('**/api/applause', (route) =>
    route.fulfill({ status: 500, json: { error: 'Falha E2E no Aplause.' } }),
  );
  await page.goto('/app/applause');

  await expect(page.locator('.error[role="alert"]')).toContainText('Falha E2E no Aplause.');
});

test('colaborador nao visualiza acoes administrativas do Aplause', async ({ page }) => {
  await login(page, 'colaborador1@demo.local');
  await page.goto('/app/applause');

  await expect(page.getByRole('heading', { name: 'Reconhecimento entre pessoas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Editar' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Arquivar' })).toHaveCount(0);
});
