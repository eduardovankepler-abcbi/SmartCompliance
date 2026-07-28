import { expect, test } from "@playwright/test";
import { login, openEvaluationWorkspace, openSection } from "./helpers.js";

test.setTimeout(120000);

test("gestor acompanha leituras do 360 e fecha a jornada com PDI da equipe", async ({
  page
}) => {
  const planTitle = `PDI 360 E2E ${Date.now()}`;

  await login(page, {
    email: "gestor@demo.local",
    password: "demo123"
  });

  await openSection(page, "Avaliacoes");
  await expect(page.getByRole("button", { name: "Operacao" })).toHaveCount(0);
  await openEvaluationWorkspace(page, "Leituras");
  await expect(page.getByRole("heading", { name: "Leituras do ciclo" })).toBeVisible();
  await expect(page.getByText("Comparar com outro ciclo")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Historico armazenado por ciclo" })).toBeVisible();

  await openSection(page, "Desenvolvimento");
  await expect(page.getByRole("button", { name: /PDI da equipe/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Meu PDI/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Organizacao" })).toHaveCount(0);
  await page.getByRole("button", { name: /PDI da equipe/ }).click();

  const developmentPlanForm = page.locator("form.development-plan-form");

  await developmentPlanForm.locator("select").nth(0).selectOption("p2");
  await developmentPlanForm.locator("input").nth(0).fill(planTitle);
  await developmentPlanForm
    .locator("textarea")
    .nth(0)
    .fill("Conduzir checkpoints quinzenais e registrar evidencias objetivas.");
  await developmentPlanForm.locator("input").nth(1).fill("2026-07-31");
  await developmentPlanForm
    .locator("textarea")
    .nth(1)
    .fill("Resumo dos checkpoints e melhoria percebida no proximo ciclo.");
  await developmentPlanForm.getByRole("button", { name: "Registrar PDI" }).click();

  await expect(page.getByText(planTitle, { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Sair" }).click();

  await login(page, {
    email: "colaborador2@demo.local",
    password: "demo123"
  });

  await expect(page.getByRole("button", { name: "Dashboard" })).toHaveCount(0);

  await openSection(page, "Avaliacoes");
  await expect(page.getByRole("button", { name: "Leituras" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Operacao" })).toHaveCount(0);

  await openSection(page, "Desenvolvimento");
  await expect(page.getByRole("heading", { name: "Novo PDI" })).toHaveCount(0);
  await expect(page.getByText(planTitle, { exact: true }).first()).toBeVisible();

  const createdPlanCard = page.locator(".list-card.compact-list-card").filter({
    has: page.getByText(planTitle)
  });

  await createdPlanCard.getByLabel("Status do andamento").selectOption("done");
  await createdPlanCard
    .getByLabel("Reporte do colaborador")
    .fill("Plano executado com checkpoints registrados e evidencias compartilhadas.");
  await createdPlanCard.getByRole("button", { name: "Reportar andamento" }).click();

  await expect(createdPlanCard.locator(".badge").filter({ hasText: "Concluido" }).first()).toBeVisible();
  await expect(
    createdPlanCard.getByText(
      "Plano executado com checkpoints registrados e evidencias compartilhadas."
    )
  ).toBeVisible();
});
