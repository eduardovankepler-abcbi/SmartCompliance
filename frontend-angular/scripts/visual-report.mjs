import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const reportDir = join(root, 'reports', 'visual-parity');

const routes = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'compliance', label: 'Compliance / Incidentes' },
  { id: 'development', label: 'Desenvolvimento' },
  { id: 'applause', label: 'Aplause' },
  { id: 'people', label: 'Pessoas' },
  { id: 'users', label: 'Usuarios' },
];

mkdirSync(reportDir, { recursive: true });

const rows = routes.map((route) => {
  const react = `${route.id}-react.png`;
  const angular = `${route.id}-angular.png`;
  return {
    ...route,
    react,
    angular,
    hasReact: existsSync(join(reportDir, react)),
    hasAngular: existsSync(join(reportDir, angular)),
  };
});

const generatedAt = new Date().toISOString();
const missing = rows.filter((row) => !row.hasReact || !row.hasAngular);
const checklistPath = join(reportDir, 'review-checklist.md');
const existingChecklist = existsSync(checklistPath) ? readFileSync(checklistPath, 'utf8') : '';

function existingChecklistLine(id) {
  return existingChecklist
    .split('\n')
    .find((line) => line.startsWith(`| ${id} |`));
}

function checklistStatus(id) {
  const line = existingChecklistLine(id);
  return line?.split('|')[3]?.trim() || 'pendente';
}

const manualStatuses = rows.map((row) => checklistStatus(row.id));
const pendingRows = rows.filter((row) => checklistStatus(row.id) === 'pendente');
const fixRows = rows.filter((row) => checklistStatus(row.id) === 'corrigir');
const attentionRows = rows.filter((row) => checklistStatus(row.id) === 'atencao');
const hasBlockingVisualGap = missing.length > 0 || fixRows.length > 0 || pendingRows.length > 0;
const blockStatus = hasBlockingVisualGap
  ? 'Bloco 7 em revisao: ainda ha capturas ausentes, pendentes ou itens marcados como corrigir.'
  : 'Bloco 7 fechado: capturas completas e sem divergencias visuais bloqueantes.';
const gateStatus = hasBlockingVisualGap
  ? 'Gate visual minimo: falhou.'
  : 'Gate visual minimo: aprovado.';

const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Comparacao visual React x Angular</title>
  <style>
    :root { color-scheme: light; font-family: Inter, Segoe UI, Arial, sans-serif; color: #101828; background: #f8fafc; }
    body { margin: 0; padding: 32px; }
    header { max-width: 1200px; margin: 0 auto 28px; }
    h1 { margin: 0; font-size: 28px; }
    p { color: #475467; }
    .summary { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
    .pill { padding: 8px 12px; border: 1px solid #d0d5dd; border-radius: 999px; background: #fff; font-weight: 700; }
    .pill.ok { color: #067647; background: #ecfdf3; border-color: #abefc6; }
    .pill.warn { color: #b54708; background: #fffaeb; border-color: #fedf89; }
    main { display: grid; gap: 28px; max-width: 1440px; margin: 0 auto; }
    section { padding: 20px; background: #fff; border: 1px solid #d0d5dd; border-radius: 14px; box-shadow: 0 10px 24px rgba(16,24,40,.06); }
    section h2 { margin: 0 0 16px; font-size: 20px; }
    .pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start; }
    figure { margin: 0; border: 1px solid #eaecf0; border-radius: 12px; overflow: hidden; background: #f9fafb; }
    figcaption { padding: 10px 12px; font-weight: 700; color: #344054; background: #fff; border-bottom: 1px solid #eaecf0; }
    img { display: block; width: 100%; height: auto; }
    .missing { padding: 24px; color: #b42318; background: #fef3f2; }
    .review-index { max-width: 1440px; margin: 0 auto 28px; padding: 20px; background: #fff; border: 1px solid #d0d5dd; border-radius: 14px; }
    .review-index h2 { margin: 0 0 12px; }
    .review-index table { width: 100%; border-collapse: collapse; }
    .review-index th, .review-index td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eaecf0; }
    .review-index th { color: #475467; font-size: 12px; text-transform: uppercase; }
    .status { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .status-pendente { color: #344054; background: #f2f4f7; }
    .status-ok { color: #067647; background: #ecfdf3; }
    .status-atencao { color: #b54708; background: #fffaeb; }
    .status-corrigir { color: #b42318; background: #fef3f2; }
    .checklist { margin-top: 14px; padding: 14px; background: #f8fafc; border: 1px dashed #d0d5dd; border-radius: 10px; }
    .checklist strong { display: block; margin-bottom: 8px; }
    .checklist ul { margin: 0; padding-left: 20px; color: #475467; }
    @media (max-width: 900px) { body { padding: 16px; } .pair { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <h1>Comparacao visual React x Angular</h1>
    <p>Gerado em ${generatedAt}. Use este relatorio para revisar equivalencia visual, hierarquia, densidade, estados e contraste entre os fronts.</p>
    <div class="summary">
      <span class="pill ${missing.length ? 'warn' : 'ok'}">${rows.length - missing.length}/${rows.length} pares completos</span>
      <span class="pill ${hasBlockingVisualGap ? 'warn' : 'ok'}">${blockStatus}</span>
      <span class="pill ${hasBlockingVisualGap ? 'warn' : 'ok'}">${gateStatus}</span>
      <span class="pill">React x Angular</span>
      <span class="pill">Viewport 1440x1000</span>
    </div>
  </header>
  <section class="review-index" aria-labelledby="review-index-title">
    <h2 id="review-index-title">Indice de revisao visual</h2>
    <p>Atualize <code>review-checklist.md</code> com status <code>ok</code>, <code>atencao</code> ou <code>corrigir</code> conforme a revisao humana.</p>
    <table>
      <thead><tr><th>Rota</th><th>Status manual</th><th>Ir para capturas</th></tr></thead>
      <tbody>
        ${rows.map((row) => {
          const status = checklistStatus(row.id);
          return `<tr><td>${row.label}</td><td><span class="status status-${status}">${status}</span></td><td><a href="#${row.id}">abrir comparacao</a></td></tr>`;
        }).join('')}
      </tbody>
    </table>
  </section>
  <main>
    ${rows.map((row) => `
      <section id="${row.id}">
        <h2>${row.label}</h2>
        <div class="pair">
          <figure>
            <figcaption>React</figcaption>
            ${row.hasReact ? `<img src="./${row.react}" alt="${row.label} no React" />` : '<div class="missing">Screenshot React ausente.</div>'}
          </figure>
          <figure>
            <figcaption>Angular</figcaption>
            ${row.hasAngular ? `<img src="./${row.angular}" alt="${row.label} no Angular" />` : '<div class="missing">Screenshot Angular ausente.</div>'}
          </figure>
        </div>
        <div class="checklist">
          <strong>Checklist de revisao</strong>
          <ul>
            <li>Estrutura e ordem dos blocos principais.</li>
            <li>Densidade, espacamento e hierarquia visual.</li>
            <li>Estados vazios, listas, metricas e acoes primarias.</li>
            <li>Contraste, legibilidade e responsividade base.</li>
          </ul>
        </div>
      </section>
    `).join('')}
  </main>
</body>
</html>`;

const markdown = [
  '# Comparacao visual React x Angular',
  '',
  `Gerado em: ${generatedAt}`,
  '',
  `Pares completos: ${rows.length - missing.length}/${rows.length}.`,
  '',
  `Status do bloco 7: ${blockStatus}`,
  '',
  `Gate visual minimo: ${hasBlockingVisualGap ? 'falhou' : 'aprovado'}.`,
  '',
  `Itens em atencao permitidos pelo gate: ${attentionRows.map((row) => row.label).join(', ') || 'nenhum'}.`,
  '',
  'O gate falha quando ha screenshot ausente, status `pendente` ou status `corrigir`.',
  '',
  'Abra `index.html` neste diretorio para revisar as capturas lado a lado.',
  '',
  '| Rota | React | Angular | Status |',
  '| --- | --- | --- | --- |',
  ...rows.map((row) => `| ${[
    row.label,
    row.hasReact ? `[${row.react}](./${row.react})` : 'ausente',
    row.hasAngular ? `[${row.angular}](./${row.angular})` : 'ausente',
    row.hasReact && row.hasAngular ? 'completo' : 'incompleto',
  ].join(' | ')} |`),
  '',
  '## Indice de revisao manual',
  '',
  'Atualize `review-checklist.md` com status `ok`, `atencao` ou `corrigir`.',
  '',
  '| Rota | Status manual |',
  '| --- | --- |',
  ...rows.map((row) => `| ${row.label} | ${checklistStatus(row.id)} |`),
  '',
  '## Checklist',
  '',
  '- Estrutura e ordem dos blocos principais.',
  '- Densidade, espacamento e hierarquia visual.',
  '- Estados vazios, listas, metricas e acoes primarias.',
  '- Contraste, legibilidade e responsividade base.',
  '',
].join('\n');

const checklist = [
  '# Checklist de divergencias visuais',
  '',
  `Atualizado em: ${generatedAt}`,
  '',
  'Status permitidos: `pendente`, `ok`, `atencao`, `corrigir`.',
  '',
  `Status do bloco 7: ${blockStatus}`,
  '',
  `Gate visual minimo: ${hasBlockingVisualGap ? 'falhou' : 'aprovado'}.`,
  '',
  '| ID | Rota | Status | Observacoes |',
  '| --- | --- | --- | --- |',
  ...rows.map((row) => {
    const existing = existingChecklistLine(row.id);
    if (existing) return existing;
    return `| ${row.id} | ${row.label} | pendente |  |`;
  }),
  '',
  '## Criterios sugeridos',
  '',
  '- `ok`: diferencas aceitaveis ou inexistentes.',
  '- `atencao`: diferenca visual pequena, sem bloquear fechamento.',
  '- `corrigir`: diferenca relevante de layout, hierarquia, conteudo ou legibilidade.',
  '',
].join('\n');

writeFileSync(join(reportDir, 'index.html'), html);
writeFileSync(join(reportDir, 'README.md'), markdown);
writeFileSync(checklistPath, checklist);

console.log(`Visual parity report generated: ${join('reports', 'visual-parity', 'index.html')}`);
if (hasBlockingVisualGap) {
  if (missing.length) {
    console.log(`Missing pairs: ${missing.map((row) => row.id).join(', ')}`);
  }
  if (pendingRows.length) {
    console.log(`Pending visual review: ${pendingRows.map((row) => row.id).join(', ')}`);
  }
  if (fixRows.length) {
    console.log(`Visual fixes required: ${fixRows.map((row) => row.id).join(', ')}`);
  }
  process.exitCode = 1;
}
