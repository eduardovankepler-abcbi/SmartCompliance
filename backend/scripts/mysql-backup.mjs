import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../src/config/env.js";
import { resolveMysqlDumpPath } from "./mysql-client-paths.mjs";
import { readLocalState, resolveDataDirectory, writeBackupState } from "./backup-state.mjs";

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function run() {
  if (!process.argv.includes("--backend-stopped")) {
    throw new Error("Pare o backend para manter SQL e arquivos consistentes e execute com --backend-stopped.");
  }
  if (env.storageMode !== "mysql") {
    throw new Error("Backup MySQL requer STORAGE_MODE=mysql.");
  }

  const dataDirectory = resolveDataDirectory(env.dataDir);
  const localState = await readLocalState(dataDirectory);
  await fs.mkdir(env.backup.dir, { recursive: true });
  const backupFile = path.resolve(
    env.backup.dir,
    `smart-compliance-${env.mysql.database}-${timestampForFile()}.sql`
  );

  const args = [
    `--host=${env.mysql.host}`,
    `--port=${env.mysql.port}`,
    `--user=${env.mysql.user}`,
    ...(env.mysql.ssl ? ["--ssl-mode=REQUIRED"] : []),
    "--single-transaction",
    "--routines",
    "--triggers",
    env.mysql.database
  ];

  const output = await fs.open(backupFile, "wx", 0o600);
  const child = spawn(resolveMysqlDumpPath(), args, {
    env: {
      ...process.env,
      MYSQL_PWD: env.mysql.password
    },
    stdio: ["ignore", output.fd, "inherit"]
  });

  let exitCode;
  try {
    exitCode = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    });
  } finally { await output.close(); }

  if (exitCode !== 0) {
    throw new Error(`mysqldump finalizou com codigo ${exitCode}.`);
  }

  if (JSON.stringify(localState) !== JSON.stringify(await readLocalState(dataDirectory))) {
    throw new Error("Estado local mudou durante o backup. Pare o backend e tente novamente.");
  }
  await writeBackupState(backupFile, localState);
  console.log(`Backup criado: ${backupFile} e ${backupFile}.state.json. Preserve os dois arquivos.`);
}

run().catch((error) => {
  console.error("Falha ao gerar backup MySQL", {
    message: error.message
  });
  process.exit(1);
});
