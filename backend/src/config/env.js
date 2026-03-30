import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  storageMode: process.env.STORAGE_MODE || "memory",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  authSecret: process.env.AUTH_SECRET || "smart-compliance-dev-secret",
  mysql: {
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "smart_compliance"
  }
};

if (env.nodeEnv === "production" && env.authSecret === "smart-compliance-dev-secret") {
  throw new Error("AUTH_SECRET precisa ser configurado em producao.");
}
