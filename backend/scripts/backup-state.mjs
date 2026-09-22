import crypto from "node:crypto";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const STATE_FILES = ["custom-libraries.json", "anonymous-responses.json"];

export function resolveDataDirectory(configuredDirectory) {
  return configuredDirectory ? path.resolve(configuredDirectory)
    : fileURLToPath(new URL("../.data/", import.meta.url));
}

function validateState(name, content) {
  const state = JSON.parse(content);
  const keys = name === "custom-libraries.json" ? ["drafts", "published"] : ["responses"];
  if (!state || keys.some((key) => !Array.isArray(state[key]))) {
    throw new Error(`Estado local invalido: ${name}`);
  }
}

export async function readLocalState(directory) {
  const files = {};
  for (const name of STATE_FILES) {
    try {
      files[name] = await fs.readFile(path.join(directory, name), "utf8");
    } catch (error) {
      // Ausencia de respostas e normal antes do primeiro envio anonimo.
      if (error.code !== "ENOENT" || name !== "anonymous-responses.json") throw error;
      files[name] = '{"responses":[]}';
    }
    validateState(name, files[name]);
  }
  return files;
}

export async function fileDigest(file) {
  const hash = crypto.createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

export async function writeBackupState(sqlFile, files) {
  const manifest = { version: 1, sqlSha256: await fileDigest(sqlFile), files };
  await fs.writeFile(`${sqlFile}.state.json`, JSON.stringify(manifest), { flag: "wx", mode: 0o600 });
}

export async function readBackupState(sqlFile) {
  const manifest = JSON.parse(await fs.readFile(`${sqlFile}.state.json`, "utf8"));
  if (manifest.version !== 1 || manifest.sqlSha256 !== await fileDigest(sqlFile) ||
      !manifest.files || Object.keys(manifest.files).length !== STATE_FILES.length) {
    throw new Error("Backup incompleto ou SQL diferente do manifesto.");
  }
  for (const name of STATE_FILES) validateState(name, manifest.files[name]);
  return manifest.files;
}

export async function restoreLocalState(directory, files) {
  for (const name of STATE_FILES) validateState(name, files[name]);
  await fs.mkdir(directory, { recursive: true });
  for (const name of STATE_FILES) {
    const target = path.join(directory, name);
    const temporary = `${target}.${crypto.randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, files[name], { flag: "wx", mode: 0o600 });
      await fs.rename(temporary, target);
    } finally {
      await fs.rm(temporary, { force: true });
    }
  }
}
