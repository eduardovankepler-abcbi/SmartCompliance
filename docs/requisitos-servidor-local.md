# Requisitos do servidor local

Objetivo: consolidar as informacoes que precisam estar decididas antes de instalar o Smart Compliance no servidor definitivo. Nao registre senhas, tokens ou dumps neste arquivo.

## 1. Identificacao do ambiente

| Item | Valor a preencher | Observacao |
| --- | --- | --- |
| Responsavel tecnico |  | Pessoa que tera acesso ao servidor durante a janela. |
| Sistema operacional |  | Ex.: Windows Server, Ubuntu Server, Debian. |
| Dominio ou IP final |  | URL que entrara em `CORS_ORIGIN`. |
| Acesso interno/externo |  | Definir se sera LAN, VPN ou internet. |
| Porta publica |  | Normalmente 443 com HTTPS. |
| Janela de implantacao |  | Data e horario com possibilidade de rollback. |

## 2. Execucao da aplicacao

| Item | Decisao | Criterio minimo |
| --- | --- | --- |
| Node.js |  | Versao compativel com o projeto e disponivel no PATH. |
| Gerenciador de processo |  | Serviço do Windows, PM2, systemd ou equivalente. |
| Porta do backend |  | Deve bater com `PORT` no `.env`; sugestao atual: 4000. |
| Usuario do processo |  | Usuario sem privilegio administrativo quando possivel. |
| Diretorio da aplicacao |  | Caminho onde o repositorio/build ficara instalado. |
| Politica de logs |  | Capturar stdout/stderr JSON do backend. |

## 3. Proxy e HTTPS

| Item | Decisao | Criterio minimo |
| --- | --- | --- |
| Servidor web/proxy |  | Nginx, IIS, Apache, Caddy ou equivalente. |
| TLS/HTTPS |  | Certificado valido para a URL final. |
| Rota `/api` |  | Encaminhar para `http://127.0.0.1:<PORT>/api`. |
| Rota `/health` |  | Encaminhar para o backend para monitoramento. |
| SPA fallback |  | Rotas fora de `/api` devem servir `index.html`. |
| Tamanho de upload |  | Confirmar limite suficiente para importacoes previstas. |

## 4. Banco MySQL

| Item | Decisao | Criterio minimo |
| --- | --- | --- |
| Provedor |  | Aiven ou MySQL autorizado pela operacao. |
| Host e porta |  | Preencher no `.env`, sem registrar senha neste documento. |
| Banco |  | Nome definitivo em `MYSQL_DATABASE`. |
| Usuario |  | Usuario com permissao necessaria para schema/migrations. |
| SSL |  | Definir `MYSQL_SSL_MODE`; Aiven normalmente exige SSL. |
| Cliente MySQL |  | `mysql` e `mysqldump` no PATH ou paths absolutos. |
| Backup validado |  | Backup e restore testados antes do uso real. |

## 5. Diretorios persistentes

| Finalidade | Variavel | Caminho a preencher | Observacao |
| --- | --- | --- | --- |
| Dados locais complementares | `DATA_DIR` |  | Guarda bibliotecas customizadas e respostas anonimas. |
| Backups | `BACKUP_DIR` |  | Deve ter permissao restrita e retencao definida. |
| Build Angular publicado |  |  | Conteudo de `frontend-angular/dist/frontend-angular/browser`. |
| Logs do processo |  |  | Definir retencao e acesso. |

## 6. Variaveis obrigatorias do backend

Preencher no `.env` do backend no servidor definitivo:

```env
NODE_ENV=production
PORT=4000
APP_VERSION=release-YYYYMMDD
LOG_FORMAT=json
STORAGE_MODE=mysql
TRUST_PROXY=1
AUTH_SECRET=<valor forte com 32+ caracteres>
MYSQL_HOST=<host definitivo>
MYSQL_PORT=<porta definitiva>
MYSQL_USER=<usuario definitivo>
MYSQL_PASSWORD=<senha definitiva>
MYSQL_DATABASE=<banco definitivo>
MYSQL_SSL_MODE=<required ou disabled conforme o banco>
MYSQL_SSL_REJECT_UNAUTHORIZED=<true/false conforme certificado>
CORS_ORIGIN=<url final do frontend>
DATA_DIR=<diretorio persistente de dados locais>
BACKUP_DIR=<diretorio persistente de backups>
MYSQLDUMP_PATH=<mysqldump ou caminho absoluto>
MYSQL_CLIENT_PATH=<mysql ou caminho absoluto>
```

Depois de preencher, rodar no servidor:

```bash
cd backend
npm run validate:production-config
```

## 7. Comandos de preparo recomendados

No pacote/revisao que sera instalado:

```bash
cd backend
npm test
npm run validate:production-config

cd ../frontend-angular
npm run build:production-local
```

Antes de migrar dados ou mexer em banco existente:

```bash
cd backend
npm run backup:mysql -- --backend-stopped
```

Preserve o arquivo `.sql` e o `.sql.state.json` juntos.

## 8. Decisoes pendentes antes da implantacao

- [ ] Sistema operacional definitivo.
- [ ] Dominio/IP e HTTPS.
- [ ] Proxy web escolhido.
- [ ] Forma de iniciar/reiniciar o backend.
- [ ] Diretorios definitivos para `DATA_DIR` e `BACKUP_DIR`.
- [ ] Banco MySQL definitivo e politica SSL.
- [ ] Politica de backup e retencao.
- [ ] Usuario inicial real, sem depender de seed demo.
- [ ] Procedimento de rollback aprovado.
