import { Router } from "express";
import { requireRoles } from "../auth/middleware.js";
import { badRequest } from "./helpers.js";

export function createUsersRouter(store) {
  const router = Router();

  router.get("/", requireRoles("admin", "hr"), async (req, res, next) => {
    try {
      res.json(await store.getUsers(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requireRoles("admin", "hr"), async (req, res) => {
    const { personId, email, password, roleKey, status } = req.body;

    if (!personId || !email || !password || !roleKey || !status) {
      return badRequest(res, "Campos obrigatorios do usuario nao informados.");
    }

    try {
      const user = await store.createUser(
        { personId, email, password, roleKey, status },
        req.auth.user
      );
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao cadastrar usuario." });
    }
  });

  router.patch("/:userId", requireRoles("admin", "hr"), async (req, res) => {
    const { roleKey, status, password } = req.body;

    if (!roleKey || !status) {
      return badRequest(res, "roleKey e status sao obrigatorios.");
    }

    try {
      const user = await store.updateUser(
        req.params.userId,
        { roleKey, status, password: password || "" },
        req.auth.user
      );
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao atualizar usuario." });
    }
  });

  return router;
}
