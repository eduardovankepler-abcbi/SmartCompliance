import { expect, Page, test } from '@playwright/test';

interface DashboardOverviewResponse {
  cards: Array<{ label: string; value: string }>;
  riskSummary?: { openIncidents: number };
  operationalAlerts?: Array<{ key: string; label: string; value: number; detail: string }>;
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

test('abre o dashboard de PDI pela navegacao executiva', async ({ page }) => {
  await login(page, 'gestor@demo.local');

  await page.getByRole('navigation', { name: 'Navegacao do dashboard' }).getByRole('link', { name: 'PDI', exact: true }).click();

  await expect(page).toHaveURL(/\/app\/dashboard\/pdi$/);
  await expect(page.getByRole('heading', { name: 'Evolução da equipe' })).toBeVisible();
  await expect(page.getByText('Governança aplicada')).toBeVisible();
  await expect(page.getByRole('link', { name: 'PDI', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.pdi-dashboard__filters label').filter({ hasText: /^Equipe/ }).locator('select')).toHaveCount(0);
});

test('permite ao administrador aplicar um filtro governado de equipe no PDI', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await page.goto('/app/dashboard/pdi');
  await expect(page.getByRole('heading', { name: 'Evolução da equipe' })).toBeVisible();

  const teamFilter = page.locator('.pdi-dashboard__filters label').filter({ hasText: /^Equipe/ }).locator('select');
  await expect(teamFilter).toBeVisible();
  const options = await teamFilter.locator('option').count();
  expect(options).toBeGreaterThan(1);
  await teamFilter.selectOption({ index: 1 });

  await expect(page.locator('.pdi-dashboard__stamp strong')).toContainText('Equipe de');
  await expect(page.getByText('Como calculamos')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cobertura do desenvolvimento' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Gaps e risco de desenvolvimento' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ações vinculadas às prioridades' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ações por responsável' })).toBeVisible();
  await expect(page.getByText(/Histórico exato a partir de 19\/08\/2026/)).toBeVisible();
});

test('transforma prioridade do PDI em rascunho de acao atribuivel', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await page.goto('/app/development?source=pdi-priority&competencyId=cmp_communication&focusTitle=Desenvolver%20Comunicacao&actionText=Criar%20plano%20de%20acao&expectedEvidence=Evidencia%20de%20evolucao');

  await expect(page.getByRole('heading', { name: 'Novo PDI' })).toBeVisible();
  await expect(page.locator('select[formcontrolname="competencyId"]')).toHaveValue('cmp_communication');
  await expect(page.getByLabel('Foco do PDI')).toHaveValue('Desenvolver Comunicacao');
  await expect(page.getByLabel('Acao planejada')).toHaveValue('Criar plano de acao');
  await expect(page.getByLabel('Evidencia esperada')).toHaveValue('Evidencia de evolucao');
  await expect(page.getByLabel('Prazo')).not.toHaveValue('');
});

test('atualiza o andamento de uma acao priorizada no dashboard', async ({ page }) => {
  await login(page, 'admin@demo.local');
  let updated = false;
  let progressPayload: { progressStatus?: string; progressNote?: string } = {};
  await page.route('**/api/dashboards/overview**', async (route) => {
    const response = await route.fetch();
    const overview = await response.json();
    overview.pdiAnalytics.competencyPriorities = [{ competencyId:'cmp_communication', competencyName:'Comunicacao', latestScore:2.5, gap:2.5, priorityScore:50, riskLevel:'medium', recommendation:'Acompanhar evolucao.' }];
    overview.pdiAnalytics.priorityActions = [{ planId:'plan_priority_1', personId:'p1', personName:'Colaborador Demo 01', competencyId:'cmp_communication', competencyName:'Comunicacao', focusTitle:'Desenvolver Comunicacao', actionText:'Acompanhar evolucao.', dueDate:'2026-12-20', progressStatus:updated ? 'in_progress' : 'not_started', overdue:false, deadlineStatus:'on_track' }, { planId:'plan_priority_2', personId:'p2', personName:'Colaborador Demo 02', competencyId:'cmp_communication', competencyName:'Comunicacao', focusTitle:'Remover bloqueio de Comunicacao', actionText:'Tratar impedimento.', dueDate:'2026-01-20', progressStatus:'blocked', overdue:true, deadlineStatus:'overdue' }];
    overview.pdiAnalytics.priorityActionSummary = { notStarted:updated ? 0 : 1, inProgress:updated ? 1 : 0, blocked:1, done:0, overdue:1, dueSoon:0, onTrack:1 };
    overview.pdiAnalytics.responsibleActionSummary = [{ personId:'p2', personName:'Colaborador Demo 02', total:1, overdue:1, dueSoon:0, blocked:1, inProgress:0, attentionScore:5 }, { personId:'p1', personName:'Colaborador Demo 01', total:1, overdue:0, dueSoon:0, blocked:0, inProgress:updated ? 1 : 0, attentionScore:0 }];
    await route.fulfill({ response, json:overview });
  });
  await page.route('**/api/development/plans/plan_priority_1/progress', async (route) => {
    progressPayload = route.request().postDataJSON();
    updated = true;
    await route.fulfill({ status:200, json:{ id:'plan_priority_1', progressStatus:'in_progress' } });
  });

  await page.goto('/app/dashboard/pdi');
  await page.getByRole('button', { name:/Colaborador Demo 02/ }).click();
  await expect(page.getByText('Responsável: Colaborador Demo 02')).toBeVisible();
  await expect(page.getByText('Remover bloqueio de Comunicacao')).toBeVisible();
  await expect(page.getByText('Desenvolver Comunicacao')).toHaveCount(0);
  await page.getByRole('button', { name:'Limpar responsável' }).click();
  await expect(page.getByText('Responsável: Colaborador Demo 02')).toHaveCount(0);
  await expect(page.getByText('2 ação(ões) encontrada(s)')).toBeVisible();
  await page.getByLabel('Filtrar ações por status').selectOption('blocked');
  await expect(page.getByText('Remover bloqueio de Comunicacao')).toBeVisible();
  await expect(page.getByText('Desenvolver Comunicacao')).toHaveCount(0);
  await page.getByLabel('Filtrar ações por prazo').selectOption('overdue');
  await expect(page.getByText('1 ação(ões) encontrada(s)')).toBeVisible();
  await page.getByLabel('Filtrar ações por status').selectOption('all');
  await page.getByLabel('Filtrar ações por prazo').selectOption('all');
  await page.getByText('Desenvolver Comunicacao').locator('..').getByRole('button', { name:'Atualizar andamento' }).click();
  await page.getByLabel('Status da ação').selectOption('blocked');
  await page.getByRole('button', { name:'Salvar andamento' }).click();
  await expect(page.getByRole('alert')).toHaveText('Informe a justificativa do bloqueio.');
  expect(progressPayload).toEqual({});

  await page.getByLabel('Status da ação').selectOption('done');
  await page.getByLabel('Nota gerencial').fill('Evidência de conclusão validada.');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name:'Salvar andamento' }).click();
  expect(progressPayload).toEqual({});
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name:'Salvar andamento' }).click();

  await expect(page.getByText(/Em andamento · prazo/)).toBeVisible();
  expect(progressPayload).toEqual({ progressStatus:'done', progressNote:'Evidência de conclusão validada.' });
});

test('exige troca de senha no primeiro acesso antes de abrir o workspace', async ({ page }) => {
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 200,
      json: {
        token: 'temporary-token',
        user: {
          id: 'user_temp',
          email: 'temporario@empresa.local',
          roleKey: 'employee',
          status: 'active',
          mustChangePassword: true,
          passwordChangedAt: null,
          person: {
            id: 'person_temp',
            name: 'Usuario Temporario',
            area: 'Gente',
          },
        },
      },
    }),
  );
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      json: {
        id: 'user_temp',
        email: 'temporario@empresa.local',
        roleKey: 'employee',
        status: 'active',
        mustChangePassword: true,
        passwordChangedAt: null,
        person: {
          id: 'person_temp',
          name: 'Usuario Temporario',
          area: 'Gente',
        },
      },
    }),
  );
  await page.route('**/api/auth/change-password', (route) =>
    route.fulfill({
      status: 200,
      json: {
        id: 'user_temp',
        email: 'temporario@empresa.local',
        roleKey: 'employee',
        status: 'active',
        mustChangePassword: false,
        passwordChangedAt: new Date().toISOString(),
        person: {
          id: 'person_temp',
          name: 'Usuario Temporario',
          area: 'Gente',
        },
      },
    }),
  );

  await page.goto('/login');
  await page.getByLabel('E-mail').fill('temporario@empresa.local');
  await page.getByLabel('Senha').fill('demo123');
  await page.getByRole('button', { name: 'Acessar', exact: true }).click();

  await expect(page).toHaveURL(/\/change-password$/);
  await page.goto('/app/dashboard');
  await expect(page).toHaveURL(/\/change-password$/);

  await page.getByLabel('Senha atual').fill('demo123');
  await page.getByLabel('Nova senha', { exact: true }).fill('novaSenha123');
  await page.getByLabel('Confirmar nova senha').fill('novaSenha123');
  await page.getByRole('button', { name: 'Atualizar senha' }).click();

  await expect(page).toHaveURL(/\/app\/compliance$/);
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

test('orienta administrador quando nao ha pessoa disponivel para novo usuario', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await page.route('**/api/users', (route) => route.fulfill({ status: 200, json: [] }));
  await page.route('**/api/people', (route) => route.fulfill({ status: 200, json: [] }));
  await page.route('**/api/audit-trail?*', (route) => route.fulfill({ status: 200, json: [] }));

  await page.goto('/app/users');

  const emptyState = page.getByRole('status').filter({ hasText: 'Nenhuma pessoa disponivel para novo acesso.' });
  await expect(page.getByRole('button', { name: 'Novo usuario' })).toBeDisabled();
  await expect(emptyState).toBeVisible();
  await expect(emptyState).toContainText('Cadastre uma pessoa antes de provisionar acesso.');
  await expect(emptyState.getByRole('link', { name: 'Abrir Pessoas' })).toBeVisible();
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
  await expect(page.getByText('Riscos operacionais')).toBeVisible();
  if (overview.riskSummary) {
    await expect(page.locator('.dashboard__executive-grid')).toContainText(String(overview.riskSummary.openIncidents));
  }
  for (const alert of overview.operationalAlerts ?? []) {
    const alertElement = page.locator('.dashboard__alert').filter({ hasText: alert.label });
    await expect(alertElement).toContainText(String(alert.value));
    await expect(alertElement).toContainText(alert.detail);
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

test('permite administrador consultar auditoria gerencial', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await expect(page.getByRole('link', { name: 'Abrir Auditoria' })).toBeVisible();

  const auditResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' && response.url().includes('/api/audit-trail'),
  );
  await page.getByRole('link', { name: 'Abrir Auditoria' }).click();
  await auditResponse;

  await expect(page).toHaveURL(/\/app\/audit$/);
  await expect(page.getByRole('heading', { name: 'Auditoria' })).toBeVisible();
  await expect(page.getByLabel('Filtros de auditoria')).toBeVisible();
  await expect(page.getByLabel('Eventos de auditoria')).toBeVisible();
});
