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
  await expect(page.getByRole("button", { name: "Salvar regras do pareamento" })).toBeVisible();
  await expect(page.getByText("Pareamentos do Feedback transversal")).toBeVisible();

  await page.getByRole("button", { name: "Biblioteca" }).click();
  await expect(page.getByRole("heading", { name: "Perguntas da avaliacao" })).toBeVisible();
  await expect(page.locator("strong", { hasText: "Modalidades de avaliacao" })).toBeVisible();
  await expect(page.getByText("RH editor")).toBeVisible();
  await expect(page.getByRole("button", { name: "Competencias" })).toBeVisible();
});

test("rh salva configuracao transversal e encontra os dados apos recarregar", async ({
  page
}) => {
  await login(page, {
    email: "rh@demo.local",
    password: "demo123"
  });

  await openSection(page, "Avaliacoes");
  await openEvaluationWorkspace(page, "Operacao");
  await openEvaluationModule(page, "Feedback transversal");

  await page.getByLabel("Avaliadores por pessoa").fill("2");
  await page.getByLabel("Unidade para override").fill("Sao Paulo");
  await page.getByLabel("Qtd. na unidade").fill("2");
  await page.getByRole("button", { name: "Salvar regras do pareamento" }).click();

  await expect(
    page.getByText("Configuracao do Feedback transversal atualizada.")
  ).toBeVisible();
  await expect(page.getByText("2 avaliador(es) por pessoa nessa unidade")).toBeVisible();

  await page.reload();

  await openSection(page, "Avaliacoes");
  await openEvaluationWorkspace(page, "Operacao");
  await openEvaluationModule(page, "Feedback transversal");

  await expect(page.getByText("Configuracao do Feedback transversal")).toBeVisible();
  await expect(page.getByLabel("Avaliadores por pessoa")).toHaveValue("2");
  await expect(page.getByText("2 avaliador(es) por pessoa nessa unidade")).toBeVisible();
});
