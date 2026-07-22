# Bundle budget

Generated at: 2026-07-22T14:35:02.641Z

Status: passed

Initial bundle: 275.95 kB / 300.00 kB

## Initial files

| File | Size |
| --- | ---: |
| main-FDCYSPBD.js | 3.72 kB |
| styles-BIVBVGYV.css | 1.83 kB |
| chunk-GUXNWRZU.js | 1.62 kB |
| chunk-XL76TNRP.js | 85.75 kB |
| chunk-DSWIXUV7.js | 13.06 kB |
| chunk-7J6KAAY4.js | 1.23 kB |
| chunk-K2NUI5QC.js | 0.13 kB |
| chunk-WM6U7HGB.js | 168.61 kB |

## Largest lazy chunks

| File | Entry point | Size |
| --- | --- | ---: |
| chunk-ZXCDE4DK.js | - | 42.17 kB |
| chunk-C7JE7C6P.js | src/app/features/evaluations/evaluation-feedback-insights-panel.component.ts | 35.83 kB |
| chunk-2OL6WNF3.js | src/app/features/development/development-page.component.ts | 27.12 kB |
| chunk-336RRGOM.js | src/app/features/evaluations/evaluations-page.component.ts | 24.82 kB |
| chunk-IRHBAYPP.js | src/app/features/dashboard/dashboard-page.component.ts | 21.80 kB |
| chunk-QDDZCHSO.js | src/app/features/evaluations/evaluation-cycle-operations-panel.component.ts | 21.04 kB |
| chunk-WL4DYTCC.js | src/app/features/evaluations/evaluation-questionnaires-panel.component.ts | 19.64 kB |
| chunk-XVFHU2UY.js | src/app/features/evaluations/evaluation-library-panel.component.ts | 18.07 kB |
| chunk-2CQBFFRQ.js | src/app/features/incidents/incidents-page.component.ts | 15.87 kB |
| chunk-VBAQFJHH.js | src/app/features/people/people-page.component.ts | 15.02 kB |

## Largest shared lazy chunk composition

chunk-ZXCDE4DK.js is shared by lazy features and has no direct entry point.

| Input | Size in chunk |
| --- | ---: |
| node_modules/@angular/forms/fesm2022/forms.mjs | 41.73 kB |

Shared lazy chunk consumers:

- src/app/features/development/development-page.component.ts
- src/app/features/evaluations/evaluation-cycle-operations-panel.component.ts
- src/app/features/evaluations/evaluation-feedback-insights-panel.component.ts
- src/app/features/evaluations/evaluation-library-panel.component.ts
- src/app/features/evaluations/evaluation-questionnaires-panel.component.ts
- src/app/features/evaluations/evaluations-page.component.ts
- src/app/features/incidents/incidents-page.component.ts
- src/app/features/people/people-page.component.ts

Recommendation: keep this chunk shared unless a concrete feature can remove its dependency on the listed inputs; forcing a split may duplicate framework code across lazy chunks.
