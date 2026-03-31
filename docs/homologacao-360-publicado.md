# Homologacao 360 Publicado

Este roteiro organiza a validacao funcional do modulo 360 no ambiente publicado.

## Ambientes

- Frontend publicado: `https://smart-compliance-frontend.vercel.app`
- Backend publicado: `https://smartcompliance.onrender.com`
- Health check: `https://smartcompliance.onrender.com/health`

## Credenciais demo

- `admin@demo.local / demo123`
- `rh@demo.local / demo123`
- `gestor@demo.local / demo123`
- `colaborador1@demo.local / demo123`
- `colaborador2@demo.local / demo123`
- `consultor1@demo.local / demo123`

## Pre-check

1. Abrir o health check e confirmar `status: ok`
2. Abrir o frontend publicado
3. Validar login com `admin@demo.local`

## Matriz por perfil

### RH / Admin

Validar:
- acessar `Avaliacoes`
- abrir `Biblioteca`
- criar ou publicar biblioteca
- criar novo ciclo escolhendo a biblioteca
- liberar ciclo
- encerrar ciclo
- processar ciclo
- abrir `Operacao`
- validar participantes do ciclo
- validar relacionamentos:
  - `self`
  - `manager`
  - `leader`
  - `peer`
  - `cross-functional`
  - `client-internal`
  - `client-external`
  - `company`
- validar snapshots apos `Processado`

Aceite:
- ciclo usa a biblioteca escolhida
- participantes e avaliadores aparecem por relacionamento
- ciclo processado congela leitura agregada

### Gestor

Validar:
- acessar `Avaliacoes`
- abrir `Leituras`
- comparar ciclos
- responder `Feedback do Lider`
- visualizar apenas equipe/escopo proprio
- acessar `Desenvolvimento`
- criar e concluir PDI da equipe

Aceite:
- gestor nao ve escopo organizacional indevido
- leituras respeitam consolidado do time
- PDI fica salvo e atualizavel

### Colaborador

Validar:
- acessar `Avaliacoes`
- responder `Autoavaliacao`
- responder `Avaliacao de Satisfacao`
- responder `Avaliacao do Lider`
- responder `Cliente Interno` quando existir
- responder `Cliente Externo` quando existir
- abrir `Desenvolvimento`
- visualizar apenas dados proprios

Aceite:
- jornada de resposta fica limpa
- colaborador nao ve dashboard
- colaborador nao ve leituras estrategicas

### Consultor / Parceiro

Validar:
- login com `consultor1@demo.local`
- acessar assignments de `Cliente Externo`
- responder avaliacao sem visualizar dados internos indevidos

Aceite:
- grupo externo participa como avaliador real
- resposta entra no consolidado do ciclo

## Regras criticas do 360

Validar:
- grupos anonimos so aparecem com minimo de respondentes
- `leader`, `client-internal` e `client-external` entram no agregado
- resposta so acontece em ciclo `Liberado`
- ciclo `Encerrado` nao aceita novas respostas
- ciclo `Processado` preserva snapshot final

## Evidencias recomendadas

- print da tela de criacao de ciclo com biblioteca
- print da operacao mostrando participantes e relacionamentos
- print da resposta de cada submodulo principal
- print do ciclo em `Processado`
- print do PDI criado e concluido

## Resultado esperado

Ao final da homologacao:
- todos os grupos do 360 devem existir como fluxo real
- o ciclo deve sair de `Planejamento` ate `Processado`
- a leitura consolidada deve refletir os grupos com confidencialidade adequada
- o PDI deve fechar a jornada pos-avaliacao
