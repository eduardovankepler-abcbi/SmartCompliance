# Mapeamento da Onda 4 - Indicadores e Auditoria

Data do mapeamento: 04/08/2026

## Objetivo da etapa

Mapear os indicadores e eventos ja disponiveis no backend/frontend para definir a menor implementacao util do dashboard executivo e da auditoria gerencial.

## Fontes analisadas

- `backend/src/data/storeDashboardOperations.js`
- `backend/src/routes/dashboards.js`
- `backend/src/routes/audit.js`
- `backend/src/data/storeAccess.js`
- `backend/src/data/storeConstants.js`
- `frontend-angular/src/app/features/dashboard/dashboard.service.ts`
- `frontend-angular/src/app/features/dashboard/dashboard-page.component.ts`
- `frontend-angular/src/app/features/audit/audit.service.ts`
- `frontend-angular/src/app/features/audit/audit-trail.component.ts`

## Indicadores ja disponiveis

Dashboard por API:

- Endpoint: `GET /api/dashboards/overview`
- Perfis com acesso: `admin`, `hr`, `manager`
- Filtros atuais: `area`, `timeGrouping`
- Escopos atuais: executivo, equipe e pessoal
- Dados consolidados:
  - pessoas no recorte;
  - assignments pendentes, concluidos e totais;
  - registros de desenvolvimento;
  - reconhecimentos Aplause;
  - satisfacao media por pessoa/area;
  - distribuicao de respostas;
  - mix de avaliacoes por relacionamento;
  - resumo de resultados por relacionamento;
  - saude 360 quando aplicavel;
  - status de assignments;
  - desenvolvimento por tipo;
  - linha do tempo de ciclo por periodo.

Frontend:

- Tela `Dashboard` ja consome `DashboardOverview`.
- UI ja possui areas para leitura executiva, analitica, resultados, desempenho 360, pessoas/areas e compliance/riscos.
- Existe chamada visual para `Incidentes abertos`, mas o backend ainda nao entrega esse indicador no payload.

## Eventos de auditoria ja disponiveis

Endpoint:

- `GET /api/audit-trail`

Perfis com acesso:

- `admin` e `hr`: categorias `user`, `registry`, `competency`, `incident`, `cycle`, `feedback_request`, `applause`, `development`.
- `compliance`: categoria `incident`.
- `manager`: categorias `cycle`, `feedback_request`, `applause`, `development`.

Filtros atuais:

- `category`
- `entityType`
- `entityId`
- `limit`

Categorias registradas:

- usuarios e autenticacao;
- cadastro de pessoas/areas;
- competencias;
- incidentes e evidencias;
- ciclos, questionarios e operacao 360;
- solicitacoes de feedback;
- Aplause;
- PDI, registros de desenvolvimento e integracoes de aprendizagem.

Frontend:

- Componente reutilizavel `AuditTrailComponent`.
- Uso atual em Usuarios, Pessoas, Aplause e Incidentes.
- Ainda nao ha tela gerencial centralizada para auditoria.

## Lacunas para a Onda 4

MVP:

- Adicionar indicadores de compliance/incidentes ao dashboard:
  - incidentes abertos;
  - incidentes vencidos ou proximos do SLA;
  - incidentes concluidos;
  - casos sem responsavel ou sem prontidao de fechamento.
- Adicionar bloco de alertas acionaveis no payload do dashboard:
  - assignments pendentes;
  - PDI `not_started` ou `blocked`;
  - incidentes abertos/vencidos;
  - fila de aprendizagem pendente;
  - auditoria sensivel recente.
- Amadurecer auditoria gerencial:
  - filtro por periodo (`from`, `to`);
  - filtro por `actorUserId` ou ator;
  - filtro por `action`;
  - retorno de `category`, `action`, `entityType`, `entityId` no contrato do frontend.
- Criar ponto de leitura central para auditoria:
  - pagina ou painel gerencial;
  - resumo por categoria;
  - lista de eventos criticos recentes.

Melhoria opcional:

- Incluir idade do ultimo backup no dashboard, caso exista endpoint operacional seguro para isso.
- Incluir status de healthcheck/monitoramento no dashboard executivo.
- Incluir quick links reais nas acoes rapidas do dashboard.
- Exibir tendencia por periodo para incidentes e PDI.

Item futuro:

- SLA configuravel por tipo de incidente.
- Alertas automatizados por e-mail/Slack/Teams.
- Exportacao de status report semanal.
- Politica automatica de retencao e expurgo de logs/evidencias.

## Recomendacao de implementacao

Etapa 2 deve focar em backend primeiro:

1. Expandir `DashboardOverview` com `riskSummary` e `operationalAlerts`.
2. Popular `riskSummary` a partir de incidentes, PDI e learning events.
3. Manter o contrato retrocompativel para nao quebrar a UI atual.
4. Depois adaptar o frontend para renderizar o novo bloco executivo.

Etapa 3 deve focar em auditoria:

1. Expandir filtros da API de auditoria por periodo, ator e acao.
2. Expandir `AuditEntry` no frontend com campos ja retornados pelo backend.
3. Criar painel central de auditoria gerencial ou integrar no dashboard.

## Decisao desta etapa

O mapeamento esta concluido. A menor implementacao util da Onda 4 e adicionar indicadores de risco/alertas operacionais ao dashboard antes de construir uma tela nova de auditoria.
