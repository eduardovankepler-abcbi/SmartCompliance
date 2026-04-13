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

  const configured = canonical ? parseCsv(canonical) : legacy ? parseCsv(legacy) : [];
  const originRules = configured.length
    ? configured
    : [
        "http://localhost:5173",
        "https://smart-compliance-frontend.vercel.app",
        "https://smart-compliance-frontend*.vercel.app"
      ];
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

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function buildMysqlSslOption() {
  const mode = String(process.env.MYSQL_SSL_MODE || process.env.DB_SSL_MODE || "disabled")
    .trim()
    .toLowerCase();

  if (mode === "disabled" || mode === "off" || mode === "false" || mode === "none") {
    return null;
  }

  const rejectUnauthorized = parseBoolean(
    process.env.MYSQL_SSL_REJECT_UNAUTHORIZED ?? process.env.DB_SSL_REJECT_UNAUTHORIZED,
    mode === "verify-full"
  );
  const ca =
    process.env.MYSQL_SSL_CA ||
    process.env.DB_SSL_CA ||
    process.env.MYSQL_SSL_CA_PEM ||
    process.env.DB_SSL_CA_PEM ||
    "";

  const ssl = {
    rejectUnauthorized
  };

  if (ca) {
    ssl.ca = String(ca).replace(/\\n/g, "\n");
  }

  return ssl;
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
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || "smart_compliance",
    ssl: buildMysqlSslOption()
  }
};

if (env.nodeEnv === "production" && env.authSecret === "smart-compliance-dev-secret") {
  throw new Error("AUTH_SECRET precisa ser configurado em producao.");
}
