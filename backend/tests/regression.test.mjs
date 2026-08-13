process.env.STORAGE_MODE = "memory";

const { runAuthAccessRegression } = await import("./auth-access.test.mjs");
const { runEvaluationsRegression } = await import("./evaluations.test.mjs");
const { runOperationsRegistryDevelopmentRegression } = await import("./operations-registry-development.test.mjs");

await runAuthAccessRegression();
await runEvaluationsRegression();
await runOperationsRegistryDevelopmentRegression();

console.log("Backend regression tests passed.");
