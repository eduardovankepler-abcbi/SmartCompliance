import { expect, Page, test } from '@playwright/test';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('demo123');
  await page.getByRole('button', { name: 'Acessar', exact: true }).click();
  await expect(page).toHaveURL(/\/app\//);
}

const cycles = [
  { id:'c-new', title:'Ciclo atual', semesterLabel:'2026.2', dueDate:'2026-12-20', targetGroup:'Todos', status:'Liberado', libraryId:'default', libraryName:'Padrao', modelName:'Padrao', isEnabled:true },
  { id:'c-old', title:'Ciclo anterior', semesterLabel:'2026.1', dueDate:'2026-06-20', targetGroup:'Todos', status:'Processado', libraryId:'default', libraryName:'Padrao', modelName:'Padrao', isEnabled:true },
];
const people = [
  { id:'p1', name:'Colaborador Demo', roleTitle:'Analista', area:'Produto', workUnit:'Norte', workMode:'remote', managerPersonId:'p2', managerName:'Gestor Demo', areaManagerPersonId:null, areaManagerName:null, employmentType:'internal' },
  { id:'p2', name:'Gestor Demo', roleTitle:'Gestor', area:'Produto', workUnit:'Norte', workMode:'hybrid', managerPersonId:null, managerName:null, areaManagerPersonId:null, areaManagerName:null, employmentType:'internal' },
  { id:'p3', name:'Parceira de projeto', roleTitle:'Especialista', area:'Tecnologia', workUnit:'Sul', workMode:'remote', managerPersonId:null, managerName:null, areaManagerPersonId:null, areaManagerName:null, employmentType:'internal' },
];
const pendingRequest = { id:'fr-1', cycleId:'c-new', cycleTitle:'Ciclo atual', semesterLabel:'2026.2', cycleStatus:'Liberado', requesterUserId:'u1', requesterName:'Colaborador Demo', revieweePersonId:'p1', revieweeName:'Colaborador Demo', status:'pending', contextNote:'Colaboracao realizada na entrega compartilhada do projeto.', requestedAt:'2026-07-20T10:00:00Z', decidedAt:null, decidedByName:'', providers:[{ id:'fri-1', providerPersonId:'p3', providerName:'Parceira de projeto', assignmentId:null }] };
const received = { id:'submission-1', cycleId:'c-new', cycleTitle:'Ciclo atual', semesterLabel:'2026.2', relationshipType:'manager', reviewerName:'Gestor Demo', revieweePersonId:'p1', overallScore:4.4, strengthsNote:'Excelente articulacao.', developmentNote:'Antecipar riscos do projeto.', submittedAt:'2026-07-18T10:00:00Z', revieweeAcknowledgementStatus:null, revieweeAcknowledgementNote:'', revieweeAcknowledgedAt:null };
const reviews = [
  { personId:'p1', personName:'Colaborador Demo', personArea:'Produto', cycleId:'c-new', cycleTitle:'Ciclo atual', semesterLabel:'2026.2', score10:8.5, confidenceLabel:'Leitura consolidada', isPartial:false, guidance:'Manter os pontos fortes.', developmentPlanSuggestion:'Criar um marco de acompanhamento.', visibility:'Visivel para colaborador, gestor e admin.' },
  { personId:'p1', personName:'Colaborador Demo', personArea:'Produto', cycleId:'c-old', cycleTitle:'Ciclo anterior', semesterLabel:'2026.1', score10:7, confidenceLabel:'Leitura em consolidacao', isPartial:true, guidance:'Consolidar os aprendizados.', developmentPlanSuggestion:'Revisar o plano anterior.', visibility:'Visivel para colaborador, gestor e admin.' },
];

async function mockBase(page: Page) {
  await page.route('**/api/evaluations/cycles', r=>r.fulfill({status:200,json:cycles}));
  await page.route('**/api/evaluations/assignments', r=>r.fulfill({status:200,json:[]}));
  await page.route('**/api/people', r=>r.fulfill({status:200,json:people}));
}

test('colaborador solicita feedback e confirma leitura do gestor', async ({ page }) => {
  await login(page,'colaborador1@demo.local');await mockBase(page);
  let requests: any[]=[];let currentReceived={...received};
  await page.route('**/api/evaluations/feedback-requests**',async route=>{const req=route.request();if(req.method()==='GET')return route.fulfill({status:200,json:requests});const body=req.postDataJSON() as any;const created={...pendingRequest,...body};requests=[created];return route.fulfill({status:201,json:created});});
  await page.route('**/api/evaluations/received-feedback',r=>r.fulfill({status:200,json:[currentReceived]}));
  await page.route('**/api/evaluations/responses/*/acknowledgement',async route=>{const body=route.request().postDataJSON() as any;currentReceived={...currentReceived,revieweeAcknowledgementStatus:body.status,revieweeAcknowledgementNote:body.note,revieweeAcknowledgedAt:new Date().toISOString()};return route.fulfill({status:200,json:currentReceived});});
  await page.route('**/api/evaluations/performance-360',r=>r.fulfill({status:200,json:reviews}));
  await page.goto('/app/evaluations');await page.getByRole('button',{name:'Feedback e 360'}).click();
  await page.getByRole('checkbox',{name:/Parceira de projeto/}).check();
  await page.getByLabel('Contexto da colaboracao').fill('Colaboracao realizada na entrega compartilhada do projeto e seus resultados.');
  await page.getByRole('button',{name:'Registrar solicitacao'}).click();await expect(page.getByText('Solicitacao de feedback registrada.')).toBeVisible();
  await expect(page.getByRole('button',{name:'Aprovar'})).toHaveCount(0);
  await page.getByRole('button',{name:'Concordo e confirmo a leitura'}).click();await expect(page.getByText('Leitura confirmada')).toBeVisible();
});

test('admin aprova solicitacao e compara historico 360', async ({ page }) => {
  await login(page,'admin@demo.local');await mockBase(page);let request={...pendingRequest};
  await page.route('**/api/evaluations/feedback-requests**',async route=>{const req=route.request();if(req.method()==='PATCH'){request={...request,status:'approved'};return route.fulfill({status:200,json:request});}return route.fulfill({status:200,json:[request]});});
  await page.route('**/api/evaluations/performance-360',r=>r.fulfill({status:200,json:reviews}));
  await page.goto('/app/evaluations');await page.getByRole('button',{name:'Feedback e 360'}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Aprovar'}).click();await expect(page.getByText('Aprovada')).toBeVisible();
  await page.getByRole('button',{name:'360 e insights'}).click();await expect(page.getByText('+1.5')).toBeVisible();await expect(page.getByRole('heading',{name:'Historico por ciclo'})).toBeVisible();await expect(page.getByText('Criar um marco de acompanhamento.')).toBeVisible();
});

test('gestor visualiza estado vazio sem confirmacao de feedback pessoal', async ({ page }) => {
  await login(page,'gestor@demo.local');await mockBase(page);
  await page.route('**/api/evaluations/feedback-requests**',r=>r.fulfill({status:200,json:[]}));await page.route('**/api/evaluations/performance-360',r=>r.fulfill({status:200,json:[]}));
  await page.goto('/app/evaluations');await page.getByRole('button',{name:'Feedback e 360'}).click();await expect(page.getByText('Nenhuma solicitacao registrada.')).toBeVisible();await expect(page.getByRole('heading',{name:'Feedback recebido'})).toHaveCount(0);await page.getByRole('button',{name:'360 e insights'}).click();await expect(page.getByText('Nenhuma leitura 360 disponivel para este perfil.')).toBeVisible();
});
