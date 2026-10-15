import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("payment verification updates the obligation and cannot double post", async ({ page }) => {
  await page.goto("/demo/contributions");
  const row = page.getByRole("row").filter({ hasText: "Ayanda Ndlovu" });
  await expect(row).toContainText("R 500.00");
  await row.getByRole("button", { name: "Review", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Bank transaction").selectOption("b10");
  await dialog.getByRole("button", { name: "Verify & post receipt" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(row).toContainText("Verified");
  await expect(row).toContainText("R 0.00");
  await expect(page.getByText("R 4 800.00", { exact: true })).toBeVisible();
});
test("two distinct approvers and external evidence are required for payout completion", async ({
  page,
}) => {
  await page.goto("/demo/payouts");
  await page.getByRole("button", { name: "Review & approve" }).click();
  await page.getByLabel("Decision reason").fill("Treasurer attempting to self approve");
  await page.getByRole("button", { name: "Save decision" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByLabel("Act as demo reviewer").selectOption("sipho");
  await page.getByRole("button", { name: "Review & approve" }).click();
  await page.getByLabel("Decision reason").fill("Funds and constitution reviewed");
  await page.getByRole("button", { name: "Save decision" }).click();
  await expect(page.getByText("1 / 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Review & approve" }).click();
  await page.getByLabel("Decision reason").fill("Attempting a duplicate approval");
  await page.getByRole("button", { name: "Save decision" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "different authorised person",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByLabel("Act as demo reviewer").selectOption("thandi");
  await page.getByRole("button", { name: "Review & approve" }).click();
  await page.getByLabel("Decision reason").fill("Recipient and rotation reviewed");
  await page.getByRole("button", { name: "Save decision" }).click();
  await expect(page.getByRole("button", { name: "Record external payout" })).toBeVisible();
  await page.getByLabel("Act as demo reviewer").selectOption("naledi");
  await page.getByRole("button", { name: "Record external payout" }).click();
  await page.getByLabel("External bank payment reference").fill("DEMO-EFT-2026-025");
  await page.getByRole("button", { name: "Record external payment", exact: true }).click();
  await expect(page.getByText("External payment recorded: DEMO-EFT-2026-025")).toBeVisible();
});
test("burial society keeps eligibility and rule version visible", async ({ page }) => {
  await page.goto("/demo/benefits");
  await expect(page.getByText("Rule version 2026.1", { exact: false })).toBeVisible();
  await expect(page.getByText("6 calendar months · completed 01 July 2026")).toBeVisible();
  await page.getByRole("button", { name: "Review & record decision" }).click();
  await page.getByLabel("Committee decision", { exact: true }).selectOption("decline");
  await page.getByLabel("Decision reason").fill("Requested supporting evidence was not supplied");
  await page.getByRole("button", { name: "Save decision" }).click();
  await expect(page.getByText("Request declined.", { exact: false })).toBeVisible();
  await expect(page.getByText("Requested supporting evidence was not supplied")).toBeVisible();
});
test("monthly report downloads a balanced CSV", async ({ page }) => {
  await page.goto("/demo/reports");
  await expect(page.getByText("Debits equal credits")).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  expect((await downloaded).suggestedFilename()).toBe("stokvelos-ubuntu-2026-10-demo.csv");
});
for (const width of [320, 360, 768, 1024, 1440])
  test(`responsive workspace at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/demo");
    await page.getByRole("heading", { level: 1 }).waitFor();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByText("R 10 500.00", { exact: false })).toBeVisible();
    await expect(page.getByRole("link", { name: "Review next payout", exact: true })).toBeVisible();
    const recent = page.locator(".recent-contributions .table-wrap");
    expect(await recent.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    await expect(recent.getByText("Reported", { exact: true }).first()).toBeVisible();
    if (width === 360)
      await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  });
test("early metadata and dark theme match page backgrounds", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/demo/settings");
  expect(
    await page
      .locator('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]')
      .getAttribute("content"),
  ).toBe("#161F34");
  expect(
    await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor),
  ).toBe("rgb(22, 31, 52)");
  await page.getByRole("button", { name: "Install StokvelOS" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("offline actions are blocked and private dashboard HTML is not cached", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Service-worker cache inspection runs in Chromium; other browsers cover interface flows.",
  );
  await page.goto("/demo/contributions");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.getByRole("button", { name: "Record payment", exact: true }).click();
  await page.getByLabel("Amount (ZAR)").fill("100.00");
  await page.getByRole("button", { name: "Record reported payment" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Connect to the internet",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const paths = await Promise.all(
      names.map(async (n) =>
        (await (await caches.open(n)).keys()).map((r) => new URL(r.url).pathname),
      ),
    );
    return paths.flat();
  });
  expect(cached.some((p) => p.startsWith("/demo") || p.startsWith("/api/"))).toBe(false);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "A little pause. We’ll reconnect." }),
  ).toBeVisible();
  await context.setOffline(false);
  await page.getByRole("link", { name: "Try connecting again" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("grow together");
});
test("manifest has installable and maskable icons", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const m = await response.json();
  expect(m.display).toBe("standalone");
  expect(m.icons.some((i: { sizes: string }) => i.sizes === "192x192")).toBe(true);
  expect(m.icons.some((i: { purpose: string }) => i.purpose === "maskable")).toBe(true);
  for (const i of m.icons) expect((await request.get(i.src)).ok()).toBe(true);
});
test("reduced motion stops decorative movement and dialogs restore keyboard focus", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await expect(page.locator(".hero-phone-motion")).toHaveCSS("transform", "none");
  await page.goto("/demo/contributions");
  const record = page.getByRole("button", { name: "Record payment", exact: true });
  await record.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(record).toBeFocused();
});
test("marketing and workspace meet automated accessibility checks", async ({ page }) => {
  for (const mode of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: mode });
    for (const path of ["/", "/demo", "/demo/settings"]) {
      await page.goto(path);
      await page.getByRole("heading", { level: 1 }).waitFor();
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        result.violations,
        JSON.stringify(
          result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
        ),
      ).toEqual([]);
    }
  }
});
