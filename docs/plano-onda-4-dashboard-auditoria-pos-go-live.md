# Plano da Onda 4 - Dashboard, Auditoria e Pos-Go-Live

Data de inicio: 04/08/2026

## Objetivo

Preparar o Smart Compliance para acompanhamento interno pos-go-live, dando visibilidade executiva, rastreabilidade gerencial e rotinas operacionais para os modulos ja homologados.

## Escopo MVP da onda

1. Dashboard executivo de prontidao.
   - consolidar indicadores de pessoas, avaliacoes, PDI, compliance/incidentes e auditoria;
   - destacar pendencias, riscos e itens vencidos;
   - separar visao admin/RH, gestor e colaborador;
   - garantir leitura rapida para reuniao semanal.

2. Auditoria gerencial.
   - revisar eventos criticos ja registrados;
   - criar filtros uteis por categoria, usuario, entidade e periodo quando faltarem;
   - evidenciar eventos sensiveis, mudancas de permissao, fechamento de incidentes e alteracoes de ciclo/PDI;
   - validar restricao de acesso por perfil.

3. Acompanhamento pos-go-live.
   - definir checklist semanal de operacao interna;
   - listar sinais de alerta: login bloqueado, ciclo atrasado, PDI parado, incidente vencido, backup antigo;
   - registrar processo de triagem e escalonamento;
   - deixar pronto um modelo de status report.

4. Homologacao de producao sem mutacao ampla.
   - validar healthcheck publicado;
   - validar login e troca de senha com usuarios reais/temporarios;
   - validar navegacao principal por perfil;
   - validar dados reais apenas em leitura, sem criar ciclo/incidente amplo em producao sem aprovacao.

5. Fechamento da onda.
   - documentar evidencias;
   - registrar riscos residuais;
   - decidir prontidao para piloto interno;
   - definir rotina de acompanhamento dos primeiros 30 dias.

## Riscos e mitigacoes

- Risco: dashboard ocultar problema operacional relevante.
  - Mitigacao: priorizar indicadores acionaveis e incluir lista de alertas, nao apenas totais agregados.

- Risco: auditoria expor informacao sensivel para perfil indevido.
  - Mitigacao: validar filtros e permissoes por perfil antes de liberar visao gerencial.

- Risco: pos-go-live depender de acompanhamento manual demais.
  - Mitigacao: criar checklist semanal simples e registrar criterios objetivos de alerta.

- Risco: diferenca entre ambiente isolado e producao publicada.
  - Mitigacao: executar rodada nao destrutiva no ambiente publicado e manter qualquer teste mutavel restrito a staging/isolado.

- Risco: backup e restore nao serem conferidos durante o piloto.
  - Mitigacao: incluir idade do ultimo backup e resultado de restore como item obrigatorio do status report.

## Ordem recomendada

1. Etapa 1: mapear indicadores e eventos existentes no backend/frontend.
2. Etapa 2: implementar ajustes minimos do dashboard executivo.
3. Etapa 3: amadurecer filtros e visibilidade de auditoria.
4. Etapa 4: criar checklist e status report pos-go-live.
5. Etapa 5: homologar leitura em frontend contra MySQL isolado e ambiente publicado.
6. Etapa 6: fechar decisao de piloto interno.

## Criterios de pronto

- Dashboard mostra indicadores acionaveis dos modulos homologados.
- Auditoria permite investigar eventos criticos por perfil autorizado.
- Gestor e colaborador nao acessam dados fora do escopo.
- Checklist semanal e status report estao documentados.
- Healthcheck publicado e navegacao principal foram validados.
- Riscos residuais estao registrados com responsavel operacional.

## Proxima etapa imediata

Implementar a menor evolucao util do dashboard executivo: `riskSummary` e `operationalAlerts` no backend, mantendo contrato retrocompativel e preparando a renderizacao no frontend.

## Andamento

- Etapa 1 concluida em 04/08/2026: indicadores e eventos existentes mapeados em `docs/mapeamento-onda-4-indicadores-auditoria.md`.
- Etapa 2 concluida em 05/08/2026: backend do dashboard expandido com `riskSummary` e `operationalAlerts`, validado em memoria e MySQL isolado.
