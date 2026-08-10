# Tentativa de Restore Seguro - Onda 6 - 10/08/2026

## Objetivo

Executar a Etapa 3 da Onda 6 somente se o ambiente de destino estivesse isolado e nao produtivo.

## Resultado

Status: `Bloqueado por seguranca`

O restore nao foi executado.

## Motivo do Bloqueio

A checagem previa do `.env` mostrou que as variaveis MySQL atuais apontam para o banco publicado:

| Campo | Valor conferido |
| --- | --- |
| `STORAGE_MODE` | `mysql` |
| `MYSQL_HOST` | `mysql-15206814-eduardovankepler-smart-compliance.k.aivencloud.com` |
| `MYSQL_PORT` | `14010` |
| `MYSQL_DATABASE` | `defaultdb` |
| `MYSQL_USER` | `avnadmin` |
| `MYSQL_SSL_MODE` | `required` |

Como o script `npm run restore:mysql` usa as variaveis MySQL ativas, executar o comando neste momento aplicaria o restore no banco publicado. Isso viola o roteiro de restore seguro da Onda 6.

## Backup Disponivel

Backup mais recente localizado:

- `backend/backups/smart-compliance-defaultdb-2026-08-05T17-46-24-253Z.sql`

## Decisao

Manter o restore bloqueado ate haver banco de destino isolado confirmado por TI/Operacao.

## Proxima Acao

Provisionar ou informar um banco MySQL isolado para restore, com host/database distintos de producao, e atualizar temporariamente as variaveis locais antes de executar `npm run restore:mysql`.
