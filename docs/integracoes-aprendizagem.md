# Integrações de aprendizagem

Este documento define a primeira porta de entrada para integrar sistemas internos de cursos e treinamentos ao Smart Compliance.

## Objetivo

Receber eventos externos de aprendizagem sem acoplar o produto a um fornecedor específico. Os eventos entram em uma fila de revisão e podem ser aplicados em `Desenvolvimento` ou `PDI` mantendo rastreabilidade da origem.

## Endpoint

`POST /api/development/integrations/learning-events`

Permissão inicial: `admin` e `hr`.

### Payload

```json
{
  "sourceSystem": "LMS Corporativo",
  "events": [
    {
      "externalId": "course-001",
      "personEmail": "colaborador1@demo.local",
      "title": "Gestão de riscos aplicada",
      "providerName": "Academia Corporativa",
      "status": "completed",
      "completedAt": "2026-04-12",
      "workloadHours": 8,
      "competencyKey": "risk-management"
    }
  ]
}
```

### Regras atuais

- `completed` sugere criação futura de registro de `Desenvolvimento`.
- `in_progress` e `planned` sugerem criação futura de item de `PDI`.
- Emails conhecidos entram como `ready_for_review`.
- Emails não conciliados entram como `needs_review`.
- Duplicidades por `sourceSystem + externalId` são ignoradas.

## Aplicação revisada

`POST /api/development/integrations/learning-events/:eventId/apply`

Permissão: `admin` e `hr`.

O endpoint aplica o evento já conciliado:

- `completed` cria um registro em `development_records`.
- `planned` e `in_progress` criam um plano em `development_plans`.
- `competencyKey` tenta mapear automaticamente para `competencies.key`.
- Campos enviados no corpo podem sobrescrever a sugestão da integração, como `competencyId`, `recordType`, `dueDate`, `expectedEvidence` e `reviewNote`.
- O evento passa para `processingStatus = applied` e grava `appliedEntityType`, `appliedEntityId` e `appliedAt`.

## Próxima fase

- Adicionar uma tela de revisão manual no frontend antes da aplicação definitiva.
