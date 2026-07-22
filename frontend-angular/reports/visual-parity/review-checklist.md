# Checklist de divergencias visuais

Atualizado em: 2026-07-22T17:05:02.722Z

Status permitidos: `pendente`, `ok`, `atencao`, `corrigir`.

Status do bloco 7: Bloco 7 fechado: capturas completas e sem divergencias visuais bloqueantes.

Gate visual minimo: aprovado.

| ID | Rota | Status | Observacoes |
| --- | --- | --- | --- |
| dashboard | Dashboard | ok | Topo executivo, abas de leitura, tema escuro, densidade analitica, comparativos e acoes recomendadas foram aproximados da referencia React. |
| compliance | Compliance / Incidentes | ok | Divergencia simples fechada: formulario abre por padrao e composicao de triagem/fila esta proxima do React; diferencas restantes ficam no refinamento global de shell/tema. |
| development | Desenvolvimento | ok | Tema escuro, formularios principais visiveis e bloco de trilha/indice foram aproximados; diferencas restantes decorrem de dados reais completos no Angular versus recorte vazio na referencia React. |
| applause | Aplause | ok | Conteudo e fluxo estao proximos; diferenca principal e tema claro versus escuro e densidade visual. |
| people | Pessoas | ok | Tema escuro, densidade, formulario inicial e edicao inline expandida por pessoa foram aproximados; fluxo de atualizacao inline coberto por E2E. |
| users | Usuarios | ok | Tema escuro, densidade, formulario inicial e edicao inline expandida foram aproximados; fluxo de atualizacao inline coberto por E2E. |

## Criterios sugeridos

- `ok`: diferencas aceitaveis ou inexistentes.
- `atencao`: diferenca visual pequena, sem bloquear fechamento.
- `corrigir`: diferenca relevante de layout, hierarquia, conteudo ou legibilidade.
