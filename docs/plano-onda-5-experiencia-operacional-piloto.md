# Plano da Onda 5 - Experiencia Operacional e Estabilizacao do Piloto

Data de inicio: 05/08/2026

## Objetivo

Conduzir o piloto interno controlado do Smart Compliance com estabilidade operacional, evidencias semanais e melhorias pequenas que reduzam atrito para RH, Compliance, gestores e TI.

## Decisao de Entrada

A Onda 5 inicia a partir do fechamento da Onda 4, que aprovou o produto para piloto interno controlado com classificacao `Amarelo controlado`.

Condicoes herdadas:

- API publicada e MySQL validados em leitura.
- Dashboard executivo e auditoria gerencial disponiveis.
- Checklist pos-go-live e status report documentados.
- Validacao visual publicada com credenciais ainda pendente de aprovacao explicita ou execucao manual assistida.

## Escopo MVP da Onda

1. Validacao visual publicada.
   - executar `npm run e2e:published` com aprovacao explicita ou roteiro manual equivalente;
   - validar login, dashboard, auditoria e bloqueio de colaborador;
   - registrar evidencia no status report.

2. Primeiro status report do piloto.
   - preencher o modelo de `docs/checklist-pos-go-live-onda-4.md`;
   - registrar responsavel operacional dos primeiros 30 dias;
   - registrar backup mais recente e validacao operacional;
   - classificar status geral como verde, amarelo ou vermelho.

3. Quick actions reais no dashboard.
   - transformar acoes rapidas em links internos uteis;
   - priorizar incidentes, usuarios, pessoas, auditoria e avaliacoes;
   - manter acesso por perfil sem expor rota indevida.

4. Reducao de atrito operacional.
   - revisar textos de estados vazios e erros nos fluxos mais usados;
   - garantir que filtros essenciais persistam ou sejam faceis de repetir;
   - ajustar pequenas inconsistencias encontradas no piloto.

5. Notificacoes e alertas internos.
   - mapear quais alertas devem virar comunicacao ativa;
   - definir canal operacional inicial;
   - evitar automacao antes de responsaveis e criterios estarem claros.

6. Governanca de dados operacionais.
   - revisar retencao de auditoria e evidencias;
   - definir politica minima para anexos e logs;
   - separar item futuro se exigir mudanca estrutural.

## Riscos e Mitigacoes

- Risco: piloto expandir sem validacao visual publicada.
  - Mitigacao: tratar validacao visual como primeira etapa da onda e manter expansao bloqueada ate evidencia.

- Risco: status report virar tarefa burocratica.
  - Mitigacao: manter uma pagina semanal curta com poucos indicadores e decisoes objetivas.

- Risco: quick actions exporem rotas para perfil sem permissao.
  - Mitigacao: reaproveitar configuracao de navegacao e guards existentes.

- Risco: alertas gerarem ruido excessivo.
  - Mitigacao: comecar com alertas manuais no status report antes de notificacao automatica.

- Risco: ajuste operacional virar refatoracao ampla.
  - Mitigacao: limitar cada melhoria a um fluxo e validar com teste focado.

## Ordem Recomendada

1. Etapa 1: executar ou preparar a validacao visual publicada com credenciais.
2. Etapa 2: preencher o primeiro status report real do piloto.
3. Etapa 3: implementar quick actions reais no dashboard.
4. Etapa 4: corrigir atritos pequenos identificados no piloto.
5. Etapa 5: desenhar notificacoes internas de pendencias criticas.
6. Etapa 6: revisar governanca de retencao de auditoria/evidencias.
7. Etapa 7: fechar decisao de expansao do piloto.

## Criterios de Pronto

- Validacao visual publicada concluida ou substituida por roteiro manual com evidencia.
- Primeiro status report preenchido com responsavel operacional definido.
- Dashboard possui atalhos uteis e coerentes por perfil.
- Achados amarelos/vermelhos do piloto possuem responsavel e prazo.
- Nenhum colaborador acessa dashboard, auditoria ou dados fora de escopo.
- Decisao de expansao, manutencao ou pausa do piloto registrada.

## Proxima Etapa Imediata

Definir responsavel operacional nominal dos primeiros 30 dias e desenhar notificacoes internas de pendencias criticas.

## Andamento

- Onda 5 iniciada em 05/08/2026 com foco em experiencia operacional e estabilizacao do piloto interno controlado.
- Etapa 1 iniciada em 05/08/2026: validacao visual publicada autorizada e executada, mas bloqueada porque o bundle publicado esta desatualizado e ainda nao contem `Auditoria` nem `Riscos operacionais`. Evidencia registrada em `docs/homologacao-onda-5-validacao-visual-publicada.md`.
- Etapa 1 atualizada em 05/08/2026: frontend Angular publicado em producao no projeto `smart-compliance-angular`; bundle publicado ja contem `Auditoria` e `Riscos operacionais`, mas E2E visual ainda bloqueia porque a credencial demo redireciona para troca obrigatoria de senha.
- Etapa 1 parcialmente aprovada em 05/08/2026: senha do `admin@demo.local` alterada com autorizacao explicita e validacao visual de dashboard/auditoria publicada passou. Pendente validar bloqueio visual de colaborador com conta apta.
- Etapa 1 concluida em 05/08/2026: conta demo `colaborador2@demo.local` preparada com autorizacao explicita e validacao visual publicada confirmou bloqueio de dashboard/auditoria para colaborador.
- Etapa 2 concluida em 05/08/2026: primeiro status report do piloto criado em `docs/status-report-piloto-onda-5-semana-1.md`, com status `Amarelo controlado`, backup operacional registrado e pendencia de responsavel nominal.
- Etapa 3 implementada em 06/08/2026: dashboard passou a exibir quick actions reais para avaliacoes, incidentes, auditoria, usuarios e pessoas, filtradas pela matriz central de permissao de navegacao.
- Etapa 3 publicada em producao em 06/08/2026: deploy Vercel concluido e alias `https://smart-compliance-angular.vercel.app` respondeu `200 OK`.
- Etapa 4 iniciada em 06/08/2026: fluxo de Usuarios recebeu estado vazio operacional para orientar cadastro de Pessoas antes do provisionamento e bloquear criacao de acesso sem pessoa elegivel.
