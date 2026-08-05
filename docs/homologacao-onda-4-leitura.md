# Homologacao Onda 4 - Leitura Nao Destrutiva

Data: 05/08/2026

## Objetivo

Validar a prontidao de leitura da Onda 4 sem criar ou alterar dados funcionais amplos em producao.

## Escopo Validado

- Healthcheck do backend publicado.
- Backend publicado conectado em MySQL.
- Backend local/in-process usando configuracao MySQL do `.env`.
- Dashboard executivo por perfil autorizado.
- Auditoria gerencial por perfil autorizado.
- Bloqueio de dashboard e auditoria para colaborador.
- Disponibilidade HTTP dos frontends publicados.

Observacao: o fluxo de login registra auditoria `login_success`. Esta foi a unica mutacao esperada da rodada.

## Comandos Executados

### API publicada

```bash
cd backend
npm run homologate:wave4:readonly
```

Resultado:

- `status`: `passed`
- `mode`: `remote`
- `baseUrl`: `https://smartcompliance.onrender.com`
- `health.status`: `ok`
- `health.ready`: `true`
- `health.storageMode`: `mysql`
- `health.database`: `ok`
- cards do dashboard admin: `6`
- alertas operacionais admin: `2`
- cards do dashboard gestor: `6`
- eventos de auditoria admin: `20`
- eventos de auditoria compliance: `13`
- colaborador bloqueado no dashboard: `true`
- colaborador bloqueado na auditoria: `true`

### API local com MySQL configurado

```powershell
cd backend
$env:HOMOLOGATION_LOCAL='true'; npm run homologate:wave4:readonly
```

Resultado:

- `status`: `passed`
- `mode`: `local`
- `health.status`: `ok`
- `health.ready`: `true`
- `health.storageMode`: `mysql`
- `health.database`: `ok`
- cards do dashboard admin: `6`
- alertas operacionais admin: `2`
- cards do dashboard gestor: `6`
- eventos de auditoria admin: `20`
- eventos de auditoria compliance: `13`
- colaborador bloqueado no dashboard: `true`
- colaborador bloqueado na auditoria: `true`

### Disponibilidade publica sem credenciais

Validados via `fetch` do Node:

- `https://smart-compliance-frontend.vercel.app`: HTTP `200`, `text/html`.
- `https://smart-compliance-angular.vercel.app`: HTTP `200`, `text/html`.
- `https://smartcompliance.onrender.com/health`: HTTP `200`, `application/json`.

### Build frontend

```bash
cd frontend-angular
npm run build
```

Resultado: build Angular concluido com sucesso.

## Pendencia Controlada

O teste Playwright contra o frontend publicado com login real nao foi executado nesta rodada porque enviaria credenciais para um destino externo. Para executar:

```bash
cd frontend-angular
npm run e2e:published
```

Requisito: aprovacao explicita para enviar credenciais demo ao frontend publicado.

## Decisao

Status da etapa: `Amarelo`.

Justificativa:

- A API publicada e a leitura local/MySQL passaram.
- A disponibilidade publica do frontend passou.
- A validacao automatizada de login/navegacao no frontend publicado ainda depende de aprovacao explicita.

## Proximo Passo

Executar o teste publicado com aprovacao explicita ou realizar a mesma navegacao manualmente no navegador, registrando evidencia visual no status report.
