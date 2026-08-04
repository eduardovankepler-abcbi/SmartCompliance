import fs from "node:fs";

const MYSQLDUMP_CANDIDATES = [
  "mysqldump",
  "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe",
  "C:\\Program Files\\MySQL\\MySQL Workbench 8.0\\mysqldump.exe",
  "C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe",
  "C:\\Program Files (x86)\\MySQL\\MySQL Workbench 8.0\\mysqldump.exe"
];

const MYSQL_CANDIDATES = [
  "mysql",
  "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe",
  "C:\\Program Files\\MySQL\\MySQL Workbench 8.0\\mysql.exe",
  "C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe",
  "C:\\Program Files (x86)\\MySQL\\MySQL Workbench 8.0\\mysql.exe"
];

function firstExisting(candidates) {
  if (process.platform === "win32") {
    const absoluteMatch = candidates.find((candidate) => candidate.includes("\\") && fs.existsSync(candidate));
    if (absoluteMatch) {
      return absoluteMatch;
    }
  }

  for (const candidate of candidates) {
    if (!candidate.includes("\\") || fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}

export function resolveMysqlDumpPath() {
  return process.env.MYSQLDUMP_PATH || firstExisting(MYSQLDUMP_CANDIDATES);
}

export function resolveMysqlClientPath() {
  return process.env.MYSQL_CLIENT_PATH || firstExisting(MYSQL_CANDIDATES);
}
