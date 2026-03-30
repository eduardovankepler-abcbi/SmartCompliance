import { Router } from "express";
import { badRequest } from "./helpers.js";

export function createApplauseRouter(store) {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      res.json(await store.getApplauseEntries(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    const { receiverPersonId, category, impact, contextNote } = req.body;

    if (!receiverPersonId || !category || !impact || !contextNote) {
      return badRequest(res, "Campos obrigatorios do Aplause nao informados.");
    }

    try {
      const applause = await store.createApplauseEntry({
        senderPersonId: req.auth.user.person.id,
        receiverPersonId,
        category,
        impact,
        contextNote
      });

      res.status(201).json(applause);
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao registrar Aplause." });
    }
  });

  router.patch("/:applauseId", async (req, res, next) => {
    const { applauseId } = req.params;
    const { receiverPersonId, category, impact, contextNote, status } = req.body;

    if (!receiverPersonId || !category || !impact || !contextNote || !status) {
      return badRequest(res, "Campos obrigatorios do Aplause nao informados.");
    }

    try {
      const applause = await store.updateApplauseEntry(
        applauseId,
        {
          receiverPersonId,
          category,
          impact,
          contextNote,
          status
        },
        req.auth.user
      );

      res.json(applause);
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao atualizar Aplause." });
    }
  });

  return router;
}
