import { expect, test } from "@playwright/test";
import { login, openEvaluationModule, openSection } from "./helpers.js";

test("colaborador visualiza o formulario da avaliacao de satisfacao", async ({ page }) => {
  await login(page, {
    email: "colaborador1@demo.local",
    password: "demo123"
  });

  await openSection(page, "Avaliacoes");
  await openEvaluationModule(page, "Avaliacao de Satisfacao");

  await expect(page.getByRole("heading", { name: /Responder avaliacao de satisfacao/i })).toBeVisible();
  await expect(page.locator("form.evaluation-response-form")).toBeVisible();
  await expect(page.locator("form.evaluation-response-form select").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Enviar/i }).first()).toBeVisible();
});
