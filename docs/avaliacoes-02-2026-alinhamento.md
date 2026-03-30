# Alinhamento das Avaliacoes 02/2026

## Fontes analisadas

- `Autoavaliacao profissional 02_2026 - Google Formularios.pdf`
- `Avaliacao de lideres 02_2026 - Google Formularios.pdf`
- `Avaliacao de satisfacao 02_2026 - Google Formularios.pdf`

## O que foi alinhado

- `Autoavaliacao` passou a refletir o formulario real com:
  - 20 perguntas em escala de concordancia
  - 1 pergunta final aberta
  - secoes tematicas iguais ao formulario
- `Avaliacao do Lider` passou a refletir o formulario real com:
  - 20 perguntas em escala de concordancia
  - 1 pergunta final aberta
  - secoes tematicas iguais ao formulario
- `Avaliacao da Empresa / Satisfacao` passou a refletir o formulario real com:
  - perguntas em escala de concordancia
  - perguntas abertas
  - pergunta de multipla selecao
  - secoes tematicas iguais ao formulario

## Evolucoes tecnicas aplicadas

- suporte a perguntas `scale`, `text` e `multi-select`
- renderizacao por secao no frontend
- exportacao de template `.xlsx` pronto para importacao da biblioteca
- importador expandido para aceitar:
  - `section_key`
  - `section_title`
  - `section_description`
  - `helper_text`
  - `input_type`
  - `option_values`
  - `scale_profile`
  - `collect_evidence_on_extreme`

## Premissas preservadas

- campos de contexto como `Seu nome`, `Seu setor e cargo` e `Seu lider` continuam derivados do proprio sistema, em vez de virarem perguntas duplicadas no formulario digital
- o fluxo de `Feedback de Colaboracao` foi mantido como ja existia, porque nao fazia parte dos PDFs enviados
- os dados reais existentes foram preservados; os ajustes se concentraram na biblioteca, no motor de resposta e no template de importacao
