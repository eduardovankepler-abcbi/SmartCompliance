import { expect, test } from "@playwright/test";
import {
  login,
  openEvaluationModule,
  openEvaluationWorkspace,
  openSection
} from "./helpers.js";

test.setTimeout(120000);

test("rh publica questionario individual e colaborador responde a autoavaliacao personalizada", async ({
  page
}) => {
  await login(page, {
    email: "rh@demo.local",
    password: "demo123"
  });

  await openSection(page, "Avaliacoes");
  await openEvaluationWorkspace(page, "Operacao");

  await page.getByRole("button", { name: "Questionarios individuais" }).click();
  await expect(
    page.getByRole("heading", { name: "Questionarios individuais" })
  ).toBeVisible();

  const title = `Autoavaliacao individual E2E ${Date.now()}`;
  await page.getByLabel("Tipo").first().selectOption({ label: "Autoavaliacao" });
  await page
    .getByLabel("Colaborador")
    .first()
    .selectOption({ label: "Colaborador Demo 01 · Compliance" });
  await page.getByLabel("Titulo").first().fill(title);
  await page.getByLabel("Descricao").first().fill("Questionario individual de regressao ponta a ponta.");
  await page.getByRole("button", { name: "Criar rascunho" }).click();

  await expect(page.getByRole("button", { name: title })).toBeVisible();
  await page.getByRole("button", { name: title }).click();

  await page.getByRole("button", { name: "Carregar da biblioteca base" }).click();
  await expect(
    page.getByText("Perguntas carregadas a partir da biblioteca base do ciclo.")
  ).toBeVisible();

  await page.getByRole("button", { name: "Editar" }).first().click();
  await page.getByLabel("Marcar pergunta como sensivel").check();
  await page.getByRole("button", { name: "Salvar pergunta" }).click();

  await page.getByRole("button", { name: "Publicar questionario" }).click();
  await expect(page.locator(".badge").filter({ hasText: "Publicado" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Sair" }).click();

  await login(page, {
    email: "colaborador1@demo.local",
    password: "demo123"
  });

  await openSection(page, "Avaliacoes");
  await openEvaluationModule(page, "Autoavaliacao");

  await expect(
    page.getByText("Este formulario contem perguntas sensiveis")
  ).toBeVisible();
  await expect(page.locator("form.evaluation-response-form")).toBeVisible();
  await page.getByRole("button", { name: "Enviar autoavaliacao" }).click();

  await expect(page.getByText("Avaliacao ja enviada")).toBeVisible();

  await page.getByRole("button", { name: "Sair" }).click();

  await login(page, {
    email: "rh@demo.local",
    password: "demo123"
  });

  await openSection(page, "Avaliacoes");
  await openEvaluationWorkspace(page, "Leituras");
  await openEvaluationModule(page, "Autoavaliacao");

  await expect(page.getByText("Colaborador Demo 01")).toBeVisible();
  await expect(page.getByText("Sensivel")).toBeVisible();
});
