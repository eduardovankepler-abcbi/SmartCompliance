# Publicacao do Smart Compliance

Este projeto pode ser publicado sem depender da maquina local usando:

- `Frontend`: Vercel
- `Backend`: Render
- `Banco`: MySQL gerenciado

## Arquitetura recomendada

### Frontend

- plataforma recomendada apos a migracao: `Vercel`
- diretorio raiz do servico: `frontend-angular`
- framework: `Angular`
- build QA na Vercel: `npm run build -- --configuration=homolog`
- build producao local: `npm run build:production-local`
- output directory: `dist/frontend-angular/browser`
- SPA rewrite: `/*` para `/index.html`

Observacao: o app React em `frontend/` foi preservado para historico/transicao. Para ver a
padronizacao visual ABC, o deploy precisa apontar para `frontend-angular/`.

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
- `LOG_FORMAT=json`
- `AUTH_SECRET=<gerar-um-valor-forte>`
- `MYSQL_HOST=<host-do-banco>` (ou `DB_HOST`)
- `MYSQL_PORT=<porta-do-banco>` (ou `DB_PORT`)
- `MYSQL_USER=<usuario-do-banco>` (ou `DB_USER`)
- `MYSQL_PASSWORD=<senha-do-banco>` (ou `DB_PASSWORD`)
- `MYSQL_DATABASE=<nome-do-banco>` (ou `DB_NAME`)
- `MYSQL_SSL_MODE=required` quando o provedor exigir SSL
- `MYSQL_SSL_REJECT_UNAUTHORIZED=false` para homologacao temporaria em provedores como Aiven
- `CORS_ORIGIN=<url-do-frontend-publicado>` (ou `CORS_ORIGINS` em CSV)
- `CORS_ADDITIONAL_ORIGINS=<urls-extras-em-csv>` quando houver dominio customizado ou preview adicional da Vercel

Observacao:

- em producao, `AUTH_SECRET` nao pode ficar no valor padrao
- `PORT` normalmente e fornecida pela propria plataforma
- o backend ja libera por padrao `localhost`, `127.0.0.1`, `smart-compliance-angular*.vercel.app` e `smartcompliance*.vercel.app`

### Frontend

O Angular usa dois alvos principais:

```ts
// homologacao Vercel
apiUrl: 'https://smartcompliance.onrender.com'

// producao local
apiUrl: '/api'
```

Na producao local, o servidor web/proxy deve encaminhar `/api` para o backend Node.

## Banco de dados

### Implantacao das correcoes de seguranca e persistencia

1. No Render, confirmar o servico, revisao publicada, disco montado e `DATA_DIR` efetivo.
   A ausencia de disco no `render.yaml` nao comprova ausencia no painel.
2. Antes de reiniciar, adicionar disco ou mudar `DATA_DIR`, preservar os JSONs atuais
   da instancia em execucao. Adicionar disco dispara deploy e pode perder arquivos
   do armazenamento efemero. Nao encerrar a instancia antes dessa preservacao.
3. Confirmar que os arquivos preservados foram recuperados no diretorio persistente;
   criar backup conjunto consistente de SQL e JSONs em janela sem gravacoes.
   A homologacao local nao substitui essa verificacao dos dados de producao.
4. Publicar backend e Angular na mesma janela: a troca de senha passa a devolver
   token renovado. Sessoes antigas exigirao novo login. Nao executar seed ou testes
   de escrita no banco real como parte da publicacao.
5. Validar `/health`, login, troca de senha por conta de homologacao autorizada e
   preservacao dos arquivos apos o deploy. Registrar a revisao realmente publicada.
6. Se a validacao falhar, interromper a liberacao; reverter somente o codigo para
   a revisao anterior, preservando o disco e os dados. Restore de producao exige
   procedimento especifico e nao deve ser automatico.

Referencia: [discos persistentes do Render](https://render.com/docs/disks).

Antes de usar o backend publicado com `mysql`, execute a estrutura do banco:

1. `backend/db/schema.sql`
2. migrations pendentes aplicaveis ao banco existente

Nao execute seed demo no banco definitivo. O `backend/db/seed.sql` e protegido por uma variavel de sessao e deve ficar restrito a QA/homologacao autorizada.

Se voce ja tem um banco existente (tabelas ja criadas) e atualizou o codigo, aplique tambem:

- `backend/db/migrations/2026-04-01-evaluation-cycle-config.sql` (switches de ciclo + questionarios)
- `backend/db/migrations/2026-05-05-evaluation-individual-questionnaires.sql` (questionarios individuais + politicas de acesso)
- `backend/db/migrations/2026-08-04-auth-production-hardening.sql` (troca obrigatoria de senha + data da ultima troca)

Antes de aplicar migrations em banco existente, gere backup:

Pare todas as instancias do backend antes do backup e da restauracao. A opcao
`--backend-stopped` declara essa condicao; ela nao interrompe o servico automaticamente.
Use o mesmo `DATA_DIR` do backend, em armazenamento persistente. Sem configuracao,
o diretorio utilizado e `backend/.data`.

```bash
cd backend
npm run backup:mysql -- --backend-stopped
```

Em Windows ou servidores sem MySQL no `PATH`, configure `MYSQLDUMP_PATH` e
`MYSQL_CLIENT_PATH` apontando para os executaveis do cliente MySQL.

Para validar recuperacao em homologacao:

```bash
cd backend
npm run restore:mysql -- caminho/do/backup.sql --backend-stopped
```

Preserve o SQL e o arquivo complementar `<backup.sql>.state.json` juntos: este ultimo
contem bibliotecas e respostas anonimas. O restore verifica o conjunto antes de
alterar o banco e rejeita backups SQL antigos sem o complemento. Nao reinicie o
backend se a restauracao falhar; valide banco e arquivos em homologacao primeiro.

Teste automatizado com MySQL temporario local: defina `SC_TEST_MYSQL_PORT` e execute
`node backend/tests/mysql-backup-integration.test.mjs` a partir da raiz do projeto.
O teste aceita apenas `127.0.0.1`, porta diferente de 3306 e servidor cujo diretorio
seja `sc-mysql-homolog-<identificador hexadecimal>`. Usa dados sinteticos, compara
todas as tabelas restauradas e os dois JSONs e verifica rejeicao de SQL corrompido.
Nao utiliza `backend/.env`. Encerre a instancia temporaria ao terminar.

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

Para homologar especificamente a frente de `questionarios individuais` em MySQL real, siga tambem:

- `docs/validacao-mysql-questionarios-individuais.md`
- `docs/checklist-homologacao-render-mysql.md`
- `docs/checklist-homologacao-aiven.md` se o banco estiver na Aiven

## Ordem de publicacao

1. Suba o codigo para um repositorio Git.
2. Publique o backend no Render.
3. Configure as variaveis de ambiente do backend.
4. Execute `schema.sql` e migrations pendentes no banco. Use seed demo apenas em QA/homologacao autorizada.
5. Valide o endpoint `GET /health`.
6. Para QA, publique o frontend Angular na Vercel usando `frontend-angular`.
7. Para producao local, publique `dist/frontend-angular/browser` no servidor web local.
8. Atualize `CORS_ORIGIN` ou `CORS_ADDITIONAL_ORIGINS` no backend com qualquer URL final do frontend fora dos dominios padrao.
9. Rode um teste de login e navegacao completa.

## Checklist de validacao

- `GET /health` responde `status: ok`
- `GET /health` responde `ready: true`
- `GET /health` retorna header `X-Request-Id`
- logs do backend aparecem em JSON quando `LOG_FORMAT=json`
- login funciona
- usuario criado/resetado retorna `mustChangePassword`
- primeiro acesso redireciona para `/change-password`
- usuario com senha provisoria nao acessa `/app` antes da troca
- backup foi gerado e restore foi testado em homologacao
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

- proxy `/api` do frontend local para o backend
- `CORS_ORIGIN`
- `STORAGE_MODE=mysql`
- `AUTH_SECRET`

Se esses 4 pontos estiverem corretos, o deploy tende a ser direto.

## Arquivos de apoio no projeto

- `backend/.env.production.example`
- `docs/checklist-producao-local.md`
- `render.yaml`

## Arquitetura publicada hoje

Para evitar ambiguidade, o desenho operacional atual do projeto e:

- QA: `frontend-angular` na Vercel, `backend` no Render, `mysql` gerenciado externo
- Producao local planejada: `frontend-angular` e `backend` no servidor local, com MySQL definitivo autorizado

Nao existe dependencia operacional da Railway no fluxo atual.


