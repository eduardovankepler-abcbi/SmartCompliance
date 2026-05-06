# Checklist de Homologacao: Render + MySQL

Este checklist transforma a validacao do Smart Compliance em um passo a passo operacional para o ambiente mais provavel do projeto:

- `backend` no `Render`
- `frontend` na `Vercel`
- `MySQL` gerenciado externo

Use junto com:

- `docs/deploy-publicacao.md`
- `docs/validacao-mysql-questionarios-individuais.md`

## Quando usar

Use este roteiro quando voce quiser:

- validar uma subida nova do backend no Render
- confirmar se o MySQL real esta pronto para `questionarios individuais`
- homologar a jornada ponta a ponta sem depender da maquina local

## Ordem recomendada

1. Confirmar variaveis do backend no Render
2. Confirmar conectividade com o MySQL
3. Aplicar `schema.sql`, `seed.sql` e migrations necessarias
4. Validar `GET /health`
5. Validar login
6. Validar jornada de `questionarios individuais`
7. Validar auditoria no banco

## 1. Variaveis do backend no Render

Confirme no servico `smart-compliance-backend`:

- `NODE_ENV=production`
- `STORAGE_MODE=mysql`
- `AUTH_SECRET=<valor forte>`
- `MYSQL_HOST=<host real do banco>`
- `MYSQL_PORT=<porta real>`
- `MYSQL_USER=<usuario real>`
- `MYSQL_PASSWORD=<senha real>`
- `MYSQL_DATABASE=<database real>`
- `MYSQL_SSL_MODE=required` quando o provedor exigir
- `MYSQL_SSL_REJECT_UNAUTHORIZED=false` apenas se o provedor de homologacao exigir essa compatibilidade
- `CORS_ORIGIN=<url final do frontend>`

## 2. Pré-checagem do banco

Antes de subir a homologacao:

1. Tire backup ou snapshot.
2. Confirme se voce esta no database correto.
3. Confirme se o usuario do banco tem permissao para:
   - `CREATE`
   - `ALTER`
   - `INDEX`
   - `SELECT`
   - `INSERT`
   - `UPDATE`

## 3. Scripts de banco

Para ambiente novo:

1. `backend/db/schema.sql`
2. `backend/db/seed.sql`

Para ambiente existente:

1. `backend/db/migrations/2026-04-01-evaluation-cycle-config.sql`
2. `backend/db/migrations/2026-05-05-evaluation-individual-questionnaires.sql`

Se o Render estiver com `AUTO_MIGRATE_DB` habilitado, o backend tenta cobrir parte da estrutura automaticamente, mas a homologacao deve considerar o banco correto apenas quando as consultas abaixo confirmarem tudo explicitamente.

## 4. SQL minimo de validacao estrutural

### Tabelas

```sql
SHOW TABLES LIKE 'evaluation_questionnaires';
SHOW TABLES LIKE 'evaluation_questionnaire_questions';
SHOW TABLES LIKE 'evaluation_questionnaire_access_policies';
```

### Colunas

```sql
SHOW COLUMNS FROM evaluation_assignments LIKE 'questionnaire_id';
SHOW COLUMNS FROM evaluation_answers LIKE 'questionnaire_question_id';
```

### Indices

```sql
SHOW INDEX FROM evaluation_questionnaires WHERE Key_name = 'idx_questionnaires_cycle_reviewee_relationship';
SHOW INDEX FROM evaluation_questionnaires WHERE Key_name = 'idx_questionnaires_status';
SHOW INDEX FROM evaluation_assignments WHERE Key_name = 'idx_assignments_questionnaire_id';
SHOW INDEX FROM evaluation_answers WHERE Key_name = 'idx_answers_questionnaire_question_id';
```

## 5. Validacao do Render

Depois do deploy:

1. Abra `GET /health`
2. Confirme resposta `status: ok`
3. Se falhar, verifique primeiro:
   - host/porta do MySQL
   - SSL do MySQL
   - nome real do database
   - permissao do usuario

## 6. Validacao funcional mínima

### Etapa A. Login

1. Abrir frontend publicado
2. Entrar com `admin` ou `rh`
3. Confirmar que a aplicacao carrega sem erro global

### Etapa B. Questionario individual

1. Abrir `Avaliacoes`
2. Abrir `Operacao`
3. Abrir `Questionarios individuais`
4. Criar uma `Autoavaliacao`
5. Carregar da biblioteca base
6. Marcar uma pergunta como sensivel
7. Publicar

### Etapa C. Resposta

1. Entrar como o colaborador alvo
2. Abrir `Avaliacoes`
3. Responder a `Autoavaliacao`

### Etapa D. Leituras

1. Entrar como `RH`
2. Abrir `Avaliacoes`
3. Abrir `Leituras`
4. Confirmar se a resposta aparece:
   - mascarada por padrao
   - bruta apenas quando `can_view_raw_answers = 1`

## 7. Validacao SQL após o fluxo

### Questionario publicado

```sql
SELECT id, title, relationship_type, status, question_count, published_at
FROM evaluation_questionnaires
ORDER BY updated_at DESC
LIMIT 10;
```

### Assignment vinculado

```sql
SELECT id, cycle_id, reviewee_person_id, relationship_type, questionnaire_id, status
FROM evaluation_assignments
WHERE questionnaire_id IS NOT NULL
ORDER BY id DESC
LIMIT 20;
```

### Resposta gravada

```sql
SELECT id, assignment_id, reviewer_user_id, reviewee_person_id, submitted_at
FROM evaluation_submissions
ORDER BY submitted_at DESC
LIMIT 20;
```

### Resposta sensível

```sql
SELECT
  a.submission_id,
  a.questionnaire_question_id,
  qq.is_sensitive,
  a.score,
  a.evidence_note
FROM evaluation_answers a
JOIN evaluation_questionnaire_questions qq
  ON qq.id = a.questionnaire_question_id
WHERE qq.is_sensitive = 1
ORDER BY a.id DESC
LIMIT 20;
```

### Auditoria

```sql
SELECT
  action_key,
  actor_name,
  entity_type,
  entity_id,
  summary_text,
  detail_text,
  created_at
FROM audit_logs
WHERE action_key = 'sensitive-viewed'
ORDER BY created_at DESC
LIMIT 20;
```

## 8. Critérios de aprovado

Considere homologado quando:

- backend sobe no Render com `STORAGE_MODE=mysql`
- `GET /health` responde `ok`
- login funciona
- RH/Admin conseguem criar e publicar questionario individual
- `assignment.questionnaire_id` e preenchido corretamente
- colaborador responde o questionario individual correto
- politica default mascara resposta sensivel
- politica com `can_view_raw_answers = 1` libera leitura bruta para perfil autorizado
- auditoria `sensitive-viewed` aparece no banco quando houve leitura bruta sensivel

## 9. Sinais de reprovação imediata

Reprove a rodada se aparecer qualquer um destes sinais:

- Render sobe mas `/health` falha por MySQL
- migration aplicada sem indices criticos
- `questionnaire_id` nao propaga para assignment
- resposta sensivel aparece em bruto com `can_view_raw_answers = 0`
- leitura bruta sensivel acontece sem auditoria
- RH perde acesso a `Leituras`

## 10. Registro da rodada

Ao final, registre:

1. data da homologacao
2. ambiente validado
3. URL do backend no Render
4. nome do database validado
5. IDs de questionario e assignment usados
6. resultado da auditoria `sensitive-viewed`
7. pendencias abertas, se houver
