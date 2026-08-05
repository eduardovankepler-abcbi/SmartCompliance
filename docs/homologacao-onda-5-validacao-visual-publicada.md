# Homologacao Onda 5 - Validacao Visual Publicada

Data: 05/08/2026

## Objetivo

Validar login, dashboard, auditoria e bloqueios por perfil no frontend publicado.

## Resultado

Status: `Aprovado`

O teste publicado foi autorizado e executado antes e depois da publicacao do frontend atualizado. A segunda rodada confirmou que o deploy atual esta no ar, mas falhou antes de validar dashboard/auditoria porque a credencial demo usada foi redirecionada para troca de senha. Depois disso, houve autorizacao explicita para trocar senhas de contas demo; as contas `admin@demo.local` e `colaborador2@demo.local` foram preparadas de forma controlada e a validacao visual publicada passou para admin e colaborador.

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

Resultado apos troca controlada da senha do admin demo:

- comando executado: `npx playwright test --config=playwright.published.config.ts -g "valida dashboard e auditoria publicados sem mutacao funcional"`
- `1 passed`
- dashboard publicado validado com admin;
- bloco `Riscos operacionais` validado;
- pagina `Auditoria` publicada validada;
- filtros e lista de eventos de auditoria visiveis.

Resultado apos preparacao controlada do colaborador demo:

- conta usada: `colaborador2@demo.local`;
- validacao executada programaticamente com Playwright, sem imprimir senha ou token;
- apos login: `/app/compliance`;
- tentativa de abrir `/app/dashboard`: redirecionada para `/app/compliance`;
- tentativa de abrir `/app/audit`: redirecionada para `/app/compliance`;
- resultado: `passed`.

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

Conclusao atual: o frontend atualizado esta publicado e as jornadas visuais de admin e colaborador foram aprovadas.

## Impacto

- A API publicada continua validada pela homologacao nao destrutiva da Onda 4.
- A validacao visual publicada de admin esta aprovada.
- A validacao visual publicada de colaborador esta aprovada.
- O piloto interno pode seguir para o primeiro status report real.

## Proxima Acao

1. Preencher o primeiro status report real do piloto.
2. Registrar responsavel operacional dos primeiros 30 dias.
3. Registrar backup mais recente e validacao operacional.
