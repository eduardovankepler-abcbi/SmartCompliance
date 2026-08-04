import { spawn } from "node:child_process";
import fs from "node:fs";
import { env } from "../src/config/env.js";
import { resolveMysqlClientPath } from "./mysql-client-paths.mjs";

const backupFile = process.argv[2];

if (!backupFile) {
  console.error("Informe o arquivo SQL: npm run restore:mysql -- caminho/do/backup.sql");
  process.exit(1);
}

if (!fs.existsSync(backupFile)) {
  console.error(`Arquivo de backup nao encontrado: ${backupFile}`);
  process.exit(1);
}

if (env.storageMode !== "mysql") {
  console.error("Restore MySQL requer STORAGE_MODE=mysql.");
  process.exit(1);
}

const args = [
  `--host=${env.mysql.host}`,
  `--port=${env.mysql.port}`,
  `--user=${env.mysql.user}`,
  ...(env.mysql.ssl ? ["--ssl-mode=REQUIRED"] : []),
  env.mysql.database
];

const input = fs.openSync(backupFile, "r");
const child = spawn(resolveMysqlClientPath(), args, {
  env: {
    ...process.env,
    MYSQL_PWD: env.mysql.password
  },
  stdio: [input, "inherit", "inherit"]
});

child.on("close", (exitCode) => {
  fs.closeSync(input);
  if (exitCode !== 0) {
    console.error(`mysql finalizou com codigo ${exitCode}.`);
    process.exit(exitCode);
  }
  console.log(`Restore aplicado em ${env.mysql.database}`);
});
