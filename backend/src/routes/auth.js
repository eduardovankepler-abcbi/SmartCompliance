import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { env } from "../config/env.js";
import { logger } from "../observability/logger.js";
import { badRequest } from "./helpers.js";
import { createUserToken } from "../auth/token.js";

const MAX_TRACKED_LOGIN_ATTEMPTS = 10000;

function getClientIp(req) {
  if (Array.isArray(req.ips) && req.ips.length > 0) {
    return req.ips[0];
  }

  if (typeof req.ip === "string" && req.ip.trim()) {
    return req.ip.trim();
  }

  return "unknown";
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function createLoginRateLimiter({
  loginWindowMs = env.auth.loginWindowMs,
  loginLockMs = env.auth.loginLockMs,
  maxFailedLogins = env.auth.maxFailedLogins,
  maxEntries = MAX_TRACKED_LOGIN_ATTEMPTS
} = {}) {
  const attempts = new Map();
  const maxFailedLoginsByIp = maxFailedLogins * 4;

  function pruneExpiredAttempts(now) {
    attempts.forEach((state, key) => {
      if (state.windowEndsAt < now && state.lockedUntil < now) {
        attempts.delete(key);
      }
    });
  }

  function getState(key, now) {
    const current = attempts.get(key);

    if (current && (current.windowEndsAt >= now || current.lockedUntil > now)) {
      return current;
    }

    if (attempts.size >= maxEntries) {
      return {
        failedAttempts: maxFailedLogins,
        windowEndsAt: now + loginWindowMs,
        lockedUntil: now + loginLockMs,
        overflow: true
      };
    }

    const fresh = { failedAttempts: 0, windowEndsAt: now + loginWindowMs, lockedUntil: 0 };
    attempts.set(key, fresh);
    return fresh;
  }

  function getStates(ip, email, now = Date.now()) {
    pruneExpiredAttempts(now);
    const normalizedEmail = normalizeEmail(email);
    return [
      { scope: "ip", state: getState(`ip:${ip}`, now) },
      { scope: "account", state: getState(`account:${normalizedEmail}`, now) }
    ];
  }

  return {
    getLockedUntil(ip, email, now = Date.now()) {
      pruneExpiredAttempts(now);
      return Math.max(
        attempts.get(`ip:${ip}`)?.lockedUntil || 0,
        attempts.get(`account:${normalizeEmail(email)}`)?.lockedUntil || 0
      );
    },
    recordFailure(ip, email, now = Date.now()) {
      const states = getStates(ip, email, now);
      for (const { scope, state } of states) {
        if (state.overflow) continue;
        state.failedAttempts += 1;
        const limit = scope === "ip" ? maxFailedLoginsByIp : maxFailedLogins;
        if (state.failedAttempts >= limit) {
          state.lockedUntil = now + loginLockMs;
        }
      }
      return Math.max(...states.map(({ state }) => state.lockedUntil));
    },
    clearAccount(email) {
      attempts.delete(`account:${normalizeEmail(email)}`);
    }
  };
}

export function createAuthRouter(store) {
  const router = Router();
  const loginRateLimiter = createLoginRateLimiter();

  router.post("/login", async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return badRequest(res, "Email e senha sao obrigatorios.");
    }
    if (String(email).length > 254 || String(password).length > 1024) {
      return badRequest(res, "Credenciais invalidas.");
    }

    try {
      const clientIp = getClientIp(req);
      const lockedUntil = loginRateLimiter.getLockedUntil(clientIp, email);
      if (lockedUntil > Date.now()) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((lockedUntil - Date.now()) / 1000)
        );
        res.setHeader("Retry-After", String(retryAfterSeconds));
        logger.warn("auth.login.rate_limited", {
          requestId: req.requestId,
          ip: getClientIp(req),
          retryAfterSeconds
        });
        return res.status(429).json({
          error: "Muitas tentativas de login. Tente novamente em alguns minutos."
        });
      }

      const user = await store.authenticateUser(email, password);
      if (!user) {
        const lockedUntilAfterFailure = loginRateLimiter.recordFailure(clientIp, email);
        if (lockedUntilAfterFailure > Date.now()) {
          logger.warn("auth.login.locked", {
            requestId: req.requestId,
            ip: clientIp
          });
        }
        return res.status(401).json({ error: "Credenciais invalidas." });
      }

      loginRateLimiter.clearAccount(email);
      await store.recordAuthEvent?.("login_success", user, `IP: ${clientIp}`);

      let token;
      try {
        token = await createUserToken(store, user, password);
      } catch (error) {
        error.authStage = "issue_token";
        throw error;
      }

      res.json({
        token,
        user
      });
    } catch (error) {
      logger.error("auth.login.failed", {
        requestId: req.requestId,
        stage: error.authStage || "unknown",
        error
      });
      res.status(500).json({
        error: "Erro interno ao processar login.",
        code: error.authStage ? `auth_${error.authStage}` : "auth_internal"
      });
    }
  });

  router.get("/me", requireAuth(store, { allowPasswordChange: true }), async (req, res) => {
    res.json(req.auth.user);
  });

  router.post("/logout", requireAuth(store, { allowPasswordChange: true }), async (req, res, next) => {
    try {
      const { jti, exp } = req.auth.token;
      if (jti) {
        await store.revokeSession(jti, exp, req.auth.user.id);
      }
      await store.recordAuthEvent?.("logout", req.auth.user, `IP: ${getClientIp(req)}`);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  router.post("/change-password", requireAuth(store, { allowPasswordChange: true }), async (req, res) => {
    const { currentPassword, nextPassword } = req.body;
    if (!currentPassword || !nextPassword) {
      return badRequest(res, "Senha atual e nova senha sao obrigatorias.");
    }

    try {
      const user = await store.changeOwnPassword(req.auth.user.id, {
        currentPassword,
        nextPassword
      });
      res.json({ ...user, token: await createUserToken(store, user, String(nextPassword).trim()) });
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao alterar senha." });
    }
  });

  return router;
}
