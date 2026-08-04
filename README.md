# Smart Compliance MVP

MVP local para uma plataforma de compliance, feedback, desenvolvimento profissional e reconhecimento formal.

## Stack

- Backend: Node.js + Express
- Frontend oficial: Angular 21
- Frontend legado: React + Vite em `frontend/`, preservado somente como rollback temporario
- Banco alvo: MySQL
- Publicacao recomendada:
  - Backend no Render
  - Frontend Angular na Vercel
  - Banco MySQL gerenciado (Aiven ou provedor equivalente)

## Módulos do MVP

- Canal de Ética e Conduta
- Avaliação e Feedback
- Desenvolvimento Profissional
- Reconhecimento Formal (`Aplause`)
- Indicadores Internos e Governança
- Dashboards de Clima, Engajamento e Evolução Organizacional
- Fluxo para colaboradores internos, consultores e terceiros

## Estrutura do projeto

- `backend/`: API REST
- `frontend-angular/`: aplicacao Angular oficial em producao
- `frontend/`: aplicacao React legada, mantida apenas para rollback e comparacao historica
- `docs/`: visão funcional e decisões do MVP
- `docs/evolucao-recomendada.md`: trilha recomendada para as próximas rodadas
- `docs/mapa-retomada-operacional.md`: guia rápido para retomar por módulo e tipo de problema
- `docs/deploy-publicacao.md`: guia de publicação sem depender da máquina local
- `docs/validacao-mysql-questionarios-individuais.md`: checklist de homologação MySQL para avaliações individualizadas
- `docs/checklist-homologacao-render-mysql.md`: passo a passo operacional para Render + MySQL gerenciado
- `docs/checklist-homologacao-aiven.md`: adaptação prática da homologação para Aiven for MySQL
- `docs/fechamento-onda-2-compliance-incidentes.md`: aceite da Onda 2 de Compliance/Incidentes

## Como rodar localmente

Requer Node.js 20+ e npm instalados.

1. Instale as dependências:

```bash
npm install
npm --prefix backend install
npm --prefix frontend-angular install
```

2. Configure o backend:

```bash
copy backend\\.env.example backend\\.env
```

3. Para iniciar com dados locais em memória:

```bash
npm run dev:backend
npm run dev:frontend
```

`npm run dev:frontend` inicia o Angular em `http://localhost:4200`.
Para abrir o React legado, use `npm run dev:frontend:legacy`.

4. Para validar rapidamente o estado atual do projeto:

```bash
npm run verify
```

5. Para validar a jornada real no navegador com E2E:

```bash
npm run test:e2e
```

Isso sobe backend + frontend localmente, abre o navegador headless do Playwright e cobre:

- login por perfil
- navegacao principal
- avaliacao de satisfacao do colaborador
- operacao e biblioteca de avaliacoes para RH

6. Para usar MySQL:

- Crie um banco no MySQL.
- Execute o script `backend/db/schema.sql`.
- Execute o script `backend/db/seed.sql`.
- Ajuste `STORAGE_MODE=mysql` e as variáveis do banco em `backend/.env`.

## Login demo

- `gestor@demo.local` / `demo123`
- `admin@demo.local` / `demo123`
- `colaborador1@demo.local` / `demo123`
- `colaborador2@demo.local` / `demo123`

## Evolucao da fase 2

- autenticacao com token assinado
- perfis de acesso por papel
- schema MySQL expandido
- seed inicial para pessoas, usuarios, ciclos e assignments
- fluxo real de avaliacoes com distribuicao, formulario e submissao

## Módulo de avaliações

O desenho do MVP segue uma abordagem híbrida:

- perguntas-base padronizadas da empresa
- blocos por competência
- poucas perguntas extras opcionais do gestor
- escala de `1` a `5` totalmente rotulada
- comentário obrigatório em avaliações extremas

## Estado atual

O projeto já possui validação local por testes, build do frontend e uma suíte E2E mínima. Antes de cada nova rodada, use `npm run verify` e, quando a mudança tocar a interface, `npm run test:e2e`.

## Publicação

O frontend oficial publicado e o Angular em `https://smart-compliance-frontend.vercel.app`.
O roteiro historico de publicacao está em `docs/deploy-publicacao.md`; para detalhes do corte React -> Angular, consulte `MIGRATION_HANDOFF.md`.

Resumo operacional atual:

- frontend publicado na Vercel
- backend publicado no Render
- banco em MySQL gerenciado com `STORAGE_MODE=mysql`
