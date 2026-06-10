import { expect, test } from "@playwright/test";
import { login } from "./helpers.js";

test("admin explora o dashboard analitico de resultados", async ({ page }) => {
  await login(page, {
    email: "admin@demo.local",
    password: "demo123"
  });

  await page.getByRole("button", { name: "Dashboard" }).click();
  await expect(page.getByText("Filtros do dashboard")).toBeVisible();

  await page.getByRole("button", { name: /Leitura analitica/i }).click();
  await expect(page.getByText("Sintese rapida do recorte")).toBeVisible();

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
  await expect(page.getByText("Volume por ano")).toBeVisible();

  const compositionSelect = page
    .locator(".dashboard-filter-select-card")
    .filter({ hasText: "Recorte" })
    .locator("select");
  await compositionSelect.selectOption("company");
  await expect(page.getByText("Satisfacao por pergunta")).toBeVisible();
  await expect(page.getByText("Sem respostas para esta area")).toBeVisible();

  await compositionSelect.selectOption("peer");
  await expect(page.getByText("Leitura por dimensão")).toBeVisible();
  await expect(page.locator(".response-chart-grid .response-chart-card").first()).toBeVisible();
});
