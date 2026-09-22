process.env.STORAGE_MODE = "memory";
// A regressao nao deve sobrescrever as bibliotecas e respostas do ambiente local.
const { mkdtemp } = await import("node:fs/promises");
const { tmpdir } = await import("node:os");
const { join } = await import("node:path");
process.env.DATA_DIR ||= await mkdtemp(join(tmpdir(), "smart-compliance-regression-"));

await import("./security-config.test.mjs");
const { runAuthAccessRegression } = await import("./auth-access.test.mjs");
const { runEvaluationsRegression } = await import("./evaluations.test.mjs");
const { runOperationsRegistryDevelopmentRegression } = await import("./operations-registry-development.test.mjs");

await runAuthAccessRegression();
await runEvaluationsRegression();
await runOperationsRegistryDevelopmentRegression();

console.log("Backend regression tests passed.");
