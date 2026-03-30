import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { badRequest } from "./helpers.js";
import { createToken } from "../auth/token.js";

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const MAX_FAILED_LOGINS = 5;
const loginAttempts = new Map();

function getClientKey(req, email) {
  return `${req.ip || "unknown"}:${String(email || "").toLowerCase()}`;
}

function getRateLimitState(key) {
  const now = Date.now();
  const current = loginAttempts.get(key);

  if (!current || current.windowEndsAt < now) {
    const fresh = {
      failedAttempts: 0,
      windowEndsAt: now + LOGIN_WINDOW_MS,
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
        return res.status(429).json({
          error: "Muitas tentativas de login. Tente novamente em alguns minutos."
        });
      }

      const user = await store.authenticateUser(email, password);
      if (!user) {
        state.failedAttempts += 1;
        if (state.failedAttempts >= MAX_FAILED_LOGINS) {
          state.lockedUntil = Date.now() + LOGIN_LOCK_MS;
        }
        return res.status(401).json({ error: "Credenciais invalidas." });
      }

      loginAttempts.delete(clientKey);

      const token = createToken({
        userId: user.id,
        roleKey: user.roleKey
      });

      res.json({
        token,
        user
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/me", requireAuth(store), async (req, res) => {
    res.json(req.auth.user);
  });

  return router;
}
