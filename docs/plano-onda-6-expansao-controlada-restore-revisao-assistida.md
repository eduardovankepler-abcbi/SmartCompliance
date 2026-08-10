# Plano da Onda 6 - Expansao Controlada, Restore Seguro e Revisao Assistida

Data de inicio: 10/08/2026

## Objetivo

Preparar o Smart Compliance para ampliacao controlada do piloto interno, fechando os bloqueios operacionais da Onda 5: responsavel nominal, restore seguro, revisao assistida dos modulos com usuarios reais e decisao formal de expansao por grupo.

## Decisao de Entrada

A Onda 6 inicia a partir do fechamento da Onda 5, que aprovou a manutencao do piloto interno restrito com classificacao `Amarelo controlado`.

Condicoes herdadas:

- Produto publicado e acessivel em producao.
- Dashboard, auditoria e bloqueio de colaborador validados.
- Backup operacional executado e validado estruturalmente.
- Quick actions reais publicadas no dashboard.
- Matriz de notificacoes e politica minima de retencao documentadas.
- Expansao ampla bloqueada ate resolver pendencias operacionais.

## Escopo MVP da Onda

1. Responsavel operacional nominal.
   - registrar nome, papel, substituto e janela de acompanhamento;
   - definir canal oficial de contato para os primeiros 30 dias;
   - atualizar status report com responsavel real.

2. Restore seguro.
   - definir ambiente seguro de restore;
   - executar restore com backup recente sem afetar producao;
   - registrar evidencia objetiva de sucesso ou falha;
   - manter producao intocada durante a validacao.

3. Revisao assistida dos modulos com usuarios reais.
   - revisar Compliance com RH/Compliance;
   - revisar Avaliacoes com RH, gestor e colaborador;
   - revisar Desenvolvimento/PDI com RH e gestor;
   - revisar Pessoas/Usuarios com TI/RH;
   - revisar Aplause com usuario final quando houver uso previsto.

4. Expansao por grupo pequeno.
   - definir grupo maximo recomendado;
   - validar perfis e acessos antes de liberar;
   - documentar criterio para entrada e saida do grupo;
   - bloquear expansao ampla ate novo aceite.

5. Status report da Semana 2.
   - atualizar indicadores operacionais;
   - registrar achados por modulo;
   - classificar decisao: manter, expandir grupo pequeno, conter ou pausar.

6. Backlog de maturidade pos-piloto.
   - separar automacoes futuras de notificacao;
   - separar expurgo/arquivamento automatico;
   - separar melhorias de UX encontradas na revisao assistida.

## Riscos e Mitigacoes

- Risco: expandir sem dono operacional.
  - Mitigacao: manter expansao bloqueada enquanto responsavel nominal nao estiver registrado.

- Risco: restore afetar producao.
  - Mitigacao: executar somente em ambiente isolado e registrar conexao/escopo antes de rodar.

- Risco: usuarios reais exporem dados fora de escopo.
  - Mitigacao: revisar perfis e rotas antes da liberacao e manter grupo pequeno.

- Risco: revisao assistida virar teste informal sem evidencia.
  - Mitigacao: usar roteiro por modulo e registrar resultado no status report.

- Risco: achados do piloto virarem refatoracao ampla.
  - Mitigacao: classificar como MVP, melhoria opcional ou item futuro antes de implementar.

## Ordem Recomendada

1. Etapa 1: registrar responsavel operacional nominal e canal oficial.
2. Etapa 2: preparar roteiro e ambiente de restore seguro.
3. Etapa 3: executar restore seguro e registrar evidencia.
4. Etapa 4: criar roteiro de revisao assistida por modulo.
5. Etapa 5: executar revisao assistida com usuarios reais.
6. Etapa 6: consolidar status report da Semana 2.
7. Etapa 7: decidir expansao para novo grupo pequeno ou manutencao do piloto restrito.

## Criterios de Pronto

- Responsavel operacional nominal registrado.
- Restore seguro executado ou bloqueio documentado com proxima acao.
- Revisao assistida dos modulos criticos registrada.
- Nenhum item vermelho aberto sem responsavel e prazo.
- Decisao de expansao por grupo documentada.
- Expansao ampla continua bloqueada ate aceite formal posterior.

## Proxima Etapa Imediata

Iniciar Onda 7 com Alfa controlada, usuarios reais autorizados e decisao de expansao baseada na revisao assistida.

## Andamento

- Onda 6 iniciada em 10/08/2026 com foco em expansao controlada, restore seguro e revisao assistida dos modulos com usuarios reais.
- Etapa 1 preparada em 10/08/2026: registro operacional criado em `docs/responsavel-operacional-onda-6.md`, mantendo expansao bloqueada ate preenchimento de responsavel nominal e canal oficial.
- Etapa 2 preparada em 10/08/2026: roteiro de restore seguro criado em `docs/roteiro-restore-seguro-onda-6.md`, mantendo execucao bloqueada ate confirmacao de banco isolado e autorizacao explicita.
- Etapa 3 tentada em 10/08/2026 com autorizacao, mas bloqueada por seguranca antes da execucao porque o `.env` atual aponta para o banco publicado `defaultdb`. Evidencia registrada em `docs/restore-seguro-onda-6-tentativa-2026-08-10.md`.
- Etapa 3 concluida em 10/08/2026: restore executado com sucesso em MySQL isolado no Docker, com 29 tabelas restauradas e producao confirmada saudavel apos a validacao. Evidencia registrada em `docs/restore-seguro-onda-6-sucesso-2026-08-10.md`.
- Etapa 4 concluida em 10/08/2026: roteiro de revisao assistida por modulo criado em `docs/roteiro-revisao-assistida-modulos-onda-6.md`, cobrindo perfis, tarefas, evidencias e classificacao de achados.
- Etapa 5 tentada em 10/08/2026, mas bloqueada por dependencia operacional: ainda faltam responsavel nominal, canal oficial e usuarios reais autorizados. Registro criado em `docs/execucao-revisao-assistida-onda-6-2026-08-10.md`.
- Etapa 6 concluida em 10/08/2026: status report da Semana 2 criado em `docs/status-report-piloto-onda-6-semana-2.md`, classificando a operacao como `Amarelo controlado` e pronta para preparar Alfa.
- Etapa 7 concluida em 10/08/2026: decisao de expansao condicionada registrada em `docs/fechamento-onda-6-expansao-controlada.md`, aprovando preparacao da Alfa controlada e mantendo expansao ampla bloqueada.
- Backlog pos-piloto criado em 10/08/2026 em `docs/backlog-pos-piloto-onda-6.md`.
- Operacao pos-fechamento em 10/08/2026: contas demo `@demo.local` restauradas com autorizacao explicita e validadas na API publicada. Evidencia registrada em `docs/reset-contas-demo-2026-08-10.md`.
