# Plano de Implementacao: Questionarios Individuais com Privacidade Reforcada

## Objetivo

Transformar a proposta de questionarios individuais personalizados em um roteiro tecnico executavel, minimizando regressao no modulo `Avaliacoes`.

## Escopo desta rodada

Entregar uma base que permita:

- CRUD manual de questionarios por colaborador
- regras fixas de quantidade de perguntas por tipo
- vinculo explicito entre `assignment` e `questionnaire`
- carregamento seguro do questionario somente pelo assignment autorizado
- camada adicional de privacidade para perguntas e respostas sensiveis

## Decisoes tecnicas assumidas

Este plano assume:

1. `Feedback do Lider` usa `relationshipType = manager`
2. `Autoavaliacao` usa `relationshipType = self`
3. `Colega do mesmo setor` sera tratado como um tipo funcional novo chamado `peer-same-area`
4. O questionario pode ser editado ate ser atribuido/enviado
5. Depois de atribuido/enviado, nao pode mais ser alterado
6. Perguntas e respostas sensiveis podem ser vistas por `admin`, `hr` e gestor direto do subordinado, sempre com auditoria

## Estrategia de entrega

A implementacao deve acontecer em 5 fases.

## Fase 1. Fundacao de dados e compatibilidade

Objetivo:

- introduzir novas tabelas e colunas sem quebrar o fluxo atual

### Banco

Criar migration nova, por exemplo:

- `backend/db/migrations/2026-05-05-evaluation-individual-questionnaires.sql`

Adicionar:

### Tabela `evaluation_questionnaires`

- `id`
- `cycle_id`
- `reviewee_person_id`
- `relationship_type`
- `source_library_id`
- `title`
- `description`
- `status`
- `question_count`
- `visibility_level`
- `version_number`
- `published_at`
- `created_by_user_id`
- `updated_by_user_id`
- `created_at`
- `updated_at`

### Tabela `evaluation_questionnaire_questions`

- `id`
- `questionnaire_id`
- `sort_order`
- `section_key`
- `section_title`
- `section_description`
- `dimension_key`
- `dimension_title`
- `prompt_text`
- `helper_text`
- `input_type`
- `scale_profile`
- `visibility`
- `is_required`
- `collect_evidence_on_extreme`
- `is_sensitive`
- `options_json`
- `created_at`
- `updated_at`

### Tabela `evaluation_questionnaire_access_policies`

- `id`
- `questionnaire_id`
- `can_view_reviewee`
- `can_view_reviewer`
- `can_view_manager`
- `can_view_hr`
- `can_view_admin`
- `can_view_raw_answers`
- `can_view_prompt_text_after_submission`
- `created_at`
- `updated_at`

### Alteracao em `evaluation_assignments`

Adicionar coluna:

- `questionnaire_id` nullable no inicio

### Indices recomendados

- indice por `cycle_id + reviewee_person_id + relationship_type`
- indice por `questionnaire_id`
- indice por `status`

### Compatibilidade

Enquanto `evaluation_assignments.questionnaire_id` estiver nulo:

- o backend continua usando a resolucao antiga por `cycle + relationshipType`

### Arquivos afetados

- `backend/db/schema.sql`
- `backend/db/migrations/...`
- `backend/src/data/store.js`

### Criterio de aceite

- schema sobe sem quebrar regressao atual
- assignments antigos continuam funcionando

## Fase 2. Backend de questionarios individuais

Objetivo:

- introduzir o CRUD dos questionarios atribuidos

### Novos metodos de store

Criar operacao dedicada, preferencialmente em arquivo novo:

- `backend/src/data/storeEvaluationQuestionnaireOperations.js`

Metodos recomendados:

- `getEvaluationQuestionnaires(filters, actorUser)`
- `getEvaluationQuestionnaireById(questionnaireId, actorUser)`
- `createEvaluationQuestionnaire(payload, actorUser)`
- `updateEvaluationQuestionnaire(questionnaireId, payload, actorUser)`
- `publishEvaluationQuestionnaire(questionnaireId, actorUser)`
- `archiveEvaluationQuestionnaire(questionnaireId, actorUser)`
- `addEvaluationQuestionnaireQuestion(questionnaireId, payload, actorUser)`
- `updateEvaluationQuestionnaireQuestion(questionId, payload, actorUser)`
- `deleteEvaluationQuestionnaireQuestion(questionId, actorUser)`
- `reorderEvaluationQuestionnaireQuestions(questionnaireId, payload, actorUser)`

### Validacoes obrigatorias

No backend:

- `manager` precisa ter exatamente 15 perguntas ativas
- `self` precisa ter exatamente 20 perguntas ativas
- `peer-same-area` precisa ter exatamente 7 perguntas ativas
- nao permitir publicar questionario com pergunta vazia
- nao permitir publicar questionario com ordem duplicada

### Rotas novas

Adicionar em `backend/src/routes/evaluations.js`:

- `GET /api/evaluations/questionnaires`
- `GET /api/evaluations/questionnaires/:questionnaireId`
- `POST /api/evaluations/questionnaires`
- `PATCH /api/evaluations/questionnaires/:questionnaireId`
- `POST /api/evaluations/questionnaires/:questionnaireId/publish`
- `POST /api/evaluations/questionnaires/:questionnaireId/archive`
- `POST /api/evaluations/questionnaires/:questionnaireId/questions`
- `PATCH /api/evaluations/questionnaire-questions/:questionId`
- `DELETE /api/evaluations/questionnaire-questions/:questionId`
- `POST /api/evaluations/questionnaires/:questionnaireId/reorder`

### Permissoes recomendadas

- criar/editar/publicar/arquivar: `admin`, `hr`
- leitura operacional: `admin`, `hr`
- leitura individual para responder: somente via assignment autorizado

### Auditoria

Registrar:

- criacao de questionario
- publicacao
- arquivamento
- alteracao de pergunta
- exclusao de pergunta
- mudanca de politica de acesso

### Arquivos afetados

- `backend/src/routes/evaluations.js`
- `backend/src/data/store.js`
- `backend/src/data/storeEvaluationQuestionnaireOperations.js`
- `backend/src/data/storeEvaluationsDomain.js`

### Criterio de aceite

- RH/Admin consegue criar e publicar questionario individual sem mexer na biblioteca
- backend rejeita questionario fora das contagens obrigatorias

## Fase 3. Vínculo entre assignment e questionario

Objetivo:

- fazer a resposta depender do questionario efetivamente atribuido

### Mudanca central

Hoje:

- `getEvaluationTemplateForCycleRelationship(cycleId, relationshipType)`

Novo modelo:

- `getEvaluationQuestionnaireForAssignment(assignmentId, reviewerUserId)`

### Comportamento esperado

Quando o assignment tiver `questionnaire_id`:

- o backend ignora a biblioteca para fins de resposta
- devolve o questionario publicado vinculado ao assignment

Quando o assignment nao tiver `questionnaire_id`:

- usa fallback legado por `cycle + relationshipType`

### Pontos de mudanca

Em `backend/src/data/storeEvaluationReadOperations.js`:

- ajustar `getEvaluationAssignmentById`
- passar a devolver `assignment + questionnaire`
- manter compatibilidade com `template` no payload do frontend, se quisermos evitar refatoracao imediata da tela

Em `backend/src/data/storeEvaluationSubmissionOperations.js`:

- validar respostas contra o questionario do assignment
- gravar respostas usando as perguntas do questionario atribuido

### Ajuste recomendado de nomenclatura

Para reduzir ambiguidade:

- backend pode continuar devolvendo `template` no contrato externo por enquanto
- internamente, a origem real passa a ser `questionnaire`

### Atribuicao de questionarios a assignments

Criar processo para:

- selecionar questionarios publicados do ciclo
- localizar assignments do `reviewee_person_id + relationship_type`
- preencher `evaluation_assignments.questionnaire_id`

Isso pode acontecer:

- no ato de publicar questionario
- ou em job de sincronizacao operacional do ciclo

### Arquivos afetados

- `backend/src/data/storeEvaluationReadOperations.js`
- `backend/src/data/storeEvaluationSubmissionOperations.js`
- `backend/src/routes/evaluations.js`

### Criterio de aceite

- um assignment com `questionnaire_id` carrega seu proprio conjunto de perguntas
- dois colaboradores no mesmo ciclo podem receber autoavaliacoes diferentes

## Fase 4. Frontend operacional e CRUD

Objetivo:

- permitir manutencao real desses questionarios no workspace operacional

### API client

Adicionar em `frontend/src/api.js`:

- `getEvaluationQuestionnaires`
- `getEvaluationQuestionnaire`
- `createEvaluationQuestionnaire`
- `updateEvaluationQuestionnaire`
- `publishEvaluationQuestionnaire`
- `archiveEvaluationQuestionnaire`
- `createEvaluationQuestionnaireQuestion`
- `updateEvaluationQuestionnaireQuestion`
- `deleteEvaluationQuestionnaireQuestion`
- `reorderEvaluationQuestionnaireQuestions`

### Fluxo frontend

Criar hook dedicado, preferencialmente:

- `frontend/src/evaluations/useEvaluationQuestionnaires.js`

Responsabilidades:

- listar questionarios por ciclo
- filtrar por colaborador e tipo
- controlar draft de perguntas
- publicar e arquivar
- exibir status e politicas de privacidade

### UI recomendada

Separar a experiencia em duas abas no workspace operacional:

1. `Bibliotecas`
- continua para catalogo e modelos base

2. `Questionarios individuais`
- CRUD real por colaborador

### Componentes recomendados

- `frontend/src/evaluations/EvaluationQuestionnairePanel.jsx`
- `frontend/src/evaluations/EvaluationQuestionnaireEditor.jsx`
- `frontend/src/evaluations/EvaluationQuestionnairePrivacyPanel.jsx`

### Ajustes em telas existentes

- `frontend/src/evaluations/EvaluationLibraryPanel.jsx`
  - manter para biblioteca base
- `frontend/src/evaluations/EvaluationsSection.jsx`
  - incluir acesso a `Questionarios individuais`
- `frontend/src/evaluations/EvaluationResponsePanel.jsx`
  - exibir badge de privacidade e origem do questionario

### Criterio de aceite

- RH/Admin consegue montar questionario individual manualmente
- o fluxo visual separa claramente biblioteca base de questionario atribuido

## Fase 5. Privacidade reforcada

Objetivo:

- endurecer a protecao de prompts e respostas

### Regra 1. Acesso por assignment

O questionario para resposta deve ser acessado somente por:

- `GET /api/evaluations/assignments/:assignmentId`

Nao deve existir rota publica que exponha o conteudo completo do questionario apenas por:

- `cycleId`
- `revieweePersonId`
- `relationshipType`

### Regra 2. Snapshot e congelamento

Ao publicar e atribuir/enviar questionario:

- congelar a versao publicada
- impedir edicao direta depois da atribuicao

Regra adotada:

- antes da atribuicao/envio, o questionario pode ser ajustado
- depois da atribuicao/envio, o questionario fica imutavel

### Regra 3. Perguntas sensiveis

Toda pergunta pode carregar:

- `is_sensitive = true`

Efeito:

- nao aparece em exportacoes simples
- exige permissao elevada para leitura bruta
- pode aparecer de forma mascarada nas leituras amplas

### Regra 4. Politica de visualizacao

Aplicar na API:

- avaliador: ve apenas o proprio assignment
- avaliado: nao acessa perguntas individuais de outros
- gestor direto: pode acessar respostas dos seus subordinados, inclusive sensiveis, com auditoria
- RH/Admin: acesso conforme politica da entidade

### Regra 5. Auditoria de acesso sensivel

Criar log especifico quando RH/Admin:

- abre resposta com pergunta sensivel
- exporta resposta detalhada
- altera politica de acesso

### Regra 6. Leituras e analytics

Dashboards e bundles agregados devem evitar depender do prompt literal da pergunta quando `is_sensitive` for verdadeiro.

Onde possivel, usar:

- `questionId`
- `dimensionTitle`
- rotulo resumido

### Criterio de aceite

- nao e possivel acessar questionario individual sem assignment valido
- visualizacao de conteudo sensivel fica restrita e auditada

## Ordem recomendada de implementacao no codigo

1. migration e schema
2. operacoes de store para questionarios
3. rotas backend
4. vinculo `assignment.questionnaire_id`
5. ajuste de leitura do assignment
6. ajuste de submissao
7. api client do frontend
8. painel de CRUD
9. camada de privacidade visual e auditoria
10. regressao e E2E

## Plano de testes

### Backend

Expandir:

- `backend/tests/evaluations.test.mjs`

Cobrir:

- criacao de questionario draft
- publicacao com 15/20/7 perguntas validas
- bloqueio quando contagem estiver errada
- vinculo de `questionnaire_id` ao assignment
- acesso negado a assignment sem autorizacao
- bloqueio de acesso bruto a pergunta sensivel sem permissao

### Frontend

Expandir:

- testes do fluxo de `Avaliacoes`

Cobrir:

- CRUD de questionario individual
- publicacao
- resposta carregando questionario correto
- ausencia de vazamento entre colaboradores

### E2E

Adicionar cenarios como:

1. RH cria autoavaliacao personalizada para colaborador A
2. RH cria autoavaliacao diferente para colaborador B
3. colaborador A nao recebe perguntas de B
4. colaborador B nao recebe perguntas de A
5. gestor responde feedback do lider com 15 perguntas
6. peer do mesmo setor responde questionario de 7 perguntas

## Riscos principais

### 1. Acoplamento com a biblioteca atual

Risco:

- tentar editar bibliotecas para representar casos individuais

Mitigacao:

- manter biblioteca como origem
- usar entidade separada para questionario atribuido

### 2. Vazamento de conteudo

Risco:

- API ainda expor prompts por relacionamento amplo

Mitigacao:

- resolver conteudo somente por assignment autorizado

### 3. Regressao em ciclos antigos

Risco:

- quebrar fluxos existentes ao migrar tudo de uma vez

Mitigacao:

- manter fallback legado enquanto `questionnaire_id` estiver nulo

### 4. Edicao de questionario publicado

Risco:

- historico mudar depois da resposta

Mitigacao:

- travar `published`
- usar versionamento

## Entrega minima recomendada

Se quisermos uma primeira entrega menor, a menor versao segura seria:

1. novas tabelas
2. CRUD de questionarios individuais
3. publicacao com validacao 15/20/7
4. `assignment.questionnaire_id`
5. carregamento do questionario somente por assignment
6. `is_sensitive`
7. auditoria basica de criacao/publicacao/acesso sensivel

Isso ja resolve o requisito principal sem exigir reescrever todo o ecossistema analitico numa unica rodada.
