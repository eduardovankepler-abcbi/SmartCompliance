import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { readLocalState, writeBackupState, readBackupState, restoreLocalState } from "../scripts/backup-state.mjs";

const directory = await fs.mkdtemp(path.join(os.tmpdir(), "sc-backup-test-"));
try {
  const source = path.join(directory, "source");
  const target = path.join(directory, "restored");
  await fs.mkdir(source);
  await fs.writeFile(path.join(source, "custom-libraries.json"), JSON.stringify({ drafts: [{ id: "draft" }], published: [{ id: "published" }] }));
  await fs.writeFile(path.join(source, "anonymous-responses.json"), JSON.stringify({ responses: [{ id: "response", overallScore: 4 }] }));
  const sql = path.join(directory, "backup.sql");
  await fs.writeFile(sql, "-- SQL de teste\nSELECT 1;\n");
  const state = await readLocalState(source);
  await writeBackupState(sql, state);
  await restoreLocalState(target, await readBackupState(sql));
  assert.deepEqual(await readLocalState(target), state, "Restauracao deve preservar bibliotecas e respostas");
  await fs.appendFile(sql, "SELECT 2;\n");
  await assert.rejects(readBackupState(sql), /Backup incompleto/);
  await fs.rm(`${sql}.state.json`);
  await assert.rejects(readBackupState(sql), { code: "ENOENT" });
  await assert.rejects(readLocalState(path.join(directory, "missing")), { code: "ENOENT" });
  console.log("Backup state round-trip and integrity tests passed.");
} finally {
  assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(directory).startsWith("sc-backup-test-"));
  await fs.rm(directory, { recursive: true, force: true });
}
