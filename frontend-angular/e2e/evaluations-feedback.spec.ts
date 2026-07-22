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
const assignments = [
  { id:'a-company-1', cycleId:'c-new', cycleTitle:'Ciclo atual', semesterLabel:'2026.2', cycleStatus:'Liberado', revieweePersonId:'p1', revieweeName:'Colaborador Demo', revieweeArea:'Produto', reviewerUserId:'u2', reviewerName:'Gestor Demo', relationshipType:'company', dueDate:'2026-12-20', status:'submitted', submittedAt:'2026-07-18T10:00:00Z', overallScore:4.2 },
  { id:'a-company-2', cycleId:'c-new', cycleTitle:'Ciclo atual', semesterLabel:'2026.2', cycleStatus:'Liberado', revieweePersonId:'p2', revieweeName:'Gestor Demo', revieweeArea:'Produto', reviewerUserId:'u1', reviewerName:'Colaborador Demo', relationshipType:'company', dueDate:'2026-12-20', status:'pending', submittedAt:null, overallScore:null },
  { id:'a-company-old', cycleId:'c-old', cycleTitle:'Ciclo anterior', semesterLabel:'2026.1', cycleStatus:'Processado', revieweePersonId:'p1', revieweeName:'Colaborador Demo', revieweeArea:'Produto', reviewerUserId:'u2', reviewerName:'Gestor Demo', relationshipType:'company', dueDate:'2026-06-20', status:'submitted', submittedAt:'2026-06-18T10:00:00Z', overallScore:3.7 },
  { id:'a-manager-1', cycleId:'c-new', cycleTitle:'Ciclo atual', semesterLabel:'2026.2', cycleStatus:'Liberado', revieweePersonId:'p1', revieweeName:'Colaborador Demo', revieweeArea:'Produto', reviewerUserId:'u2', reviewerName:'Gestor Demo', relationshipType:'manager', dueDate:'2026-12-20', status:'submitted', submittedAt:'2026-07-18T10:00:00Z', overallScore:4.4 },
];
const responsesBundle = {
  individualResponses: [
    { id:'resp-manager-1', assignmentId:'a-manager', cycleId:'c-new', relationshipType:'manager', reviewerName:'Gestor Demo', revieweeName:'Colaborador Demo', revieweeArea:'Produto', overallScore:4.4, weightedScore:4.4, strengthsNote:'Excelente articulacao.', developmentNote:'Antecipar riscos do projeto.', submittedAt:'2026-07-18T10:00:00Z', answers:[{ id:'ans-1', questionId:'q1', questionPrompt:'Como foi a entrega?', dimensionTitle:'Entrega', score:4.4, selectedOptions:[] }] },
    { id:'resp-manager-2', assignmentId:'a-manager-old', cycleId:'c-old', relationshipType:'manager', reviewerName:'Gestor Demo', revieweeName:'Colaborador Demo', revieweeArea:'Produto', overallScore:3.8, weightedScore:3.8, strengthsNote:'Historico do ciclo anterior.', developmentNote:'Ampliar alinhamento.', submittedAt:'2026-06-18T10:00:00Z', answers:[{ id:'ans-2', questionId:'q2', questionPrompt:'Como foi a colaboracao?', dimensionTitle:'Colaboracao', score:null, textValue:'Texto sensivel', masked:true, selectedOptions:[] }] },
  ],
  aggregateResponses: [],
  cycleAggregateResponses: [
    { cycleId:'c-new', relationshipType:'company', totalResponses:4, averageScore:4.2, questionAverages:[{ questionId:'q-company', questionPrompt:'Como esta a empresa?', dimensionTitle:'Satisfacao', totalResponses:4, averageScore:4.2 }] },
    { cycleId:'c-old', relationshipType:'company', totalResponses:1, averageScore:null, questionAverages:[{ questionId:'q-company-old', questionPrompt:'Como estava a empresa?', dimensionTitle:'Clima anterior', totalResponses:1, averageScore:null }] },
  ],
  reportSnapshots: [
    { id:'snapshot-old-company', cycleId:'c-old', relationshipType:'company', totalResponses:6, averageScore:4.1, generatedAt:'2026-06-21T12:00:00Z', questionAverages:[{ questionId:'q-snapshot', questionPrompt:'Como ficou o ciclo?', dimensionTitle:'Snapshot clima', totalResponses:6, averageScore:4.1 }] },
  ],
};

async function mockBase(page: Page) {
  await page.route('**/api/evaluations/cycles', r=>r.fulfill({status:200,json:cycles}));
  await page.route('**/api/evaluations/assignments', r=>r.fulfill({status:200,json:[]}));
  await page.route('**/api/evaluations/responses', r=>r.fulfill({status:200,json:{individualResponses:[],aggregateResponses:[],cycleAggregateResponses:[],reportSnapshots:[]}}));
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
  await page.getByRole('button',{name:'360 e insights'}).click();await expect(page).toHaveURL(/\/app\/evaluations\/company\/insights\/360$/);await expect(page.getByText('+1.5')).toBeVisible();await expect(page.getByRole('heading',{name:'Historico por ciclo'})).toBeVisible();await expect(page.getByText('Criar um marco de acompanhamento.')).toBeVisible();
});

test('abre rota profunda de 360 diretamente', async ({ page }) => {
  await login(page,'admin@demo.local');await mockBase(page);
  await page.route('**/api/evaluations/feedback-requests**',r=>r.fulfill({status:200,json:[pendingRequest]}));
  await page.route('**/api/evaluations/performance-360',r=>r.fulfill({status:200,json:reviews}));
  await page.goto('/app/evaluations/self/insights/360');
  await expect(page).toHaveURL(/\/app\/evaluations\/self\/insights\/360$/);
  await expect(page.getByRole('heading',{name:'Historico por ciclo'})).toBeVisible();
  await expect(page.getByText('Criar um marco de acompanhamento.')).toBeVisible();
});

test('evita chamadas duplicadas da pagina mae em insights direto', async ({ page }) => {
  await login(page,'admin@demo.local');
  let cyclesCalls = 0;
  let assignmentsCalls = 0;
  await page.route('**/api/evaluations/cycles', r=>{cyclesCalls+=1;return r.fulfill({status:200,json:cycles});});
  await page.route('**/api/evaluations/assignments', r=>{assignmentsCalls+=1;return r.fulfill({status:200,json:assignments});});
  await page.route('**/api/evaluations/responses', r=>r.fulfill({status:200,json:responsesBundle}));
  await page.route('**/api/people', r=>r.fulfill({status:200,json:people}));
  await page.route('**/api/evaluations/feedback-requests**',r=>r.fulfill({status:200,json:[]}));
  await page.route('**/api/evaluations/performance-360',r=>r.fulfill({status:200,json:reviews}));
  await page.goto('/app/evaluations/manager/insights/360');
  await expect(page.getByRole('heading',{name:'Dashboard executivo'})).toBeVisible();
  expect(cyclesCalls).toBe(1);
  expect(assignmentsCalls).toBe(1);
});

test('exibe respostas individuais e agregadas em insights', async ({ page }) => {
  await login(page,'admin@demo.local');await mockBase(page);
  await page.route('**/api/evaluations/feedback-requests**',r=>r.fulfill({status:200,json:[]}));
  await page.route('**/api/evaluations/assignments',r=>r.fulfill({status:200,json:assignments}));
  await page.route('**/api/evaluations/performance-360',r=>r.fulfill({status:200,json:reviews}));
  await page.route('**/api/evaluations/responses',r=>r.fulfill({status:200,json:responsesBundle}));
  await page.goto('/app/evaluations/manager/insights/360');
  await expect(page.getByRole('heading',{name:'Respostas individuais'})).toBeVisible();
  await expect(page.getByText('Excelente articulacao.')).toBeVisible();
  await page.getByLabel('Ciclo das respostas').selectOption('c-old');
  await expect(page.getByText('Historico do ciclo anterior.')).toBeVisible();
  await expect(page.getByText('Excelente articulacao.')).toHaveCount(0);
  await expect(page.getByText('Uma ou mais respostas foram anonimizadas para proteger o respondente.')).toBeVisible();
  await expect(page.getByText('Colaboracao: Resposta protegida')).toBeVisible();
  await page.getByRole('button',{name:/Empresa/}).click();
  await expect(page).toHaveURL(/\/app\/evaluations\/company\/insights$/);
  await page.getByRole('button',{name:'360 e insights'}).click();
  await expect(page.getByRole('heading',{name:'Dashboard executivo'})).toBeVisible();
  await expect(page.getByText('Assignments').first()).toBeVisible();
  await expect(page.getByText('-50%')).toBeVisible();
  await expect(page.getByText('Ativo: 50 · Comparado: 100')).toBeVisible();
  await expect(page.getByText('Ciclo ativo exige atencao executiva: conclusao abaixo do ciclo comparado.')).toBeVisible();
  await expect(page.getByText('Abaixo do ciclo comparado',{exact:true})).toBeVisible();
  await expect(page.getByText('Acima do ciclo comparado').first()).toBeVisible();
  await page.getByLabel('Comparar com').first().selectOption('');
  await expect(page.getByText('Nenhum outro ciclo disponivel para comparacao.')).toBeVisible();
  await page.getByLabel('Comparar com').first().selectOption('c-old');
  await expect(page.getByRole('heading',{name:'Historico executivo por ciclo'})).toBeVisible();
  await page.getByRole('button',{name:'Comparar com ativo'}).click();
  await expect(page.getByText('Ativo: 50 · Comparado: 100')).toBeVisible();
  await page.getByRole('button',{name:'Abrir ciclo'}).click();
  await expect(page.getByLabel('Ciclo em foco').first()).toHaveValue('c-old');
  await page.getByRole('button',{name:'Comparar com ativo'}).click();
  await expect(page.getByText('Ativo: 100 · Comparado: 50')).toBeVisible();
  await expect(page.getByText('Media observada abaixo do comparado; recomenda-se analisar dimensoes e respostas protegidas.')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Agregados por ciclo'})).toBeVisible();
  await expect(page.getByText('1 respostas consolidadas')).toBeVisible();
  await expect(page.getByText('Media protegida por volume minimo de respostas.')).toBeVisible();
  await expect(page.getByText('Clima anterior: -')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Snapshots processados'})).toBeVisible();
  await expect(page.getByText('6 respostas no snapshot')).toBeVisible();
  await expect(page.getByText('Snapshot clima: 4.1')).toBeVisible();
  await page.getByLabel('Ciclo das respostas').selectOption('c-new');
  await expect(page.getByText('4 respostas consolidadas')).toBeVisible();
  await expect(page.getByText('Satisfacao: 4.2')).toBeVisible();
  await expect(page.getByText('6 respostas no snapshot')).toHaveCount(0);
});

test('gestor visualiza estado vazio sem confirmacao de feedback pessoal', async ({ page }) => {
  await login(page,'gestor@demo.local');await mockBase(page);
  await page.route('**/api/evaluations/feedback-requests**',r=>r.fulfill({status:200,json:[]}));await page.route('**/api/evaluations/performance-360',r=>r.fulfill({status:200,json:[]}));
  await page.goto('/app/evaluations');await page.getByRole('button',{name:'Feedback e 360'}).click();await expect(page.getByText('Nenhuma solicitacao registrada.')).toBeVisible();await expect(page.getByRole('heading',{name:'Feedback recebido'})).toHaveCount(0);await page.getByRole('button',{name:'360 e insights'}).click();await expect(page.getByText('Nenhuma leitura 360 disponivel para este perfil.')).toBeVisible();
});
