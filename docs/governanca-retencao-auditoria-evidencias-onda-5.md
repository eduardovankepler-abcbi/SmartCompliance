# Governanca de Retencao - Auditoria e Evidencias - Onda 5

Data: 07/08/2026

## Objetivo

Definir uma politica minima para retencao, acesso e revisao de auditoria, evidencias de incidentes e backups durante o piloto interno controlado.

## Escopo

Esta politica cobre:

- trilha de auditoria operacional em `audit_logs`;
- evidencias anexadas a incidentes em `incident_evidences`;
- arquivos locais de backup MySQL gerados pela rotina operacional;
- referencias a evidencias documentais no status report da Onda 5.

Nao cobre ainda:

- expurgo automatico de dados no banco;
- classificacao juridica definitiva de prazos legais;
- armazenamento externo criptografado para anexos;
- rotina de restore automatizada.

## Estado Atual Observado

- Auditoria fica persistida no banco e possui filtro por perfil, categoria, acao, ator e periodo.
- Evidencias de incidentes usam upload em memoria, limite de tamanho no backend e armazenamento em `LONGBLOB`.
- Download e listagem de evidencias exigem perfil autorizado para fila de incidentes.
- Inclusao de evidencia gera evento de auditoria `evidence_added`.
- Backup MySQL possui diretorio configuravel e `BACKUP_RETENTION_DAYS`, com padrao atual de 7 dias.

## Politica Minima para o Piloto

| Dado | Retencao MVP | Acesso | Revisao | Observacao |
| --- | --- | --- | --- | --- |
| Auditoria operacional | Manter durante todo o piloto e por no minimo 180 dias apos encerramento | Admin, RH, Compliance e Gestor conforme escopo ja implementado | Semanal no status report | Nao expurgar manualmente sem aprovacao de Operacao/TI. |
| Evidencias de incidentes | Manter enquanto o caso estiver aberto e por no minimo 180 dias apos fechamento | Perfis da fila de incidentes | Semanal para casos abertos | Download deve ficar restrito a quem trata incidentes. |
| Backups MySQL locais | Manter pelo menos 7 dias ou politica maior definida por TI | TI / responsavel operacional | Semanal | Restore ainda precisa ser testado em ambiente seguro. |
| Evidencias documentais da homologacao | Manter no repositorio enquanto a onda estiver ativa | Time do projeto | Fechamento da onda | Nao registrar senhas, tokens ou dados sensiveis. |

## Regras Operacionais

- Nao apagar auditoria ou evidencias durante o piloto sem registro no status report.
- Nao anexar arquivos com credenciais, tokens, senhas ou dados fora do caso tratado.
- Conferir semanalmente se incidentes fechados possuem historico minimo: responsavel, decisao, evidencia quando aplicavel e data de fechamento.
- Registrar no status report qualquer download/exportacao de evidencias feito para investigacao.
- Manter backups fora do versionamento do Git.

## Criterios para Expurgo Futuro

Antes de implementar expurgo automatico, fechar:

- prazo legal/organizacional de retencao com Compliance/RH/TI;
- destino de arquivamento para casos encerrados;
- trilha de auditoria do proprio expurgo;
- rotina de restore validada;
- teste automatizado cobrindo que colaborador nao acessa evidencias nem auditoria.

## Riscos Residuais

- Evidencias em `LONGBLOB` podem pressionar o tamanho do banco se o uso crescer.
- Backup local sem restore periodico pode passar falsa seguranca.
- Retencao sem dono nominal pode atrasar decisoes de expurgo ou arquivamento.

## Decisao da Onda 5

Para o piloto interno, a recomendacao e manter retencao conservadora, sem expurgo automatico, ate haver responsavel nominal, politica formal e restore validado.
