import { expect, test } from "@playwright/test";

const SWITCHER = { role: "radiogroup" as const, name: /Idioma de la aplicación/ };

test.describe("multi-language navigation", () => {
  test("switches the public site to British English and keeps it while navigating", async ({ page }) => {
    await page.goto("/");
    const group = page.getByRole(SWITCHER.role, { name: SWITCHER.name }).first();
    await expect(group).toBeVisible();

    await group.getByRole("radio", { name: "English (United Kingdom)" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");
    await expect(page.getByText(/Practice library|Sign in/i).first()).toBeVisible();

    // The preference survives client navigation to the public library.
    await page.goto("/ejercicios/futbol-base");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");
    await expect(page.locator("body")).not.toContainText("Biblioteca de ejercicios de fútbol base");

    // And a full reload.
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");

    // Back to Spanish.
    await page
      .getByRole(SWITCHER.role, { name: SWITCHER.name })
      .first()
      .getByRole("radio", { name: "Español (España)" })
      .click();
    await expect(page.locator("html")).toHaveAttribute("lang", "es-ES");
  });

  test("language switcher is keyboard operable", async ({ page }) => {
    await page.goto("/");
    const group = page.getByRole(SWITCHER.role, { name: SWITCHER.name }).first();
    await group.getByRole("radio", { name: "Español (España)" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("html")).toHaveAttribute("lang", "es-ES");
  });
});
