# Homologacao Onda 5 - Validacao Visual Publicada

Data: 05/08/2026

## Objetivo

Validar login, dashboard, auditoria e bloqueios por perfil no frontend publicado.

## Resultado

Status: `Bloqueado por credencial demo com troca obrigatoria de senha`

O teste publicado foi autorizado e executado antes e depois da publicacao do frontend atualizado. A segunda rodada confirmou que o deploy atual esta no ar, mas falhou antes de validar dashboard/auditoria porque a credencial demo usada foi redirecionada para troca de senha.

## Comando Executado

```bash
cd frontend-angular
npm run e2e:published
```

Resultado inicial, antes do deploy atualizado:

- `2 failed`
- `valida dashboard e auditoria publicados sem mutacao funcional`: apos login com admin, permaneceu em `/login`.
- `bloqueia colaborador no dashboard publicado`: ao acessar dashboard/auditoria como colaborador, retornou para `/login`.

Resultado apos deploy atualizado:

- `2 failed`
- `valida dashboard e auditoria publicados sem mutacao funcional`: apos login com admin, foi redirecionado para `/change-password`.
- `bloqueia colaborador no dashboard publicado`: ao acessar dashboard/auditoria como colaborador, retornou para `/login`.

## Deploy Executado

```bash
cd frontend-angular
npx vercel deploy --prod --yes
```

Resultado:

- projeto: `smart-compliance-angular`
- alias de producao atualizado: `https://smart-compliance-angular.vercel.app`
- deployment de producao: `https://smart-compliance-angular-7q3nrd6nz-eduardos-projects-e211db16.vercel.app`

## Evidencia Tecnica

Antes do deploy, foi feita uma verificacao sem credenciais do bundle publicado em:

- `https://smart-compliance-frontend.vercel.app`

Resultado:

- frontend responde HTTP `200`;
- bundle aponta para `https://smartcompliance.onrender.com`;
- bundle publicado nao contem os textos/rotas recentes:
  - `Auditoria`: ausente;
  - `Riscos operacionais`: ausente;
  - rota/componente de auditoria: ausente.

Conclusao inicial: o frontend publicado estava atrasado em relacao ao codigo versionado apos as entregas da Onda 4.

Apos o deploy, foi feita nova verificacao sem credenciais em:

- `https://smart-compliance-angular.vercel.app`

Resultado:

- bundle contem `Auditoria`;
- bundle contem `Riscos operacionais`;
- bundle contem `Alertas para acompanhamento`.

Conclusao atual: o frontend atualizado esta publicado, mas a validacao visual ainda precisa de uma credencial de homologacao que nao exija troca de senha ou de uma decisao explicita para executar o fluxo de troca em ambiente publicado.

## Impacto

- A API publicada continua validada pela homologacao nao destrutiva da Onda 4.
- A validacao visual publicada da Onda 5 ainda nao pode ser considerada concluida.
- O piloto interno deve continuar como `Amarelo controlado` ate existir credencial apta para a rodada visual ou ate a troca de senha ser executada com aprovacao explicita.

## Proxima Acao

1. Providenciar usuario de homologacao publicado que nao exija troca de senha, ou aprovar explicitamente a troca de senha de uma conta demo.
2. Reexecutar:

```bash
cd frontend-angular
npm run e2e:published
```

3. Registrar nova evidencia no status report.
