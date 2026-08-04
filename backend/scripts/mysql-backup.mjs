import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../src/config/env.js";

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function run() {
  if (env.storageMode !== "mysql") {
    throw new Error("Backup MySQL requer STORAGE_MODE=mysql.");
  }

  await fs.mkdir(env.backup.dir, { recursive: true });
  const backupFile = path.resolve(
    env.backup.dir,
    `smart-compliance-${env.mysql.database}-${timestampForFile()}.sql`
  );

  const args = [
    `--host=${env.mysql.host}`,
    `--port=${env.mysql.port}`,
    `--user=${env.mysql.user}`,
    "--single-transaction",
    "--routines",
    "--triggers",
    env.mysql.database
  ];

  const output = await fs.open(backupFile, "w");
  const child = spawn("mysqldump", args, {
    env: {
      ...process.env,
      MYSQL_PWD: env.mysql.password
    },
    stdio: ["ignore", output.fd, "inherit"]
  });

  const exitCode = await new Promise((resolve) => {
    child.on("close", resolve);
  });
  await output.close();

  if (exitCode !== 0) {
    throw new Error(`mysqldump finalizou com codigo ${exitCode}.`);
  }

  console.log(`Backup criado em ${backupFile}`);
}

run().catch((error) => {
  console.error("Falha ao gerar backup MySQL", {
    message: error.message
  });
  process.exit(1);
});
