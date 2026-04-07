import { expect } from "@playwright/test";

export async function login(page, { email, password }) {
  await page.goto("/");
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
  await page.getByRole("button", { name: moduleLabel }).click();
  await expect(page.getByRole("button", { name: moduleLabel })).toHaveClass(/active/);
}
