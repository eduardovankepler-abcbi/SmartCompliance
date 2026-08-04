import { env } from "../config/env.js";

const LEVEL_TO_CONSOLE = {
  info: "log",
  warn: "warn",
  error: "error"
};

function normalizeError(error) {
  if (!error) {
    return {};
  }

  return {
    message: error.message,
    code: error.code,
    errno: error.errno,
    stage: error.authStage || error.stage
  };
}

function write(level, event, details = {}) {
  const payload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    version: env.appVersion,
    ...details
  };
  const consoleMethod = LEVEL_TO_CONSOLE[level] || "log";

  if (env.logFormat === "json") {
    console[consoleMethod](JSON.stringify(payload));
    return;
  }

  console[consoleMethod](`[${payload.timestamp}] ${level.toUpperCase()} ${event}`, details);
}

export const logger = {
  info(event, details = {}) {
    write("info", event, details);
  },
  warn(event, details = {}) {
    write("warn", event, details);
  },
  error(event, details = {}) {
    write("error", event, {
      ...details,
      error: normalizeError(details.error)
    });
  }
};
