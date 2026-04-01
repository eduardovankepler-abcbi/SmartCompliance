import dotenv from "dotenv";

dotenv.config();

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wildcardToRegex(pattern) {
  const escaped = escapeRegExp(pattern).replace(/\\\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

function buildCorsOriginOption() {
  const canonical = process.env.CORS_ORIGIN;
  const legacy = process.env.CORS_ORIGINS;

  const configured = canonical ? [canonical] : legacy ? parseCsv(legacy) : [];
  const originRules = configured.length ? configured : ["http://localhost:5173"];
  const matchers = originRules.map((rule) =>
    rule.includes("*") ? wildcardToRegex(rule) : rule
  );

  if (matchers.length === 1 && typeof matchers[0] === "string") {
    return matchers[0];
  }

  return function corsOrigin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowed = matchers.some((matcher) =>
      typeof matcher === "string" ? matcher === origin : matcher.test(origin)
    );
    callback(null, allowed);
  };
}

function resolveStorageMode() {
  if (process.env.STORAGE_MODE) {
    return process.env.STORAGE_MODE;
  }

  if (process.env.MYSQL_HOST || process.env.DB_HOST) {
    return "mysql";
  }

  return "memory";
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  storageMode: resolveStorageMode(),
  corsOrigin: buildCorsOriginOption(),
  authSecret: process.env.AUTH_SECRET || "smart-compliance-dev-secret",
  mysql: {
    host: process.env.MYSQL_HOST || process.env.DB_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER || "root",
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || "smart_compliance"
  }
};

if (env.nodeEnv === "production" && env.authSecret === "smart-compliance-dev-secret") {
  throw new Error("AUTH_SECRET precisa ser configurado em producao.");
}
