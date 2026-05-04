import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { env } from "../config/env.js";
import { badRequest } from "./helpers.js";
import { createToken } from "../auth/token.js";

const loginAttempts = new Map();

function getClientIp(req) {
  if (Array.isArray(req.ips) && req.ips.length > 0) {
    return req.ips[0];
  }

  if (typeof req.ip === "string" && req.ip.trim()) {
    return req.ip.trim();
  }

  return "unknown";
}

function getClientKey(req, email) {
  return `${getClientIp(req)}:${String(email || "").toLowerCase()}`;
}

function pruneExpiredLoginAttempts(now = Date.now()) {
  loginAttempts.forEach((state, key) => {
    if (state.windowEndsAt < now && state.lockedUntil < now) {
      loginAttempts.delete(key);
    }
  });
}

function getRateLimitState(key) {
  const now = Date.now();
  pruneExpiredLoginAttempts(now);
  const current = loginAttempts.get(key);

  if (!current || current.windowEndsAt < now) {
    const fresh = {
      failedAttempts: 0,
      windowEndsAt: now + env.auth.loginWindowMs,
      lockedUntil: 0
    };
    loginAttempts.set(key, fresh);
    return fresh;
  }

  return current;
}

export function createAuthRouter(store) {
  const router = Router();

  router.post("/login", async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return badRequest(res, "Email e senha sao obrigatorios.");
    }
    if (String(email).length > 254 || String(password).length > 1024) {
      return badRequest(res, "Credenciais invalidas.");
    }

    try {
      const clientKey = getClientKey(req, email);
      const state = getRateLimitState(clientKey);
      if (state.lockedUntil > Date.now()) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((state.lockedUntil - Date.now()) / 1000)
        );
        res.setHeader("Retry-After", String(retryAfterSeconds));
        return res.status(429).json({
          error: "Muitas tentativas de login. Tente novamente em alguns minutos."
        });
      }

      const user = await store.authenticateUser(email, password);
      if (!user) {
        state.failedAttempts += 1;
        if (state.failedAttempts >= env.auth.maxFailedLogins) {
          state.lockedUntil = Date.now() + env.auth.loginLockMs;
        }
        return res.status(401).json({ error: "Credenciais invalidas." });
      }

      loginAttempts.delete(clientKey);

      let token;
      try {
        token = createToken({
          userId: user.id,
          roleKey: user.roleKey
        });
      } catch (error) {
        error.authStage = "issue_token";
        throw error;
      }

      res.json({
        token,
        user
      });
    } catch (error) {
      console.error("Login failed", {
        stage: error.authStage || "unknown",
        code: error.code,
        errno: error.errno,
        message: error.message
      });
      res.status(500).json({
        error: "Erro interno ao processar login.",
        code: error.authStage ? `auth_${error.authStage}` : "auth_internal"
      });
    }
  });

  router.get("/me", requireAuth(store), async (req, res) => {
    res.json(req.auth.user);
  });

  return router;
}
