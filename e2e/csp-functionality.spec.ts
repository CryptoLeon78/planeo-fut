import { expect, test } from "@playwright/test";

const storageKey = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY;
const sessionJson = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON;
test.skip(!storageKey || !sessionJson, "Requiere la sesión E2E gestionada del proyecto");

test("la CSP permite cargar dashboard, navegar y llamar a la API", async ({ page, request }) => {
  await page.goto("/");
  await page.evaluate(
    ([key, value]) => window.localStorage.setItem(key, value),
    [storageKey ?? "", sessionJson ?? ""],
  );
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Hola,/ })).toBeVisible();
  await page.getByRole("link", { name: /Calendario/i }).first().click();
  await expect(page).toHaveURL(/\/calendar/);

  const response = await request.get("/api/public/health");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-security-policy"]).toContain("default-src 'none'");
});