# Backlog Tecnico: Questionarios Individuais Personalizados

## Objetivo

Quebrar a mudanca de arquitetura dos questionarios individuais em tarefas pequenas, ordenadas e implementaveis, reduzindo risco de regressao no modulo `Avaliacoes`.

## Premissas

Este backlog assume:

- `Feedback do Lider` = `manager`
- `Autoavaliacao` = `self`
- `Colega do mesmo setor` = `peer-same-area`
- biblioteca continua existindo como fonte base
- resposta final passa a depender de `assignment.questionnaire_id`
- o questionario pode ser editado ate a atribuicao/envio
- depois da atribuicao/envio, o questionario fica congelado
- `admin`, `hr` e gestor direto podem ver respostas sensiveis, com auditoria

## Decisoes fechadas

### D1. Modelagem do colega do mesmo setor

Decisao adotada:

- criar `relationshipType = peer-same-area`

### D2. Edicao depois de publicar

Decisao adotada:

- o questionario pode ser editado ate a atribuicao/envio
- depois disso, fica congelado e nao pode mais ser alterado

### D3. Quem ve resposta sensivel

Decisao adotada:

- `admin`
- `hr`
- gestor direto do subordinado relacionado

Sempre com trilha de auditoria.

## Sequencia de execucao

## Bloco 1. Base de dados e compatibilidade

### Tarefa 1. Criar migration de questionarios individuais

Entregar:

- nova migration SQL com as tabelas:
  - `evaluation_questionnaires`
  - `evaluation_questionnaire_questions`
  - `evaluation_questionnaire_access_policies`
- nova coluna `questionnaire_id` em `evaluation_assignments`

Arquivos:

- `backend/db/migrations/2026-05-05-evaluation-individual-questionnaires.sql`

Dependencias:

- nenhuma

Criterio de pronto:

- migration roda sem erro
- banco existente continua consistente

### Tarefa 2. Atualizar schema base

Entregar:

- refletir as novas tabelas e coluna no `schema.sql`

Arquivos:

- `backend/db/schema.sql`

Dependencias:

- Tarefa 1

Criterio de pronto:

- `schema.sql` representa o estado novo corretamente

### Tarefa 3. Atualizar seed ou fallback de memoria para suportar o novo modelo

Entregar:

- estruturas vazias ou exemplos minimos no modo memoria
- suporte a `questionnaire_id` sem quebrar o fluxo atual

Arquivos:

- `backend/src/data/mockData.js`
- `backend/src/data/store.js`

Dependencias:

- Tarefa 1

Criterio de pronto:

- ambiente em memoria sobe normalmente
- regressao atual continua passando

## Bloco 2. Dominio e store do backend

### Tarefa 4. Criar arquivo de operacoes de questionarios individuais

Entregar:

- novo modulo de store dedicado

Arquivos:

- `backend/src/data/storeEvaluationQuestionnaireOperations.js`

Dependencias:

- Tarefa 1

Criterio de pronto:

- arquivo expoe estrutura base para MySQL e memoria

### Tarefa 5. Implementar CRUD basico de questionarios

Entregar:

- listar
- criar
- detalhar
- atualizar metadados
- arquivar

Metodos esperados:

- `getEvaluationQuestionnaires`
- `getEvaluationQuestionnaireById`
- `createEvaluationQuestionnaire`
- `updateEvaluationQuestionnaire`
- `archiveEvaluationQuestionnaire`

Arquivos:

- `backend/src/data/storeEvaluationQuestionnaireOperations.js`
- `backend/src/data/store.js`

Dependencias:

- Tarefa 4

Criterio de pronto:

- RH/Admin consegue criar e consultar questionarios em store

### Tarefa 6. Implementar CRUD de perguntas do questionario

Entregar:

- adicionar pergunta
- editar pergunta
- excluir pergunta
- reordenar

Metodos esperados:

- `addEvaluationQuestionnaireQuestion`
- `updateEvaluationQuestionnaireQuestion`
- `deleteEvaluationQuestionnaireQuestion`
- `reorderEvaluationQuestionnaireQuestions`

Dependencias:

- Tarefa 5

Criterio de pronto:

- perguntas persistem com `sort_order` consistente

### Tarefa 7. Implementar validacao 15/20/7 por tipo

Entregar:

- regra de publicacao:
  - `manager` = 15
  - `self` = 20
  - `peer-same-area` = 7

Arquivos:

- `backend/src/data/storeEvaluationsDomain.js`
- `backend/src/data/storeEvaluationQuestionnaireOperations.js`

Dependencias:

- Tarefa 6

Criterio de pronto:

- backend impede publicacao fora da contagem obrigatoria

### Tarefa 8. Implementar publicacao e congelamento

Entregar:

- status `draft` e `published`
- congelamento do questionario depois da atribuicao/envio
- opcionalmente `version_number`

Metodos esperados:

- `publishEvaluationQuestionnaire`

Dependencias:

- Tarefa 7

Criterio de pronto:

- questionario atribuido/enviado nao sofre alteracao silenciosa

## Bloco 3. API e autorizacao

### Tarefa 9. Expor rotas REST de questionarios

Entregar:

- novas rotas em `evaluations.js`

Rotas:

- `GET /api/evaluations/questionnaires`
- `GET /api/evaluations/questionnaires/:questionnaireId`
- `POST /api/evaluations/questionnaires`
- `PATCH /api/evaluations/questionnaires/:questionnaireId`
- `POST /api/evaluations/questionnaires/:questionnaireId/publish`
- `POST /api/evaluations/questionnaires/:questionnaireId/archive`
- `POST /api/evaluations/questionnaires/:questionnaireId/questions`
- `PATCH /api/evaluations/questionnaire-questions/:questionId`
- `DELETE /api/evaluations/questionnaire-questions/:questionId`
- `POST /api/evaluations/questionnaires/:questionnaireId/reorder`

Arquivos:

- `backend/src/routes/evaluations.js`

Dependencias:

- Tarefa 8

Criterio de pronto:

- CRUD acessivel por API para `admin` e `hr`

### Tarefa 10. Aplicar autorizacao e auditoria do CRUD

Entregar:

- restricao para `admin` e `hr`
- auditoria de criacao, edicao, publicacao e arquivamento

Arquivos:

- `backend/src/routes/evaluations.js`
- `backend/src/data/storeEvaluationQuestionnaireOperations.js`
- `backend/src/data/store.js`

Dependencias:

- Tarefa 9

Criterio de pronto:

- acoes administrativas deixam rastro em auditoria

## Bloco 4. Vinculo do assignment com o questionario

### Tarefa 11. Criar mecanismo de atribuicao de questionario ao assignment

Entregar:

- preencher `evaluation_assignments.questionnaire_id` para assignments compatveis

Recomendacao:

- fazer isso no momento da publicacao do questionario

Arquivos:

- `backend/src/data/storeEvaluationQuestionnaireOperations.js`
- `backend/src/data/store.js`

Dependencias:

- Tarefa 8

Criterio de pronto:

- assignment passa a conhecer explicitamente qual questionario usa

### Tarefa 12. Ajustar leitura do assignment para usar questionario atribuido

Entregar:

- `getEvaluationAssignmentById` passa a resolver:
  - questionario individual se `questionnaire_id` existir
  - fallback legado se nao existir

Arquivos:

- `backend/src/data/storeEvaluationReadOperations.js`

Dependencias:

- Tarefa 11

Criterio de pronto:

- assignment retorna o conjunto correto de perguntas para cada colaborador

### Tarefa 13. Ajustar submissao para validar contra o questionario do assignment

Entregar:

- submissao deixa de depender somente de `cycle + relationshipType`
- validacao usa o questionario vinculado

Arquivos:

- `backend/src/data/storeEvaluationSubmissionOperations.js`

Dependencias:

- Tarefa 12

Criterio de pronto:

- dois colaboradores no mesmo ciclo podem responder autoavaliacoes diferentes

## Bloco 5. Privacidade reforcada

### Tarefa 14. Implementar politica de acesso do questionario

Entregar:

- persistir politica de acesso em `evaluation_questionnaire_access_policies`
- aplicar defaults seguros

Arquivos:

- `backend/src/data/storeEvaluationQuestionnaireOperations.js`
- `backend/src/data/store.js`

Dependencias:

- Tarefa 8

Criterio de pronto:

- todo questionario publicado tem politica de acesso associada

### Tarefa 15. Forcar carregamento do questionario somente por assignment autorizado

Entregar:

- evitar rotas de leitura de conteudo bruto por `cycleId + relationshipType + person`

Arquivos:

- `backend/src/routes/evaluations.js`
- `backend/src/data/storeEvaluationReadOperations.js`

Dependencias:

- Tarefa 12

Criterio de pronto:

- sem assignment autorizado, sem acesso ao conteudo do questionario

### Tarefa 16. Implementar `is_sensitive` nas perguntas

Entregar:

- perguntas podem ser marcadas como sensiveis
- store e API preservam essa informacao

Arquivos:

- `backend/src/data/storeEvaluationQuestionnaireOperations.js`
- `backend/src/data/storeEvaluationReadOperations.js`
- `backend/src/data/storeEvaluationSubmissionOperations.js`

Dependencias:

- Tarefa 6

Criterio de pronto:

- sistema reconhece perguntas sensiveis end-to-end

### Tarefa 17. Auditar acesso a resposta sensivel

Entregar:

- registrar quando `admin`, `hr` ou gestor direto visualizar resposta bruta de pergunta sensivel

Arquivos:

- `backend/src/data/store.js`
- `backend/src/routes/evaluations.js`

Dependencias:

- Tarefa 16

Criterio de pronto:

- acesso privilegiado sensivel gera log especifico

## Bloco 6. Frontend

### Tarefa 18. Adicionar client API para questionarios individuais

Entregar:

- novas funcoes em `frontend/src/api.js`

Dependencias:

- Tarefa 9

Criterio de pronto:

- frontend consegue consumir o CRUD novo

### Tarefa 19. Criar hook de fluxo dos questionarios individuais

Entregar:

- hook dedicado para estado, filtros e operacoes

Arquivo recomendado:

- `frontend/src/evaluations/useEvaluationQuestionnaires.js`

Dependencias:

- Tarefa 18

Criterio de pronto:

- CRUD pode ser consumido pela tela sem inflar `useEvaluations.js`

### Tarefa 20. Criar painel operacional de questionarios individuais

Entregar:

- lista por ciclo
- filtro por colaborador
- filtro por tipo
- editor de perguntas
- status draft/published

Arquivos recomendados:

- `frontend/src/evaluations/EvaluationQuestionnairePanel.jsx`
- `frontend/src/evaluations/EvaluationQuestionnaireEditor.jsx`

Dependencias:

- Tarefa 19

Criterio de pronto:

- RH/Admin consegue manter questionarios sem tocar em biblioteca

### Tarefa 21. Integrar o painel ao workspace de Avaliacoes

Entregar:

- nova aba ou subsecao em `Operacao`
- separacao clara entre:
  - `Bibliotecas`
  - `Questionarios individuais`

Arquivos:

- `frontend/src/evaluations/EvaluationsSection.jsx`
- `frontend/src/evaluations/EvaluationLibraryPanel.jsx`

Dependencias:

- Tarefa 20

Criterio de pronto:

- operacao deixa clara a diferenca entre modelo base e questionario atribuido

### Tarefa 22. Ajustar tela de resposta para badges e contexto de privacidade

Entregar:

- exibir origem do questionario
- exibir indicador de confidencialidade

Arquivos:

- `frontend/src/evaluations/EvaluationResponsePanel.jsx`

Dependencias:

- Tarefa 12

Criterio de pronto:

- avaliador responde com clareza sobre o contexto daquele questionario

## Bloco 7. Testes

### Tarefa 23. Expandir regressao de backend

Entregar:

- cobrir CRUD
- publicacao 15/20/7
- vinculo com assignment
- fallback legado
- privacidade

Arquivos:

- `backend/tests/evaluations.test.mjs`

Dependencias:

- Tarefas 9 a 17

Criterio de pronto:

- regressao cobre o modelo novo sem perder o legado

### Tarefa 24. Expandir testes de frontend

Entregar:

- casos minimos do novo fluxo operacional

Arquivos:

- `frontend/tests/`

Dependencias:

- Tarefas 20 a 22

Criterio de pronto:

- fluxo basico do CRUD esta coberto

### Tarefa 25. Adicionar E2E do fluxo individualizado

Entregar:

- RH cria questionario para colaborador A
- RH cria outro para colaborador B
- cada usuario responde apenas o seu

Arquivos:

- `frontend/e2e/`

Dependencias:

- Tarefas 20 a 22

Criterio de pronto:

- sem vazamento de perguntas entre colaboradores

## Ordem recomendada de implementacao pratica

Se formos executar em ondas, a melhor sequencia e:

### Onda 1

- Tarefas 1 a 3

Resultado:

- base de dados pronta e projeto ainda compativel

### Onda 2

- Tarefas 4 a 10

Resultado:

- CRUD administrativo de questionarios pronto no backend

### Onda 3

- Tarefas 11 a 13

Resultado:

- assignment passa a governar o questionario real

### Onda 4

- Tarefas 14 a 17

Resultado:

- privacidade reforcada no backend

### Onda 5

- Tarefas 18 a 22

Resultado:

- operacao real disponivel no frontend

### Onda 6

- Tarefas 23 a 25

Resultado:

- regressao e validacao ponta a ponta

## Entrega minima viavel recomendada

Se quisermos uma primeira entrega menor e segura, eu recomendo parar inicialmente em:

- Tarefa 1 ate Tarefa 13

Isso ja entrega:

- novo modelo
- CRUD backend
- assignment com questionario individual
- resposta realmente personalizada por colaborador

Depois disso, fazemos a camada reforcada de privacidade visual e a cobertura final.
