# Checklist Pos-Go-Live - Onda 4

Data de criacao: 05/08/2026

## Objetivo

Padronizar o acompanhamento semanal do Smart Compliance durante o piloto interno, garantindo que operacao, seguranca, dados e suporte sejam revisados com criterios objetivos.

## Cadencia

- Frequencia: semanal nos primeiros 30 dias apos liberacao interna.
- Responsavel primario: RH ou pessoa designada como dona da operacao.
- Apoio: TI para infraestrutura, Compliance para incidentes, liderancas para pendencias de equipe.
- Evidencia minima: status report preenchido e link ou print dos paineis revisados.

## Checklist Semanal

### 1. Acesso e autenticacao

- [ ] Login validado com perfil `admin` ou `hr`.
- [ ] Login validado com perfil `manager`.
- [ ] Login validado com perfil `employee` ou usuario temporario autorizado.
- [ ] Usuarios bloqueados, inativos ou com troca de senha pendente revisados.
- [ ] Nenhuma credencial real registrada em documento, print publico ou chat operacional.

Sinal de alerta:

- Vermelho: usuario critico nao consegue acessar e nao ha contingencia.
- Amarelo: multiplos usuarios com erro de acesso, mas admin consegue corrigir.
- Verde: acessos principais funcionando e falhas isoladas tratadas.

### 2. Dashboard executivo

- [ ] Dashboard abre sem erro.
- [ ] `riskSummary` e alertas operacionais revisados.
- [ ] Assignments pendentes avaliados com responsavel de acompanhamento.
- [ ] Incidentes abertos ou vencidos revisados.
- [ ] PDI bloqueado ou nao iniciado revisado.

Sinal de alerta:

- Vermelho: dashboard indisponivel ou alerta critico sem responsavel.
- Amarelo: indicadores carregam, mas ha fila acumulada sem prazo claro.
- Verde: indicadores revisados e acoes atribuidas.

### 3. Auditoria gerencial

- [ ] Tela `/app/audit` acessada por perfil autorizado.
- [ ] Filtros por categoria, acao, ator e periodo testados.
- [ ] Eventos sensiveis recentes revisados.
- [ ] Mudancas de permissao, incidentes fechados e alteracoes de ciclo/PDI conferidas quando existirem.
- [ ] Colaborador sem permissao nao acessa a trilha operacional.

Sinal de alerta:

- Vermelho: perfil indevido acessa auditoria ou evento sensivel nao aparece.
- Amarelo: evento aparece, mas detalhe esta insuficiente para investigacao.
- Verde: trilha permite investigar os eventos da semana.

### 4. Banco, backup e restore

- [ ] Healthcheck do backend validado.
- [ ] Conexao MySQL validada no ambiente alvo.
- [ ] Backup mais recente localizado e com data/hora registrada.
- [ ] Backup operacional executado conforme rotina.
- [ ] Restore ou validacao operacional de backup conferido em ambiente seguro.

Sinal de alerta:

- Vermelho: backup ausente, falho ou sem possibilidade de restore.
- Amarelo: backup existe, mas restore nao foi conferido na semana.
- Verde: backup e validacao operacional documentados.

### 5. Modulos de produto

- [ ] Compliance: fila de incidentes revisada e casos sem responsavel tratados.
- [ ] Avaliacoes: ciclos ativos, pendencias e leituras sensiveis conferidos.
- [ ] Desenvolvimento/PDI: planos bloqueados, nao iniciados e eventos de aprendizagem revisados.
- [ ] Pessoas/Usuarios: novas entradas, alteracoes e acessos conferidos.
- [ ] Aplause: registros recentes revisados quando houver uso no periodo.

Sinal de alerta:

- Vermelho: modulo critico indisponivel ou dado fora de escopo visivel.
- Amarelo: modulo funciona, mas depende de ajuste manual recorrente.
- Verde: modulo opera dentro do escopo esperado.

## Triagem e Escalonamento

1. Classificar cada achado como verde, amarelo ou vermelho.
2. Registrar o achado no status report com modulo, impacto, responsavel e prazo.
3. Para item vermelho, acionar responsavel no mesmo dia e congelar expansao do piloto ate mitigacao.
4. Para item amarelo, acompanhar na proxima reuniao semanal ou antecipar se afetar usuario final.
5. Para item verde, manter evidencia e seguir rotina.

## Modelo de Status Report

Periodo: `____/____/______` a `____/____/______`

Responsavel pela revisao: `________________________`

Ambiente avaliado: `Producao / Staging / Isolado`

### Resumo Executivo

- Status geral: `Verde / Amarelo / Vermelho`
- Principal risco da semana:
- Principal acao concluida:
- Decisao recomendada: `manter piloto / conter expansao / pausar operacao`

### Indicadores Revisados

| Indicador | Valor | Status | Observacao |
| --- | --- | --- | --- |
| Healthcheck backend |  |  |  |
| Ultimo backup |  |  |  |
| Restore/validacao backup |  |  |  |
| Assignments pendentes |  |  |  |
| Incidentes abertos |  |  |  |
| PDI bloqueado/nao iniciado |  |  |  |
| Eventos sensiveis de auditoria |  |  |  |

### Achados e Acoes

| Modulo | Achado | Impacto | Responsavel | Prazo | Status |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

### Evidencias

- Dashboard:
- Auditoria:
- Backup:
- Healthcheck:
- Outros:

### Decisao

- [ ] Continuar piloto interno.
- [ ] Continuar com restricoes.
- [ ] Pausar expansao ate resolver itens vermelhos.

Justificativa:

