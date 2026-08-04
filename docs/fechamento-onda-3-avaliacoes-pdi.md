# Fechamento da Onda 3 - Avaliacoes e PDI

Data de fechamento: 04/08/2026

## Decisao

Onda 3 aprovada para uso interno controlado, com implantacao gradual e acompanhamento operacional.

A aprovacao cobre os fluxos de Avaliacoes, Operacao de ciclos, Questionarios, PDI, Registros de desenvolvimento e permissoes principais por perfil em ambiente local isolado com MySQL restaurado. A producao publicada deve receber uma rodada de aceite final sem mutacao ampla antes de liberar usuarios reais em escala.

## Evidencias executadas

- Backend em memoria: `npm test` aprovado.
- Homologacao mutavel por API contra MySQL restaurado: aprovada.
- Frontend automatizado: Playwright focado aprovado com 18/18 testes.
- Build Angular: `npm run build` aprovado.
- Homologacao assistida de frontend contra MySQL restaurado: aprovada.

IDs finais da rodada MySQL:

- Banco isolado: `smart_compliance_restore_20260804_142534`
- Cycle ID: `cycle_suaua3u5`
- Assignment ID: `assignment_hb3tjjls`
- Submission ID: `submission_6a8ow75w`
- Development plan ID: `development_plan_jybwv7b9`
- Development record ID: `development_np84gm5g`

## Escopo validado

- Login por perfil com tratamento de primeiro acesso.
- Admin acessando Operacao de ciclos, Questionarios, Fila de aprendizagem e Novo PDI.
- Colaborador acessando Minhas avaliacoes e Formacao/PDI.
- Bloqueio visual de Operacao de ciclos e Fila de aprendizagem para colaborador.
- Resposta de avaliacao com validacao de obrigatoriedade e envio duplicado.
- PDI criado, com progresso registrado e arquivamento.
- Registro de desenvolvimento criado e arquivado.
- Healthcheck MySQL com `ready=true`, `database=ok` e colunas operacionais confirmadas.

## Ressalvas

- A rodada mutavel foi executada em MySQL restaurado/local, nao diretamente em producao.
- A validacao de privacidade sensivel profunda ficou coberta por checklist e regras automatizadas parciais, mas ainda recomenda evidencias manuais com dado sensivel realista antes de ampliar uso.
- Usuarios da base restaurada exigiram troca de senha no primeiro acesso; isso e comportamento esperado, mas deve ser comunicado aos usuarios internos.
- Os arquivos locais `backend/backups/` e `frontend-angular/reports/parity/` permanecem fora do versionamento desta onda.

## Riscos remanescentes e mitigacao

- Risco: regra de visibilidade sensivel falhar em um caso de questionario customizado.
  - Mitigacao: executar rodada curta com pergunta sensivel e registrar auditoria `sensitive-viewed` antes de abrir ciclos reais amplos.

- Risco: divergencia entre ambiente isolado e producao publicada.
  - Mitigacao: rodar checklist nao destrutivo no ambiente publicado e, se houver staging, repetir `homologate:wave3` contra staging antes de producao.

- Risco: usuarios internos travarem no primeiro acesso.
  - Mitigacao: comunicar fluxo de troca obrigatoria de senha e validar suporte de RH/admin para reset.

- Risco: PDI ser criado sem governanca posterior.
  - Mitigacao: acompanhar semanalmente PDIs `not_started`, `blocked` e vencidos no primeiro mes de uso.

## Proximo passo recomendado

Iniciar a Onda 4 com foco em dashboard executivo, auditoria gerencial e prontidao de acompanhamento pos-go-live.
