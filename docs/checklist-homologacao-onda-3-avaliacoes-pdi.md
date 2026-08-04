# Checklist de Homologacao da Onda 3 - Avaliacoes e PDI

Data da rodada: ____/____/______
Ambiente: producao / homologacao
Responsavel: ___________________

## 1. Pre-check operacional

- [ ] Backend responde `GET /health` com `status=ok` e `ready=true`.
- [ ] `storageMode=mysql` confirmado no healthcheck publicado.
- [ ] Frontend publicado abre em `https://smart-compliance-angular.vercel.app`.
- [ ] Backup ou snapshot do banco foi confirmado antes da rodada.
- [ ] Usuarios temporarios de homologacao foram planejados e serao inativados ao final.

IDs/versoes:

- Backend version: ___________________
- Frontend deployment: ___________________
- Backup/snapshot: ___________________

## 2. Perfis minimos da rodada

- [ ] Admin ou RH para operacao de ciclos/questionarios.
- [ ] Gestor para leitura de equipe e PDI da equipe.
- [ ] Colaborador para responder avaliacao e visualizar PDI proprio.
- [ ] Consultor/parceiro quando houver cliente externo no ciclo.

Usuarios usados:

- Admin/RH: ___________________
- Gestor: ___________________
- Colaborador: ___________________
- Consultor/parceiro: ___________________

## 3. Avaliacoes - fluxo funcional

- [ ] Admin/RH acessa `Avaliacoes`.
- [ ] Ciclos carregam sem erro.
- [ ] Atribuicoes carregam sem erro.
- [ ] Colaborador acessa `Minhas avaliacoes`.
- [ ] Colaborador abre assignment pendente.
- [ ] Perguntas obrigatorias bloqueiam envio incompleto.
- [ ] Pergunta de escala aceita nota valida.
- [ ] Pergunta multi-selecao aceita opcao valida.
- [ ] Pergunta de mesma area permite apenas uma opcao quando aplicavel.
- [ ] Nota extrema com exigencia de evidencia bloqueia envio sem comentario.
- [ ] Envio concluido muda assignment para `submitted`.

IDs:

- Cycle ID: ___________________
- Assignment ID: ___________________
- Submission ID: ___________________

## 4. Questionarios e ciclo 360

- [ ] Admin/RH acessa `Questionarios`.
- [ ] Questionario individual pode ser criado ou localizado.
- [ ] Perguntas carregam da biblioteca quando aplicavel.
- [ ] Questionario publicado fica com `status=published`.
- [ ] `assignment.questionnaire_id` fica preenchido para o assignment correspondente.
- [ ] Operacao do ciclo mostra participantes e relacionamento esperados.
- [ ] Grupos 360 revisados: empresa, lideranca, gestor, par, mesma area, transversal, cliente interno, cliente externo e autoavaliacao.
- [ ] Ciclo liberado aceita respostas.
- [ ] Ciclo encerrado bloqueia novas respostas.
- [ ] Ciclo processado preserva snapshot/leitura final quando aplicavel.

IDs:

- Questionnaire ID: ___________________
- Questionnaire question ID sensivel: ___________________
- Processed cycle/report ID: ___________________

## 5. Privacidade e respostas sensiveis

- [ ] Politica default do questionario tem `can_view_raw_answers=false`.
- [ ] Resposta sensivel fica mascarada para leitura comum.
- [ ] Prompt sensivel nao aparece em bruto quando politica bloquear.
- [ ] Leitura bruta so aparece quando politica permitir.
- [ ] Leitura bruta sensivel gera auditoria `sensitive-viewed`.
- [ ] Gestor visualiza apenas escopo permitido.
- [ ] Colaborador nao visualiza leituras estrategicas.
- [ ] Consultor/parceiro nao visualiza dados internos indevidos.

Evidencias:

- Audit ID `sensitive-viewed`: ___________________
- Perfil que abriu leitura bruta: ___________________
- Resultado de mascaramento: ___________________

## 6. PDI - fluxo funcional

- [ ] Colaborador acessa `Desenvolvimento` e ve escopo proprio.
- [ ] Gestor acessa PDI da equipe quando aplicavel.
- [ ] RH/Admin acessa visao organizacional.
- [ ] Novo PDI pode ser criado com pessoa, foco, acao, prazo e evidencia esperada.
- [ ] PDI pode ser vinculado a competencia.
- [ ] PDI pode ser atualizado.
- [ ] Andamento do PDI aceita `not_started`, `in_progress`, `blocked` e `done`.
- [ ] Nota de progresso aparece no card.
- [ ] PDI pode ser arquivado.
- [ ] Trilha operacional registra criacao, atualizacao, progresso e arquivamento.

IDs:

- Development plan ID: ___________________
- Competency ID: ___________________
- Audit IDs relevantes: ___________________

## 7. Desenvolvimento - registros e aprendizagem

- [ ] Registro de desenvolvimento pode ser criado.
- [ ] Registro pode ser editado.
- [ ] Registro pode ser arquivado.
- [ ] RH/Admin visualiza fila de integracoes de aprendizagem quando houver eventos.
- [ ] Evento de aprendizagem pode ser aplicado em registro ou PDI quando aplicavel.
- [ ] Evento aplicado fica com status esperado e nao reaparece como pendente.

IDs:

- Development record ID: ___________________
- Learning event ID: ___________________

## 8. Permissoes por perfil

- [ ] Admin/RH acessa operacao, questionarios, biblioteca, leituras e PDI organizacional.
- [ ] Gestor acessa leituras e PDI apenas do escopo permitido.
- [ ] Colaborador acessa apenas suas avaliacoes e desenvolvimento proprio.
- [ ] Consultor/parceiro acessa apenas assignments externos quando existirem.
- [ ] Perfil sem permissao recebe 403 nas rotas operacionais.

Rotas testadas com 403 esperado:

- ___________________
- ___________________
- ___________________

## 9. Criterios de aceite

A rodada so pode ser aprovada se todos os itens abaixo estiverem verdadeiros:

- [ ] Fluxo de resposta de avaliacao foi concluido no ambiente publicado.
- [ ] Questionario individual publicado foi vinculado ao assignment correto.
- [ ] Privacidade de resposta sensivel foi validada.
- [ ] Auditoria de leitura sensivel foi validada.
- [ ] PDI foi criado, atualizado, progredido e arquivado.
- [ ] Permissoes por perfil foram validadas.
- [ ] Usuarios temporarios foram inativados.
- [ ] IDs de evidencia foram registrados neste checklist.

## 10. Resultado da rodada

Resultado: aprovado / aprovado com ressalvas / bloqueado

Ressalvas ou bloqueios:

- ___________________
- ___________________
- ___________________

Proxima acao:

- ___________________
