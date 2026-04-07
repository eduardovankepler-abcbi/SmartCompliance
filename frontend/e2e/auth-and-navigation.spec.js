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

test("colaborador acessa apenas a jornada esperada", async ({ page }) => {
  await login(page, {
    email: "colaborador1@demo.local",
    password: "demo123"
  });

  await openSection(page, "Avaliacoes");
  await expect(page.getByRole("button", { name: "Pessoas" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Operacao" })).toHaveCount(0);
});
