import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { env } from "../src/config/env.js";
import { resolveMysqlClientPath } from "./mysql-client-paths.mjs";
import { readBackupState, resolveDataDirectory, restoreLocalState } from "./backup-state.mjs";

async function run() {
  const backupFile = process.argv[2];
  if (!backupFile || backupFile.startsWith("--")) {
    throw new Error("Informe o arquivo SQL: npm run restore:mysql -- caminho/backup.sql --backend-stopped");
  }
  if (!process.argv.includes("--backend-stopped")) {
    throw new Error("Pare o backend antes da restauracao e execute com --backend-stopped.");
  }
  if (env.storageMode !== "mysql") throw new Error("Restore MySQL requer STORAGE_MODE=mysql.");

  // Valida o conjunto completo antes de qualquer alteracao no banco.
  const localState = await readBackupState(backupFile);
  const input = await fs.open(backupFile, "r");
  try {
    const child = spawn(resolveMysqlClientPath(), [
      '--host=' + env.mysql.host, '--port=' + env.mysql.port, '--user=' + env.mysql.user,
      ...(env.mysql.ssl ? ["--ssl-mode=REQUIRED"] : []), env.mysql.database
    ], { env: { ...process.env, MYSQL_PWD: env.mysql.password }, stdio: [input.fd, "inherit", "inherit"] });
    const exitCode = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    });
    if (exitCode !== 0) throw new Error('mysql finalizou com codigo ' + exitCode);
  } finally { await input.close(); }

  await restoreLocalState(resolveDataDirectory(env.dataDir), localState);
  console.log('SQL e estado local restaurados em ' + env.mysql.database + '. Valide antes de reiniciar o backend.');
}

run().catch((error) => {
  console.error("Restauracao nao concluida. Mantenha o backend parado.", { message: error.message });
  process.exitCode = 1;
});
