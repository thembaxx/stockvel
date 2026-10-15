import { test, expect } from "@playwright/test";

test("signed-out users cannot read account data", async ({ request }) => {
  const response = await request.get("/api/account");
  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(await response.json()).toEqual({ error: "AUTHENTICATION_REQUIRED" });
});

test("private workspace redirects signed-out users", async ({ page }) => {
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/auth\/sign-in(?:\?|$)/);
  await expect(page.locator("body")).toBeVisible();
});

test("the fictional public dashboard remains accessible without signing in", async ({ page }) => {
  await page.goto("/demo");
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.locator("body")).toContainText("Interactive demo");
});
