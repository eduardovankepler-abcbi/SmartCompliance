import { expect, test } from "@playwright/test";
import {
  login,
  openEvaluationModule,
  openEvaluationWorkspace,
  openSection
} from "./helpers.js";

test("rh acessa operacao do feedback transversal e biblioteca", async ({ page }) => {
  await login(page, {
    email: "rh@demo.local",
    password: "demo123"
  });

  await openSection(page, "Avaliacoes");
  await openEvaluationWorkspace(page, "Operacao");
  await openEvaluationModule(page, "Feedback transversal");

  await expect(page.getByText("Configuracao do Feedback transversal")).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar configuracao" })).toBeVisible();
  await expect(page.getByText("Pareamentos do Feedback transversal")).toBeVisible();

  await page.getByRole("button", { name: "Biblioteca" }).click();
  await expect(page.getByRole("heading", { name: "Biblioteca de avaliacoes" })).toBeVisible();
  await expect(page.locator("strong", { hasText: "Bibliotecas publicadas" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Competencias" })).toBeVisible();
});
