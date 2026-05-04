import { runAuthAccessRegression } from "./auth-access.test.mjs";
import { runEvaluationsRegression } from "./evaluations.test.mjs";
import { runOperationsRegistryDevelopmentRegression } from "./operations-registry-development.test.mjs";

await runAuthAccessRegression();
await runEvaluationsRegression();
await runOperationsRegistryDevelopmentRegression();

console.log("Backend regression tests passed.");
