import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const repoRoot = join(root, '..');
const reactE2eDir = join(repoRoot, 'frontend', 'e2e');
const angularE2eDir = join(root, 'e2e');
const reportDir = join(root, 'reports', 'parity');
const args = new Set(process.argv.slice(2));
const failOnMissing = args.has('--fail-on-missing') || args.has('--strict') || args.has('--fail-on-partial');
const failOnPartial = args.has('--fail-on-partial') || args.has('--strict');

const capabilities = [
  {
    id: 'auth-navigation-shell',
    area: 'Shell',
    capability: 'Autenticacao, navegacao estrutural e shell responsivo',
    react: ['auth-and-navigation.spec.js'],
    angular: ['auth-navigation-and-areas.spec.ts'],
    requiredAngularPatterns: ['restaura a sessao', 'Atualizar dados', 'areas'],
  },
  {
    id: 'evaluations-deep-routes',
    area: 'Avaliacoes',
    capability: 'Rotas profundas, slugs legados e workspaces de Avaliacoes',
    react: ['evaluations-employee.spec.js', 'evaluations-individual-questionnaires.spec.js'],
    angular: ['evaluations-base.spec.ts', 'evaluations-library.spec.ts', 'evaluations-feedback.spec.ts'],
    requiredAngularPatterns: ['rota profunda', 'normaliza slug legado', '/app/evaluations/manager/insights/360'],
  },
  {
    id: 'evaluations-responses',
    area: 'Avaliacoes',
    capability: 'Respostas individuais, agregadas, anonimato e snapshots',
    react: ['evaluations-360-homologation.spec.js'],
    angular: ['evaluations-feedback.spec.ts'],
    requiredAngularPatterns: ['Respostas individuais', 'Agregados por ciclo', 'Snapshots processados', 'Resposta protegida'],
  },
  {
    id: 'executive-dashboard',
    area: 'Avaliacoes',
    capability: 'Dashboard executivo/analitico, comparacao e historico por ciclo',
    react: ['evaluations-360-homologation.spec.js'],
    angular: ['evaluations-feedback.spec.ts'],
    requiredAngularPatterns: ['Dashboard executivo', 'Historico executivo por ciclo', 'Ciclo ativo exige atencao executiva', 'Abaixo do ciclo comparado'],
  },
  {
    id: 'evaluations-operations',
    area: 'Avaliacoes',
    capability: 'Operacao de ciclos, inadimplencia, configuracao e pareamentos',
    react: ['evaluations-admin-operations.spec.js'],
    angular: ['evaluations-operations.spec.ts'],
    requiredAngularPatterns: ['notifica inadimplentes', 'pairings', 'config'],
  },
  {
    id: 'evaluations-library-questionnaires',
    area: 'Avaliacoes',
    capability: 'Biblioteca, perguntas, questionarios individuais e publicacao',
    react: ['evaluations-individual-questionnaires.spec.js'],
    angular: ['evaluations-library.spec.ts', 'evaluations-custom-libraries.spec.ts'],
    requiredAngularPatterns: ['Nova pergunta', 'Novo questionario', 'custom', 'import'],
  },
  {
    id: 'people-users-registry',
    area: 'Cadastro',
    capability: 'Pessoas, usuarios, areas e competencias',
    react: ['auth-and-navigation.spec.js'],
    angular: ['auth-navigation-and-areas.spec.ts'],
    requiredAngularPatterns: ['Nova area', 'Competencias', 'Pessoa E2E', 'suggestedUserEmail', 'roleKey'],
  },
  {
    id: 'compliance-incidents-crud',
    area: 'Compliance',
    capability: 'CRUD de incidentes, tratamento, escopo por perfil e estados de fila',
    react: ['auth-and-navigation.spec.js'],
    angular: ['auth-navigation-and-areas.spec.ts'],
    requiredAngularPatterns: ['Novo relato', 'Registrar relato', 'Tratar', 'Salvar tratamento', 'Nenhum incidente no seu escopo', 'Falha E2E ao carregar incidentes'],
  },
  {
    id: 'dashboard-results',
    area: 'Dashboard',
    capability: 'Dashboard geral e resultados por perfil',
    react: ['dashboard-results.spec.js', 'dashboard-manager-results.spec.js'],
    angular: ['auth-navigation-and-areas.spec.ts'],
    requiredAngularPatterns: ['Dashboard', 'cards', 'gestor'],
  },
  {
    id: 'development',
    area: 'Desenvolvimento',
    capability: 'Trilhas e desenvolvimento',
    react: [],
    angular: ['development.spec.ts'],
    requiredAngularPatterns: ['Desenvolvimento'],
  },
  {
    id: 'applause',
    area: 'Aplause',
    capability: 'Reconhecimento entre pares',
    react: [],
    angular: ['applause.spec.ts'],
    requiredAngularPatterns: ['Aplause'],
  },
];

const migrationBlocks = [
  { id: '1', name: 'Rotas profundas de Avaliacoes', capabilityIds: ['evaluations-deep-routes'] },
  { id: '2', name: 'Respostas individuais e agregadas', capabilityIds: ['evaluations-responses'] },
  { id: '3', name: 'Dashboard executivo/analitico', capabilityIds: ['executive-dashboard'] },
  { id: '4', name: 'Tema e acabamento do shell', capabilityIds: ['auth-navigation-shell'] },
  { id: '5', name: 'Matriz automatizada de paridade', capabilityIds: [] },
  { id: '6', name: 'Ajustes de CRUDs e demais modulos', capabilityIds: ['people-users-registry', 'compliance-incidents-crud', 'development', 'applause'] },
];

function listSpecs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((file) => /\.(spec|test)\.[jt]s$/.test(file)).sort();
}

function readSpec(dir, file) {
  const path = join(dir, file);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function presentFiles(dir, files) {
  return files.filter((file) => existsSync(join(dir, file)));
}

function patternHits(files, patterns) {
  const corpus = files.map((file) => readSpec(angularE2eDir, file)).join('\n');
  return patterns.filter((pattern) => corpus.toLowerCase().includes(pattern.toLowerCase()));
}

function statusFor(entry, angularFiles, hits) {
  if (!angularFiles.length) return 'missing';
  if (entry.requiredAngularPatterns.length && hits.length < entry.requiredAngularPatterns.length) return 'partial';
  return 'covered';
}

function icon(status) {
  return status === 'covered' ? '✅' : status === 'partial' ? '🟡' : '❌';
}

function summarizeByArea(items) {
  return Object.values(items.reduce((acc, row) => {
    const current = acc[row.area] || { area: row.area, covered: 0, partial: 0, missing: 0, total: 0 };
    current[row.status] += 1;
    current.total += 1;
    acc[row.area] = current;
    return acc;
  }, {})).sort((left, right) => left.area.localeCompare(right.area, 'pt-BR'));
}

function summarizeBlocks(items) {
  return migrationBlocks.map((block) => {
    if (!block.capabilityIds.length) {
      return { ...block, status: 'covered', capabilities: ['Automacao gerada por este script'] };
    }
    const related = items.filter((row) => block.capabilityIds.includes(row.id));
    const status = related.some((row) => row.status === 'missing')
      ? 'missing'
      : related.some((row) => row.status === 'partial')
        ? 'partial'
        : 'covered';
    return { ...block, status, capabilities: related.map((row) => row.capability) };
  });
}

const reactSpecs = listSpecs(reactE2eDir);
const angularSpecs = listSpecs(angularE2eDir);
const rows = capabilities.map((entry) => {
  const reactFiles = presentFiles(reactE2eDir, entry.react);
  const angularFiles = presentFiles(angularE2eDir, entry.angular);
  const hits = patternHits(angularFiles, entry.requiredAngularPatterns);
  const missingPatterns = entry.requiredAngularPatterns.filter((pattern) => !hits.includes(pattern));
  const status = statusFor(entry, angularFiles, hits);
  return { ...entry, reactFiles, angularFiles, hits, missingPatterns, status };
});

const summary = rows.reduce(
  (acc, row) => ({ ...acc, [row.status]: acc[row.status] + 1 }),
  { covered: 0, partial: 0, missing: 0 },
);
const areaSummary = summarizeByArea(rows);
const blockSummary = summarizeBlocks(rows);
const gapRows = rows.filter((row) => row.status !== 'covered');

mkdirSync(reportDir, { recursive: true });

const generatedAt = new Date().toISOString();
const markdown = [
  '# Matriz automatizada de paridade',
  '',
  `Gerado em: ${generatedAt}`,
  '',
  `Resumo: ${summary.covered} cobertos, ${summary.partial} parciais, ${summary.missing} ausentes.`,
  '',
  `Specs React detectados: ${reactSpecs.length}. Specs Angular detectados: ${angularSpecs.length}.`,
  '',
  `Gate: ${failOnMissing ? 'falha em ausentes' : 'informativo'}${failOnPartial ? ' e parciais' : ''}.`,
  '',
  '## Resumo por area',
  '',
  '| Area | Cobertos | Parciais | Ausentes | Total |',
  '| --- | ---: | ---: | ---: | ---: |',
  ...areaSummary.map((area) => [
    area.area,
    area.covered,
    area.partial,
    area.missing,
    area.total,
  ].join(' | ')),
  '',
  '## Cobertura dos blocos migrados',
  '',
  '| Bloco | Status | Capacidades rastreadas |',
  '| --- | --- | --- |',
  ...blockSummary.map((block) => [
    `${block.id}. ${block.name}`,
    icon(block.status),
    block.capabilities.map((capability) => `\`${capability}\``).join('<br>'),
  ].join(' | ')),
  '',
  '## Lacunas para PR/CI',
  '',
  ...(gapRows.length
    ? gapRows.map((row) => `- ${icon(row.status)} ${row.area} / ${row.capability}: ${row.missingPatterns.join(', ') || row.status}`)
    : ['- Nenhuma lacuna automatizada encontrada.']),
  '',
  '## Matriz detalhada',
  '',
  '| Status | Area | Capacidade | React E2E | Angular E2E | Evidencias Angular | Lacunas |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map((row) => [
    icon(row.status),
    row.area,
    row.capability,
    row.reactFiles.map((file) => `\`${file}\``).join('<br>') || '—',
    row.angularFiles.map((file) => `\`${file}\``).join('<br>') || '—',
    row.hits.map((hit) => `\`${hit}\``).join('<br>') || '—',
    row.missingPatterns.map((hit) => `\`${hit}\``).join('<br>') || '—',
  ].join(' | ')),
  '',
  '## Observacoes',
  '',
  '- A matriz valida cobertura automatizada por specs e palavras-chave de comportamento.',
  '- Status `partial` nao significa falha funcional; significa que alguma evidencia esperada ainda nao foi encontrada no E2E Angular.',
  '- Use `npm run parity:check` para falhar em capacidades ausentes.',
  '- Use `npm run parity:strict` para falhar em capacidades ausentes ou parciais.',
  '- Atualize o catalogo em `frontend-angular/scripts/parity-matrix.mjs` conforme novos blocos de paridade forem fechados.',
  '',
].join('\n');

const json = {
  generatedAt,
  summary,
  areaSummary,
  blockSummary,
  gaps: gapRows.map((row) => ({
    id: row.id,
    area: row.area,
    capability: row.capability,
    status: row.status,
    missingPatterns: row.missingPatterns,
  })),
  reactSpecs: reactSpecs.map((file) => relative(repoRoot, join(reactE2eDir, file))),
  angularSpecs: angularSpecs.map((file) => relative(repoRoot, join(angularE2eDir, file))),
  rows: rows.map((row) => ({
    id: row.id,
    area: row.area,
    capability: row.capability,
    status: row.status,
    reactFiles: row.reactFiles,
    angularFiles: row.angularFiles,
    hits: row.hits,
    missingPatterns: row.missingPatterns,
  })),
};

writeFileSync(join(reportDir, 'matrix.md'), markdown);
writeFileSync(join(reportDir, 'matrix.json'), `${JSON.stringify(json, null, 2)}\n`);

console.log(`Parity matrix generated: ${relative(root, join(reportDir, 'matrix.md'))}`);
console.log(`Covered: ${summary.covered}; partial: ${summary.partial}; missing: ${summary.missing}`);
console.log('');
console.log('Area summary:');
for (const area of areaSummary) {
  console.log(`- ${area.area}: ${area.covered}/${area.total} covered, ${area.partial} partial, ${area.missing} missing`);
}
console.log('');
if (gapRows.length) {
  console.log('Gaps:');
  for (const row of gapRows) {
    console.log(`- ${row.status.toUpperCase()} ${row.area} / ${row.capability}: ${row.missingPatterns.join(', ') || 'no details'}`);
  }
} else {
  console.log('Gaps: none');
}

const failures = [
  ...(failOnMissing && summary.missing ? [`${summary.missing} missing`] : []),
  ...(failOnPartial && summary.partial ? [`${summary.partial} partial`] : []),
];

if (failures.length) {
  console.error(`Parity gate failed: ${failures.join('; ')}`);
  process.exitCode = 1;
}
