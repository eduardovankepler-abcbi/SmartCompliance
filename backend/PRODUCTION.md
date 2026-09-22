# Configuracao de producao local

Antes de iniciar o backend no servidor definitivo, configure o `.env` de producao e rode:

```bash
cd backend
npm run validate:production-config
```

O validador confere `NODE_ENV=production`, `STORAGE_MODE=mysql`, `AUTH_SECRET` forte, variaveis `MYSQL_*`, `CORS_ORIGIN` sem wildcard e formato basico de porta. Ele nao imprime segredos.

Para producao local com frontend e backend no mesmo dominio, o frontend Angular production usa `/api`; configure o proxy/servidor web para encaminhar `/api` ao backend.
