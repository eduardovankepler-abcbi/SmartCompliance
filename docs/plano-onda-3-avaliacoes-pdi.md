# Plano da Onda 3 - Avaliacoes e PDI

Data de inicio: 2026-08-04

## Objetivo

Levar Avaliacoes, Feedback/360 e PDI a um nivel maduro para uso interno em producao, com foco em confiabilidade do ciclo, privacidade das respostas, rastreabilidade operacional e continuidade dos planos de desenvolvimento.

## Escopo MVP da onda

1. Homologacao funcional publicada de Avaliacoes.
   - validar login por perfil;
   - validar listagem de ciclos e atribuicoes;
   - validar resposta de avaliacao;
   - validar perguntas obrigatorias, multi-selecao e evidencia em nota extrema;
   - validar bloqueio de abas operacionais para perfis sem permissao.

2. Homologacao de privacidade e sensibilidade.
   - confirmar mascaramento de respostas sensiveis por padrao;
   - confirmar acesso bruto apenas quando politica permitir;
   - confirmar auditoria de leitura sensivel;
   - confirmar visibilidade correta por RH, admin, gestor e colaborador.

3. Maturidade operacional de ciclos e questionarios.
   - validar criacao, publicacao e leitura de questionarios;
   - validar vinculo `assignment.questionnaire_id`;
   - validar grupos 360: empresa, lideranca, gestor, par, mesma area, transversal, cliente interno, cliente externo e autoavaliacao;
   - validar processamento/snapshot quando aplicavel.

4. PDI de producao.
   - validar criacao, edicao, progresso e arquivamento de PDI;
   - validar escopos: pessoal, equipe e organizacional;
   - validar vinculo opcional com competencia e ciclo;
   - validar integracao de aprendizagem quando usada por RH/admin.

5. Fechamento da onda.
   - documentar casos homologados;
   - registrar IDs de ciclo, assignment, questionario e PDI usados;
   - registrar riscos residuais;
   - decidir pronto para uso interno controlado ou listar bloqueios.

## Riscos e mitigacoes

- Risco: dados sensiveis de avaliacao aparecerem para perfil indevido.
  - Mitigacao: homologar mascaramento por perfil e auditar leitura bruta sensivel antes de qualquer aceite.

- Risco: questionarios publicados nao serem os mesmos respondidos pelo colaborador.
  - Mitigacao: validar explicitamente `assignment.questionnaire_id` e responder um assignment real no ambiente publicado.

- Risco: ciclo 360 ficar operacionalmente inconsistente entre grupos.
  - Mitigacao: testar um conjunto minimo por grupo de relacionamento e revisar contagens de atribuicoes.

- Risco: PDI virar registro solto, sem acompanhamento.
  - Mitigacao: exigir teste de progresso, status, evidencia esperada e arquivamento.

- Risco: fluxo de homologacao poluir producao com usuarios ativos.
  - Mitigacao: usar usuarios temporarios marcados como homologacao e inativar ao fim de cada rodada.

## Ordem recomendada

1. Etapa 1: checklist de homologacao publicado para Avaliacoes/PDI.
2. Etapa 2: teste funcional completo por API no backend publicado.
3. Etapa 3: teste funcional completo pela UI publicada.
4. Etapa 4: correcoes minimas dos gaps encontrados.
5. Etapa 5: aceite formal da Onda 3.

## Criterios de pronto

- Backend publicado com healthcheck `ok`.
- Frontend publicado no Vercel.
- Regressao local do backend aprovada em modo memoria.
- Build Angular aprovado.
- Pelo menos uma rodada ponta a ponta publicada validada.
- Permissoes por perfil validadas.
- Auditoria sensivel validada.
- Usuarios temporarios de homologacao inativados.

## Proxima etapa imediata

Criar o checklist executavel de homologacao da Onda 3, cobrindo Avaliacoes, privacidade/sensibilidade e PDI, para orientar a rodada real no ambiente publicado.
