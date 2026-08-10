# Restore Seguro - Onda 6 - 10/08/2026

## Objetivo

Executar restore do backup MySQL em ambiente isolado, sem afetar o banco publicado.

## Resultado

Status: `Concluido com sucesso`

O restore foi executado em um container Docker local e isolado.

## Ambiente de Destino

| Campo | Valor |
| --- | --- |
| Tipo | Docker local |
| Container | `smart-compliance-restore-onda6` |
| Imagem | `mysql:8.4` |
| Host local | `127.0.0.1` |
| Porta local | `3310` |
| Banco | `smart_compliance_restore` |
| Producao alterada | `Nao` |

## Backup Restaurado

- `backend/backups/smart-compliance-defaultdb-2026-08-05T17-46-24-253Z.sql`

## Evidencias Pos-Restore

| Checagem | Resultado |
| --- | --- |
| Total de tabelas restauradas | `29` |
| `people` | `14` registros |
| `users` | `12` registros |
| `audit_logs` | `182` registros |
| `incident_reports` | `7` registros |
| `incident_evidences` | `3` registros |
| Amostra de usuarios demo | `admin`, `colaborador1`, `colaborador2`, `compliance`, `consultor1` presentes |
| Healthcheck de producao apos restore isolado | `status=ok`, `ready=true`, `database=ok` |

## Observacoes

- Nenhuma senha, token ou hash foi registrado nesta evidencia.
- O aviso do cliente MySQL sobre senha em linha de comando ocorreu apenas dentro do container local isolado.
- O container local foi mantido disponivel apos a validacao para eventual conferencia adicional.

## Decisao

O bloqueio de restore da Onda 5 foi removido para fins operacionais: ha evidencia de que o backup pode ser restaurado em ambiente isolado.

Expansao ampla continua condicionada a responsavel operacional nominal e revisao assistida dos modulos com usuarios reais.
