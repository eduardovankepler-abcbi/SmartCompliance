# Publicacao do Smart Compliance

Este projeto pode ser publicado sem depender da maquina local usando:

- `Frontend`: Vercel
- `Backend`: Render
- `Banco`: MySQL gerenciado

## Arquitetura recomendada

### Frontend

- plataforma: `Vercel`
- diretorio raiz do projeto na Vercel: `frontend`
- framework: `Vite`
- build command: `npm run build`
- output directory: `dist`

### Backend

- plataforma: `Render`
- diretorio raiz do servico: `backend`
- build command: `npm install`
- start command: `npm run start`
- health check: `/health`

### Banco de dados

- usar MySQL gerenciado
- pode ser o MySQL que voce ja possui ou outro provedor externo compatível

## Variaveis de ambiente

### Backend

Configurar no servico do Render:

- `NODE_ENV=production`
- `STORAGE_MODE=mysql`
- `AUTH_SECRET=<gerar-um-valor-forte>`
- `MYSQL_HOST=<host-do-banco>` (ou `DB_HOST`)
- `MYSQL_PORT=<porta-do-banco>` (ou `DB_PORT`)
- `MYSQL_USER=<usuario-do-banco>` (ou `DB_USER`)
- `MYSQL_PASSWORD=<senha-do-banco>` (ou `DB_PASSWORD`)
- `MYSQL_DATABASE=<nome-do-banco>` (ou `DB_NAME`)
- `MYSQL_SSL_MODE=required` quando o provedor exigir SSL
- `MYSQL_SSL_REJECT_UNAUTHORIZED=false` para homologacao temporaria em provedores como Aiven
- `CORS_ORIGIN=<url-do-frontend-publicado>` (ou `CORS_ORIGINS` em CSV)

Observacao:

- em producao, `AUTH_SECRET` nao pode ficar no valor padrao
- `PORT` normalmente e fornecida pela propria plataforma

### Frontend

Configurar na Vercel:

- `VITE_API_URL=<url-publica-do-backend>`

Exemplo:

```bash
VITE_API_URL=https://smartcompliance.onrender.com
```

## Banco de dados

Antes de usar o backend publicado com `mysql`, execute:

1. `backend/db/schema.sql`
2. `backend/db/seed.sql`

Se voce ja tem um banco existente (tabelas ja criadas) e atualizou o codigo, aplique tambem:

- `backend/db/migrations/2026-04-01-evaluation-cycle-config.sql` (switches de ciclo + questionarios)

Opcional:

- o backend tenta aplicar automaticamente essa migracao quando `AUTO_MIGRATE_DB` nao esta desativado

Voce pode fazer isso:

- por um cliente MySQL local
- pelo console SQL do provedor
- por um job inicial de provisionamento

Observacao pratica:

- em provedores como Aiven, o banco e frequentemente criado com nome padrao como `defaultdb`
- use exatamente os valores fornecidos pelo provedor para `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD` e `MYSQL_DATABASE`
- se o provedor exigir SSL, mantenha `MYSQL_SSL_MODE=required`

## Ordem de publicacao

1. Suba o codigo para um repositorio Git.
2. Publique o backend no Render.
3. Configure as variaveis de ambiente do backend.
4. Execute `schema.sql` e `seed.sql` no banco.
5. Valide o endpoint `GET /health`.
6. Publique o frontend na Vercel.
7. Configure `VITE_API_URL` apontando para o backend publicado.
8. Atualize `CORS_ORIGIN` no backend com a URL final do frontend.
9. Rode um teste de login e navegacao completa.

## Checklist de validacao

- `GET /health` responde `status: ok`
- login funciona
- leituras do dashboard carregam
- modulo de avaliacoes responde
- importacao/exportacao da biblioteca funciona
- upload de arquivo nao falha por CORS

## Publicacao minima recomendada

Se quiser publicar primeiro uma versao de demonstracao:

- `backend` em `memory` para teste rapido
- `frontend` na Vercel

Mas para nao depender da sua maquina de forma confiavel, o recomendado e:

- `backend` publicado no Render
- `mysql` gerenciado
- `frontend` publicado na Vercel

## Risco principal

O principal ponto de atencao na publicacao e alinhar:

- `VITE_API_URL`
- `CORS_ORIGIN`
- `STORAGE_MODE=mysql`
- `AUTH_SECRET`

Se esses 4 pontos estiverem corretos, o deploy tende a ser direto.

## Arquivos de apoio no projeto

- `backend/.env.production.example`
- `frontend/.env.production.example`
- `render.yaml`

## Arquitetura publicada hoje

Para evitar ambiguidade, o desenho operacional atual do projeto e:

- `frontend` na Vercel
- `backend` no Render
- `mysql` gerenciado externo

Nao existe dependencia operacional da Railway no fluxo atual.
