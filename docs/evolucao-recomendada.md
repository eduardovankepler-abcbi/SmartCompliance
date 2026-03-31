# Evolucao Recomendada

Este documento organiza as frentes possiveis do produto e a ordem recomendada para evoluir o MVP sem perder estabilidade.

## Opcoes que temos agora

### 1. Qualidade e seguranca de evolucao
- objetivo: reduzir regressao antes de novas features
- foco: testes de fumaça, checklist operacional, verificacao unica do projeto
- quando priorizar: sempre que o app estiver mudando em varias frentes ao mesmo tempo

### 2. UX por perfil
- objetivo: deixar a experiencia mais clara para colaborador, gestor, RH, compliance e admin
- foco: esconder ruído, simplificar telas e refinar fluxos de uso real
- quando priorizar: se a prioridade for demonstracao e adocao interna

### 3. Fluxos de avaliacoes
- objetivo: tornar `Avaliacoes` ainda mais forte como modulo principal
- foco: telas mais independentes por submodulo, historico por ciclo, comparativos e regras de ciclo
- quando priorizar: se a prioridade for RH, lideranca e jornada de feedback

### 4. Dashboards executivos
- objetivo: fortalecer leitura gerencial e comercial
- foco: recortes por periodo, area, setor e consolidado por tipo de avaliacao
- quando priorizar: se a prioridade for reuniao executiva ou apresentacao comercial

### 5. Governanca e rastreabilidade
- objetivo: maturidade operacional
- foco: trilha de auditoria, historico de alteracoes, maior rigor em compliance e usuarios
- quando priorizar: se o MVP estiver indo para uso mais serio ou piloto controlado

## Sequencia recomendada

### Passo 1. Baseline de verificacao
Status: concluido.

Entregas:
- comando unico `npm run verify`
- consolidacao dos testes existentes
- criterio claro para validar backend + frontend antes de cada rodada

Resultado:
- toda nova rodada pode ser fechada com um check simples e repetivel
- menos chance de quebrar login, avaliacoes, dashboard e navegacao sem perceber

### Passo 2. Refino por perfil
Status: concluido.

Foco:
- revisar jornada de colaborador
- revisar jornada de gestor
- revisar jornada administrativa
- remover blocos apenas explicativos e reforcar o que e acionavel

Entregas ja aplicadas:
- navegacao mais coerente por perfil
- secao inicial priorizada por papel (`Avaliacoes` para colaborador e `Compliance` para perfil de compliance)
- contexto do topo mais aderente a cada jornada
- formularios do colaborador e do canal de relato com menos campos sem utilidade no fluxo
- remocao de ruido em jornadas com opcao unica de pessoa ou identificacao anonima

Resultado esperado:
- telas mais objetivas
- menos confusao visual
- demonstracao mais convincente

### Passo 3. Avaliacoes em experiencia ainda mais modular
Status: concluido.

Foco:
- avaliar separacao maior dos submodulos
- reforcar historico por ciclo
- melhorar comparativos e filtros

Entregas ja aplicadas:
- destaque proprio do submodulo ativo
- comparacao entre ciclos com deltas de evolucao
- historico do submodulo mais contextualizado no ciclo em foco
- separacao clara entre `Responder`, `Leituras` e `Operacao`
- governanca de ciclo e biblioteca isoladas do fluxo de resposta
- roteamento proprio para workspace operacional do modulo

Resultado esperado:
- modulo mais maduro
- menos acoplamento visual na mesma tela

### Passo 4. Dashboards por leitura executiva
Status: concluido.

Foco:
- leitura temporal mais forte
- recortes por area e setor
- consolidado por elemento do ciclo

Entregas ja aplicadas:
- sintese executiva do recorte logo no topo do dashboard
- narrativa rapida com foco, evolucao temporal e principal ponto de atencao
- comparativo automatico por periodo com melhora, queda e area critica
- mensagens-chave com risco principal, sinal positivo e prioridade recomendada
- alternancia entre leitura executiva e leitura analitica

Resultado esperado:
- melhor uso em reunioes
- melhor narrativa comercial

### Passo 5. Auditoria e trilha operacional
Status: concluido.

Foco:
- historico de alteracoes em usuarios, ciclos, compliance e feedback direto
- maior confiabilidade para operacao

Entregas ja aplicadas:
- trilha operacional persistida para usuarios, compliance, ciclos e feedback direto
- endpoint dedicado de auditoria com escopo por perfil
- leitura da trilha exibida nas telas de Usuarios, Compliance e Avaliacoes
- cobertura minima de regressao para acesso e filtragem da auditoria

Resultado esperado:
- produto mais robusto
- menos dependencia de memoria operacional

## Regra pratica para as proximas rodadas

Antes de considerar qualquer etapa concluida:

1. Rodar `npm run verify`
2. Testar login com pelo menos um perfil operacional
3. Validar rapidamente `Avaliacoes` e a secao principal do perfil usado

## Proxima trilha recomendada

### Passo 1. Fechar Biblioteca de Avaliacoes com criacao real de ciclo
Status: concluido.

Entregas:
- novo ciclo passa a escolher a biblioteca aplicada
- backend deixa de fixar o ciclo no template `t1`
- biblioteca publicada passa a governar o template carregado no assignment do ciclo
- ciclos passam a exibir a biblioteca usada

### Passo 2. Vincular Compliance a area e responsavel real
Status: concluido.

Entregas:
- `Compliance` deixa de depender de `assignedTo` em texto livre
- cada caso passa a registrar `area responsavel`
- a fila operacional permite definir `responsavel designado`
- exibicao do caso passa a refletir area, responsavel e fallback para o gestor da area

### Passo 3. Completar ciclo de vida de Desenvolvimento
Status: concluido.

Entregas:
- registros de desenvolvimento agora podem ser editados
- historico ganhou manutencao direta por registro
- arquivamento passou a fazer parte do fluxo, sem perder o historico
- backend cobre criacao, atualizacao e arquivamento com regressao automatizada

### Passo 4. Completar ciclo de vida de Aplause
Status: concluido.

Entregas:
- Aplause agora permite manutencao administrativa dos registros
- status pode ser ajustado no fluxo publicado
- gestores e perfis administrativos conseguem revisar e arquivar registros
- backend cobre criacao e atualizacao com regressao automatizada

### Passo 5. Homologacao final dos modulos
Status: concluido.

Entregas:
- revisao final das jornadas publicadas por modulo
- remocao do acoplamento invisivel do score no cadastro de pessoas
- trilha operacional conectada tambem a Desenvolvimento e Aplause
- regressao adicional para garantir cadastro de pessoa sem score manual

## Trilha 360 recomendada

### Passo 1. Formalizar competencias
Status: concluido.

Entregas:
- cadastro formal de competencias no backend
- governanca de competencias dentro da operacao de biblioteca
- capacidade de criar e atualizar competencias por RH/Admin
- regressao automatizada para o ciclo basico da entidade

### Passo 2. Formalizar participantes e avaliadores
Status: concluido.

Entregas:
- separar `participante do ciclo` de `assignment`
- explicitar quem e avaliado em cada ciclo
- explicitar quem avalia quem, por papel
- exibir a estrutura do ciclo na operacao de avaliacoes
- manter o status do avaliador sincronizado com a submissao

### Passo 3. Fechar status processado e snapshot de relatorio
Status: concluido.

Entregas:
- novo status `Processado`
- congelamento do relatorio final do ciclo
- leitura historica sem depender so do dado transacional
- processamento operacional direto na tela de avaliacoes

### Passo 4. Criar PDI estruturado
Status: concluido.

Entregas:
- plano de desenvolvimento individual com foco, acao, prazo e evidencia
- manutencao completa do PDI no backend e no frontend
- vinculo opcional com ciclo e competencia
- trilha operacional de criacao, atualizacao e arquivamento do plano

### Passo 5. Adicionar clientes internos e externos como grupos reais
Status: concluido.

Entregas:
- novos grupos reais de relacionamento no ciclo: `client-internal` e `client-external`
- materializacao automatica desses grupos ao criar ciclo e distribuicao de assignments
- consolidacao anonima por grupo no bundle de respostas e snapshots processados
- suporte de importacao/exportacao de biblioteca para os novos tipos
- navegacao e leitura operacional dos novos submodulos no frontend

### Passo 6. Homologar 360 publicado ponta a ponta
Status: concluido.

Entregas:
- roteiro de homologacao publicado por perfil em `docs/homologacao-360-publicado.md`
- criterios de aceite para ciclo, grupos do 360, consolidacao e PDI
- checklist operacional para execucao da equipe no ambiente publicado
- novos relationship types no motor do 360
- regras proprias de visibilidade e consolidacao

### Passo 6. Homologar 360 publicado ponta a ponta
Status: pendente.

Entregas esperadas:
- checklist funcional completo no ambiente publicado
- validacao final por perfil e por grupo de avaliador
