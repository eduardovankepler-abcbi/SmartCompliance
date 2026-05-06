# Proposta: Questionarios Individuais Personalizados com Camada Extra de Privacidade

## Objetivo

Alterar a arquitetura atual de `Avaliacoes` para permitir questionarios personalizados por colaborador, com manutencao manual via CRUD e reforco de privacidade no acesso ao conteudo das perguntas e respostas.

## Mudanca de regra de negocio

O modelo atual trabalha com biblioteca por `relationshipType` no nivel do ciclo. A proposta e migrar para um modelo em que o questionario deixa de ser apenas "do tipo de relacionamento" e passa a poder ser "do relacionamento para um colaborador especifico".

Nova regra desejada:

- `Feedback do Lider`: 15 perguntas
- `Autoavaliacao`: 20 perguntas
- `Colega do mesmo setor`: 7 perguntas
- as perguntas devem ser editadas manualmente via CRUD
- as perguntas devem poder ser direcionadas individualmente para cada colaborador
- o acesso ao conteudo do questionario precisa ganhar uma camada extra de privacidade

## Leitura do estado atual

Hoje a arquitetura esta centrada em um template compartilhado por ciclo e relacionamento:

- o frontend carrega o questionario em `frontend/src/evaluations/useEvaluations.js`
- a API devolve `assignment + template` em `backend/src/routes/evaluations.js`
- o backend resolve o template por `cycleId + relationshipType` em `backend/src/data/storeEvaluationReadOperations.js`
- a submissao valida respostas contra esse template em `backend/src/data/storeEvaluationSubmissionOperations.js`

Em outras palavras:

- todos os colaboradores do mesmo ciclo e mesmo relacionamento recebem a mesma estrutura base
- existe biblioteca customizada por relacionamento
- ainda nao existe conceito formal de questionario individual por pessoa

## Problema arquitetural a resolver

O requisito novo quebra a suposicao central atual:

- hoje: `1 ciclo + 1 relationshipType -> 1 template`
- desejado: `1 ciclo + 1 relationshipType + 1 colaborador -> 1 questionario proprio`

Se tentarmos encaixar isso apenas dentro da biblioteca atual, vamos criar acoplamento ruim, risco de vazamento de perguntas e dificuldade de auditoria.

## Decisao arquitetural recomendada

Separar claramente tres camadas:

1. `Biblioteca base`
- continua existindo como fonte de referencia
- define estruturas padrao e perguntas reaproveitaveis

2. `Questionario atribuido`
- representa o pacote final de perguntas para um colaborador em um relacionamento especifico
- pode nascer de copia da biblioteca, mas vira um artefato proprio

3. `Assignment`
- deixa de depender apenas de `relationshipType`
- passa a apontar para o questionario efetivamente atribuido

Resumo da nova regra tecnica:

- biblioteca deixa de ser a fonte direta da resposta
- quem governa a resposta passa a ser o `questionario atribuido`

## Modelo funcional proposto

### 1. Tipos de questionario suportados

Para esta rodada, o sistema deve tratar como questionarios independentes:

- `self`
- `leader`
- `peer-same-area`

Observacao:

- hoje o produto usa `peer` de forma mais ampla
- para esta evolucao, a decisao adotada e formalizar um subtipo proprio para evitar ambiguidade

Decisao adotada:

- manter `peer` como relacionamento geral de plataforma
- introduzir `peer-same-area` como novo `relationshipType` funcional para o fluxo de colega do mesmo setor

### 2. Quantidade alvo de perguntas

Cada questionario atribuido deve validar:

- `leader`: exatamente 15 perguntas ativas
- `self`: exatamente 20 perguntas ativas
- `peer-same-area`: exatamente 7 perguntas ativas

Essa regra deve ser validada no backend antes da publicacao/liberacao do ciclo.

### 3. Direcionamento individual

O RH/Admin deve conseguir:

- escolher o colaborador avaliado
- escolher o tipo de questionario
- montar ou editar manualmente a lista de perguntas
- publicar aquele questionario para uso real

O questionario individual deve ficar ligado ao colaborador avaliado, nao ao avaliador.

Exemplo:

- Joao pode ter uma `Autoavaliacao` com 20 perguntas especificas
- Maria pode ter uma `Autoavaliacao` diferente no mesmo ciclo
- ambos ainda pertencem ao mesmo ciclo

## Proposta de modelo de dados

## Novas entidades recomendadas

### `evaluation_questionnaires`

Representa o questionario final atribuido.

Campos sugeridos:

- `id`
- `cycle_id`
- `reviewee_person_id`
- `relationship_type`
- `source_library_id` nullable
- `title`
- `description`
- `status` (`draft`, `published`, `archived`)
- `question_count`
- `visibility_level`
- `created_by_user_id`
- `updated_by_user_id`
- `created_at`
- `updated_at`

### `evaluation_questionnaire_questions`

Representa as perguntas do questionario atribuido.

Campos sugeridos:

- `id`
- `questionnaire_id`
- `sort_order`
- `prompt_text`
- `helper_text`
- `input_type`
- `scale_profile`
- `visibility`
- `collect_evidence_on_extreme`
- `options_json`
- `is_sensitive`
- `created_at`
- `updated_at`

### `evaluation_questionnaire_access_policies`

Camada adicional para governanca de privacidade.

Campos sugeridos:

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

Adicionar:

- `questionnaire_id`

Isso elimina a dependencia exclusiva de `cycle + relationshipType` para descobrir o questionario.

## Fluxo recomendado

### Etapa 1. Montagem

RH/Admin cria ou clona um questionario individual:

- seleciona ciclo
- seleciona colaborador
- seleciona tipo (`leader`, `self`, `peer-same-area`)
- monta manualmente as perguntas
- salva como `draft`

### Etapa 2. Validacao

Antes de publicar:

- `leader` precisa ter 15 perguntas
- `self` precisa ter 20 perguntas
- `peer-same-area` precisa ter 7 perguntas
- nao pode haver pergunta vazia
- nao pode haver ordem duplicada

### Etapa 3. Publicacao

Ao publicar:

- o questionario fica congelado para aquele colaborador no ciclo
- os assignments passam a apontar para `questionnaire_id`
- o questionario pode ser editado antes de ser atribuido/enviado ao colaborador
- depois de atribuido/enviado, nao pode mais ser alterado

### Etapa 4. Resposta

Quando o avaliador abre um assignment:

- o backend carrega o `assignment`
- resolve o `questionnaire_id`
- devolve somente o questionario autorizado para aquele usuario

## Mudancas recomendadas na API

### Rotas novas

- `GET /api/evaluations/questionnaires?cycleId=&revieweePersonId=&relationshipType=`
- `POST /api/evaluations/questionnaires`
- `PATCH /api/evaluations/questionnaires/:questionnaireId`
- `POST /api/evaluations/questionnaires/:questionnaireId/publish`
- `POST /api/evaluations/questionnaires/:questionnaireId/archive`

### Rotas novas para perguntas

- `POST /api/evaluations/questionnaires/:questionnaireId/questions`
- `PATCH /api/evaluations/questionnaires/:questionId`
- `DELETE /api/evaluations/questionnaires/:questionId`
- `POST /api/evaluations/questionnaires/:questionnaireId/reorder`

### Ajuste de rota existente

Hoje o assignment depende de:

- `getEvaluationAssignmentById`
- `getEvaluationTemplateForCycleRelationship(cycleId, relationshipType)`

Recomendacao:

- substituir a resolucao indireta por `getEvaluationQuestionnaireForAssignment(assignmentId, reviewerUserId)`

Assim o backend para de inferir e passa a carregar explicitamente o questionario correto do assignment.

## Camada extra de privacidade

Esse ponto merece uma decisao forte de arquitetura.

## Risco atual

Hoje, se o sistema resolve o template apenas por `cycleId + relationshipType`, o questionario e conceitualmente mais compartilhado. Isso e ruim para o novo requisito porque:

- aumenta o risco de exposicao indevida de perguntas de outro colaborador
- dificulta provar que cada avaliador viu somente o que devia
- mistura governanca de conteudo com governanca de resposta

## Reforcos recomendados

### 1. Questionario resolvido so por assignment

Essa e a principal camada de seguranca.

O frontend nunca deve buscar o questionario por:

- `cycleId`
- `relationshipType`
- `revieweePersonId`

O frontend deve buscar apenas pelo `assignmentId` do proprio usuario autenticado.

Regra:

- sem `assignment` autorizado, sem acesso ao texto das perguntas

### 2. Snapshot do questionario no momento da publicacao

Quando o questionario for publicado e vinculado ao assignment:

- o conteudo relevante deve ficar congelado
- alteracoes futuras no CRUD nao devem reescrever o historico invisivelmente

Isso protege:

- rastreabilidade
- auditoria
- consistencia juridica

### 3. Politica de visibilidade por perfil

Separar quem pode ver:

- texto bruto das perguntas
- respostas brutas
- agregados
- identificacao do avaliado

Regra adotada:

- avaliador ve somente o assignment dele
- avaliado nao ve perguntas individuais de outros questionarios
- gestor direto pode ver respostas dos seus subordinados, inclusive sensiveis, com auditoria
- RH/Admin veem o questionario publicado e, se autorizado, respostas brutas

### 4. Flag de pergunta sensivel

Adicionar `is_sensitive` em cada pergunta.

Uso adotado:

- perguntas sensiveis nao entram em exportacoes simples
- perguntas sensiveis nao aparecem em leituras amplas
- respostas sensiveis exigem permissao elevada para visualizacao bruta
- perfis autorizados: `admin`, `hr` e gestor direto do subordinado relacionado

### 5. Segregacao entre leitura operacional e leitura analitica

As telas de analytics e dashboard nao devem depender do texto integral das perguntas sensiveis.

Elas devem usar:

- ids tecnicos
- agregados anonimizados
- labels resumidas quando permitido

### 6. Auditoria especifica de acesso

Registrar em trilha:

- criacao de questionario individual
- publicacao
- edicao apos publicacao bloqueada ou versionada
- visualizacao de resposta sensivel por RH/Admin

### 7. Endurecimento de retorno da API

A API deve parar de devolver mais do que o necessario.

Exemplo recomendado:

- `respond view`: devolve apenas o questionario do assignment atual
- `operations view`: devolve metadados do questionario, nao necessariamente todos os prompts
- `insights`: devolve agregados e estatisticas, nao respostas detalhadas por padrao

## Impacto no frontend

As principais areas afetadas serao:

- `frontend/src/evaluations/useEvaluations.js`
- `frontend/src/evaluations/EvaluationLibraryPanel.jsx`
- `frontend/src/evaluations/EvaluationResponsePanel.jsx`
- `frontend/src/evaluations/EvaluationsSection.jsx`

Mudancas necessarias:

- criar tela ou painel de CRUD de questionarios individuais
- separar `biblioteca` de `questionarios atribuidos`
- carregar o questionario do assignment por `assignmentId`
- exibir indicadores de privacidade e status do questionario

## Impacto no backend

As principais areas afetadas serao:

- `backend/src/routes/evaluations.js`
- `backend/src/data/storeEvaluationReadOperations.js`
- `backend/src/data/storeEvaluationSubmissionOperations.js`
- `backend/src/data/storeEvaluationsDomain.js`
- `backend/db/schema.sql`
- `backend/db/migrations/`

Mudancas necessarias:

- novo CRUD de questionarios
- nova relacao entre assignment e questionario
- validacao de quantidade obrigatoria de perguntas por tipo
- leitura segura do questionario por assignment autorizado
- trilha de auditoria especifica para perguntas sensiveis e acessos privilegiados

## Compatibilidade e migracao

Para reduzir risco, a migracao deve ser feita em duas etapas.

### Fase 1. Modelo hibrido

- manter biblioteca atual
- permitir gerar questionarios individuais por clonagem
- assignments novos passam a usar `questionnaire_id`
- assignments antigos continuam funcionando pelo modelo atual ate migracao completa

### Fase 2. Modelo final

- toda resposta passa a depender de `questionnaire_id`
- a resolucao por `cycle + relationshipType` deixa de ser fonte primaria
- biblioteca vira apenas origem e catalogo

## Decisoes fechadas para implementacao

1. `Colega do mesmo setor` sera um novo `relationshipType`: `peer-same-area`
2. O questionario pode ser editado antes de ser atribuido/enviado ao colaborador
3. Depois de atribuido/enviado, o questionario fica congelado e nao pode mais ser alterado
4. Respostas de perguntas sensiveis podem ser visualizadas por `admin`, `hr` e gestor direto do subordinado, sempre com auditoria

## Recomendacao final

A melhor direcao e:

- manter a biblioteca como origem
- criar `questionarios atribuidos` por colaborador e por relacionamento
- vincular cada assignment a um `questionnaire_id`
- resolver o questionario somente pelo assignment autorizado
- adicionar governanca de privacidade com politica de acesso, pergunta sensivel e auditoria de visualizacao

Esse desenho atende o requisito novo sem forcar a biblioteca atual a assumir uma responsabilidade para a qual ela nao foi modelada.
