import { expect, test } from "@playwright/test";
import { login } from "./helpers.js";

test("gestor explora o dashboard da equipe sem ampliar o escopo", async ({ page }) => {
  await login(page, {
    email: "gestor@demo.local",
    password: "demo123"
  });

  await page.getByRole("button", { name: "Dashboard" }).click();
  await expect(page.getByText("Painel gerencial")).toBeVisible();
  await expect(
    page.getByText("Leitura da sua equipe direta, sem exposicao de outras areas.")
  ).toBeVisible();

  const areaSelect = page
    .locator(".dashboard-filter-select-card")
    .filter({ hasText: "Area" })
    .locator("select");
  await expect(areaSelect.locator("option")).toHaveCount(1);
  await expect(areaSelect).toHaveValue("team");

  await page.getByRole("button", { name: /Leitura analitica/i }).click();
  await expect(page.getByText("Resultado por modalidade")).toBeVisible();
  await expect(page.getByText("Resumo macro por modalidade")).toBeVisible();

  const compositionSelect = page
    .locator(".dashboard-filter-select-card")
    .filter({ hasText: "Recorte" })
    .locator("select");
  await compositionSelect.selectOption("peer");

  await expect(compositionSelect).toHaveValue("peer");
  await expect(page.getByText("Leitura por dimensão")).toBeVisible();
  await expect(page.locator(".response-chart-grid .response-chart-card").first()).toBeVisible();

  await compositionSelect.selectOption("manager");
  await expect(page.getByText("Sem detalhe analitico disponivel")).toBeVisible();
});
