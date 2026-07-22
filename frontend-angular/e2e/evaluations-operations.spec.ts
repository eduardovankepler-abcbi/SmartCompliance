import { expect, Page, test } from '@playwright/test';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('demo123');
  await page.getByRole('button', { name: 'Acessar', exact: true }).click();
  await expect(page).toHaveURL(/\/app\//);
}

const cycle = {
  id: 'cycle-73', title: 'Ciclo operacional', semesterLabel: '2026.2', dueDate: '2026-12-20',
  targetGroup: 'Todos', status: 'Planejamento', libraryId: 'default', libraryName: 'Padrao',
  modelName: 'Padrao', isEnabled: true, moduleAvailability: { manager: true },
  transversalConfig: { defaultReviewersPerPerson: 1, unitOverrides: {} },
};

const library = {
  scale: [], defaultLibrary: { id: 'default', name: 'Padrao', description: '', questionCount: 7 },
  manualLibrary: { id: 'manual', name: 'Manual', description: '', questionCount: 0 }, cycleLibraries: [], questionGroups: [],
};

const structure = () => ({
  cycle: { id: cycle.id, title: cycle.title, semesterLabel: cycle.semesterLabel, status: cycle.status, dueDate: cycle.dueDate, participantCount: 2, raterCount: 2, transversalConfig: cycle.transversalConfig },
  compliance: { totalAssignments: 2, submittedAssignments: 1, pendingAssignments: 1, delinquentAssignments: 1, adherenceRate: 50, delinquencyRate: 50 },
  participants: [
    { personId: 'p1', personName: 'Ana Unidade Norte', personArea: 'Produto', personRoleTitle: 'Analista', personWorkUnit: 'Norte', personWorkMode: 'Remoto', managerName: 'Gestor', totalRaters: 1, completedRaters: 0, pendingRaters: 1 },
    { personId: 'p2', personName: 'Bruno Unidade Sul', personArea: 'Operacoes', personRoleTitle: 'Analista', personWorkUnit: 'Sul', personWorkMode: 'Presencial', managerName: 'Gestor', totalRaters: 1, completedRaters: 1, pendingRaters: 0 },
  ],
  delinquents: [{ id: 'a1', reviewerUserId: 'u2', reviewerName: 'Bruno Unidade Sul', revieweePersonId: 'p1', revieweeName: 'Ana Unidade Norte', relationshipType: 'cross-functional', dueDate: cycle.dueDate, daysOverdue: 3, reminderCount: 0, lastReminderSentAt: null }],
  relationshipSummary: [{ relationshipType: 'cross-functional', total: 1 }],
  transversal: {
    config: cycle.transversalConfig,
    pairings: [{ pairingId: 'pair-1', reviewerUserId: 'u2', reviewerName: 'Bruno Unidade Sul', reviewerArea: 'Operacoes', revieweePersonId: 'p1', revieweeName: 'Ana Unidade Norte', revieweeArea: 'Produto', workUnit: 'Norte' }],
    eligible: [
      { personId: 'p1', reviewerUserId: 'u1', personName: 'Ana Unidade Norte', personArea: 'Produto', personWorkUnit: 'Norte', personWorkMode: 'Remoto' },
      { personId: 'p2', reviewerUserId: 'u2', personName: 'Bruno Unidade Sul', personArea: 'Operacoes', personWorkUnit: 'Sul', personWorkMode: 'Presencial' },
    ], ineligible: [], indicators: { coverageRate: 50, repeatedPairings: 0 },
  },
});

async function mockOperations(page: Page) {
  await page.route('**/api/evaluations/assignments', route => route.fulfill({ status: 200, json: [] }));
  await page.route('**/api/evaluations/library**', route => route.fulfill({ status: 200, json: library }));
  await page.route('**/api/evaluations/cycles**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === 'GET' && path.endsWith('/cycles')) return route.fulfill({ status: 200, json: [cycle] });
    if (request.method() === 'GET' && path.endsWith('/participants')) return route.fulfill({ status: 200, json: structure() });
    if (request.method() === 'POST' && path.endsWith('/cycles')) {
      Object.assign(cycle, request.postDataJSON(), { id: 'cycle-created', status: 'Planejamento' });
      return route.fulfill({ status: 201, json: cycle });
    }
    if (request.method() === 'PATCH' && path.endsWith('/status')) {
      cycle.status = (request.postDataJSON() as { status: string }).status;
      return route.fulfill({ status: 200, json: cycle });
    }
    if (request.method() === 'PATCH' && path.endsWith('/config')) {
      const body = request.postDataJSON() as typeof cycle;
      Object.assign(cycle, body);
      if (body.transversalConfig) cycle.transversalConfig = body.transversalConfig;
      return route.fulfill({ status: 200, json: cycle });
    }
    if (request.method() === 'POST' && path.endsWith('/notify-delinquents')) return route.fulfill({ status: 200, json: { notified: 1 } });
    if (request.method() === 'POST' && (path.endsWith('/force') || path.endsWith('/block'))) return route.fulfill({ status: 200, json: structure() });
    return route.continue();
  });
}

test('RH cria e libera um ciclo', async ({ page }) => {
  await login(page, 'rh@demo.local');
  await mockOperations(page);
  await page.goto('/app/evaluations');
  await page.getByRole('button', { name: 'Operacao' }).click();
  await page.getByRole('button', { name: 'Novo ciclo' }).click();
  await page.getByLabel('Titulo').fill('Ciclo criado 7.3');
  await page.getByLabel('Semestre').fill('2027.1');
  await page.getByLabel('Prazo').fill('2027-06-30');
  await page.getByLabel('Grupo alvo').fill('Liderancas');
  await page.getByRole('button', { name: 'Criar em planejamento' }).click();
  await expect(page.getByRole('heading', { name: 'Ciclo criado 7.3' })).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Liberar ciclo' }).click();
  await expect(page.locator('.cycle-card')).toContainText('Liberado');
});

test('admin filtra participantes, notifica inadimplentes e configura transversal', async ({ page }) => {
  cycle.id = 'cycle-73'; cycle.title = 'Ciclo operacional'; cycle.status = 'Planejamento';
  await login(page, 'admin@demo.local');
  await mockOperations(page);
  await page.goto('/app/evaluations');
  await page.getByRole('button', { name: 'Operacao' }).click();
  await expect(page).toHaveURL(/\/app\/evaluations\/company\/operations\/cycle-73$/);
  await page.locator('.toolbar select').nth(1).selectOption('Norte');
  await expect(page).toHaveURL(/\/app\/evaluations\/company\/operations\/cycle-73\?unit=Norte$/);
  await expect(page.locator('.participants')).toContainText('Ana Unidade Norte');
  await expect(page.locator('.participants')).not.toContainText('Bruno Unidade Sul');
  await page.getByRole('button', { name: 'Notificar inadimplentes' }).click();
  await expect(page.getByText('1 cobranca(s) registrada(s).')).toBeVisible();
  await page.getByLabel('Avaliadores por pessoa').fill('2');
  await page.getByLabel('Unidade para excecao').fill('Norte');
  await page.getByLabel('Qtd. na unidade').fill('3');
  await page.getByRole('button', { name: 'Salvar regras' }).click();
  await expect(page.getByText(/Norte: 3/)).toBeVisible();
});

test('abre rota profunda de operacao com ciclo e filtros', async ({ page }) => {
  cycle.id = 'cycle-73'; cycle.title = 'Ciclo operacional'; cycle.status = 'Planejamento';
  await login(page, 'admin@demo.local');
  await mockOperations(page);
  await page.goto('/app/evaluations/company/operations/cycle-73?unit=Norte&mode=Remoto');
  await expect(page.getByRole('heading', { name: 'Ciclo operacional' })).toBeVisible();
  await expect(page.locator('.participants')).toContainText('Ana Unidade Norte');
  await expect(page.locator('.participants')).not.toContainText('Bruno Unidade Sul');
});

test('colaborador nao acessa a operacao de ciclos', async ({ page }) => {
  await login(page, 'colaborador1@demo.local');
  await page.goto('/app/evaluations');
  await expect(page.getByRole('button', { name: 'Operacao' })).toHaveCount(0);
});
