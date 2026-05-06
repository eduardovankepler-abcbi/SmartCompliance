# Validacao MySQL: Questionarios Individuais

Este roteiro serve para validar em banco MySQL real a entrega de `questionarios individuais` com privacidade reforcada no modulo `Avaliacoes`.

Use este guia quando:

- o backend estiver rodando com `STORAGE_MODE=mysql`
- `backend/db/schema.sql` e `backend/db/seed.sql` ja tiverem sido aplicados
- a migration `backend/db/migrations/2026-05-05-evaluation-individual-questionnaires.sql` precisar ser validada ou homologada

## Objetivo

Confirmar em ambiente MySQL real que:

- o schema suporta `questionnaire_id`, perguntas individuais e politicas de acesso
- os indices criticos existem
- RH/Admin conseguem criar e publicar questionarios individuais
- o assignment passa a carregar o questionario individual correto
- respostas sensiveis ficam mascaradas por padrao
- respostas sensiveis so aparecem em bruto quando `can_view_raw_answers = true`
- acessos sensiveis visiveis geram auditoria

## Pre-checagem

Antes de validar:

1. Garanta backup ou snapshot do banco.
2. Confirme `STORAGE_MODE=mysql`.
3. Confirme `AUTO_MIGRATE_DB` conforme sua estrategia:
   - se quiser validar migracao manual: deixe desativado
   - se quiser validar bootstrap automatico: deixe habilitado
4. Suba o backend apontando para o MySQL real.
5. Tenha um usuario `admin` ou `hr` funcional para o fluxo.

## Checklist de estrutura

Rode estas consultas no MySQL.

### 1. Tabelas novas

```sql
SHOW TABLES LIKE 'evaluation_questionnaires';
SHOW TABLES LIKE 'evaluation_questionnaire_questions';
SHOW TABLES LIKE 'evaluation_questionnaire_access_policies';
```

Esperado:

- as 3 tabelas existem

### 2. Colunas novas

```sql
SHOW COLUMNS FROM evaluation_assignments LIKE 'questionnaire_id';
SHOW COLUMNS FROM evaluation_answers LIKE 'questionnaire_question_id';
```

Esperado:

- ambas as colunas existem

### 3. Indices criticos

```sql
SHOW INDEX FROM evaluation_questionnaires WHERE Key_name = 'idx_questionnaires_cycle_reviewee_relationship';
SHOW INDEX FROM evaluation_questionnaires WHERE Key_name = 'idx_questionnaires_status';
SHOW INDEX FROM evaluation_assignments WHERE Key_name = 'idx_assignments_questionnaire_id';
SHOW INDEX FROM evaluation_answers WHERE Key_name = 'idx_answers_questionnaire_question_id';
```

Esperado:

- os 4 indices existem

### 4. Politica default

```sql
SELECT
  can_view_reviewee,
  can_view_reviewer,
  can_view_manager,
  can_view_hr,
  can_view_admin,
  can_view_raw_answers,
  can_view_prompt_text_after_submission
FROM evaluation_questionnaire_access_policies
LIMIT 5;
```

Esperado:

- `can_view_raw_answers = 0` por padrao
- `can_view_prompt_text_after_submission = 0` por padrao

## Fluxo funcional recomendado

### Etapa 1. Criar rascunho individual

Na interface:

1. Entrar como `RH` ou `Admin`
2. Abrir `Avaliacoes`
3. Abrir `Operacao`
4. Abrir `Questionarios individuais`
5. Criar uma `Autoavaliacao` para um colaborador

Validar no banco:

```sql
SELECT id, cycle_id, reviewee_person_id, relationship_type, status, question_count
FROM evaluation_questionnaires
ORDER BY created_at DESC
LIMIT 5;
```

Esperado:

- o questionario aparece com `status = 'draft'`

### Etapa 2. Carregar perguntas e publicar

Na interface:

1. Carregar da biblioteca base
2. Marcar pelo menos uma pergunta como sensivel
3. Publicar o questionario

Validar no banco:

```sql
SELECT id, status, question_count, published_at
FROM evaluation_questionnaires
ORDER BY published_at DESC
LIMIT 5;
```

```sql
SELECT questionnaire_id, sort_order, is_sensitive
FROM evaluation_questionnaire_questions
ORDER BY updated_at DESC
LIMIT 25;
```

Esperado:

- o questionario fica com `status = 'published'`
- `published_at` preenchido
- a contagem bate com a regra do tipo
- pelo menos uma pergunta sensivel existe quando marcada na UI

### Etapa 3. Confirmar vinculo com assignment

```sql
SELECT
  a.id,
  a.cycle_id,
  a.reviewee_person_id,
  a.relationship_type,
  a.questionnaire_id
FROM evaluation_assignments a
WHERE a.questionnaire_id IS NOT NULL
ORDER BY a.id DESC
LIMIT 20;
```

Esperado:

- o assignment correspondente passa a apontar para o questionario publicado

## Validacao de privacidade

### Cenario A. Politica default

Use um questionario publicado com:

- `can_view_manager = 1`
- `can_view_hr = 1`
- `can_view_admin = 1`
- `can_view_raw_answers = 0`
- `can_view_prompt_text_after_submission = 0`

Depois:

1. Responda o assignment com uma pergunta sensivel
2. Abra `Leituras` como RH ou gestor direto

Esperado:

- a resposta sensivel aparece mascarada
- o prompt sensivel nao volta em bruto
- nao deve haver leitura bruta sensivel

Consulta util:

```sql
SELECT
  p.can_view_raw_answers,
  p.can_view_prompt_text_after_submission,
  q.title,
  q.status
FROM evaluation_questionnaires q
JOIN evaluation_questionnaire_access_policies p
  ON p.questionnaire_id = q.id
ORDER BY q.updated_at DESC
LIMIT 10;
```

### Cenario B. Politica com leitura bruta permitida

Atualize a politica do questionario:

```sql
UPDATE evaluation_questionnaire_access_policies
SET
  can_view_raw_answers = 1,
  can_view_prompt_text_after_submission = 1,
  updated_at = NOW()
WHERE questionnaire_id = '<QUESTIONNAIRE_ID>';
```

Depois:

1. Abra `Leituras` como RH
2. Abra `Leituras` como gestor direto do colaborador

Esperado:

- respostas sensiveis aparecem em bruto
- prompt pode voltar conforme politica
- leitura sensivel visivel deve gerar auditoria

## Validacao de auditoria

Depois de abrir uma resposta sensivel realmente visivel:

```sql
SELECT
  category,
  action_key,
  entity_type,
  entity_id,
  actor_name,
  summary_text,
  detail_text,
  created_at
FROM audit_logs
WHERE action_key = 'sensitive-viewed'
ORDER BY created_at DESC
LIMIT 20;
```

Esperado:

- existe registro `sensitive-viewed`
- o ator bate com quem abriu a leitura
- o detalhe menciona respostas sensiveis visiveis

## Validacao de contrato da API

Se quiser validar sem depender da UI:

1. publicar um questionario individual
2. responder o assignment
3. chamar `GET /api/evaluations/responses` com token de RH

Esperado:

- com `can_view_raw_answers = false`: item sensivel volta mascarado
- com `can_view_raw_answers = true`: item sensivel volta visivel para perfil autorizado

## Criterios de aceite

Considere a validacao aprovada quando:

- schema novo existe no MySQL real
- indices criticos existem
- publicacao vincula `assignment.questionnaire_id`
- colaborador responde o questionario correto do assignment
- resposta sensivel fica mascarada por padrao
- resposta sensivel so aparece em bruto quando a politica permite
- acesso sensivel visivel gera auditoria

## Sinais de problema

Investigue imediatamente se ocorrer algum destes sinais:

- `questionnaire_id` nulo mesmo apos publicacao
- questionario publicado com contagem errada
- RH/gestor vendo resposta sensivel em bruto com `can_view_raw_answers = 0`
- ausencia de `sensitive-viewed` quando houve leitura bruta sensivel
- ambiente MySQL com tabelas novas mas sem indices novos

## Fechamento recomendado

Depois da homologacao:

1. registrar data e ambiente validados
2. registrar se a validacao foi com migracao manual ou auto-migrate
3. salvar os IDs de questionario/assignment usados no teste
4. anexar prints ou logs do `audit_logs` se a rodada for de homologacao formal
