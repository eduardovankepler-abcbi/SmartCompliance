import { Router } from "express";
import { badRequest } from "./helpers.js";

export function createDevelopmentRouter(store) {
  const router = Router();

  router.get("/records", async (req, res, next) => {
    try {
      res.json(await store.getDevelopmentRecords(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/records", async (req, res, next) => {
    const {
      personId,
      recordType,
      title,
      providerName,
      completedAt,
      skillSignal,
      notes
    } = req.body;

    if (
      !personId ||
      !recordType ||
      !title ||
      !providerName ||
      !completedAt ||
      !skillSignal
    ) {
      return badRequest(
        res,
        "Campos obrigatorios do registro de desenvolvimento nao informados."
      );
    }

    try {
      const record = await store.createDevelopmentRecord({
        personId,
        recordType,
        title,
        providerName,
        completedAt,
        skillSignal,
        notes: notes || ""
      }, req.auth.user);

      res.status(201).json(record);
    } catch (error) {
      res
        .status(400)
        .json({ error: error.message || "Falha ao registrar desenvolvimento." });
    }
  });

  return router;
}
