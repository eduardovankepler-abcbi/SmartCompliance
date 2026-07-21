import { expect, Page, test } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('colaborador1@demo.local');
  await page.getByLabel('Senha').fill('demo123');
  await page.getByRole('button', { name: 'Acessar', exact: true }).click();
  await expect(page).toHaveURL(/\/app\//);
}

const cycle = {
  id: 'cycle-e2e', title: 'Ciclo E2E', semesterLabel: '2026.2', dueDate: '2026-12-20',
  targetGroup: 'Todos', status: 'Liberado', libraryId: 'library-e2e', libraryName: 'Biblioteca E2E',
  modelName: 'Biblioteca E2E', isEnabled: true,
};

const assignment = {
  id: 'assignment-e2e', cycleId: cycle.id, cycleTitle: cycle.title, semesterLabel: cycle.semesterLabel,
  cycleStatus: 'Liberado', revieweePersonId: 'person-e2e', revieweeName: 'Pessoa Avaliada E2E',
  revieweeArea: 'Produto', reviewerUserId: 'user-e2e', relationshipType: 'self',
  dueDate: cycle.dueDate, status: 'pending',
};

test('abre questionario e envia respostas tipadas', async ({ page }) => {
  await login(page);
  await page.route('**/api/evaluations/cycles', (route) => route.fulfill({ status: 200, json: [cycle] }));
  await page.route('**/api/evaluations/assignments', (route) => route.fulfill({ status: 200, json: [assignment] }));
  await page.route('**/api/evaluations/assignments/assignment-e2e', (route) => route.fulfill({ status: 200, json: {
    assignment,
    template: {
      id: 'template-e2e', key: 'self', title: 'Questionario E2E', description: 'Fluxo base da avaliacao.',
      scale: [1, 2, 3, 4, 5].map((value) => ({ value, label: String(value) })),
      policy: { showStrengthsNote: true, showDevelopmentNote: true },
      questions: [
        { id: 'q-scale', dimensionTitle: 'Entrega', prompt: 'Como foi a entrega?', inputType: 'scale', isRequired: true },
        { id: 'q-text', dimensionTitle: 'Reflexao', prompt: 'Descreva um aprendizado.', inputType: 'text', isRequired: true },
        { id: 'q-multi', dimensionTitle: 'Competencias', prompt: 'Selecione competencias.', inputType: 'multi-select', isRequired: true, options: [{ value: 'collaboration', label: 'Colaboracao' }, { value: 'quality', label: 'Qualidade' }] },
      ],
    },
  } }));

  let submittedPayload: unknown;
  await page.route('**/api/evaluations/submit', async (route) => {
    submittedPayload = route.request().postDataJSON();
    await route.fulfill({ status: 201, json: { id: 'submission-e2e' } });
  });

  await page.goto('/app/evaluations');
  await expect(page.getByRole('heading', { name: 'Ciclos e respostas' })).toBeVisible();
  await page.getByRole('button', { name: 'Responder avaliacao' }).click();
  await expect(page.getByRole('heading', { name: 'Questionario E2E' })).toBeVisible();

  const textQuestion = page.locator('.question').filter({ hasText: 'Descreva um aprendizado.' });
  await textQuestion.getByLabel('Resposta').fill('Aprendizado registrado no teste E2E.');
  const multiQuestion = page.locator('.question').filter({ hasText: 'Selecione competencias.' });
  await multiQuestion.getByLabel('Colaboracao').check();
  await page.getByLabel('Pontos fortes').fill('Boa capacidade de entrega.');
  await page.getByLabel('Pontos de desenvolvimento').fill('Aprofundar comunicacao.');
  await page.getByRole('button', { name: 'Enviar avaliacao' }).click();

  await expect.poll(() => submittedPayload).not.toBeUndefined();
  expect(submittedPayload).toMatchObject({
    assignmentId: assignment.id,
    strengthsNote: 'Boa capacidade de entrega.',
    developmentNote: 'Aprofundar comunicacao.',
    answers: [
      { questionId: 'q-scale', score: 3 },
      { questionId: 'q-text', textValue: 'Aprendizado registrado no teste E2E.' },
      { questionId: 'q-multi', selectedOptions: ['collaboration'] },
    ],
  });
});

test('exibe estado vazio sem atribuicoes', async ({ page }) => {
  await login(page);
  await page.route('**/api/evaluations/cycles', (route) => route.fulfill({ status: 200, json: [] }));
  await page.route('**/api/evaluations/assignments', (route) => route.fulfill({ status: 200, json: [] }));
  await page.goto('/app/evaluations');
  await expect(page.getByText('Nenhuma avaliacao atribuida ao seu usuario.')).toBeVisible();
});

test('exibe erro quando Avaliacoes falha', async ({ page }) => {
  await login(page);
  await page.route('**/api/evaluations/cycles', (route) => route.fulfill({ status: 500, json: { error: 'Falha E2E em Avaliacoes.' } }));
  await page.goto('/app/evaluations');
  await expect(page.getByRole('alert')).toContainText('Falha E2E em Avaliacoes.');
});
