# SmartCompliance Angular

Frontend oficial do SmartCompliance em Angular 21.

## Status

- Producao oficial: `https://smart-compliance-frontend.vercel.app`
- Projeto Vercel: `smart-compliance-angular`
- Backend de producao: `https://smartcompliance.onrender.com`
- Frontend React em `../frontend/`: legado, mantido apenas para rollback temporario

## Desenvolvimento

```bash
npm install
npm run start
```

O servidor local usa `http://localhost:4200`.

## Validacao

```bash
npm run build
npm run parity:strict
npm run e2e
```

Use `npm run parity:strict` como gate rapido de paridade migrada. Use `npm run e2e` quando a mudanca tocar fluxos de usuario.

## Deploy

```bash
npx vercel --prod --yes
npx vercel alias set <deployment-angular>.vercel.app smart-compliance-frontend.vercel.app
```

Sempre confirme que o dominio oficial serve Angular verificando `<app-root>` no HTML e ausencia de root React.
