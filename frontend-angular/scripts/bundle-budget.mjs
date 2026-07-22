import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const root = process.cwd();
const maxInitialBytes = Number(process.env.INITIAL_BUNDLE_MAX_BYTES || 300 * 1024);
const browserDir = join(root, 'dist', 'frontend-angular', 'browser');
const indexPath = join(browserDir, 'index.html');
const statsPath = join(root, 'dist', 'frontend-angular', 'stats.json');
const reportDir = join(root, 'reports', 'bundle');
const reportPath = join(reportDir, 'budget.md');

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} kB`;
}

if (!existsSync(indexPath)) {
  console.error(`Bundle budget check failed: ${indexPath} was not found. Run ng build first.`);
  process.exit(1);
}

const html = readFileSync(indexPath, 'utf8');
const files = [
  ...html.matchAll(/<script[^>]+src="([^"]+)"/g),
  ...html.matchAll(/<link[^>]+(?:rel="modulepreload"[^>]+href|href)="([^"]+)"/g),
]
  .map((match) => match[1])
  .filter((file) => /\.(js|css)$/.test(file))
  .filter((file, index, all) => all.indexOf(file) === index)
  .map((file) => {
    const path = join(browserDir, file);
    return {
      file,
      bytes: existsSync(path) ? statSync(path).size : 0,
      missing: !existsSync(path),
    };
  });

const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
const status = files.some((file) => file.missing) || totalBytes > maxInitialBytes ? 'failed' : 'passed';
const initialFileNames = new Set(files.map((file) => basename(file.file)));

function readLazyOutputs() {
  if (!existsSync(statsPath)) return [];
  const stats = JSON.parse(readFileSync(statsPath, 'utf8'));
  return Object.entries(stats.outputs || {})
    .map(([file, output]) => ({
      file,
      entryPoint: output.entryPoint || '',
      bytes: output.bytes || 0,
      imports: output.imports || [],
      inputs: output.inputs || {},
      isInitial: initialFileNames.has(basename(file)) || output.entryPoint === 'src/main.ts' || output.entryPoint === 'angular:styles/global:styles',
    }))
    .filter((output) => output.file.endsWith('.js') && !output.isInitial)
    .sort((left, right) => right.bytes - left.bytes)
    .slice(0, 10);
}

const largestLazyOutputs = readLazyOutputs();
const largestSharedLazyOutput = largestLazyOutputs.find((output) => !output.entryPoint);
const largestSharedLazyInputs = largestSharedLazyOutput
  ? Object.entries(largestSharedLazyOutput.inputs)
    .map(([file, input]) => ({ file, bytes: input.bytesInOutput || 0 }))
    .filter((input) => input.bytes > 0)
    .sort((left, right) => right.bytes - left.bytes)
    .slice(0, 8)
  : [];
const largestSharedLazyConsumers = largestSharedLazyOutput
  ? largestLazyOutputs
    .filter((output) => output.imports?.some((item) => item.path === largestSharedLazyOutput.file))
    .map((output) => output.entryPoint || basename(output.file))
    .filter(Boolean)
    .sort()
  : [];

mkdirSync(reportDir, { recursive: true });
writeFileSync(reportPath, [
  '# Bundle budget',
  '',
  `Generated at: ${new Date().toISOString()}`,
  '',
  `Status: ${status}`,
  '',
  `Initial bundle: ${formatBytes(totalBytes)} / ${formatBytes(maxInitialBytes)}`,
  '',
  '## Initial files',
  '',
  '| File | Size |',
  '| --- | ---: |',
  ...files.map((file) => `| ${basename(file.file)}${file.missing ? ' (missing)' : ''} | ${formatBytes(file.bytes)} |`),
  '',
  '## Largest lazy chunks',
  '',
  largestLazyOutputs.length
    ? '| File | Entry point | Size |'
    : 'No stats.json lazy output data available.',
  ...(largestLazyOutputs.length ? [
    '| --- | --- | ---: |',
    ...largestLazyOutputs.map((file) => `| ${basename(file.file)} | ${file.entryPoint || '-'} | ${formatBytes(file.bytes)} |`),
  ] : []),
  '',
  '## Largest shared lazy chunk composition',
  '',
  largestSharedLazyOutput
    ? `${basename(largestSharedLazyOutput.file)} is shared by lazy features and has no direct entry point.`
    : 'No unnamed shared lazy chunk was detected.',
  '',
  ...(largestSharedLazyInputs.length ? [
    '| Input | Size in chunk |',
    '| --- | ---: |',
    ...largestSharedLazyInputs.map((input) => `| ${input.file} | ${formatBytes(input.bytes)} |`),
    '',
    'Shared lazy chunk consumers:',
    '',
    ...largestSharedLazyConsumers.map((consumer) => `- ${consumer}`),
    '',
    'Recommendation: keep this chunk shared unless a concrete feature can remove its dependency on the listed inputs; forcing a split may duplicate framework code across lazy chunks.',
  ] : []),
  '',
].join('\n'));

console.log(`Initial bundle: ${formatBytes(totalBytes)} / ${formatBytes(maxInitialBytes)}`);
if (largestLazyOutputs.length) {
  console.log(`Largest lazy chunk: ${basename(largestLazyOutputs[0].file)} (${formatBytes(largestLazyOutputs[0].bytes)})`);
}
console.log(`Bundle budget report generated: ${join('reports', 'bundle', 'budget.md')}`);

if (status === 'failed') {
  process.exit(1);
}
