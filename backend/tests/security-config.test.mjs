import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertProductionStorageConfiguration, buildCorsOriginOption } from "../src/config/env.js";
import { createId } from "../src/data/storeSecurity.js";
import { createRequestRateLimiter, safeErrorMessage } from "../src/routes/helpers.js";
import { parseLibraryFile } from "../src/services/libraryImport.js";

async function resolveCors(corsOrigin, origin) {
  if (typeof corsOrigin === "string") {
    return corsOrigin === origin;
  }

  return await new Promise((resolve, reject) => {
    corsOrigin(origin, (error, allowed) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(allowed);
    });
  });
}

const originalNodeEnv = process.env.NODE_ENV;
const originalCorsOrigin = process.env.CORS_ORIGIN;
const originalCorsOrigins = process.env.CORS_ORIGINS;
const originalAdditionalOrigins = process.env.CORS_ADDITIONAL_ORIGINS;

function runProductionConfigValidation(overrides = {}) {
  const workspace = mkdtempSync(join(tmpdir(), "smart-compliance-production-config-"));
  try {
    return spawnSync(process.execPath, ["scripts/validate-production-config.mjs"], {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "production",
        STORAGE_MODE: "mysql",
        AUTH_SECRET: "a-unique-secret-with-at-least-thirty-two-characters",
        PORT: "4000",
        MYSQL_HOST: "mysql.example.internal",
        MYSQL_PORT: "3306",
        MYSQL_USER: "app_user",
        MYSQL_PASSWORD: "strong-password",
        MYSQL_DATABASE: "smart_compliance",
        MYSQL_SSL_MODE: "verify-full",
        MYSQL_SSL_REJECT_UNAUTHORIZED: "true",
        MYSQL_SSL_CA_PEM: "test-ca",
        AUTO_MIGRATE_DB: "false",
        CORS_ORIGIN: "https://smart.example.com",
        DATA_DIR: join(workspace, "data"),
        BACKUP_DIR: join(workspace, "backups"),
        ...overrides
      }
    });
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
}

try {
  process.env.NODE_ENV = "production";
  process.env.CORS_ORIGIN = "https://smart.local";
  delete process.env.CORS_ORIGINS;
  process.env.CORS_ADDITIONAL_ORIGINS = "https://admin.smart.local";

  const productionCors = buildCorsOriginOption();
  assert.equal(await resolveCors(productionCors, "https://smart.local"), true);
  assert.equal(await resolveCors(productionCors, "https://admin.smart.local"), true);
  assert.equal(await resolveCors(productionCors, "https://smart-compliance-angular.vercel.app"), false);
  assert.equal(await resolveCors(productionCors, "https://evil.example"), false);
  assert.equal(await resolveCors(productionCors, undefined), true);

  delete process.env.CORS_ORIGIN;
  delete process.env.CORS_ADDITIONAL_ORIGINS;
  const productionWithoutExplicitOrigin = buildCorsOriginOption();
  assert.equal(await resolveCors(productionWithoutExplicitOrigin, "https://smart-compliance-angular.vercel.app"), false);

  process.env.CORS_ORIGIN = "https://https://smart-compliance-angular.vercel.app/";
  const productionCorsWithDuplicatedScheme = buildCorsOriginOption();
  assert.equal(
    await resolveCors(productionCorsWithDuplicatedScheme, "https://smart-compliance-angular.vercel.app"),
    true
  );
  assert.equal(await resolveCors(productionCorsWithDuplicatedScheme, "https://evil.example"), false);

  process.env.NODE_ENV = "development";
  const developmentCors = buildCorsOriginOption();
  assert.equal(await resolveCors(developmentCors, "https://smart-compliance-angular.vercel.app"), true);

  const productionConfig = { nodeEnv: "production", storageMode: "mysql" };
  const validMysqlRuntime = {
    MYSQL_HOST: "mysql.internal",
    MYSQL_USER: "app_user",
    MYSQL_PASSWORD: "strong-password",
    MYSQL_DATABASE: "smart_compliance",
    MYSQL_SSL_MODE: "verify-full",
    MYSQL_SSL_REJECT_UNAUTHORIZED: "true",
    MYSQL_SSL_CA_PEM: "test-ca"
  };
  assert.doesNotThrow(() => assertProductionStorageConfiguration(productionConfig, validMysqlRuntime));
  assert.throws(
    () => assertProductionStorageConfiguration({ nodeEnv: "production", storageMode: "memory" }, validMysqlRuntime),
    /STORAGE_MODE=mysql/
  );
  assert.throws(
    () => assertProductionStorageConfiguration(productionConfig, { ...validMysqlRuntime, MYSQL_PASSWORD: "" }),
    /MYSQL_PASSWORD/
  );
  assert.throws(
    () => assertProductionStorageConfiguration(productionConfig, {
      ...validMysqlRuntime,
      MYSQL_SSL_REJECT_UNAUTHORIZED: "false"
    }),
    /MySQL remoto em producao requer/
  );
  assert.doesNotThrow(() => assertProductionStorageConfiguration(productionConfig, {
    ...validMysqlRuntime,
    MYSQL_HOST: "127.0.0.1",
    MYSQL_SSL_MODE: "disabled",
    MYSQL_SSL_REJECT_UNAUTHORIZED: "",
    MYSQL_SSL_CA_PEM: ""
  }));
  assert.equal(
    safeErrorMessage(new Error("ER_ACCESS_DENIED_ERROR: access denied"), "Falha ao salvar."),
    "Falha ao salvar."
  );
  assert.equal(
    safeErrorMessage(new Error("Nome da area e obrigatorio."), "Falha ao salvar."),
    "Nome da area e obrigatorio."
  );
  const limiter = createRequestRateLimiter({ windowMs: 60000, maxRequests: 1 });
  const firstResponse = { setHeader() {}, status() { return this; }, json() {} };
  let firstRequestNext = false;
  limiter({ auth: { user: { id: "u1" } }, ip: "127.0.0.1" }, firstResponse, () => { firstRequestNext = true; });
  assert.equal(firstRequestNext, true);
  let blockedStatus = 0;
  limiter({ auth: { user: { id: "u1" } }, ip: "127.0.0.1" }, {
    setHeader() {}, status(code) { blockedStatus = code; return this; }, json() {}
  }, () => {});
  assert.equal(blockedStatus, 429);
  const oversizedLibraryCsv = Buffer.from(
    `relationship_type,prompt_text\n${Array.from({ length: 501 }, () => "self,Pergunta").join("\n")}`
  );
  await assert.rejects(
    () => parseLibraryFile({ originalname: "biblioteca.csv", buffer: oversizedLibraryCsv }),
    /limite de 500 linhas/
  );
  assert.doesNotThrow(() => assertProductionStorageConfiguration({ nodeEnv: "development", storageMode: "memory" }, {}));

  const strictRemoteMysql = runProductionConfigValidation();
  assert.equal(strictRemoteMysql.status, 0, strictRemoteMysql.stderr);

  const insecureRemoteMysql = runProductionConfigValidation({
    MYSQL_SSL_MODE: "required",
    MYSQL_SSL_REJECT_UNAUTHORIZED: "false",
    MYSQL_SSL_CA_PEM: ""
  });
  assert.notEqual(insecureRemoteMysql.status, 0);
  assert.match(insecureRemoteMysql.stderr, /MYSQL_SSL_MODE precisa ser verify-full/);

  const automaticMigration = runProductionConfigValidation({ AUTO_MIGRATE_DB: "true" });
  assert.notEqual(automaticMigration.status, 0);
  assert.match(automaticMigration.stderr, /AUTO_MIGRATE_DB precisa ser false/);

  const localMysql = runProductionConfigValidation({
    MYSQL_HOST: "127.0.0.1",
    MYSQL_SSL_MODE: "disabled",
    MYSQL_SSL_REJECT_UNAUTHORIZED: "",
    MYSQL_SSL_CA_PEM: ""
  });
  assert.equal(localMysql.status, 0, localMysql.stderr);

  const generatedIds = new Set(Array.from({ length: 1000 }, () => createId("development_plan_progress")));
  assert.equal(generatedIds.size, 1000, "IDs gerados devem ser distintos na amostra");
  assert.ok(
    [...generatedIds].every((id) => /^development_plan_progress_[A-Za-z0-9_-]{8}$/.test(id)),
    "IDs devem preservar o formato compativel com o schema"
  );
} finally {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalNodeEnv;
  if (originalCorsOrigin === undefined) delete process.env.CORS_ORIGIN; else process.env.CORS_ORIGIN = originalCorsOrigin;
  if (originalCorsOrigins === undefined) delete process.env.CORS_ORIGINS; else process.env.CORS_ORIGINS = originalCorsOrigins;
  if (originalAdditionalOrigins === undefined) delete process.env.CORS_ADDITIONAL_ORIGINS; else process.env.CORS_ADDITIONAL_ORIGINS = originalAdditionalOrigins;
}

console.log("Security config tests passed.");
