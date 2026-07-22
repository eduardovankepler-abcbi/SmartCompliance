# Matriz automatizada de paridade

Gerado em: 2026-07-22T17:04:51.008Z

Resumo: 11 cobertos, 0 parciais, 0 ausentes.

Specs React detectados: 7. Specs Angular detectados: 9.

Gate: falha em ausentes e parciais.

## Resumo por area

| Area | Cobertos | Parciais | Ausentes | Total |
| --- | ---: | ---: | ---: | ---: |
Aplause | 1 | 0 | 0 | 1
Avaliacoes | 5 | 0 | 0 | 5
Cadastro | 1 | 0 | 0 | 1
Compliance | 1 | 0 | 0 | 1
Dashboard | 1 | 0 | 0 | 1
Desenvolvimento | 1 | 0 | 0 | 1
Shell | 1 | 0 | 0 | 1

## Cobertura dos blocos migrados

| Bloco | Status | Capacidades rastreadas |
| --- | --- | --- |
1. Rotas profundas de Avaliacoes | ✅ | `Rotas profundas, slugs legados e workspaces de Avaliacoes`
2. Respostas individuais e agregadas | ✅ | `Respostas individuais, agregadas, anonimato e snapshots`
3. Dashboard executivo/analitico | ✅ | `Dashboard executivo/analitico, comparacao e historico por ciclo`
4. Tema e acabamento do shell | ✅ | `Autenticacao, navegacao estrutural e shell responsivo`
5. Matriz automatizada de paridade | ✅ | `Automacao gerada por este script`
6. Ajustes de CRUDs e demais modulos | ✅ | `Pessoas, usuarios, areas e competencias`<br>`CRUD de incidentes, tratamento, escopo por perfil e estados de fila`<br>`Trilhas e desenvolvimento`<br>`Reconhecimento entre pares`

## Lacunas para PR/CI

- Nenhuma lacuna automatizada encontrada.

## Matriz detalhada

| Status | Area | Capacidade | React E2E | Angular E2E | Evidencias Angular | Lacunas |
| --- | --- | --- | --- | --- | --- | --- |
✅ | Shell | Autenticacao, navegacao estrutural e shell responsivo | `auth-and-navigation.spec.js` | `auth-navigation-and-areas.spec.ts` | `restaura a sessao`<br>`Atualizar dados`<br>`areas` | —
✅ | Avaliacoes | Rotas profundas, slugs legados e workspaces de Avaliacoes | `evaluations-employee.spec.js`<br>`evaluations-individual-questionnaires.spec.js` | `evaluations-base.spec.ts`<br>`evaluations-library.spec.ts`<br>`evaluations-feedback.spec.ts` | `rota profunda`<br>`normaliza slug legado`<br>`/app/evaluations/manager/insights/360` | —
✅ | Avaliacoes | Respostas individuais, agregadas, anonimato e snapshots | `evaluations-360-homologation.spec.js` | `evaluations-feedback.spec.ts` | `Respostas individuais`<br>`Agregados por ciclo`<br>`Snapshots processados`<br>`Resposta protegida` | —
✅ | Avaliacoes | Dashboard executivo/analitico, comparacao e historico por ciclo | `evaluations-360-homologation.spec.js` | `evaluations-feedback.spec.ts` | `Dashboard executivo`<br>`Historico executivo por ciclo`<br>`Ciclo ativo exige atencao executiva`<br>`Abaixo do ciclo comparado` | —
✅ | Avaliacoes | Operacao de ciclos, inadimplencia, configuracao e pareamentos | `evaluations-admin-operations.spec.js` | `evaluations-operations.spec.ts` | `notifica inadimplentes`<br>`pairings`<br>`config` | —
✅ | Avaliacoes | Biblioteca, perguntas, questionarios individuais e publicacao | `evaluations-individual-questionnaires.spec.js` | `evaluations-library.spec.ts`<br>`evaluations-custom-libraries.spec.ts` | `Nova pergunta`<br>`Novo questionario`<br>`custom`<br>`import` | —
✅ | Cadastro | Pessoas, usuarios, areas e competencias | `auth-and-navigation.spec.js` | `auth-navigation-and-areas.spec.ts` | `Nova area`<br>`Competencias`<br>`Pessoa E2E`<br>`suggestedUserEmail`<br>`roleKey` | —
✅ | Compliance | CRUD de incidentes, tratamento, escopo por perfil e estados de fila | `auth-and-navigation.spec.js` | `auth-navigation-and-areas.spec.ts` | `Novo relato`<br>`Registrar relato`<br>`Tratar`<br>`Salvar tratamento`<br>`Nenhum incidente no seu escopo`<br>`Falha E2E ao carregar incidentes` | —
✅ | Dashboard | Dashboard geral e resultados por perfil | `dashboard-results.spec.js`<br>`dashboard-manager-results.spec.js` | `auth-navigation-and-areas.spec.ts` | `Dashboard`<br>`cards`<br>`gestor` | —
✅ | Desenvolvimento | Trilhas e desenvolvimento | — | `development.spec.ts` | `Desenvolvimento` | —
✅ | Aplause | Reconhecimento entre pares | — | `applause.spec.ts` | `Aplause` | —

## Observacoes

- A matriz valida cobertura automatizada por specs e palavras-chave de comportamento.
- Status `partial` nao significa falha funcional; significa que alguma evidencia esperada ainda nao foi encontrada no E2E Angular.
- Use `npm run parity:check` para falhar em capacidades ausentes.
- Use `npm run parity:strict` para falhar em capacidades ausentes ou parciais.
- Atualize o catalogo em `frontend-angular/scripts/parity-matrix.mjs` conforme novos blocos de paridade forem fechados.
