import { expect, test } from "@playwright/test";
import { login, openSection } from "./helpers.js";

test("admin navega entre secoes estruturais", async ({ page }) => {
  await login(page, {
    email: "admin@demo.local",
    password: "demo123"
  });

  await openSection(page, "Pessoas");
  await expect(page.getByRole("heading", { name: "Nova pessoa" })).toBeVisible();

  await openSection(page, "Avaliacoes");
  await expect(page.getByRole("button", { name: "Operacao" })).toBeVisible();
});

test("admin visualiza os selects do formulario de pessoas", async ({ page }) => {
  await login(page, {
    email: "admin@demo.local",
    password: "demo123"
  });

  await openSection(page, "Pessoas");

  const personForm = page.locator("form").filter({
    has: page.getByRole("heading", { name: "Nova pessoa" })
  });

  await expect(personForm.locator("select")).toHaveCount(5);
  await expect(personForm.locator("select").first()).toBeVisible();
});

test("admin visualiza os selects do formulario de usuarios", async ({ page }) => {
  await login(page, {
    email: "admin@demo.local",
    password: "demo123"
  });

  await openSection(page, "Usuarios");

  const userForm = page.locator("form").filter({
    has: page.getByRole("heading", { name: "Novo usuario" })
  });

  await expect(userForm.locator("select")).toHaveCount(3);
  await expect(userForm.locator("select").first()).toBeVisible();
});

test("colaborador acessa apenas a jornada esperada", async ({ page }) => {
  await login(page, {
    email: "colaborador1@demo.local",
    password: "demo123"
  });

  await openSection(page, "Avaliacoes");
  await expect(page.getByRole("button", { name: "Pessoas" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Operacao" })).toHaveCount(0);
});
