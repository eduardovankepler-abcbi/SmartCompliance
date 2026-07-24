import { expect, Page, test } from '@playwright/test';

interface DashboardOverviewResponse {
  cards: Array<{ label: string; value: string }>;
  selectedArea: string | null;
  timeGrouping: string;
}

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('demo123');
  await page.getByRole('button', { name: 'Acessar', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/dashboard$/);
}

function suggestedUserEmail(personName: string): string {
  return `${personName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.{2,}/g, '.')}@empresa.local`;
}

test('restaura a sessao apos atualizar a pagina', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  await page.reload();

  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('impede gestor de abrir a gestao de areas', async ({ page }) => {
  await login(page, 'gestor@demo.local');
  await expect(page).toHaveURL(/\/app\/dashboard$/);

  await page.goto('/app/people/areas');

  await expect(page).toHaveURL(/\/app\/people$/);
  await expect(page.getByRole('heading', { name: 'Pessoas' })).toBeVisible();
});

test('impede gestor de abrir o catalogo de competencias', async ({ page }) => {
  await login(page, 'gestor@demo.local');
  await expect(page).toHaveURL(/\/app\/dashboard$/);

  await page.goto('/app/people/competencies');

  await expect(page).toHaveURL(/\/app\/people$/);
  await expect(page.getByRole('heading', { name: 'Pessoas' })).toBeVisible();
});

test('permite administrador criar uma area', async ({ page }) => {
  const areaName = `Area E2E ${Date.now()}`;

  await login(page, 'admin@demo.local');
  await page.goto('/app/people/areas');
  await expect(page.getByRole('heading', { name: 'Areas' })).toBeVisible();

  await page.getByRole('button', { name: 'Nova area' }).click();
  await page.getByLabel('Nome da area').fill(areaName);
  await page.getByRole('button', { name: 'Cadastrar area' }).click();

  await expect(page.getByText(areaName, { exact: true })).toBeVisible();
});

test('permite administrador criar uma competencia', async ({ page }) => {
  const competencyName = `Competencia E2E ${Date.now()}`;

  await login(page, 'admin@demo.local');
  await page.goto('/app/people/competencies');
  await expect(page.getByRole('heading', { name: 'Competencias' })).toBeVisible();

  await page.getByRole('button', { name: 'Nova competencia' }).click();
  await page.getByLabel('Nome da competencia').fill(competencyName);
  await page.getByLabel('Chave').fill('competencia-e2e');
  await page.getByLabel('Descricao').fill('Competencia criada pelo fluxo E2E.');
  await page.getByRole('button', { name: 'Cadastrar competencia' }).click();

  await expect(page.getByText(competencyName, { exact: true })).toBeVisible();
});

test('permite administrador cadastrar uma pessoa com estrutura', async ({ page }) => {
  const personName = `Pessoa E2E ${Date.now()}`;

  await login(page, 'admin@demo.local');
  await page.goto('/app/people');
  await expect(page.getByRole('button', { name: 'Nova pessoa' })).toBeVisible();

  await page.getByRole('button', { name: 'Nova pessoa' }).click();
  await page.getByLabel('Nome').fill(personName);
  await page.getByLabel('Cargo').fill('Analista E2E');
  const areaField = page.locator('select[formcontrolname="area"]');
  const area = await areaField.locator('option').nth(1).getAttribute('value');
  await areaField.selectOption(area!);
  await page.getByLabel('Unidade de trabalho').fill('Sao Paulo');
  await page.getByRole('button', { name: 'Cadastrar pessoa' }).click();

  await expect(page.getByText(personName, { exact: true })).toBeVisible();
});

test('permite administrador editar pessoa inline', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await page.goto('/app/people');
  await expect(page.locator('#people-title')).toHaveText('Pessoas');

  const personRow = page.getByRole('row').filter({ hasText: 'Colaborador Demo 01' });
  await personRow.getByRole('button', { name: 'Editar' }).click();
  const inlineForm = page.locator('.people__inline-form');

  await expect(inlineForm.getByLabel('Nome')).toHaveValue('Colaborador Demo 01');
  await inlineForm.getByLabel('Modalidade').selectOption('remote');
  await inlineForm.getByRole('button', { name: 'Salvar vinculos' }).click();

  await expect(personRow).toContainText('100% Home Office');
});

test('permite administrador provisionar usuario para pessoa sem acesso', async ({ page }) => {
  const personName = `Pessoa Usuario E2E ${Date.now()}`;
  const email = suggestedUserEmail(personName);

  await login(page, 'admin@demo.local');
  await page.goto('/app/people');
  await page.getByRole('button', { name: 'Nova pessoa' }).click();
  await page.getByLabel('Nome').fill(personName);
  await page.getByLabel('Cargo').fill('Assistente E2E');
  const areaField = page.locator('select[formcontrolname="area"]');
  const area = await areaField.locator('option').nth(1).getAttribute('value');
  await areaField.selectOption(area!);
  await page.getByLabel('Unidade de trabalho').fill('Sao Paulo');
  await page.getByRole('button', { name: 'Cadastrar pessoa' }).click();
  await expect(page.getByText(personName, { exact: true })).toBeVisible();

  await page.goto('/app/users');
  await expect(page.locator('#users-title')).toHaveText('Usuarios');
  await page.getByRole('button', { name: 'Novo usuario' }).click();
  const personField = page.locator('select[formcontrolname="personId"]');
  const personId = await personField.locator('option', { hasText: personName }).getAttribute('value');
  await personField.selectOption(personId!);
  await expect(page.getByLabel('E-mail')).toHaveValue(email);
  await expect(page.locator('select[formcontrolname="roleKey"]')).toHaveValue('employee');
  await page.getByLabel('Senha inicial').fill('demo123');
  await page.getByRole('button', { name: 'Criar usuario' }).click();

  await expect(page.getByText(email, { exact: true })).toBeVisible();
});

test('permite administrador editar usuario inline', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await page.goto('/app/users');
  await expect(page.locator('#users-title')).toHaveText('Usuarios');

  const userRow = page.getByRole('row').filter({ hasText: 'Colaborador Demo 01' });
  await userRow.getByRole('button', { name: 'Editar' }).click();
  const inlineForm = page.locator('.inline-edit');

  await expect(inlineForm.getByLabel('Pessoa')).toHaveValue('Colaborador Demo 01');
  await inlineForm.getByLabel('Status').selectOption('inactive');
  await inlineForm.getByRole('button', { name: 'Atualizar acesso' }).click();

  await expect(userRow).toContainText('Inativo');

  await userRow.getByRole('button', { name: 'Editar' }).click();
  await inlineForm.getByLabel('Status').selectOption('active');
  await inlineForm.getByRole('button', { name: 'Atualizar acesso' }).click();
  await expect(userRow).toContainText('Ativo');
});

test('permite administrador registrar um incidente', async ({ page }) => {
  const title = `Incidente E2E ${Date.now()}`;
  await login(page, 'admin@demo.local');
  await page.goto('/app/compliance');
  await expect(page.getByRole('button', { name: 'Novo relato' })).toBeVisible();
  await expect(page.getByLabel('Titulo')).toBeVisible();
  await page.getByLabel('Titulo').fill(title);
  await page.getByLabel('Descricao').fill('Descricao do incidente criada no teste E2E.');
  await page.getByRole('button', { name: 'Registrar relato' }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
});

test('gestor nao visualiza acoes de tratamento de incidentes', async ({ page }) => {
  await login(page, 'gestor@demo.local');
  await page.goto('/app/compliance');
  await expect(page.getByRole('heading', { name: 'Incidentes' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tratar' })).toHaveCount(0);
});

test('permite administrador atualizar o tratamento de um incidente', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await page.goto('/app/compliance');
  await expect(page.getByRole('heading', { name: 'Incidentes' })).toBeVisible();

  const incident = page.locator('.queue article').first();
  await incident.getByRole('button', { name: 'Tratar' }).click();
  await incident.getByLabel('Status').selectOption({ label: 'Em apuracao' });
  await incident.getByRole('button', { name: 'Salvar tratamento' }).click();

  await expect(incident).toContainText('Em apuracao');
});

test('exibe estado vazio quando nao ha incidentes', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await page.route('**/api/incidents', (route) => route.fulfill({ status: 200, json: [] }));
  await page.goto('/app/compliance');

  await expect(page.getByText('Nenhum incidente no seu escopo.')).toBeVisible();
});

test('exibe erro quando a fila de incidentes falha', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await page.route('**/api/incidents', (route) =>
    route.fulfill({ status: 500, json: { error: 'Falha E2E ao carregar incidentes.' } }),
  );
  await page.goto('/app/compliance');

  await expect(page.locator('.error[role="alert"]')).toContainText('Falha E2E ao carregar incidentes.');
});

test('exibe os indicadores do overview retornado pela API', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  const overviewResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' && response.url().includes('/api/dashboards/overview'),
  );
  await page.locator('.dashboard').getByRole('button', { name: 'Atualizar dados' }).click();
  const overview = (await (await overviewResponse).json()) as DashboardOverviewResponse;

  for (const card of overview.cards) {
    const cardElement = page.locator('.dashboard__card').filter({ hasText: card.label });
    await expect(cardElement).toContainText(card.value);
  }
});

test('aplica filtros de area e periodo para administrador', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  const areaSelect = page.locator('.dashboard__filters select').first();
  const area = await areaSelect.locator('option').nth(1).getAttribute('value');
  expect(area).not.toBeNull();

  const areaResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      new URL(response.url()).searchParams.get('area') === area,
  );
  await areaSelect.selectOption(area!);
  const areaOverview = (await (await areaResponse).json()) as DashboardOverviewResponse;
  expect(areaOverview.selectedArea).toBe(area);
  await expect(page.locator('.dashboard__scope')).toContainText(`Area: ${area}`);

  const timeResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      new URL(response.url()).searchParams.get('area') === area &&
      new URL(response.url()).searchParams.get('timeGrouping') === 'year',
  );
  await page.getByLabel('Consolidar por').selectOption('year');
  const timeOverview = (await (await timeResponse).json()) as DashboardOverviewResponse;
  expect(timeOverview.timeGrouping).toBe('year');
});

test('limita gestor ao escopo de equipe sem filtro de area', async ({ page }) => {
  await login(page, 'gestor@demo.local');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  await expect(page.locator('.dashboard__filters select')).toHaveCount(1);
  await expect(page.locator('.dashboard__scope')).toContainText('Equipe direta');
});
