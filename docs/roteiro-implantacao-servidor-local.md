# Roteiro de implantacao no servidor local

Use este roteiro depois de preencher `docs/requisitos-servidor-local.md`. Os comandos abaixo usam placeholders entre `<...>` e devem ser adaptados ao sistema operacional e ao proxy escolhidos.

## 1. Preparar pacote da revisao

Na maquina de build ou no proprio servidor:

```bash
git clone <repositorio-smart-compliance> smart-compliance
cd smart-compliance
git checkout <commit-aprovado>
```

Validar a revisao antes de copiar para o servidor definitivo:

```bash
cd backend
npm test

cd ../frontend-angular
npm run build:production-local
```

O frontend publicado deve sair em:

```text
frontend-angular/dist/frontend-angular/browser
```

## 2. Preparar diretorios no servidor

Criar os diretorios definidos no levantamento:

```text
<APP_DIR>
<DATA_DIR>
<BACKUP_DIR>
<FRONTEND_PUBLIC_DIR>
<LOG_DIR>
```

Criterios minimos:

- o usuario do processo Node precisa ler `<APP_DIR>` e escrever em `<DATA_DIR>`;
- o usuario que executa backup precisa escrever em `<BACKUP_DIR>`;
- `<BACKUP_DIR>` nao deve ser servido publicamente pelo proxy;
- `<FRONTEND_PUBLIC_DIR>` deve receber o conteudo de `dist/frontend-angular/browser`.

## 3. Configurar backend

No servidor, criar `backend/.env` a partir de `backend/.env.production.example`.

Campos que nao podem ficar com placeholder:

```env
APP_VERSION=<commit-ou-release>
AUTH_SECRET=<valor forte>
MYSQL_HOST=<host>
MYSQL_PORT=<porta>
MYSQL_USER=<usuario>
MYSQL_PASSWORD=<senha>
MYSQL_DATABASE=<banco>
MYSQL_SSL_MODE=<required|disabled>
MYSQL_SSL_REJECT_UNAUTHORIZED=<true|false>
CORS_ORIGIN=<url-final>
DATA_DIR=<DATA_DIR>
BACKUP_DIR=<BACKUP_DIR>
MYSQLDUMP_PATH=<mysqldump-ou-caminho>
MYSQL_CLIENT_PATH=<mysql-ou-caminho>
```

Validar antes de iniciar:

```bash
cd <APP_DIR>/backend
npm run validate:production-config
```

Se falhar, corrigir o `.env` antes de continuar.

## 4. Preparar banco

Para banco novo:

```bash
mysql --host=<MYSQL_HOST> --port=<MYSQL_PORT> --user=<MYSQL_USER> --password <MYSQL_DATABASE> < backend/db/schema.sql
```

Depois aplique migrations pendentes conforme o estado do banco. Nao execute seed demo no banco definitivo sem decisao explicita.

Para banco existente:

1. parar o backend;
2. gerar backup;
3. aplicar migrations pendentes;
4. validar `/health` depois da subida.

Backup com backend parado:

```bash
cd <APP_DIR>/backend
npm run backup:mysql -- --backend-stopped
```

Preservar juntos:

```text
<backup>.sql
<backup>.sql.state.json
```

## 5. Publicar frontend

Copiar o conteudo de:

```text
frontend-angular/dist/frontend-angular/browser
```

para:

```text
<FRONTEND_PUBLIC_DIR>
```

Validar que o build local de producao usa `/api`:

```bash
rg "apiUrl|/api|smartcompliance.onrender.com|localhost:4000" frontend-angular/dist/frontend-angular/browser
```

Esperado:

- pode aparecer `/api`;
- nao deve aparecer `smartcompliance.onrender.com` no build de producao local;
- nao deve aparecer `localhost:4000` no build de producao local.

## 6. Configurar proxy

Regras obrigatorias:

```text
/health -> http://127.0.0.1:<PORT>/health
/api/*  -> http://127.0.0.1:<PORT>/api/*
/*      -> <FRONTEND_PUBLIC_DIR>/index.html quando arquivo estatico nao existir
```

O proxy tambem deve:

- servir HTTPS na URL final;
- preservar headers necessarios para `TRUST_PROXY=1`;
- permitir upload no tamanho definido pelo projeto;
- nao expor `.env`, backups, logs ou diretorios internos.


### Exemplo Nginx

Adaptar `<DOMINIO_FINAL>`, `<FRONTEND_PUBLIC_DIR>` e `<PORT>`:

```nginx
server {
  listen 443 ssl http2;
  server_name <DOMINIO_FINAL>;

  root <FRONTEND_PUBLIC_DIR>;
  index index.html;

  client_max_body_size 25m;

  location = /health {
    proxy_pass http://127.0.0.1:<PORT>/health;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:<PORT>/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~ /\.(env|git) {
    deny all;
  }
}
```

### Exemplo Caddy

Adaptar `<DOMINIO_FINAL>`, `<FRONTEND_PUBLIC_DIR>` e `<PORT>`:

```caddyfile
<DOMINIO_FINAL> {
  root * <FRONTEND_PUBLIC_DIR>
  encode gzip zstd

  reverse_proxy /health 127.0.0.1:<PORT>
  reverse_proxy /api/* 127.0.0.1:<PORT>

  @static file
  handle @static {
    file_server
  }

  handle {
    rewrite * /index.html
    file_server
  }
}
```

### Exemplo IIS

No IIS, configure o site apontando para `<FRONTEND_PUBLIC_DIR>` e use URL Rewrite + ARR:

```xml
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Backend health" stopProcessing="true">
          <match url="^health$" />
          <action type="Rewrite" url="http://127.0.0.1:<PORT>/health" />
        </rule>
        <rule name="Backend API" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:<PORT>/api/{R:1}" />
        </rule>
        <rule name="Angular SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

Antes de usar IIS, confirme que ARR proxy esta habilitado e que arquivos sensiveis como `.env`, backups e logs nao estao dentro do diretorio publico.

## 7. Iniciar backend

A forma exata depende do gerenciador escolhido.

Comando base do processo:

```bash
cd <APP_DIR>/backend
npm run start
```

Criterios minimos do gerenciador:

- iniciar automaticamente apos reboot;
- reiniciar em falha;
- registrar stdout/stderr;
- executar com usuario operacional, nao administrador/root quando possivel;
- carregar variaveis do `.env` correto.

## 8. Validar pos-subida

Validacao tecnica:

```bash
curl -i <URL_FINAL>/health
```

Esperado:

```json
{
  "status": "ok",
  "ready": true,
  "storageMode": "mysql",
  "database": "ok"
}
```

Validacao funcional no navegador:

- login com usuario autorizado;
- troca de senha quando `mustChangePassword=true`;
- dashboard executivo;
- pessoas/areas/competencias com perfil autorizado;
- compliance;
- feedback;
- aplausos;
- auditoria com perfil autorizado.

## 9. Rollback

Rollback de codigo:

1. voltar backend para `<commit-anterior>`;
2. restaurar build frontend anterior em `<FRONTEND_PUBLIC_DIR>`;
3. reiniciar backend;
4. validar `/health` e login.

Rollback de dados:

1. manter backend parado;
2. usar apenas backup validado;
3. restaurar SQL e `.state.json` juntos;
4. validar em homologacao antes de repetir no banco definitivo.

Nao fazer restore direto em producao durante investigacao sem confirmar causa e impacto.

## 10. Evidencias da implantacao

Registrar fora de arquivos com segredos:

- commit implantado;
- horario de inicio e fim;
- responsavel tecnico;
- resultado de `validate:production-config`;
- resultado de `/health`;
- fluxos funcionais validados;
- caminho do backup gerado, sem anexar credenciais;
- decisao de rollback, se houver.
