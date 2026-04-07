# Feedback Transversal

## Objetivo

Formalizar o submodulo hoje chamado de `Feedback indireto` como um fluxo mais justo, auditavel e confiavel para leitura de colaboracao entre areas.

Nome recomendado do submodulo:

- `Feedback transversal`

## Problema do modelo atual

Hoje o relacionamento `cross-functional`:

- e gerado automaticamente
- usa um pareamento simples
- depende da ordem dos registros
- nao oferece balanceamento real
- nao explicita bem a governanca do processo para RH

Isso faz o processo parecer aleatorio, sem realmente ser justo nem transparente.

## Regra de negocio proposta

### Elegibilidade

Participam do `Feedback transversal` apenas pessoas que:

- possuem usuario ativo
- possuem `workUnit` preenchido
- possuem `workMode` diferente de `remote`
- pertencem a um ciclo com o modulo `cross-functional` habilitado

### Restricoes do pareamento

Um colaborador so pode avaliar outro colaborador quando:

- ambos trabalham na mesma unidade
- pertencem a areas diferentes
- nao sao a mesma pessoa
- nao existe relacao de gestao direta entre eles

Relacao de gestao direta significa:

- o avaliador e gestor direto do avaliado
- ou o avaliado e gestor direto do avaliador

### Carga alvo por ciclo

Por padrao, cada colaborador elegivel deve:

- avaliar `1` pessoa no `Feedback transversal`
- ser avaliado por `1` pessoa no `Feedback transversal`

Essa regra deve ser parametrizavel no futuro, mas a implementacao inicial deve assumir `1 -> 1`.

### Casos sem pareamento

Se a unidade nao tiver pessoas suficientes para cumprir as restricoes:

- o colaborador fica marcado como `sem pareamento elegivel`
- o ciclo continua valido
- o RH enxerga a pendencia na operacao
- a ocorrencia entra na trilha de auditoria do ciclo

## Modelo de pareamento recomendado

### Principio

O sistema deve usar um pareamento:

- automatico
- balanceado
- auditavel
- sem escolha manual livre do RH

### Regras de priorizacao

Ao gerar os pares, o motor deve priorizar:

1. pessoas da mesma unidade
2. areas diferentes
3. ausencia de relacao de gestao direta
4. menor repeticao de pares em relacao ao ciclo anterior
5. melhor distribuicao de carga entre participantes

### Desempate

Quando houver mais de um candidato valido, o sistema deve usar um desempate controlado:

- por ordem auditavel derivada do ciclo
- ou por `seed` do ciclo

O sistema nao deve depender simplesmente da ordem fisica dos registros na base.

### Resultado esperado

O pareamento final deve ser:

- reproduzivel
- explicavel
- menos enviesado
- mais defensavel para auditoria

## Papel do RH

### Regra geral

O RH nao deve escolher livremente os pares como fluxo padrao.

### Atuacao permitida

O RH pode atuar por excecao:

- bloquear um pareamento
- refazer o pareamento de uma pessoa
- forcar um pareamento especifico

### Governanca das excecoes

Toda excecao manual deve exigir:

- justificativa obrigatoria
- usuario responsavel
- data e hora
- trilha de auditoria

## Sigilo e visibilidade

### Avaliado

O avaliado:

- nao ve quem respondeu
- nao ve resposta individual identificada
- ve apenas a leitura consolidada do submodulo

### Avaliador

O avaliador:

- ve apenas os assignments dele
- nao ve a devolutiva consolidada do avaliado

### RH e Admin

RH e Admin:

- veem pares gerados
- veem excecoes
- veem respostas individuais
- veem trilha completa de auditoria

### Gestor do avaliado

O gestor direto do avaliado:

- pode ver a leitura individual ou confidencial desse submodulo

### Gestor do avaliador

O gestor do avaliador:

- nao deve ver esse feedback por padrao

## Mudancas funcionais no produto

### Nome e linguagem

Trocar no frontend:

- `Feedback indireto` -> `Feedback transversal`

Trocar textos de apoio para refletir:

- colaboracao entre areas
- mesma unidade
- confidencialidade para o avaliado

### Operacao do ciclo

O workspace `Operacao` deve mostrar:

- participantes elegiveis
- pares gerados
- pessoas sem pareamento elegivel
- pares repetidos em relacao ao ciclo anterior
- excecoes aplicadas manualmente

### Resposta

O fluxo de resposta continua simples:

- assignment individual
- questionario do submodulo
- sigilo preservado para o avaliado

### Leituras

Para colaborador:

- apenas leitura consolidada

Para gestor do avaliado:

- leitura do time sob seu escopo

Para RH/Admin:

- leitura completa, com trilha de governanca

## Regras de dados

### Campos ja existentes reaproveitados

O modelo atual ja possui base suficiente para iniciar:

- `people.workUnit`
- `people.workMode`
- `people.area`
- `people.managerPersonId`
- `evaluation_assignments.relationshipType`
- `relationshipType = cross-functional`

### Estruturas novas recomendadas

Para melhorar governanca e rastreabilidade, recomenda-se criar:

- `evaluation_pairings`
  - `id`
  - `cycleId`
  - `relationshipType`
  - `reviewerUserId`
  - `revieweePersonId`
  - `pairingSource` (`automatic` ou `manual`)
  - `pairingReason`
  - `seed`
  - `createdAt`
  - `createdByUserId`
- `evaluation_pairing_exceptions`
  - `id`
  - `cycleId`
  - `pairingId`
  - `actionType`
  - `reason`
  - `actorUserId`
  - `createdAt`

## Regras de auditoria

O sistema deve registrar:

- geracao automatica dos pares
- quantidade de pessoas sem par elegivel
- qualquer excecao manual do RH
- reprocessamento de pareamento do ciclo

## Estrategia de implementacao

### Fase 1

- renomear `Feedback indireto` para `Feedback transversal`
- substituir o pareamento atual pelo motor balanceado
- manter `1 avaliador -> 1 avaliado`
- exibir elegiveis e nao elegiveis no workspace `Operacao`

### Fase 2

- adicionar tabela dedicada de pareamentos
- adicionar excecoes manuais com justificativa
- registrar trilha detalhada de governanca

### Fase 3

- suportar mais de um avaliador por pessoa
- suportar parametrizacao por unidade
- adicionar indicadores de repeticao e cobertura historica

## Criterios de aceite

O submodulo estara alinhado quando:

- nenhum `remote` participar do `Feedback transversal`
- nenhum par for gerado dentro da mesma area
- nenhum par for gerado entre gestor direto e liderado
- o avaliado nao conseguir identificar o autor da resposta
- RH/Admin conseguirem auditar o pareamento
- o gestor direto do avaliado conseguir acessar a leitura prevista
- pessoas sem par elegivel aparecerem claramente na operacao

## Decisao recomendada

A decisao recomendada para o produto e:

- usar `Feedback transversal` como nome oficial
- adotar pareamento automatico balanceado como regra padrao
- reservar a intervencao do RH apenas para excecoes auditadas

Esse modelo protege melhor a honestidade do processo do que:

- sorteio puro
- escolha manual livre
- ou selecao pelo primeiro registro disponivel
