# Homologacao Onda 5 - Validacao Visual Publicada

Data: 05/08/2026

## Objetivo

Validar login, dashboard, auditoria e bloqueios por perfil no frontend publicado.

## Resultado

Status: `Bloqueado por deploy frontend desatualizado`

O teste publicado foi autorizado e executado, mas falhou antes de validar dashboard/auditoria.

## Comando Executado

```bash
cd frontend-angular
npm run e2e:published
```

Resultado:

- `2 failed`
- `valida dashboard e auditoria publicados sem mutacao funcional`: apos login com admin, permaneceu em `/login`.
- `bloqueia colaborador no dashboard publicado`: ao acessar dashboard/auditoria como colaborador, retornou para `/login`.

## Evidencia Tecnica

Foi feita uma verificacao sem credenciais do bundle publicado em:

- `https://smart-compliance-frontend.vercel.app`

Resultado:

- frontend responde HTTP `200`;
- bundle aponta para `https://smartcompliance.onrender.com`;
- bundle publicado nao contem os textos/rotas recentes:
  - `Auditoria`: ausente;
  - `Riscos operacionais`: ausente;
  - rota/componente de auditoria: ausente.

Conclusao: o frontend publicado esta atrasado em relacao ao codigo versionado apos as entregas da Onda 4.

## Impacto

- A API publicada continua validada pela homologacao nao destrutiva da Onda 4.
- A validacao visual publicada da Onda 5 ainda nao pode ser considerada concluida.
- O piloto interno deve continuar como `Amarelo controlado` ate o frontend publicado receber o build atual e o E2E publicado passar.

## Proxima Acao

1. Publicar o frontend Angular atualizado.
2. Confirmar que o bundle publicado contem `Auditoria` e `Riscos operacionais`.
3. Reexecutar:

```bash
cd frontend-angular
npm run e2e:published
```

4. Registrar nova evidencia no status report.
