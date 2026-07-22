import { expect, Page, test } from '@playwright/test';

async function login(page:Page,email:string){await page.goto('/login');await page.getByLabel('E-mail').fill(email);await page.getByLabel('Senha').fill('demo123');await page.getByRole('button',{name:'Acessar',exact:true}).click();await expect(page).toHaveURL(/\/app\//);}

const baseLibrary=()=>({scale:[],defaultLibrary:{id:'default',name:'Padrao',description:'',questionCount:0},manualLibrary:{id:'manual',name:'Manual',description:'',questionCount:0},cycleLibraries:[],questionGroups:[],customLibraries:[] as any[]});

async function mockBase(page:Page,library:{customLibraries:any[]}){await page.route('**/api/evaluations/cycles',r=>r.fulfill({status:200,json:[]}));await page.route('**/api/evaluations/assignments',r=>r.fulfill({status:200,json:[]}));await page.route('**/api/evaluations/library',r=>r.fulfill({status:200,json:library}));}

test('RH importa rascunho invalido e visualiza erros de validacao',async({page})=>{
  await login(page,'rh@demo.local');const library=baseLibrary();await mockBase(page,library);
  await page.route('**/api/evaluations/custom-libraries/import',r=>r.fulfill({status:201,json:{id:'draft-invalid',fileName:'invalida.csv',createdAt:'2026-07-21T10:00:00Z',errors:['Linha 2: prompt_text obrigatorio.'],summary:{templates:0,questions:0},templates:[]}}));
  await page.goto('/app/evaluations');await page.getByRole('button',{name:'Biblioteca'}).click();await page.locator('input[type=file]').setInputFiles({name:'invalida.csv',mimeType:'text/csv',buffer:Buffer.from('relationship_type')});await page.getByRole('button',{name:'Importar e validar'}).click();await expect(page.getByText('1 erro(s) de validacao')).toBeVisible();await expect(page.getByText('Linha 2: prompt_text obrigatorio.')).toBeVisible();await expect(page.getByRole('button',{name:'Publicar biblioteca'})).toHaveCount(0);
});

test('admin baixa template, publica e atualiza biblioteca customizada',async({page})=>{
  await login(page,'admin@demo.local');const library=baseLibrary();let templateCalls=0;await mockBase(page,library);
  await page.route('**/api/evaluations/custom-libraries/template',r=>{templateCalls++;return r.fulfill({status:200,headers:{'content-type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},body:'template'});});
  await page.route('**/api/evaluations/custom-libraries/import',r=>r.fulfill({status:201,json:{id:'draft-valid',fileName:'nova.xlsx',createdAt:'2026-07-21T10:00:00Z',errors:[],summary:{templates:1,questions:1},templates:[{id:'t1',relationshipType:'manager',modelName:'Gestor',description:'',questions:[{id:'q1',dimensionTitle:'Pergunta',prompt:'Como foi?',inputType:'scale'}]}]}}));
  await page.route('**/api/evaluations/custom-libraries/publish',async r=>{const body=r.request().postDataJSON() as any;const published={id:'lib-1',name:body.name,description:body.description,sourceFileName:'nova.xlsx',templateCount:1,questionCount:1,templates:[{id:'t1',relationshipType:'manager',modelName:'Gestor',description:'',questions:[]}]};library.customLibraries=[published];return r.fulfill({status:201,json:published});});
  await page.route('**/api/evaluations/custom-libraries/lib-1',async r=>{const body=r.request().postDataJSON() as any;library.customLibraries[0]={...library.customLibraries[0],...body};return r.fulfill({status:200,json:library.customLibraries[0]});});
  await page.goto('/app/evaluations');await page.getByRole('button',{name:'Biblioteca'}).click();await expect(page).toHaveURL(/\/app\/evaluations\/company\/library\/manager$/);await page.getByRole('button',{name:'Baixar template XLSX'}).click();await expect.poll(()=>templateCalls).toBe(1);
  await page.locator('input[type=file]').setInputFiles({name:'nova.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from('xlsx')});await page.getByRole('button',{name:'Importar e validar'}).click();await expect(page.getByText('1 templates · 1 perguntas')).toBeVisible();await page.getByLabel('Nome da biblioteca').fill('Biblioteca de produto');await page.getByRole('button',{name:'Publicar biblioteca'}).click();await expect(page.getByText('Biblioteca de produto',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Editar'}).click();await page.getByLabel('Descricao').last().fill('Versao atualizada');await page.getByRole('button',{name:'Salvar biblioteca'}).click();await expect(page.getByText('Versao atualizada')).toBeVisible();
});

test('colaborador nao visualiza controles de importacao',async({page})=>{await login(page,'colaborador1@demo.local');await page.goto('/app/evaluations');await expect(page.getByRole('button',{name:'Biblioteca'})).toHaveCount(0);});
