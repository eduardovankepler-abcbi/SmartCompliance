import { expect } from "@playwright/test";

export async function login(page, { email, password }) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /não foi possível carregar a aplicação/i })).toHaveCount(0);
  await expect(page.getByLabel("Email")).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar no ambiente" }).click();
  await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
}

export async function openSection(page, label) {
  await page.getByRole("button", { name: label }).click();
  await expect(page.getByRole("heading", { name: label, exact: true })).toBeVisible();
}

export async function openEvaluationWorkspace(page, workspaceLabel) {
  await page.getByRole("button", { name: workspaceLabel }).click();
  await expect(page.getByRole("button", { name: workspaceLabel })).toHaveClass(/active/);
}

export async function openEvaluationModule(page, moduleLabel) {
  const moduleButton = page.locator(".module-toolbar").getByRole("button", {
    name: new RegExp(moduleLabel, "i")
  });
  await moduleButton.click();
  await expect(moduleButton).toHaveClass(/active/);
}
