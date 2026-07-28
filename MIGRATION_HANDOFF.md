# Handoff de Migracao: React para Angular 21

## Objetivo

Migrar o frontend de React 18/Vite para Angular 21 por padronizacao corporativa. A transicao manteve o React em producao ate o corte oficial; desde 2026-07-24 o Angular responde pelo dominio oficial. O aplicativo oficial vive em `frontend-angular/` e usa a mesma API do backend existente.

## Estrategia Aprovada

- Migracao paralela por telas e modulos; nao incorporar Angular dentro do React.
- Manter `frontend/` funcional ate o corte final e preservado apenas como rollback temporario apos o corte.
- Preservar os contratos existentes de API, token e permissoes.
- Migrar telas pequenas antes dos modulos de maior risco.
- Validar cada fase com build, testes focados e paridade funcional antes de avancar.

## Estado Atual

| Item | Estado |
| --- | --- |
| Branch | `main` |
| Runtime | Node `22.14.0`, npm `10.9.8` |
| App Angular | `frontend-angular/`, Angular 21, frontend oficial |
| App React | `frontend/`, legado preservado apenas para rollback temporario |
| API de desenvolvimento | `http://localhost:4000` |
| Angular de desenvolvimento | `http://localhost:4200` |
| CORS | Backend aceita `http://localhost:4200` |
| Producao oficial | `https://smart-compliance-frontend.vercel.app` apontando para o projeto Vercel Angular |
| Build Angular | Concluido localmente e em deploy de producao Vercel |

## Fase 1: Fundacao Angular

Estimativa de referencia: 35-60 creditos Codex. Esta faixa nao representa uma cota semanal fixa do plano Plus; o consumo real varia pelo modelo e pelo tamanho das alteracoes.

1. [x] Criar a branch `codex/angular-pilot`.
2. [x] Validar o ambiente e atualizar Node para versao compativel com Angular 21.
3. [x] Criar `frontend-angular/` com Angular 21, roteamento e CSS.
4. [x] Criar estrutura base com `core`, `features`, rotas e estilos globais.
5. [x] Configurar ambientes, `HttpClient`, token Bearer, `ApiClient`, erro HTTP e CORS local.
6. [x] Implementar login, logout, restauracao de sessao e rotas protegidas.
7. [x] Implementar shell, menu lateral, URLs por modulo e permissoes basicas.
8. [x] Migrar a tela-piloto de Areas, com leitura, criacao e edicao em `/app/people/areas`.
9. [x] Adicionar e executar testes Playwright de sessao, navegacao por perfil e CRUD de Areas.
10. [x] Revisar a paridade da fundacao e aprovar o padrao para os modulos seguintes.

### Entregas Ja Criadas

- Rotas publicas e protegidas: `/login`, `/app/:section`.
- Menu para Dashboard, Compliance, Avaliacoes, Desenvolvimento, Aplause, Pessoas e Usuarios.
- Token persistido na chave `smart-compliance-token`.
- Sessao restaurada por `GET /api/auth/me`.
- Login por `POST /api/auth/login`.
- Permissoes basicas equivalentes ao React para visibilidade e acesso direto de rotas.
- Preferencia de menu recolhido na chave `smartCompliance.sidebarCollapsed`.

### Revisao de Paridade da Fase 1

| Item | Resultado | Observacao |
| --- | --- | --- |
| Login e logout | Aprovado | Usa os mesmos endpoints e a mesma chave de token do React. |
| Restauracao de sessao | Aprovado | Valida `GET /api/auth/me` antes de liberar as rotas protegidas. |
| Tratamento de erro | Aprovado | O payload `{ error }` da API e convertido em `ApiError`. |
| Navegacao e permissao | Aprovado | Menu e acesso direto seguem as regras basicas equivalentes ao React. |
| Areas | Aprovado como piloto | Lista, cria e edita; lideranca detalhada fica para a migracao completa de Pessoas. |
| Testes E2E | Aprovado | Sessao, bloqueio de perfil e criacao de Area passaram em Playwright. |
| Demais modulos | Pendente por planejamento | Dashboard, Compliance, Avaliacoes, Desenvolvimento, Aplause, Pessoas e Usuarios seguem como placeholders. |

**Decisao:** Fase 1 aprovada. O padrao Angular de rotas, servicos, guardas, estado por signals, tratamento de erro e testes Playwright deve ser reutilizado nos modulos seguintes.

## Fase 2: Tela-Piloto e Padrao de Modulo

Estimativa: 15-25 creditos.

1. [x] Selecionar uma tela de baixo risco; preferir consulta ou CRUD pequeno de Cadastro.
2. [x] Criar servico Angular especifico usando `ApiClient`.
3. [x] Migrar lista, carregamento, vazio, erro e acao principal da tela escolhida.
4. [x] Aplicar permissao de rota e de acao conforme o papel do usuario.
5. [x] Comparar resposta e comportamento com a tela React equivalente.
6. [x] Criar teste focado do servico e teste de fluxo principal da tela.
7. [x] Registrar decisoes reutilizaveis para os demais modulos.

**Decisao da tarefa 1:** a tela-piloto selecionada e **Competencias**, a ser disponibilizada
em uma rota propria de Cadastro (`/app/people/competencies`). O contrato e um CRUD isolado
(`GET`, `POST` e `PATCH /api/competencies`) e a gestao e restrita aos perfis `admin` e `hr`.
Apesar de a tela React estar hoje dentro da Biblioteca de Avaliacoes, sua API nao depende dos
fluxos de questionarios ou ciclos. Pessoas e Usuarios foram excluidos deste piloto por envolverem
regras de hierarquia e provisionamento de acesso.

**Padrao reutilizavel aprovado:** cada tela Angular fica em `features/<modulo>/`, com servico
tipado que encapsula o `ApiClient`, componente standalone com `signals` para os estados de tela
e formulario reativo para criacao/edicao. A rota explicita usa um guarda dedicado alinhado ao
React; a visibilidade das acoes tambem deve ser conferida no componente. Para este piloto, a
paridade corrigiu a leitura para apenas `admin` e `hr`, embora a API aceite `manager` no GET.
Os testes Playwright existentes cobrem permissao de rota e fluxo principal de criacao; o projeto
nao possui runner de testes unitarios Angular configurado.

## Fase 3: Dashboard

Estimativa: 15-30 creditos.

1. [x] Mapear o contrato de `GET /api/dashboards/overview` e filtros atuais.
2. [x] Criar `DashboardService` e modelos tipados.
3. [x] Migrar indicadores, filtros permitidos por papel e estados de carregamento/erro.
4. [x] Migrar graficos reutilizando componentes SVG Angular reutilizaveis, sem trocar o contrato da API.
5. [x] Validar numeros, filtros e permissoes contra o React.
6. [x] Adicionar testes de dados e de filtros principais.

**Contrato mapeado:** `GET /api/dashboards/overview?area=<nome>&timeGrouping=<cycle|semester|quarter|year>`
aceita os perfis `admin`, `hr` e `manager`. `area` e opcional e o React o envia como `null`
quando o filtro esta em `Todas`; a selecao e disponibilizada somente a `admin` e `hr`. O
`manager` recebe, sem filtro de area, apenas o recorte da propria equipe. A resposta inclui
`mode`, `notice`, `scopeLabel`, `areaOptions`, `selectedArea`, `scopeSummary`, `cards`,
`donutMetrics`, `satisfactionByArea`, `satisfactionQuestionAnalytics`, `evaluationMix`,
`evaluationResultsSummary`, `responseDistributions`, `performanceHealth`, `assignmentStatus`,
`developmentByType`, `cycleTimeline` e `timeGrouping`. Os filtros de composicao, tema e visao
existentes no React sao locais e devem ser tratados no componente Angular, sem novos parametros
de API.

## Fase 4: Cadastro

Estimativa: 25-40 creditos.

1. [x] Migrar Areas e Competencias, com lista, criacao e edicao.
2. [x] Migrar Pessoas, incluindo regras de visibilidade e gerenciamento.
3. [x] Migrar Usuarios, perfis, status e regras administrativas.
4. [x] Migrar trilha de auditoria associada ao Cadastro quando ela fizer parte do fluxo.
5. [x] Validar formularios, mensagens da API, permissoes e dados persistidos.
6. [x] Adicionar testes por servico e testes de fluxos CRUD criticos.

## Fase 5: Compliance e Operacoes

Estimativa: 20-35 creditos.

1. [x] Mapear fila de incidentes, consulta, criacao e atualizacao.
2. [x] Criar `IncidentsService` e modelos tipados para fila, criacao e tratamento.
3. [x] Migrar consultas de Compliance e auditoria relevantes ao modulo.
4. [x] Validar regras de acesso para admin, RH e compliance.
5. [x] Adicionar testes para erro, fila vazia, atualizacao e acesso negado.

**Contrato mapeado:** `GET /api/incidents` retorna a fila dentro do escopo do usuario;
`POST /api/incidents` aceita relatos autenticados com titulo, categoria, classificacao,
anonimato, area responsavel e descricao; `PATCH /api/incidents/:incidentId` e restrito a
`admin`, `hr` e `compliance` para classificacao, status, area responsavel e responsavel
designado. O React preseleciona o lider da area como responsavel quando disponivel.

## Fase 6: Desenvolvimento e Aplause

Estimativa: 15-25 creditos.

**Progresso:** Fases 6.1 a 6.5 concluidas. A rota `/app/development` agora usa uma pagina Angular
real, com `DevelopmentService`, modelos tipados, carregamento de registros e PDIs e estados de
carregamento, erro e vazio. Os fluxos operacionais permitem criar, editar e arquivar registros e
PDIs, alem de atualizar o andamento do PDI dentro do escopo autorizado pela API. Admin e RH tambem
podem revisar a fila de eventos de aprendizagem, conciliar pessoa e competencia e aplicar o evento
em Desenvolvimento ou PDI. A rota `/app/applause` tambem deixou de usar placeholder e agora cobre
consulta, criacao, edicao/arquivamento conforme perfil e trilha de auditoria. Visoes explicitas por
papel seguem para a rodada final de paridade visual. Os specs Playwright separados de Desenvolvimento
e Aplause cobrem criacao, edicao, progresso, arquivamento, vazio, erro e restricoes por perfil;
a execucao consolidada passou com 10 de 10 cenarios.

1. [x] Migrar registros e planos de desenvolvimento.
2. [x] Migrar visoes pessoal, equipe e organizacao conforme o papel.
3. [x] Migrar eventos de integracao de aprendizagem, quando aplicavel.
4. [x] Migrar Aplause, incluindo consulta, criacao e administracao.
5. [x] Validar regras de visibilidade e fluxos de atualizacao.
6. [x] Adicionar testes dos fluxos de maior uso.

## Fase 7: Avaliacoes

Estimativa: 35-65 creditos. Este e o modulo de maior risco e deve ser dividido em entregas menores.

**Progresso:** Fases 7.1 a 7.5 concluidas. A rota `/app/evaluations` agora usa uma pagina Angular real,
com `EvaluationsService`, modelos tipados, abas de atribuicoes e ciclos, detalhe do questionario,
respostas de escala, texto e multipla selecao e submissao pela API. O spec Playwright da base cobre
envio tipado, vazio e erro, com 3 de 3 cenarios aprovados. As abas de Biblioteca e Questionarios
agora cobrem listagem, criacao, edicao, remocao, ordenacao, publicacao e arquivamento, respeitando
RH para mutacoes da biblioteca e admin/RH para questionarios. O spec da 7.2 passou com 3 de 3
cenarios. A operacao de ciclos cobre criacao e transicoes, ativacao e modulos, participantes,
inadimplentes, notificacoes, filtros por unidade/modalidade e configuracao transversal, com os 3
cenarios Playwright criticos aprovados. Feedback solicitado/recebido, aprovacao, confirmacao de
leitura, desempenho 360, insights, historico e comparacao de ciclos foram migrados na 7.4, com 3
cenarios Playwright aprovados. A 7.5 adicionou download do template, importacao CSV/XLSX,
validacao de rascunho, publicacao e atualizacao de bibliotecas customizadas, tambem com 3 cenarios
Playwright aprovados. A Fase 7 de Avaliacoes esta concluida.

1. [x] Migrar biblioteca e modelos de questionario.
2. [x] Migrar criacao, edicao, ordenacao, publicacao e arquivamento de questionarios.
3. [x] Migrar ciclos, configuracoes, participantes e notificacoes.
4. [x] Migrar atribuicoes, respostas, feedbacks solicitados e recebidos.
5. [x] Migrar avaliacao 360 e visualizacoes por papel.
6. [x] Migrar importacao e download de bibliotecas personalizadas.
7. [x] Validar cada fluxo contra a API e suas permissoes antes de iniciar o proximo.
8. [x] Criar testes de regressao para publicacao, respostas e acoes irreversiveis.

## Fase 8: Qualidade, Corte e Higiene Pos-Migracao

Estimativa: 20-30 creditos.

1. [x] Executar matriz de paridade por rota, papel e fluxo critico.
2. [x] Consolidar testes Playwright para os caminhos principais.
3. [x] Corrigir divergencias visuais, de acessibilidade e de mensagens de erro bloqueantes.
4. [x] Preparar configuracao de producao do Angular e origem CORS correspondente.
5. [x] Publicar Angular em ambiente separado e validar smoke publicado.
6. [x] Fazer aceite tecnico e manter plano de reversao para o React.
7. [x] Realizar o corte de roteamento/deploy para Angular.
8. [x] Preservar React como rollback temporario.
9. [x] Atualizar README, scripts raiz e handoff para Angular como frontend oficial.
10. [x] Desativar auto-deploy do projeto React antigo no Vercel.
11. [ ] Arquivar ou remover `frontend/` somente apos decisao explicita de encerramento do rollback.

### Fase 8.2 - Corte controlado concluido

Preparacao concluida em 2026-07-21:

- `environment.production.ts` do Angular aponta para `https://smartcompliance.onrender.com`.
- `npx ng build --configuration=production` passou e gerou artefatos em
  `frontend-angular/dist/frontend-angular/browser`.
- Build production gerou apenas warning de budget: bundle inicial `526.87 kB` contra aviso de
  `500 kB`; transferencia estimada `116.47 kB`.
- `frontend-angular/vercel.json` adicionado para deploy SPA com output
  `dist/frontend-angular/browser` e rewrite de todas as rotas para `/index.html`.
- `npx ng serve --configuration=production --host localhost --port 4200` validado com rota profunda
  `/app/dashboard`, login `admin@demo.local` e `GET /api/dashboards/overview?timeGrouping=semester`
  retornando 200 contra `https://smartcompliance.onrender.com`.
- Projeto Vercel Angular separado criado como `smart-compliance-angular` e deploy iniciado em
  `https://smart-compliance-angular-ln3fmbsnl-eduardos-projects-e211db16.vercel.app`.
- Primeiro acesso publico retornou redirecionamento para `vercel.com/sso-api`, indicando Deployment
  Protection ativa no projeto Angular.
- Preflight CORS para a URL Angular publicada respondeu 200 no Render, mas ainda sem
  `Access-Control-Allow-Origin`; `backend/src/config/env.js` foi preparado com
  `https://smart-compliance-angular*.vercel.app` e precisa ser reimplantado no backend.
- Deploy backend `565124a` validado: preflight de `POST /api/auth/login` para
  `https://smart-compliance-angular-ln3fmbsnl-eduardos-projects-e211db16.vercel.app` retornou 204
  com `Access-Control-Allow-Origin` correto. CORS da URL Angular publicada esta liberado.
- Deployment Protection desativada no projeto Vercel Angular; `/login` e `/app/dashboard` publicados
  respondem 200 com fallback SPA.
- Validacao publicada concluida: login admin, Dashboard, Compliance, Pessoas, Avaliacoes,
  Desenvolvimento/Formacao e PDI e Aplause carregaram com sucesso contra o backend Render; todas as
  chamadas criticas observadas retornaram 200.
- Pre-corte em 2026-07-21: Angular publicado `/login` respondeu 200 e React oficial
  `https://smart-compliance-frontend.vercel.app/` respondeu 200, mantendo rollback disponivel.
- Corte oficial em 2026-07-24: o alias `https://smart-compliance-frontend.vercel.app` foi apontado
  para o deployment Angular
  `https://smart-compliance-angular-f428rq6kv-eduardos-projects-e211db16.vercel.app`.
- Smoke publicado pos-corte em 2026-07-24: `/login`, `/app/dashboard`, `/app/compliance`,
  `/app/people`, `/app/users`, `/app/evaluations`, `/app/development` e `/app/applause`
  retornaram 200 e serviram HTML Angular (`<app-root>`), sem root React.
- Smoke autenticado pos-corte em 2026-07-24: login `admin@demo.local`, `/api/auth/me`,
  Dashboard, Incidentes, Pessoas, Usuarios, Ciclos de Avaliacoes, Desenvolvimento e Aplause
  retornaram 200 contra `https://smartcompliance.onrender.com` com
  `Access-Control-Allow-Origin: https://smart-compliance-frontend.vercel.app`.
- Rollback React preservado no deployment especifico
  `https://smart-compliance-frontend-eq1qmi9n7-eduardos-projects-e211db16.vercel.app`.

Plano de corte historico executado:

1. Publicar o Angular em uma URL de homologacao/producao separada, sem substituir o React primeiro.
2. Manter o React disponivel em deployment especifico de rollback durante a janela de estabilizacao.
3. Trocar o apontamento oficial para Angular somente apos aceite.

Status de corte: **concluido**. O Angular responde pelo dominio oficial; o React permanece disponivel
apenas como rollback temporario em deployment especifico, sem ser o frontend padrao do repositorio.

### Higiene pos-migracao executada em 2026-07-28

- `README.md` atualizado para declarar Angular 21 como frontend oficial.
- Scripts raiz `dev:frontend`, `build:frontend`, `test:e2e`, `test` e `verify` apontam para Angular.
- Scripts `*:legacy` preservam comandos do React para rollback/comparacao.
- `frontend-angular/README.md` substituido por guia operacional do produto.
- Handoff atualizado para refletir `main`, dominio oficial Angular e React legado.

### Higiene operacional executada em 2026-07-28

- Projeto Vercel React legado `smart-compliance-frontend` desconectado do GitHub com
  `npx vercel git disconnect`, impedindo novos deployments automaticos a cada push.
- Alias oficial `smart-compliance-frontend.vercel.app` reapontado para o deployment Angular
  `smart-compliance-angular-6lxppvy06-eduardos-projects-e211db16.vercel.app`.
- Validacao HTTP confirmou que o dominio oficial serve HTML Angular com `<app-root>`.

### Acoes manuais pendentes

- Manter o alias `smart-compliance-frontend.vercel.app` apontado para `smart-compliance-angular`.
- Remover ou arquivar `frontend/` apenas depois de encerrada a janela de rollback.

Comandos manuais recomendados para publicar em Vercel separado:

```powershell
cd "E:\Smart Compliance\frontend-angular"
npm run build -- --configuration=production
npx vercel --prod
```

Ao responder as perguntas do Vercel, usar este diretorio como projeto Angular separado e confirmar:

- Build command: `npm run build -- --configuration=production`
- Output directory: `dist/frontend-angular/browser`
- SPA fallback: ja configurado em `frontend-angular/vercel.json`.

Rollback:

- Se o Angular publicado falhar em autenticacao, CORS, rota profunda ou fluxo critico, reatribuir o
  alias `https://smart-compliance-frontend.vercel.app` ao deployment React de rollback e corrigir o
  Angular fora da janela de corte.
- Nao arquivar nem desativar o React antes do aceite final.

## Auditoria Dura de Paridade 1:1

Ultima varredura: 2026-07-20, na branch `codex/angular-pilot`.

Esta auditoria compara o React preservado em `frontend/` com o Angular em `frontend-angular/`.
O criterio usado aqui e mais rigido que "fase entregue": uma tela so conta como 1:1 quando
rota, dados, permissoes por papel, estados de vazio/erro/carregamento, formularios, acoes,
auditoria e testes de fluxo critico estao cobertos no Angular.

### Matriz por Modulo

| Modulo React | Angular atual | Status 1:1 | Lacunas obrigatorias |
| --- | --- | --- | --- |
| Login, sessao e shell | `features/auth`, `core/layout`, rotas protegidas | Quase completo | Validar tema/claro-escuro e comportamento de menu em regressao visual final. |
| Dashboard | `features/dashboard` | Parcial alto | Revalidar todos os filtros locais do React: composicao, tema analitico, visao, satisfacao por pergunta e agrupamento temporal. |
| Compliance/incidentes | `features/incidents` | Parcial alto | Conferir copia visual 1:1 do formulario, fila, trilha operacional e bloqueios de tratamento por perfil. |
| Cadastro: Areas | `features/areas` | Parcial alto | Revalidar lideranca/gestor da area e mensagens de API contra React. |
| Cadastro: Competencias | `features/competencies` | Parcial alto | Revalidar diferenca intencional: React expunha dentro da biblioteca de avaliacoes; Angular expoe em `/app/people/competencies`. |
| Cadastro: Pessoas | `features/people` | Parcial alto | Conferir regras de hierarquia, pessoa sem acesso, gestor direto, unidade/modalidade e sugestao de provisionamento. |
| Cadastro: Usuarios | `features/users` | Parcial alto | Conferir perfis/status, senha inicial, pessoa vinculada e restricoes para manager. |
| Desenvolvimento | `features/development` | Fase 6 concluida | Revalidar paridade visual e indice 360 na rodada final de aceite. |
| Aplause | `features/applause` | Fase 6 concluida | Revalidar paridade visual na rodada final de aceite. |
| Avaliacoes | `features/evaluations` | Fase 7 concluida | Revalidar paridade visual e fluxos de importacao na rodada final de aceite. |
| Power BI/Analytics | Integração futura de dados, sem UI React/Angular | Fora do corte atual | Manter endpoints analíticos como contrato futuro; corte atual usa dashboards nativos da aplicação. |

### Matriz final por rota, papel e endpoint — Fase 8.1 concluida

Status: **Coberto** = rota, serviço tipado e cenário Playwright focado existem; **Revisão final** =
contrato coberto, mas ainda exige comparação visual/funcional lado a lado com o React antes do corte;
**Futuro** = contrato preservado, mas fora do aceite da migracao atual.

| Rota Angular | Perfis e bloqueios esperados | Endpoints/fluxos cobertos | Evidência automatizada | Status |
| --- | --- | --- | --- | --- |
| `/login` e shell `/app` | Sessão obrigatória; menu por papel | `/api/auth/login`, `/api/auth/me` | `auth-navigation-and-areas.spec.ts` | Revisão final: tema e menu responsivo |
| `/app/dashboard` | Visibilidade conforme API | `GET /api/dashboards/overview` | `auth-navigation-and-areas.spec.ts` | Revisão final: filtros locais e composição visual |
| `/app/compliance` | Operação e tratamento por perfil | `GET/POST/PATCH /api/incidents` | `auth-navigation-and-areas.spec.ts` | Revisão final: fila, trilha e cópia |
| `/app/people/areas` | Admin/RH para mutações | `GET/POST/PATCH /api/areas` | `auth-navigation-and-areas.spec.ts` | Coberto; revisar mensagens finais |
| `/app/people/competencies` | Admin/RH para mutações | `GET/POST/PATCH /api/competencies` | `auth-navigation-and-areas.spec.ts` | Revisão final: diferença intencional de rota |
| `/app/people` e `/app/users` | Regras de gestor, admin e RH | Pessoas e usuários (`GET/POST/PATCH`) | `auth-navigation-and-areas.spec.ts` | Revisão final: hierarquia e provisionamento |
| `/app/development` | Escopo pessoal, equipe e organização | Registros, PDI, progresso e eventos de aprendizagem | `development.spec.ts` | Coberto; revisão visual final |
| `/app/applause` | Criação e administração por papel | `GET/POST/PATCH /api/applause` | `applause.spec.ts` | Coberto; revisão visual final |
| `/app/evaluations` — base e biblioteca | Employee responde; RH/admin administram | Ciclos, assignments, respostas, biblioteca e questionários | `evaluations-base.spec.ts`, `evaluations-library.spec.ts` | Coberto; revisar textos/ordem |
| `/app/evaluations` — operação | Admin/RH; colaborador bloqueado | Transições, participantes, inadimplência, notificações e transversal | `evaluations-operations.spec.ts` | Coberto; revisar estados de erro reais |
| `/app/evaluations` — feedback/360 | Leitura por employee; aprovação por admin/RH | Solicitações, acknowledgement, 360, histórico e comparação | `evaluations-feedback.spec.ts` | Coberto; revisar dados reais por papel |
| `/app/evaluations` — bibliotecas customizadas | Apenas admin/RH; colaborador bloqueado | Template, importação, validação, publicação e atualização | `evaluations-custom-libraries.spec.ts` | Coberto; executar importação com arquivo corporativo de homologação |
| Power BI/Analytics | Admin/RH no contrato de dados | `GET /api/analytics/powerbi/evaluation-results` e `GET /api/analytics/powerbi/rls-viewers` | Sem UI Angular por decisão | Futuro: nao ha relatorio Power BI consumidor no corte atual |

#### Pendências objetivas para encerrar a 8.1

Nenhuma pendencia objetiva restante. A validacao Power BI foi reclassificada como integracao futura
porque ainda nao existe relatorio Power BI consumindo os dados; por enquanto, o escopo de analytics
permanece nos dashboards nativos da propria aplicacao.

#### Evidência funcional consolidada

- 2026-07-21: `npx playwright test` executado com **40 de 40 cenários aprovados**.
- A suíte de navegação/cadastros foi estabilizada aguardando a conclusão do login e usando
  seletores estruturais nos controles que tinham nomes acessíveis ambíguos.
- Validação de homologação: o login por chamada direta ao backend remoto funciona para
  `admin@demo.local`; o CORS inicial foi corrigido no deploy para `http://localhost:4200`, permitindo
  autenticação Angular no navegador.
- Após o ajuste de CORS, login Angular, sessão, Dashboard e leituras de Aplause, Pessoas e Auditoria
  responderam 200 contra homologação. A primeira escrita de Aplause foi recusada pelo MySQL com erro
  de formato de data ISO; a API respondeu 400 e não persistiu o registro.
- Revalidacao posterior de Aplause com marcador `[AUDIT-8.1-HOMOLOG-1784644888367]`: login, Pessoas,
  Aplause e Auditoria responderam 200, mas `POST /api/applause` voltou 400 por `created_at` ISO.
  Nenhum arquivamento foi executado porque a criacao falhou.
- Deploy `26443a3` validado em 2026-07-21: Angular local em homologacao criou Aplause com marcador
  `[AUDIT-8.1-HOMOLOG-1784645775199]` (`POST /api/applause` 201, id `applause_qnr4e6m1`) e arquivou
  o registro (`PATCH /api/applause/applause_qnr4e6m1` 200). O bloqueio de data MySQL foi resolvido
  no Render.
- CORS de homologacao validado para `http://localhost:4200`: login Angular, Pessoas, Aplause e
  Auditoria responderam com sucesso contra `https://smartcompliance.onrender.com`.
- Rodada visual React x Angular concluida em viewport 1440x1100 para Dashboard, Compliance, Pessoas
  e Avaliacoes. Nao houve 404 nas rotas testadas, e as APIs principais retornaram 200 nos dois
  frontends. Evidencias salvas em `frontend-angular/test-results/visual-parity-8-1/`.
- Diferenca visual registrada: React publicado usa tema escuro executivo, cards mais densos, atalhos
  e submodulos expostos na primeira dobra; Angular local usa tema claro operacional, com fluxos
  equivalentes em estrutura mais simples. Tratar como decisao de aceite visual antes do corte, nao
  como bloqueio funcional.
- Cenarios reais de erro de Avaliacoes reexecutados contra homologacao, sem mocks: publicacao de
  questionario inexistente retornou 400, notificacao de ciclo inexistente retornou 400, envio de
  assignment inexistente retornou 400, tentativa de publicacao por colaborador retornou 403 e
  importacao de CSV invalido retornou draft 201 com erros de validacao por linha.
- Validacao tecnica Power BI/RLS em homologacao concluida: admin acessou
  `GET /api/analytics/powerbi/evaluation-results` com 200; RH acessou
  `GET /api/analytics/powerbi/rls-viewers` com 200; gestor e colaborador receberam 403; dataset
  retornou `evaluationResults=8`, `questionResults=6`, `rlsViewers=5`, flags de privacidade sem
  comentarios brutos/respostas individuais e sem campos sensiveis obvios serializados.
- Comparação visual pública: o login Angular é claro e compacto, enquanto a raiz do React é uma
  experiência escura/executiva; além disso, `https://smart-compliance-frontend.vercel.app/login`
  responde 404, indicando falta de fallback SPA para deep links no deploy React.

#### Decisão de escopo: Power BI/Analytics

Power BI permanece uma **integracao futura de dados**, fora do corte de UI Angular e fora do aceite
da migracao atual. Nao existe relatorio Power BI consumindo esses dados no momento; por enquanto,
trabalharemos apenas com dashboards nativos da propria aplicacao. O React tambem nao possui rota,
embed ou chamada aos endpoints `/api/analytics/*`. O corte preservara os contratos tecnicos ja
existentes sem criar uma tela Angular duplicada.

### Inventario de contratos mapeados para Angular

Desenvolvimento:

- `GET /api/development/records`
- `POST /api/development/records`
- `PATCH /api/development/records/:recordId`
- `GET /api/development/plans`
- `POST /api/development/plans`
- `PATCH /api/development/plans/:planId`
- `PATCH /api/development/plans/:planId/progress`
- `GET /api/development/integrations/learning-events`
- `POST /api/development/integrations/learning-events/:eventId/apply`

Aplause:

- `GET /api/applause`
- `POST /api/applause`
- `PATCH /api/applause/:applauseId`

Avaliacoes:

- `GET /api/evaluations/template`
- `GET /api/evaluations/library`
- `POST/PATCH/DELETE /api/evaluations/library/questions`
- `POST /api/evaluations/library/questions/reorder`
- `GET/POST/PATCH /api/evaluations/questionnaires`
- `GET /api/evaluations/questionnaires/:questionnaireId`
- `POST /api/evaluations/questionnaires/:questionnaireId/publish`
- `POST /api/evaluations/questionnaires/:questionnaireId/archive`
- `POST/PATCH/DELETE /api/evaluations/questionnaire-questions`
- `POST /api/evaluations/questionnaires/:questionnaireId/reorder`
- `GET/POST /api/evaluations/cycles`
- `PATCH /api/evaluations/cycles/:cycleId/status`
- `PATCH /api/evaluations/cycles/:cycleId/config`
- `GET /api/evaluations/cycles/:cycleId/participants`
- `POST /api/evaluations/cycles/:cycleId/notify-delinquents`
- `POST /api/evaluations/cycles/:cycleId/transversal-pairings/force`
- `POST /api/evaluations/cycles/:cycleId/transversal-pairings/:pairingId/block`
- `GET /api/evaluations/assignments`
- `GET /api/evaluations/assignments/:assignmentId`
- `GET /api/evaluations/received-feedback`
- `GET/POST/PATCH /api/evaluations/feedback-requests`
- `GET /api/evaluations/responses`
- `PATCH /api/evaluations/responses/:submissionId/acknowledgement`
- `POST /api/evaluations/submit`
- `GET /api/evaluations/performance-360`
- `GET /api/evaluations/custom-libraries/template`
- `POST /api/evaluations/custom-libraries/import`
- `POST /api/evaluations/custom-libraries/publish`
- `PATCH /api/evaluations/custom-libraries/:libraryId`

### Pontos de Risco Para Corte

1. `WorkspacePageComponent` nao mascara mais `evaluations`, `development` ou `applause`; manter
   a validacao das rotas reais na matriz final antes do corte.
2. O arquivo Playwright atual concentra muitos fluxos em um unico spec. Para regressao 1:1,
   separar specs por modulo reduz risco e facilita rodar subconjuntos.
3. Dashboard e Compliance passaram por validacoes focadas, mas ainda precisam de uma rodada
   visual/funcional contra o React para detalhes de copia, ordem, filtros locais e textos.
4. Avaliacoes e o maior bloco de risco por ter acoes irreversiveis, importacao/download,
   publicacao, respostas e regras por relacionamento. Deve ser quebrado em subfases menores.
5. O criterio final nao deve aceitar somente build verde: precisa matriz por rota, papel,
   endpoint e fluxo critico.

### Proximas Etapas Recomendadas Para Fechar 1:1

1. **Fase 6.1 - Desenvolvimento base:** criar `DevelopmentService`, rota real `/app/development`,
   modelos tipados, carregamento de registros/planos e estados de erro/vazio.
2. **Fase 6.2 - Desenvolvimento operacional:** migrar formularios de registro e PDI, edicao,
   progresso do colaborador e regras de escopo pessoal/equipe/organizacao.
3. **Fase 6.3 - Integracoes de aprendizagem:** migrar fila de eventos, revisao, aplicacao em
   Desenvolvimento/PDI e auditoria.
4. **Fase 6.4 - Aplause:** criar `ApplauseService`, rota real `/app/applause`, formulario,
   listagem, atualizacao/admin, auditoria e testes por perfil.
5. **Fase 6.5 - Testes e aceite da Fase 6:** separar spec Playwright de desenvolvimento/aplause
   e cobrir cria, edita, progresso, fila vazia, erro e restricao por papel.
6. [x] **Fase 7.1 - Avaliacoes base:** migrar servico/modelos, template, ciclos, assignments,
   workspace/tabs e resposta de avaliacao.
7. [x] **Fase 7.2 - Biblioteca e questionarios:** migrar biblioteca, CRUD/reorder de perguntas,
   questionarios, publicacao e arquivamento.
8. [x] **Fase 7.3 - Operacao de ciclos:** migrar participantes, inadimplentes, notificacao,
   filtros por unidade/modalidade e configuracao de ciclo.
9. [x] **Fase 7.4 - Feedbacks e 360:** migrar feedback solicitado/recebido, acknowledgement,
   insights, historico e comparacao de ciclos.
10. [x] **Fase 7.5 - Importacao/publicacao de bibliotecas:** migrar download de template, upload,
    validacao de importacao, publicacao e atualizacao de biblioteca customizada.
11. [x] **Fase 8.1 - Matriz final:** matriz por rota, papel e endpoint registrada; comparacao
    React x Angular, homologacao Aplause, cenarios reais de erro e escopo Power BI futuro validados.
12. [-] **Fase 8.2 - Corte controlado:** Angular publicado, validado e apontado para o dominio
    oficial; falta encerrar a janela de rollback do React apos estabilizacao.

### Checklist de Aceite 1:1

- [ ] Toda secao visivel no menu React tem rota Angular real, sem placeholder.
- [ ] Cada endpoint usado pelo React tem servico Angular tipado ou decisao documentada de exclusao.
- [ ] Cada papel (`admin`, `hr`, `manager`, `employee`, `compliance`) foi testado nas rotas permitidas e proibidas.
- [ ] Estados de carregamento, vazio, erro de API e sucesso estao cobertos por modulo.
- [ ] Formularios preservam campos obrigatorios, valores padrao, normalizacoes e sugestoes automaticas do React.
- [ ] Acoes sensiveis como publicar, arquivar, notificar, importar, responder e atualizar progresso tem teste focado.
- [ ] Auditoria aparece nos modulos onde o React exibe `AuditTrailPanel`.
- [ ] Build Angular, `tsc --noEmit` e Playwright focado passam antes de marcar cada fase.
- [ ] Matriz visual final confere textos, ordem de secoes, filtros e responsividade principal.
- [ ] React permanece disponivel ate aceite final e fim da janela de reversao.

## Estimativa Consolidada

| Fase | Faixa de creditos |
| --- | --- |
| Fase 1: Fundacao | 35-60 |
| Fase 2: Tela-piloto | 15-25 |
| Fase 3: Dashboard | 15-30 |
| Fase 4: Cadastro | 25-40 |
| Fase 5: Compliance e Operacoes | 20-35 |
| Fase 6: Desenvolvimento e Aplause | 15-25 |
| Fase 7: Avaliacoes | 35-65 |
| Fase 8: Qualidade e corte | 20-30 |
| Total previsto | 180-310 |

Usar GPT-5.6 Terra como modelo padrao de implementacao. Usar GPT-5.6 Luna para inventario, analise e ajustes pequenos. Reservar GPT-5.6 Sol para decisoes de arquitetura, depuracao complexa e o modulo de Avaliacoes.

## Contratos Tecnicos

| Assunto | Decisao |
| --- | --- |
| URL da API local | `http://localhost:4000` |
| Token | `localStorage`, chave `smart-compliance-token` |
| Autorizacao | `Authorization: Bearer <token>` |
| Login | `POST /api/auth/login` retorna `token` e `user` |
| Sessao | `GET /api/auth/me` |
| Erros da API | payload `{ error: string }`, convertido em `ApiError` |
| Angular dev | porta `4200` |
| React dev | porta `5173` |
| CORS | `backend/src/config/env.js` inclui as duas portas locais |

## Comandos de Retomada

Em dois terminais separados:

```powershell
cd "E:\Smart Compliance"
npm run dev:backend
```

```powershell
cd "E:\Smart Compliance\frontend-angular"
npm start
```

Validar compilacao:

```powershell
cd "E:\Smart Compliance\frontend-angular"
npm run build
npx tsc --project tsconfig.app.json --noEmit
```

Caso seja necessario reconstruir dependencias Angular:

```powershell
cd "E:\Smart Compliance\frontend-angular"
npm ci --ignore-scripts --no-audit --no-fund
npm rebuild esbuild --foreground-scripts --no-audit --no-fund
npm run build
```

## Diagnostico Rapido

| Sintoma | Verificacao | Acao |
| --- | --- | --- |
| "Nao foi possivel conectar ao servidor" | Backend nao responde em `localhost:4000` | Iniciar `npm run dev:backend` |
| Login retorna CORS | Origem Angular nao aceita pelo backend | Conferir `DEFAULT_CORS_ORIGINS` e `CORS_ORIGIN` |
| Usuario volta ao login ao atualizar | Token ausente ou invalido | Conferir `smart-compliance-token` e `/api/auth/me` |
| Rota de modulo redireciona | Papel nao possui acesso | Conferir `navigation.config.ts` e `section-access.guard.ts` |
| `spawn EPERM` no Codex | Limitacao do ambiente isolado | Executar build e servidores no PowerShell local |
| Falha de esbuild | Dependencias interrompidas | Usar a sequencia de reconstruicao acima |

## Criterio de Conclusao

A migracao funcional termina quando todas as rotas Angular cobrirem os fluxos aprovados do React, os testes criticos passarem, o aceite tecnico for dado e o Angular estiver em producao no dominio oficial.

Status em 2026-07-28: **concluida funcionalmente**. A remocao definitiva do React legado e uma decisao operacional separada, condicionada ao encerramento da janela de rollback.
