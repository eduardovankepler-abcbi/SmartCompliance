import dotenv from "dotenv";

dotenv.config();

const errors = [];
const warnings = [];

function valueOf(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function requireValue(name, message = `${name} precisa ser configurado.`) {
  const value = valueOf(name);
  if (!value) {
    errors.push(message);
  }
  return value;
}

function isWeakSecret(value) {
  const normalized = String(value || "").trim();
  return (
    !normalized ||
    normalized === "smart-compliance-dev-secret" ||
    normalized === "change-this-to-a-strong-secret" ||
    normalized.length < 32
  );
}

function parseOrigins(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const nodeEnv = requireValue("NODE_ENV", "NODE_ENV precisa ser production no servidor definitivo.");
if (nodeEnv && nodeEnv !== "production") {
  errors.push("NODE_ENV precisa ser production no servidor definitivo.");
}

const storageMode = requireValue("STORAGE_MODE", "STORAGE_MODE precisa ser mysql no servidor definitivo.");
if (storageMode && storageMode !== "mysql") {
  errors.push("STORAGE_MODE precisa ser mysql no servidor definitivo.");
}

const authSecret = requireValue("AUTH_SECRET");
if (isWeakSecret(authSecret)) {
  errors.push("AUTH_SECRET precisa ser forte, exclusivo e ter pelo menos 32 caracteres.");
}

const port = requireValue("PORT");
if (port && (!Number.isInteger(Number(port)) || Number(port) <= 0)) {
  errors.push("PORT precisa ser um numero inteiro positivo.");
}

const mysqlHost = requireValue("MYSQL_HOST", "MYSQL_HOST precisa apontar para o MySQL definitivo.");
const mysqlPort = requireValue("MYSQL_PORT");
requireValue("MYSQL_USER");
requireValue("MYSQL_PASSWORD");
requireValue("MYSQL_DATABASE");

if (["localhost", "127.0.0.1"].includes(mysqlHost.toLowerCase())) {
  warnings.push("MYSQL_HOST aponta para host local. Confirme se o MySQL definitivo estara no mesmo servidor.");
}
if (mysqlPort && (!Number.isInteger(Number(mysqlPort)) || Number(mysqlPort) <= 0)) {
  errors.push("MYSQL_PORT precisa ser um numero inteiro positivo.");
}

const corsOrigin = valueOf("CORS_ORIGIN", "CORS_ORIGINS");
const corsAdditional = valueOf("CORS_ADDITIONAL_ORIGINS");
const origins = [...parseOrigins(corsOrigin), ...parseOrigins(corsAdditional)];
if (origins.length === 0) {
  errors.push("CORS_ORIGIN ou CORS_ORIGINS precisa conter a URL final do frontend.");
}
if (origins.some((origin) => origin === "*" || origin.includes("*"))) {
  errors.push("CORS de producao nao deve usar wildcard.");
}
if (origins.some((origin) => /^(https?:\/\/)(?:https?:\/\/)+/i.test(origin))) {
  errors.push("CORS_ORIGIN contem protocolo duplicado. Use formato como https://frontend.example.com.");
}
if (origins.some((origin) => /\/$/.test(origin))) {
  warnings.push("CORS_ORIGIN contem barra final. O backend normaliza, mas prefira origem sem barra final.");
}
if (origins.some((origin) => origin.includes("localhost") || origin.includes("127.0.0.1"))) {
  warnings.push("CORS contem localhost/127.0.0.1. Confirme se isso e intencional no servidor definitivo.");
}

const sslMode = valueOf("MYSQL_SSL_MODE", "DB_SSL_MODE");
if (!sslMode) {
  warnings.push("MYSQL_SSL_MODE nao configurado. Confirme se o MySQL definitivo exige SSL.");
}

const dataDir = requireValue("DATA_DIR", "DATA_DIR precisa apontar para armazenamento persistente no servidor definitivo.");
const backupDir = requireValue("BACKUP_DIR", "BACKUP_DIR precisa apontar para armazenamento persistente de backups.");
for (const [name, directory] of [["DATA_DIR", dataDir], ["BACKUP_DIR", backupDir]]) {
  if (directory && !directory.startsWith("/") && !/^[A-Za-z]:[\\/]/.test(directory)) {
    warnings.push(`${name} parece ser relativo. Confirme se aponta para armazenamento persistente.`);
  }
}

if (errors.length > 0) {
  console.error(JSON.stringify({ status: "failed", errors, warnings }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ status: "passed", warnings }, null, 2));
