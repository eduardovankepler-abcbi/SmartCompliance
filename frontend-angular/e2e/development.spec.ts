import { expect, Page, test } from '@playwright/test';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('demo123');
  await page.getByRole('button', { name: 'Acessar', exact: true }).click();
  await expect(page).toHaveURL(/\/app\//);
}

test('administrador cria e edita um registro de desenvolvimento', async ({ page }) => {
  const suffix = Date.now();
  const title = `Curso Angular ${suffix}`;
  const updatedTitle = `${title} atualizado`;

  await login(page, 'admin@demo.local');
  await page.goto('/app/development');
  await expect(page.getByRole('heading', { name: 'Formacao e PDI' })).toBeVisible();

  await page.getByRole('button', { name: 'Novo registro' }).click();
  await page.getByLabel('Titulo').fill(title);
  await page.getByLabel('Instituicao ou provedor').fill('Escola E2E');
  await page.getByLabel('Conclusao').fill('2026-07-21');
  await page.getByLabel('Sinal de competencia').fill('Angular');
  await page.getByRole('button', { name: 'Salvar registro' }).click();

  const card = page.locator('.card').filter({ hasText: title });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel('Titulo').fill(updatedTitle);
  await page.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(page.getByText(updatedTitle, { exact: true })).toBeVisible();
});

test('administrador cria PDI e atualiza o andamento', async ({ page }) => {
  const focusTitle = `PDI Angular ${Date.now()}`;

  await login(page, 'admin@demo.local');
  await page.goto('/app/development');
  await page.getByRole('button', { name: 'Novo PDI' }).click();
  await page.getByLabel('Foco do PDI').fill(focusTitle);
  await page.getByLabel('Acao planejada').fill('Aplicar Angular em uma entrega acompanhada.');
  await page.getByLabel('Prazo', { exact: true }).fill('2026-12-20');
  await page.getByLabel('Evidencia esperada').fill('Entrega publicada e revisada.');
  await page.getByRole('button', { name: 'Salvar PDI' }).click();

  const card = page.locator('.card').filter({ hasText: focusTitle });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Andamento' }).click();
  await card.getByLabel('Status').selectOption('in_progress');
  await card.getByLabel('Nota').fill('Primeira entrega iniciada.');
  await card.getByRole('button', { name: 'Salvar andamento' }).click();

  await expect(card).toContainText('Em andamento');
  await expect(card).toContainText('Primeira entrega iniciada.');
});

test('exibe estados vazios quando nao ha registros nem PDIs', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await page.route('**/api/development/records', (route) => route.fulfill({ status: 200, json: [] }));
  await page.route('**/api/development/plans', (route) => route.fulfill({ status: 200, json: [] }));
  await page.goto('/app/development');

  await expect(page.getByText('Nenhum PDI ativo no seu escopo.')).toBeVisible();
  await expect(page.getByText('Nenhum registro de desenvolvimento no seu escopo.')).toBeVisible();
});

test('exibe erro quando o carregamento de desenvolvimento falha', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await page.route('**/api/development/records', (route) =>
    route.fulfill({ status: 500, json: { error: 'Falha E2E em Desenvolvimento.' } }),
  );
  await page.goto('/app/development');

  await expect(page.getByRole('alert')).toContainText('Falha E2E em Desenvolvimento.');
});

test('colaborador nao visualiza a fila de integracoes de aprendizagem', async ({ page }) => {
  await login(page, 'colaborador1@demo.local');
  await page.goto('/app/development');

  await expect(page.getByRole('heading', { name: 'Formacao e PDI' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fila de revisao' })).toHaveCount(0);
});
