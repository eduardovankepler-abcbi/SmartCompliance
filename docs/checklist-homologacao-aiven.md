# Checklist de Homologacao: Aiven for MySQL

Este guia adapta a homologacao do Smart Compliance para `Aiven for MySQL`, considerando:

- `backend` publicado no `Render`
- `frontend` publicado na `Vercel`
- `MySQL` hospedado na `Aiven`

## Referencias oficiais

Baseado na documentacao oficial da Aiven consultada em 6 de maio de 2026:

- Aiven for MySQL get started
- Aiven TLS/SSL certificates
- Aiven advanced parameters for MySQL

Pontos relevantes confirmados:

- a conexao fica disponivel na tela `Overview > Quick connect`
- a Aiven recomenda TLS/SSL e permite baixar o `CA certificate`
- `ip_filter` existe e, por padrao, aparece como aberto para `0.0.0.0/0, ::/0`
- o nome do banco inicial em muitos ambientes Aiven pode ser `defaultdb`

## Objetivo

Homologar a frente de `questionarios individuais` e sua camada de privacidade em um MySQL real da Aiven, sem depender da maquina local.

## 1. Confirmar dados de conexao na Aiven

No console da Aiven:

1. Abra o servico MySQL
2. Abra `Overview`
3. Abra `Quick connect`
4. Confira:
   - `host`
   - `port`
   - `username`
   - `password`
   - `database`

Anote esses valores.

## 2. Decidir o nome real do banco

Aqui existe um ponto importante para este projeto.

Hoje os exemplos do repo usam:

- `MYSQL_DATABASE=smart_compliance`

Mas na Aiven e comum o banco inicial ser:

- `defaultdb`

Voce tem duas opcoes validas:

### Opcao A. Usar `defaultdb`

Mais simples para homologacao inicial.

No Render:

- `MYSQL_DATABASE=defaultdb`

### Opcao B. Criar um banco proprio

Mais organizado para producao.

No console ou cliente SQL:

```sql
CREATE DATABASE smart_compliance;
```

Depois no Render:

- `MYSQL_DATABASE=smart_compliance`

## 3. Confirmar usuario e autenticacao

A doc da Aiven informa que no console o metodo padrao para usuario costuma ser `caching_sha2_password`.

Isso importa porque:

- clientes muito antigos podem falhar na autenticacao
- `mysql2` moderno costuma funcionar normalmente

Para este projeto, o backend em Node.js atual deve funcionar, mas se aparecer erro de autenticacao, a primeira verificacao deve ser no usuario da Aiven e no metodo configurado para ele.

## 4. Confirmar SSL/TLS

A documentacao da Aiven informa que:

- todo trafego usa TLS
- alguns servicos exigem ou usam o `project CA certificate`
- o certificado pode ser baixado em `Overview > Connection information > CA Certificate`

Para este projeto, comece assim no Render:

- `MYSQL_SSL_MODE=required`
- `MYSQL_SSL_REJECT_UNAUTHORIZED=false` apenas se necessario em homologacao

### Recomendacao pratica

Para uma primeira homologacao:

1. tente com `MYSQL_SSL_MODE=required`
2. se a conexao falhar por validacao de certificado, mantenha:
   - `MYSQL_SSL_MODE=required`
   - `MYSQL_SSL_REJECT_UNAUTHORIZED=false`
3. se quiser endurecer depois, avance para uma configuracao com CA validado explicitamente

## 5. Confirmar acesso de rede na Aiven

A documentacao da Aiven confirma o parametro:

- `ip_filter`

Se o seu banco estiver restrito por IP:

- o Render pode falhar para conectar

### Caminho recomendado

Na Aiven:

1. Abra o servico
2. Verifique as configuracoes de rede / IP filter
3. Para homologacao inicial, confirme que o backend consegue sair para o banco

Se estiver usando filtro restrito, valide se os IPs de egresso do backend publicado estao permitidos. Se isso nao estiver claro ainda, a homologacao inicial costuma ser mais segura com a politica publica temporariamente liberada, e depois voce fecha.

## 6. Variaveis recomendadas no Render

Para Aiven, o conjunto mais provavel fica assim:

```env
NODE_ENV=production
STORAGE_MODE=mysql
AUTH_SECRET=<segredo forte>
MYSQL_HOST=<host da Aiven>
MYSQL_PORT=<porta da Aiven>
MYSQL_USER=<usuario da Aiven>
MYSQL_PASSWORD=<senha da Aiven>
MYSQL_DATABASE=<defaultdb ou smart_compliance>
MYSQL_SSL_MODE=required
MYSQL_SSL_REJECT_UNAUTHORIZED=false
CORS_ORIGIN=<url final da Vercel>
```

## 7. Ordem de homologacao recomendada

1. Ajustar variaveis no Render
2. Confirmar banco escolhido: `defaultdb` ou `smart_compliance`
3. Aplicar:
   - `backend/db/schema.sql`
   - `backend/db/seed.sql`
   - `backend/db/migrations/2026-04-01-evaluation-cycle-config.sql`
   - `backend/db/migrations/2026-05-05-evaluation-individual-questionnaires.sql`
4. Reimplantar o backend
5. Validar `GET /health`
6. Validar login
7. Validar `Questionarios individuais`
8. Validar `Leituras`
9. Validar auditoria no banco

## 8. SQL minimo para Aiven

### Confirmar database atual

```sql
SELECT DATABASE();
```

### Confirmar tabelas novas

```sql
SHOW TABLES LIKE 'evaluation_questionnaires';
SHOW TABLES LIKE 'evaluation_questionnaire_questions';
SHOW TABLES LIKE 'evaluation_questionnaire_access_policies';
```

### Confirmar indices criticos

```sql
SHOW INDEX FROM evaluation_questionnaires WHERE Key_name = 'idx_questionnaires_cycle_reviewee_relationship';
SHOW INDEX FROM evaluation_questionnaires WHERE Key_name = 'idx_questionnaires_status';
SHOW INDEX FROM evaluation_assignments WHERE Key_name = 'idx_assignments_questionnaire_id';
SHOW INDEX FROM evaluation_answers WHERE Key_name = 'idx_answers_questionnaire_question_id';
```

## 9. Validação funcional

### RH/Admin

1. login
2. `Avaliacoes`
3. `Operacao`
4. `Questionarios individuais`
5. criar e publicar questionario

### Colaborador

1. login
2. responder assignment correspondente

### RH

1. abrir `Leituras`
2. validar comportamento mascarado vs bruto conforme politica

## 10. Erros mais provaveis na Aiven

### Erro de database inexistente

Causa provavel:

- Render usando `smart_compliance`, mas a Aiven so tem `defaultdb`

Acao:

- trocar `MYSQL_DATABASE` para `defaultdb`
- ou criar o database `smart_compliance`

### Erro de SSL

Causa provavel:

- configuracao TLS do cliente nao aceitando o certificado

Acao:

- manter `MYSQL_SSL_MODE=required`
- testar `MYSQL_SSL_REJECT_UNAUTHORIZED=false` na homologacao
- se necessario, baixar o CA certificate no console da Aiven e endurecer depois

### Erro de autenticacao

Causa provavel:

- usuario/senha incorretos
- metodo de autenticacao do usuario incompatível

Acao:

- regenerar senha do usuario
- revisar usuario criado no servico

### Erro de timeout/conexao recusada

Causa provavel:

- `ip_filter`
- host/porta incorretos
- backend do Render sem acesso liberado

Acao:

- revisar `ip_filter`
- revisar `host` e `port` do `Quick connect`

## 11. Critério de aprovado

Considere aprovado quando:

- backend no Render conecta no MySQL da Aiven
- `/health` responde `ok`
- schema e migrations estao aplicados no database correto
- a jornada de `questionarios individuais` funciona
- respostas sensiveis respeitam a politica
- `sensitive-viewed` aparece quando houver leitura sensivel visivel

## 12. Próximo endurecimento depois da homologação

Depois que tudo passar:

1. decidir se o banco final continua `defaultdb` ou vira `smart_compliance`
2. revisar se `MYSQL_SSL_REJECT_UNAUTHORIZED=false` ainda e necessario
3. fechar `ip_filter` para uma politica mais restrita
