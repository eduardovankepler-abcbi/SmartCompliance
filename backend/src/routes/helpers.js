import { logger } from "../observability/logger.js";

export function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

const TECHNICAL_ERROR_PATTERN = /\b(?:ER_[A-Z_]+|SQL|SELECT|INSERT|UPDATE|DELETE|ALTER|DROP|MYSQL|ECONN|ETIMEDOUT|STACK|SYNTAX ERROR|UNKNOWN COLUMN)\b/i;

export function safeErrorMessage(error, fallback) {
  const message = error instanceof Error ? error.message.trim() : "";
  if (!message || message.length > 240 || TECHNICAL_ERROR_PATTERN.test(message)) {
    logger.error("route.internal_error_masked", { error });
    return fallback;
  }
  return message;
}

export function createRequestRateLimiter({ windowMs, maxRequests }) {
  const attempts = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.auth?.user?.id || "anonymous"}:${req.ip || "unknown"}`;
    const current = attempts.get(key);
    const state = !current || current.windowEndsAt <= now
      ? { count: 0, windowEndsAt: now + windowMs }
      : current;
    state.count += 1;
    attempts.set(key, state);

    if (state.count > maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((state.windowEndsAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ error: "Muitas solicitacoes. Tente novamente em alguns minutos." });
    }

    next();
  };
}

