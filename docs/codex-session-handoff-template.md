# Codex Session Handoff

Use este arquivo para retomar o trabalho em uma nova conversa quando a sessao anterior ficar longa, instavel ou travar.

## 1. Objetivo atual

Descreva em 1 a 3 linhas o que estamos tentando concluir agora.

Exemplo:
> Concluir a estabilizacao do fluxo de avaliacoes com MySQL/Aiven e validar que frontend e backend carregam sem erro no ambiente publicado.

## 2. Resumo executivo

Preencha este bloco primeiro se estiver com pouco tempo.

- Objetivo:
- Estado atual:
- Erro principal:
- Proximo passo:

## 3. Status atual

- O que ja foi concluido:
- O que esta funcionando:
- O que ainda falta:
- O que esta quebrado agora:

## 4. Contexto tecnico essencial

- Stack principal:
- Ambiente atual:
- Banco/provedor:
- Branch:
- Deploy/plataforma:
- Papel do usuario usado nos testes:
- URL publicada:
- Servicos envolvidos:

## 5. Arquivos relevantes

Liste apenas os arquivos que realmente importam para a retomada.

- `backend/src/...`
- `frontend/src/...`
- `docs/...`

## 6. Alteracoes recentes

Descreva as ultimas mudancas relevantes em bullets curtos.

- Ajuste 1:
- Ajuste 2:
- Ajuste 3:

## 7. Decisoes tomadas

Registre escolhas que nao devem ser reabertas sem motivo.

- Decisao 1:
- Decisao 2:
- Decisao 3:

## 8. Hipotese atual

Escreva a melhor leitura tecnica do problema neste momento.

Exemplo:
> O erro atual parece estar no caminho MySQL legado de respostas, nao no frontend, porque a rota `/api/evaluations/responses` retorna 500 e o stack trace aponta para query com coluna ausente.

## 9. Erro atual

Cole aqui a mensagem exata do erro, stack trace ou resposta da API.

```txt
Cole aqui o erro atual
```

## 10. Como reproduzir

Descreva o menor caminho para reproduzir o problema.

1. Abrir:
2. Clicar em:
3. Esperar:
4. Resultado atual:
5. Resultado esperado:

## 11. Evidencias coletadas

Inclua apenas o que ajuda a retomar rapido.

- Endpoint com erro:
- Log do backend:
- Print/descricao do comportamento:
- Query SQL relevante:
- Ultimo commit relacionado:

## 12. Working tree atual

- Arquivos modificados:
- Arquivos novos:
- Arquivos que nao podem ser sobrescritos sem revisar:

## 13. Resumo de diff

Cole um resumo curto do impacto atual.

Exemplo:
> 13 files changed, 536 insertions(+), 191 deletions(-)

## 14. Comandos ja executados

Registre o que ja foi rodado para evitar repeticao desnecessaria.

```powershell
npm test
npm --prefix frontend run build
```

## 15. Proximos comandos recomendados

Deixe aqui o proximo bloco util de comandos.

```powershell
# preencher
```

## 16. Validacoes ja feitas

- Testes que passaram:
- Build que passou:
- Fluxos manuais ja verificados:
- O que ainda nao foi validado:

## 17. Criterios de aceite

Defina o que precisa ser verdade para considerar a rodada concluida.

- Criterio 1:
- Criterio 2:
- Criterio 3:

## 18. Pendencias abertas

- Pendencia 1:
- Pendencia 2:
- Pendencia 3:

## 19. Riscos ou cuidados

- Nao sobrescrever mudancas locais do usuario
- Verificar compatibilidade MySQL antes de assumir schema completo
- Conferir se o erro e de frontend, backend ou deploy

## 20. Proximo passo recomendado

Escreva uma unica proxima acao, objetiva e executavel.

Exemplo:
> Abrir os logs do backend no Render, reproduzir o erro em `/api/evaluations/responses` e corrigir a query que ainda depende de coluna ausente no MySQL publicado.

## 21. Prompt de retomada

Cole este bloco em uma nova conversa:

```txt
Estamos retomando este projeto a partir de um handoff. Leia e continue do ponto atual sem recomeçar do zero.

Objetivo atual:
[preencher]

Resumo executivo:
[preencher]

Status atual:
[preencher]

Arquivos relevantes:
[preencher]

Decisoes tomadas:
[preencher]

Hipotese atual:
[preencher]

Erro atual:
[preencher]

Como reproduzir:
[preencher]

Evidencias:
[preencher]

Working tree atual:
[preencher]

Resumo de diff:
[preencher]

Comandos ja executados:
[preencher]

Proximos comandos recomendados:
[preencher]

Validacoes ja feitas:
[preencher]

Criterios de aceite:
[preencher]

Pendencias abertas:
[preencher]

Proximo passo recomendado:
[preencher]
```

## 22. Checklist de retomada

Antes de continuar em outra conversa:

- confirmar o erro atual
- confirmar o working tree
- confirmar se os testes passaram ou nao
- confirmar o proximo passo unico
- colar o prompt de retomada com o erro exato

## 23. Versao preenchivel rapida

Se estiver com pressa, preencha pelo menos isto:

```txt
Objetivo:
Estado atual:
Erro atual:
Como reproduzir:
Arquivos principais:
O que ja foi tentado:
O que funcionou:
Working tree:
Proximo comando:
Proximo passo:
```
