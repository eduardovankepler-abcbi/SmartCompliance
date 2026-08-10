# Roteiro de Revisao Assistida por Modulo - Onda 6

Data de criacao: 10/08/2026

## Objetivo

Guiar sessoes curtas de revisao assistida do Smart Compliance com usuarios reais, registrando achados por modulo antes de qualquer expansao ampla.

## Status

Status atual: `Preparado, execucao bloqueada`

A execucao depende de usuarios reais indicados por RH/Operacao e do responsavel operacional nominal da Onda 6.

## Participantes Minimos

| Perfil | Papel na revisao |
| --- | --- |
| RH/Admin | Validar operacao geral, cadastros, avaliacoes e dashboard. |
| Compliance | Validar incidentes, evidencias e auditoria de compliance. |
| Gestor | Validar escopo de equipe, avaliacoes, PDI e dashboard gerencial. |
| Colaborador | Validar acesso restrito, compliance, avaliacoes, PDI/Aplause quando aplicavel. |
| TI/Operacao | Apoiar acesso, evidencias, backup/restore e registro de achados. |

## Regras da Sessao

- Usar usuarios reais apenas com autorizacao do responsavel operacional.
- Nao registrar senhas, tokens, hashes ou dados sensiveis nos documentos.
- Registrar achados como `Verde`, `Amarelo` ou `Vermelho`.
- Converter cada achado amarelo/vermelho em responsavel, prazo e proxima acao.
- Nao expandir grupo se houver item vermelho sem mitigacao.

## Roteiro por Modulo

### 1. Acesso e Permissoes

Participantes: RH/Admin, Gestor, Colaborador, TI.

Checklist:

- [ ] Login com perfil autorizado funciona.
- [ ] Colaborador nao acessa dashboard gerencial nem auditoria.
- [ ] Gestor enxerga apenas escopo esperado.
- [ ] Usuario inativo ou pendente nao passa sem tratamento.
- [ ] Troca de senha, quando exigida, direciona corretamente.

Evidencia minima:

- perfis testados;
- rotas acessadas;
- resultado por perfil;
- sem credenciais documentadas.

### 2. Compliance e Incidentes

Participantes: Compliance, RH/Admin, Colaborador.

Checklist:

- [ ] Colaborador consegue registrar relato no canal permitido.
- [ ] Compliance/RH visualiza fila de tratamento.
- [ ] Caso sem responsavel fica evidente.
- [ ] Evidencia pode ser anexada e baixada por perfil autorizado.
- [ ] Evento aparece na auditoria.

Evidencia minima:

- protocolo ou identificador nao sensivel do caso;
- status do caso;
- confirmacao de auditoria;
- achados de permissionamento.

### 3. Avaliacoes

Participantes: RH/Admin, Gestor, Colaborador.

Checklist:

- [ ] Ciclo ativo aparece para perfil esperado.
- [ ] Colaborador acessa avaliacao atribuida.
- [ ] Gestor acompanha pendencias do seu escopo.
- [ ] RH/Admin consegue revisar biblioteca/questionarios/operacao.
- [ ] Perguntas sensiveis e leituras restritas nao vazam para perfil indevido.

Evidencia minima:

- ciclo avaliado;
- perfil usado;
- pendencias encontradas;
- qualquer bloqueio ou texto confuso.

### 4. Desenvolvimento/PDI

Participantes: RH/Admin, Gestor, Colaborador.

Checklist:

- [ ] Plano de desenvolvimento pode ser acompanhado.
- [ ] PDI bloqueado ou nao iniciado aparece como pendencia operacional.
- [ ] Gestor entende proxima acao.
- [ ] Colaborador enxerga apenas registros do seu escopo.
- [ ] Eventos de aprendizagem aguardando revisao ficam identificaveis.

Evidencia minima:

- plano ou registro revisado;
- status atual;
- responsavel pela proxima acao;
- achados de escopo.

### 5. Pessoas e Usuarios

Participantes: RH/Admin, TI.

Checklist:

- [ ] Cadastro de pessoa real funciona dentro da estrutura correta.
- [ ] Hierarquia/area/unidade ficam coerentes.
- [ ] Provisionamento de usuario orienta quando falta pessoa elegivel.
- [ ] Perfil e status de acesso ficam corretos.
- [ ] Alteracoes relevantes aparecem na auditoria.

Evidencia minima:

- pessoa/usuario testado sem dados sensiveis;
- perfil atribuido;
- status do acesso;
- evento de auditoria esperado.

### 6. Aplause

Participantes: Colaborador, Gestor ou RH.

Checklist:

- [ ] Usuario entende o fluxo de reconhecimento.
- [ ] Registro aparece no escopo esperado.
- [ ] Gestor/RH consegue revisar uso recente quando aplicavel.
- [ ] Nao ha exposicao indevida entre areas.

Evidencia minima:

- reconhecimento registrado ou revisado;
- perfil usado;
- visibilidade esperada.

### 7. Dashboard e Auditoria

Participantes: RH/Admin, Gestor, Compliance.

Checklist:

- [ ] Dashboard abre sem erro.
- [ ] Alertas operacionais fazem sentido para o grupo real.
- [ ] Quick actions levam para modulos esperados.
- [ ] Auditoria filtra por categoria, acao, ator e periodo.
- [ ] Eventos recentes da revisao aparecem na trilha.

Evidencia minima:

- alertas ativos;
- filtros testados;
- eventos encontrados;
- decisao operacional tomada.

## Modelo de Registro de Achado

| Modulo | Perfil | Achado | Classificacao | Responsavel | Prazo | Proxima acao |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  | Verde/Amarelo/Vermelho |  |  |  |

## Criterios de Aceite da Etapa

- Todos os modulos criticos revisados com ao menos um usuario real ou bloqueio registrado.
- Itens vermelhos possuem mitigacao ou impedem expansao.
- Itens amarelos possuem responsavel e prazo.
- Status report da Semana 2 atualizado com os achados.
- Decisao de expansao por grupo pequeno registrada.

## Proxima Acao

Agendar a revisao assistida com RH/Admin, Compliance, Gestor, Colaborador e TI/Operacao, usando este roteiro como guia.

## Historico

- 10/08/2026: execucao tentada, mas bloqueada por ausencia de responsavel operacional nominal, canal oficial e usuarios reais autorizados. Registro em `docs/execucao-revisao-assistida-onda-6-2026-08-10.md`.
