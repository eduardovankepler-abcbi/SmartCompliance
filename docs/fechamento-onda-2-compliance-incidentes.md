# Fechamento da Onda 2 - Compliance e Incidentes

Data do fechamento: 2026-08-04

## Escopo entregue

- Protocolo rastreavel por incidente.
- SLA inicial de triagem por caso.
- Fechamento controlado com motivo obrigatorio.
- Evidencias/anexos por incidente com limite de tamanho e tipos permitidos.
- Download autenticado de evidencias.
- Trilha operacional filtrada por caso.
- Criterios de prontidao exibidos no card do incidente.
- Permissoes validadas para compliance, admin e colaborador.
- Healthcheck cobrindo estrutura MySQL de incidentes e evidencias.

## Evidencias de homologacao

- Backend publicado: `5896b81703c2f49d20e117e6fc517d926c02cb76`.
- Frontend publicado: `https://smart-compliance-angular.vercel.app`.
- Healthcheck em producao: `status=ok`, `ready=true`, `database=ok`, `incidentsTable=ok`, `incidentEvidencesTable=ok`.
- Caso homologado no fluxo completo: `SC-20260804-T1TCKP`.
- Fluxo validado:
  - criar caso;
  - anexar evidencia;
  - tratar como `Em apuracao`;
  - concluir com motivo;
  - revisar prontidao;
  - revisar historico filtrado do caso;
  - validar bloqueio de fila/evidencias para colaborador.

## Checklist de aceite

- [x] Caso recebe protocolo no formato esperado.
- [x] Caso recebe prazo inicial.
- [x] Encerramento sem motivo e bloqueado.
- [x] Encerramento com motivo registra `closedAt` e `closureNote`.
- [x] Evidencia permitida pode ser anexada, listada e baixada.
- [x] Tipos de evidencia nao permitidos sao bloqueados.
- [x] Evento de evidencia aparece na auditoria.
- [x] Auditoria por caso retorna apenas eventos do incidente solicitado.
- [x] Tela publica renderiza fila, protocolo, prontidao, evidencias e historico.
- [x] Perfil compliance consegue operar a fila.
- [x] Perfil colaborador nao acessa fila nem evidencias.
- [x] Usuario temporario de homologacao foi inativado ao final.

## Riscos residuais

- Evidencias estao persistidas no MySQL como `LONGBLOB`; para alto volume, migrar para storage dedicado com URL assinada e retencao configuravel.
- Nao ha antivírus/varredura de arquivo no upload; antes de uso amplo, integrar verificação externa ou restringir ainda mais os tipos aceitos.
- Nao ha politica automatica de retencao/expurgo de incidentes e evidencias.
- A tela carrega historico/evidencias por caso visivel; se a fila crescer muito, paginar ou carregar sob demanda.

## Decisao de fechamento

A Onda 2 esta aceita para uso interno controlado do modulo de Compliance/Incidentes, desde que os riscos residuais acima sejam tratados como evolucao operacional antes de grande escala.

Proxima onda recomendada: Onda 3 - Avaliacoes e PDI para maturidade de producao.
