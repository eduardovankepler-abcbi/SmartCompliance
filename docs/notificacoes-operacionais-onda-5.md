# Notificacoes Operacionais - Onda 5

Data: 07/08/2026

## Objetivo

Definir a rotina inicial de notificacoes internas do piloto sem automatizar envios antes de existir responsavel operacional nominal, canal oficial e criterio de escalonamento aprovado.

## Principio da Etapa

Na Onda 5, notificacao e uma acao operacional controlada, nao uma automacao livre. O dashboard continua sendo a fonte primaria; o status report semanal registra decisao, responsavel e prazo.

## Fonte dos Alertas

Os alertas iniciais devem partir do bloco `Alertas para acompanhamento` do dashboard, alimentado pelos seguintes indicadores:

- `overdue_incidents`: incidentes fora do prazo.
- `unassigned_incidents`: incidentes sem responsavel.
- `pending_assignments`: avaliacoes pendentes.
- `blocked_development_plans`: PDIs bloqueados.
- `not_started_development_plans`: PDIs nao iniciados.
- `pending_learning_events`: aprendizagem aguardando revisao.

## Matriz MVP

| Alerta | Severidade | Canal inicial | Destinatario | Frequencia | Acao esperada |
| --- | --- | --- | --- | --- | --- |
| Incidentes fora do prazo | Critica | Status report + contato direto | Responsavel operacional, Compliance/RH | Diaria enquanto houver caso vencido | Definir plano de fechamento e prazo de regularizacao. |
| Incidentes sem responsavel | Alta | Status report + contato direto | Responsavel operacional, Compliance/RH | Diaria enquanto houver caso sem dono | Atribuir responsavel antes da proxima reuniao operacional. |
| Avaliacoes pendentes | Media | Status report semanal | RH, gestores envolvidos | Semanal | Acionar responsaveis por area e acompanhar reducao de pendencias. |
| PDIs bloqueados | Alta | Status report + contato direto | RH, gestor da pessoa | Semanal ou imediata se critica | Remover impedimento ou registrar decisao de pausa. |
| PDIs nao iniciados | Baixa | Status report semanal | RH, gestores | Semanal | Programar primeiro checkpoint. |
| Aprendizagem aguardando revisao | Baixa | Status report semanal | RH, gestor responsavel | Semanal | Classificar evento como PDI, evidencia ou registro concluido. |

## Regras de Escalonamento

- Critico: acionar no mesmo dia util e registrar no status report.
- Alto: acionar em ate 1 dia util e acompanhar na proxima revisao.
- Medio: consolidar por area e revisar semanalmente.
- Baixo: manter em acompanhamento sem interrupcao operacional.

## Criterios para Automatizar Depois

Automacao so deve entrar quando os quatro pontos abaixo estiverem fechados:

- Responsavel operacional nominal definido.
- Canal oficial aprovado pelo time interno.
- Texto padrao de notificacao aprovado por RH/Compliance.
- Politica de frequencia aprovada para evitar ruido.

## Pendencias

- Definir responsavel operacional nominal dos primeiros 30 dias.
- Confirmar canal inicial: Teams, Slack, e-mail ou rotina manual fora da ferramenta.
- Decidir se notificacoes automaticas entram ainda na Onda 5 ou ficam para uma onda futura.
