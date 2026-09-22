import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import mysql from "mysql2/promise";

// Opt-in: somente servidor temporario local, nunca usa backend/.env.
const port = Number(process.env.SC_TEST_MYSQL_PORT);
assert.ok(Number.isInteger(port) && port > 1024 && port !== 3306, "Informe SC_TEST_MYSQL_PORT de uma instancia temporaria");
const backend = fileURLToPath(new URL("../", import.meta.url));
const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sc-mysql-backup-test-"));
const connection = await mysql.createConnection({ host: "127.0.0.1", port, user: "root", password: "", multipleStatements: true });
const suffix = Date.now();
const sourceDb = `sc_backup_source_${suffix}`;
const targetDb = `sc_backup_target_${suffix}`;

async function runScript(script, database, directory, args = []) {
  const child = spawn(process.execPath, [path.join(backend, "scripts", script), ...args], {
    cwd: workspace,
    env: {
      PATH: process.env.PATH || process.env.Path || "", SystemRoot: process.env.SystemRoot || "",
      TEMP: os.tmpdir(), NODE_ENV: "test", STORAGE_MODE: "mysql", MYSQL_HOST: "127.0.0.1",
      MYSQL_PORT: String(port), MYSQL_USER: "root", MYSQL_PASSWORD: "", MYSQL_DATABASE: database,
      MYSQL_SSL_MODE: "disabled", DATA_DIR: directory, BACKUP_DIR: path.join(workspace, "backups"),
      ...(process.env.SC_TEST_MYSQLDUMP_PATH ? { MYSQLDUMP_PATH: process.env.SC_TEST_MYSQLDUMP_PATH } : {}),
      ...(process.env.SC_TEST_MYSQL_CLIENT_PATH ? { MYSQL_CLIENT_PATH: process.env.SC_TEST_MYSQL_CLIENT_PATH } : {})
    }, stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  const code = await new Promise((resolve, reject) => { child.once("error", reject); child.once("close", resolve); });
  return { code, output };
}

try {
  const [[server]] = await connection.query("SELECT @@datadir AS directory");
  assert.match(server.directory.replaceAll("\\", "/"), /\/sc-mysql-homolog-[a-f0-9]+\/$/i,
    "Recusa servidor que nao tenha diretorio temporario de homologacao");
  await connection.query(`CREATE DATABASE ${sourceDb}; CREATE DATABASE ${targetDb}; USE ${sourceDb}`);
  await connection.query(await fs.readFile(path.join(backend, "db/schema.sql"), "utf8"));
  await connection.execute("INSERT INTO people (id,name,role_title,area,employment_type) VALUES (?,?,?,?,?)",
    ["backup-person", "Pessoa Sintetica", "Analista", "Homologacao", "internal"]);
  await connection.execute("INSERT INTO users (id,person_id,email,password_hash,role_key,status) VALUES (?,?,?,?,?,?)",
    ["backup-user", "backup-person", "backup@example.invalid", "synthetic-hash", "employee", "active"]);
  const source = path.join(workspace, "source");
  const restored = path.join(workspace, "restored");
  await fs.mkdir(source);
  const files = {
    "custom-libraries.json": JSON.stringify({ drafts: [{ id: "draft-synthetic" }], published: [{ id: "published-synthetic" }] }),
    "anonymous-responses.json": JSON.stringify({ responses: [{ id: "answer-synthetic", overallScore: 4 }] })
  };
  for (const [name, content] of Object.entries(files)) await fs.writeFile(path.join(source, name), content);
  const backup = await runScript("mysql-backup.mjs", sourceDb, source, ["--backend-stopped"]);
  assert.equal(backup.code, 0, backup.output);
  const sqlName = (await fs.readdir(path.join(workspace, "backups"))).find((name) => name.endsWith(".sql"));
  assert.ok(sqlName);
  const sql = path.join(workspace, "backups", sqlName);
  const restore = await runScript("mysql-restore.mjs", targetDb, restored, [sql, "--backend-stopped"]);
  assert.equal(restore.code, 0, restore.output);
  const [tables] = await connection.query("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?", [sourceDb]);
  for (const { name } of tables) {
    assert.match(name, /^[a-z_]+$/);
    const [original] = await connection.query(`SELECT * FROM ${sourceDb}.${name}`);
    const [recovered] = await connection.query(`SELECT * FROM ${targetDb}.${name}`);
    assert.deepEqual(recovered, original, `Tabela restaurada difere: ${name}`);
  }
  for (const [name, content] of Object.entries(files)) assert.equal(await fs.readFile(path.join(restored, name), "utf8"), content);
  await connection.query(`UPDATE ${targetDb}.people SET name = 'Sentinela' WHERE id = 'backup-person'`);
  await fs.appendFile(sql, "\n-- corrupcao simulada\n");
  const corrupted = await runScript("mysql-restore.mjs", targetDb, restored, [sql, "--backend-stopped"]);
  assert.notEqual(corrupted.code, 0, "Backup corrompido nao pode ser restaurado");
  const [[sentinel]] = await connection.query(`SELECT name FROM ${targetDb}.people WHERE id = 'backup-person'`);
  assert.equal(sentinel.name, "Sentinela", "Validacao deve falhar antes de tocar no banco");
  console.log(`PASS: backup/restauracao MySQL real; ${tables.length} tabelas identicas; 2 arquivos identicos; corrupcao rejeitada sem alterar destino.`);
} finally {
  await connection.end();
  // Artefatos sinteticos preservados para inspecao; o servidor temporario e encerrado pelo operador.
  console.log(`Artefatos de homologacao: ${workspace}`);
}
