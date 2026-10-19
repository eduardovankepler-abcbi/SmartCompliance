# Configuracao de producao local

Antes de iniciar o backend no servidor definitivo, configure o `.env` de producao e rode:

```bash
cd backend
npm run validate:production-config
```

O validador confere `NODE_ENV=production`, `STORAGE_MODE=mysql`, `AUTH_SECRET` forte, variaveis `MYSQL_*`, `CORS_ORIGIN` sem wildcard e formato basico de porta. Para MySQL remoto, ele exige `MYSQL_SSL_MODE=verify-full`, `MYSQL_SSL_REJECT_UNAUTHORIZED=true` e a CA em `MYSQL_SSL_CA` ou `MYSQL_SSL_CA_PEM`. Ele nao imprime segredos.

Para MySQL instalado no mesmo servidor, TLS pode permanecer desabilitado somente se o banco estiver inacessivel pela rede externa. Para qualquer banco remoto, use a CA fornecida pelo provedor e nao aceite certificados nao verificados.

Para producao local com frontend e backend no mesmo dominio, o frontend Angular production usa `/api`; configure o proxy/servidor web para encaminhar `/api` ao backend.

As sessoes do navegador usam o cookie HttpOnly configurado por `AUTH_COOKIE_*`; nao grave tokens em `localStorage`. Quando frontend e backend estiverem em origens diferentes, use `AUTH_COOKIE_SAME_SITE=none`, `AUTH_COOKIE_SECURE=true` e inclua somente a origem exata do frontend em `CORS_ORIGIN`. A API rejeita operacoes mutaveis cujo cabecalho `Origin` nao corresponda a essa lista.

No servidor definitivo, aplique migrations com uma conta administrativa antes do deploy e mantenha `AUTO_MIGRATE_DB=false` para que a conta da aplicacao nao tenha permissoes DDL. Exponha o backend somente ao proxy reverso confiavel, configure `TRUST_PROXY` de acordo com essa topologia e mantenha `BACKUP_DIR` em volume criptografado e inacessivel pela rede.
