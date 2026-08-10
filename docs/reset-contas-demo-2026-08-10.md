# Reset de Contas Demo - 10/08/2026

## Objetivo

Restaurar o acesso das contas demo do Smart Compliance enquanto os usuarios reais ainda nao foram criados para a fase Alfa.

## Autorizacao

Operacao autorizada pelo usuario em 10/08/2026 para restaurar todas as contas demo.

## Escopo

Filtro aplicado no banco:

- somente usuarios com e-mail `@demo.local`;
- nenhuma conta real alterada.

## Resultado

Status: `Concluido`

Foram atualizadas 7 contas demo:

| Conta | Perfil | Status | Troca obrigatoria |
| --- | --- | --- | --- |
| `admin@demo.local` | `admin` | `active` | `false` |
| `rh@demo.local` | `hr` | `active` | `false` |
| `gestor@demo.local` | `manager` | `active` | `false` |
| `compliance@demo.local` | `compliance` | `active` | `false` |
| `colaborador1@demo.local` | `employee` | `active` | `false` |
| `colaborador2@demo.local` | `employee` | `active` | `false` |
| `consultor1@demo.local` | `employee` | `active` | `false` |

## Validacao

Todas as contas acima foram validadas na API publicada com retorno `200` em `POST /api/auth/login`.

## Observacoes de Seguranca

- Nenhum hash, token ou segredo foi registrado.
- As contas demo devem ser removidas ou desativadas conforme usuarios reais forem criados.
- Esta operacao deve ser considerada temporaria para homologacao/Alfa controlada.
