# Mapa de Retomada Operacional

Este guia resume onde entrar no projeto quando precisarmos retomar uma frente especifica sem reconstruir toda a arquitetura do zero.

## Ordem curta de retomada

Se a sessao anterior quebrou e precisamos voltar rapido, abra nesta ordem:

1. `README.md`
2. `docs/evolucao-recomendada.md`
3. `frontend/src/App.jsx`
4. `frontend/src/useAppData.js`
5. `frontend/src/appSceneProps.js`
6. `backend/src/app.js`
7. `backend/src/data/store.js`

Essa sequencia recupera:

- a intencao atual do produto
- o estado evolutivo mais recente
- a orquestracao do frontend
- o carregamento de dados
- a composicao visual por modulo
- a exposicao da API
- a regra de negocio central

## Mapa por camada

### Entrada da aplicacao

- `frontend/src/main.jsx`: bootstrap do React
- `frontend/src/App.jsx`: orquestrador principal da aplicacao
- `frontend/src/layout/AppShell.jsx`: shell, sidebar, topo, loading e erro
- `frontend/src/AppSceneRenderer.jsx`: decide qual cena renderizar

### Sessao e autorizacao

- `frontend/src/useSession.js`: login, restauracao de sessao e logout
- `frontend/src/access.js`: capabilities por perfil
- `backend/src/auth/middleware.js`: autenticacao e autorizacao da API
- `backend/src/auth/token.js`: emissao e validacao de token

### Dados e API

- `frontend/src/api.js`: cliente HTTP do frontend
- `frontend/src/useAppData.js`: carregamento global conforme capabilities
- `backend/src/app.js`: montagem das rotas
- `backend/src/server.js`: bootstrap da API

### Persistencia e dominio

- `backend/src/data/store.js`: composicao principal do modo memoria e MySQL
- `backend/db/schema.sql`: schema base
- `backend/db/seed.sql`: seed inicial
- `backend/db/migrations/`: evolucao incremental do banco

## Guia por modulo

### 1. Avaliacoes

Abrir primeiro:

1. `frontend/src/evaluations/useEvaluations.js`
2. `frontend/src/evaluations/EvaluationsSection.jsx`
3. `frontend/src/appSceneProps.js`
4. `backend/src/routes/evaluations.js`
5. `backend/src/data/storeEvaluationsDomain.js`
6. `backend/src/data/storeEvaluationReadOperations.js`
7. `backend/src/data/storeEvaluationWorkflowOperations.js`
8. `backend/src/data/storeEvaluationSubmissionOperations.js`

Quando abrir esse modulo:

- bug em ciclo, biblioteca ou operacao: olhar `routes/evaluations.js` e `storeEvaluationWorkflowOperations.js`
- bug em leitura, consolidado ou visibilidade: olhar `storeEvaluationReadOperations.js`
- bug em resposta ou submissao: olhar `storeEvaluationSubmissionOperations.js`
- bug de tela ou fluxo do usuario: olhar `useEvaluations.js` e os componentes em `frontend/src/evaluations/`

Documentos de apoio:

- `docs/homologacao-360-publicado.md`
- `docs/feedback-transversal-especificacao.md`
- `docs/avaliacoes-02-2026-alinhamento.md`

### 2. Desenvolvimento

Abrir primeiro:

1. `frontend/src/useDevelopmentFlow.js`
2. `frontend/src/sections/AppSections.jsx`
3. `backend/src/routes/development.js`
4. `backend/src/data/storeDevelopmentRecordOperations.js`
5. `backend/src/data/storeDevelopmentPlanOperations.js`
6. `backend/src/services/learningIntegrations.js`

Quando abrir esse modulo:

- bug em PDI, progresso ou historico: olhar `storeDevelopmentPlanOperations.js`
- bug em registros de desenvolvimento: olhar `storeDevelopmentRecordOperations.js`
- bug em integracoes de aprendizagem: olhar `learningIntegrations.js` e `storeLearningIntegrationOperations.js`

Documento de apoio:

- `docs/integracoes-aprendizagem.md`

### 3. Compliance

Abrir primeiro:

1. `frontend/src/useOperationsFlow.js`
2. `frontend/src/sections/OperationsSections.jsx`
3. `backend/src/routes/incidents.js`
4. `backend/src/data/storeIncidentsDomain.js`
5. `backend/src/data/store.js`

Quando abrir esse modulo:

- bug em criacao ou atualizacao de caso: olhar `storeIncidentsDomain.js`
- bug de responsavel, area ou fila: olhar `useOperationsFlow.js` e `routes/incidents.js`

### 4. Applause

Abrir primeiro:

1. `frontend/src/useOperationsFlow.js`
2. `frontend/src/sections/OperationsSections.jsx`
3. `backend/src/routes/applause.js`
4. `backend/src/data/storeApplauseOperations.js`
5. `backend/src/data/storeGrowthDomain.js`

Quando abrir esse modulo:

- bug em criacao ou manutencao administrativa: olhar `storeApplauseOperations.js`
- bug em permissao de gestor/admin: olhar `storeGrowthDomain.js` e `access.js`

### 5. Pessoas e usuarios

Abrir primeiro:

1. `frontend/src/useRegistryFlow.js`
2. `frontend/src/sections/RegistrySections.jsx`
3. `backend/src/routes/people.js`
4. `backend/src/routes/users.js`
5. `backend/src/data/storeRegistryOperations.js`
6. `backend/src/data/storeRegistryDomain.js`
7. `backend/src/data/storeUsersDomain.js`

Quando abrir esse modulo:

- bug em cadastro de pessoa, area ou gestor: olhar `storeRegistryDomain.js`
- bug em provisionamento de usuario: olhar `storeUsersDomain.js`
- bug de sugestao de papel ou vinculo pessoa-usuario: olhar `useRegistryFlow.js`

### 6. Dashboard

Abrir primeiro:

1. `frontend/src/useDashboardFlow.js`
2. `frontend/src/sections/dashboard/`
3. `backend/src/routes/dashboards.js`
4. `backend/src/data/storeDashboardOperations.js`

Quando abrir esse modulo:

- bug em filtro, agrupamento ou narrativa: olhar `useDashboardFlow.js`
- bug em metricas e payload agregado: olhar `storeDashboardOperations.js`

### 7. Shell, navegacao e experiencia por perfil

Abrir primeiro:

1. `frontend/src/App.jsx`
2. `frontend/src/useAppShellFlow.js`
3. `frontend/src/navigation.js`
4. `frontend/src/appConfig.js`
5. `frontend/src/access.js`
6. `frontend/src/layout/AppShell.jsx`

Quando abrir esse modulo:

- secao errada abrindo por perfil: olhar `useAppShellFlow.js`
- item de menu aparecendo para perfil indevido: olhar `access.js` e `navigation.js`
- ajuste global de experiencia: olhar `AppShell.jsx` e `appConfig.js`

## Guia por tipo de problema

### Se o problema for de permissao

Abrir:

1. `frontend/src/access.js`
2. `frontend/src/useSession.js`
3. `backend/src/auth/middleware.js`
4. a rota do modulo afetado

### Se o problema for de dado faltando na tela

Abrir:

1. `frontend/src/useAppData.js`
2. `frontend/src/api.js`
3. a rota correspondente em `backend/src/routes/`
4. a operacao correspondente em `backend/src/data/`

### Se o problema for visual

Abrir:

1. `frontend/src/styles.css`
2. `frontend/src/styles/01-shell.css`
3. `frontend/src/styles/02-dashboard.css`
4. `frontend/src/styles/03-modules.css`
5. o CSS mais especifico da area afetada em `frontend/src/styles/03*.css`

### Se o problema for de regra de negocio

Abrir:

1. a rota do modulo
2. o arquivo `store*Domain.js` relacionado
3. a operacao `store*Operations.js` relacionada
4. os testes do backend para aquela area

## Verificacao antes de encerrar uma rodada

Executar:

1. `npm run test`
2. `npm run build:frontend`
3. `npm run verify`

Quando a mudanca tocar fluxo real de interface, executar tambem:

1. `npm run test:e2e`

## Melhor proximo foco funcional

Pelo estado atual do repositorio e pela documentacao, o foco mais provavel para a proxima rodada funcional e:

1. homologacao 360 publicado ponta a ponta
2. refinos de UX por perfil nos modulos ja estabilizados
3. ajustes pontuais apos a modularizacao recente do frontend e da store
