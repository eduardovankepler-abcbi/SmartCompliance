import { expect, test } from "@playwright/test";
import { login } from "./helpers.js";

test("admin explora o dashboard analitico de resultados", async ({ page }) => {
  await login(page, {
    email: "admin@demo.local",
    password: "demo123"
  });

  await page.getByRole("button", { name: "Dashboard" }).click();
  await expect(page.locator('[aria-label="Filtros do dashboard"]')).toBeVisible();

  await page.getByRole("button", { name: /Leitura analitica/i }).click();
  await expect(page.getByText("Sintese rapida do recorte")).toBeVisible();
  const executivePanel = page.getByRole("tabpanel", { name: "Visão Executiva" });

  const areaSelect = page
    .locator(".dashboard-filter-select-card")
    .filter({ hasText: "Area" })
    .locator("select");
  await areaSelect.selectOption("Tecnologia");
  await expect(page.locator(".dashboard-focus-pill").filter({ hasText: "Area" })).toContainText(
    "Tecnologia"
  );

  const groupingSelect = page
    .locator(".dashboard-filter-select-card")
    .filter({ hasText: "Consolidacao" })
    .locator("select");
  await groupingSelect.selectOption("year");
  await expect(executivePanel.getByRole("heading", { name: "Volume por ano" })).toBeVisible();

  const compositionSelect = page
    .locator(".dashboard-filter-select-card")
    .filter({ hasText: "Recorte" })
    .locator("select");
  await compositionSelect.selectOption("company");
  await expect(executivePanel.getByText("Satisfacao por pergunta")).toBeVisible();
  await expect(executivePanel.getByText("Sem respostas para esta area")).toBeVisible();

  await compositionSelect.selectOption("peer");
  await expect(executivePanel.getByText("Leitura por dimensão")).toBeVisible();
  await expect(executivePanel.getByText("Perguntas priorizadas")).toBeVisible();
  await expect(executivePanel.getByRole("button", { name: "Exportar CSV" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await executivePanel.getByRole("button", { name: "Exportar CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("dashboard-avaliacoes");
  await expect(
    executivePanel.locator(".response-chart-grid .response-chart-card").first()
  ).toBeVisible();

  await page.getByRole("tab", { name: "Resultados" }).click();
  await expect(
    page.getByRole("tabpanel", { name: "Resultados" }).getByText("Resultado por modalidade")
  ).toBeVisible();

  await page.getByRole("tab", { name: "Desempenho 360" }).click();
  await expect(
    page.getByRole("tabpanel", { name: "Desempenho 360" }).getByText("Saude de performance")
  ).toBeVisible();

  await page.getByRole("tab", { name: "Pessoas e Áreas" }).click();
  await expect(
    page.getByRole("tabpanel", { name: "Pessoas e Áreas" }).getByText("Base do recorte")
  ).toBeVisible();

  await page.getByRole("tab", { name: "Compliance e Riscos" }).click();
  await expect(
    page.getByRole("tabpanel", { name: "Compliance e Riscos" }).getByText("Risco e fila de tratamento")
  ).toBeVisible();

  await page.getByRole("tab", { name: "Desenvolvimento" }).click();
  await expect(
    page.getByRole("tabpanel", { name: "Desenvolvimento" }).getByText("Cobertura e trilhas de PDI")
  ).toBeVisible();
});
