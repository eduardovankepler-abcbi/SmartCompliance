# Roteiro de Restore Seguro - Onda 6

Data de criacao: 10/08/2026

## Objetivo

Preparar a validacao de restore MySQL sem risco para o ambiente publicado do Smart Compliance.

## Status

Status atual: `Bloqueado ate banco isolado`

O restore ainda nao deve ser executado enquanto nao houver confirmacao explicita de ambiente isolado e banco de destino nao produtivo.

## Premissas Tecnicas

- O backup e gerado por `npm run backup:mysql`.
- O restore e executado por `npm run restore:mysql -- caminho/do/backup.sql`.
- O script de restore usa as variaveis MySQL ativas no ambiente.
- Se o `.env` apontar para producao, o restore sera aplicado em producao.

## Arquivos Relevantes

- `backend/scripts/mysql-backup.mjs`
- `backend/scripts/mysql-restore.mjs`
- `backend/src/config/env.js`
- `backend/backups/`

## Checklist Antes de Executar

- [ ] Responsavel operacional nominal definido.
- [ ] TI confirmou banco de destino isolado.
- [ ] Banco de destino nao e o MySQL publicado de producao.
- [ ] Variaveis `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER` e `MYSQL_SSL_MODE` conferidas.
- [ ] Backup escolhido existe localmente e nao sera versionado.
- [ ] Janela de execucao registrada.
- [ ] Criterio de sucesso definido antes do comando.

## Comando Previsto

Executar somente dentro de `backend`, com variaveis apontando para banco isolado:

```powershell
npm run restore:mysql -- backups/nome-do-backup.sql
```

## Evidencia Minima de Sucesso

Registrar no status report:

- data e hora do restore;
- banco de destino usado, sem expor senha;
- arquivo de backup usado;
- resultado do comando;
- checagem posterior de tabelas principais;
- confirmacao de que producao nao foi alterada.

## Checagens Pos-Restore

- Healthcheck do ambiente isolado responde.
- Tabelas principais existem.
- Usuarios demo e pessoas base estao presentes.
- Incidentes e evidencias esperadas foram restaurados.
- Auditoria possui eventos recentes.
- Nenhuma credencial, senha ou token foi documentado.

## Criterios de Bloqueio

Nao executar restore se:

- o host ou database forem os mesmos de producao;
- nao houver responsavel operacional;
- nao houver autorizacao explicita para usar o banco isolado;
- o backup escolhido nao tiver sido validado estruturalmente;
- houver duvida sobre qual `.env` esta carregado.

## Decisao da Etapa 2

O roteiro esta pronto para a Etapa 3. A execucao continua bloqueada ate o ambiente isolado ser confirmado e autorizado.

## Historico

- 10/08/2026: tentativa autorizada foi bloqueada antes da execucao porque o `.env` atual apontava para o banco publicado `defaultdb` no host Aiven. Evidencia registrada em `docs/restore-seguro-onda-6-tentativa-2026-08-10.md`.
