import { test, expect } from "@playwright/test";

test("More navigation stays reachable on short portrait and landscape screens", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [
    { width: 390, height: 740 },
    { width: 640, height: 320 },
    { width: 390, height: 320 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/demo/contributions");
    await page.getByRole("button", { name: "More", exact: true }).click();
    const panel = page.getByRole("region", { name: "More from your society" });
    await expect(panel).toBeVisible();
    const fits = await panel.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.bottom <= innerHeight &&
        rect.left >= 0 &&
        rect.right <= innerWidth &&
        element.scrollWidth <= element.clientWidth + 1
      );
    });
    expect(fits).toBe(true);
    const settings = panel.getByRole("link", { name: "Society settings", exact: true });
    await settings.scrollIntoViewIfNeeded();
    await expect(settings).toBeInViewport({ ratio: 1 });
    await expect(panel.getByRole("button", { name: "Close more menu" })).toBeInViewport({
      ratio: 1,
    });
    await settings.click();
    await expect(page).toHaveURL(/\/demo\/settings$/);
    await expect(panel).not.toBeVisible();
  }
});

test("navigation popups close when their controls disappear after resizing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 900, height: 740 });
  await page.goto("/demo");
  await page.getByRole("button", { name: "Search members", exact: true }).click();
  const search = page.getByRole("search", { name: "Society members" });
  await page.getByRole("textbox", { name: "Find a member", exact: true }).fill("Ayanda");
  await expect(search.getByRole("link", { name: "Ayanda Ndlovu" })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 740 });
  await expect(search).not.toBeVisible();
  await page.getByRole("button", { name: "More", exact: true }).click();
  const more = page.getByRole("region", { name: "More from your society" });
  await expect(more).toBeVisible();
  await page.setViewportSize({ width: 900, height: 740 });
  await expect(more).not.toBeVisible();
  await page.getByRole("button", { name: "Search members", exact: true }).click();
  await expect(search.getByRole("link", { name: "Ayanda Ndlovu" })).toBeVisible();
});

test("dialog scrolling leaves the page behind it still and unlocks it on close", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 740 });
  await page.goto("/demo/contributions");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.evaluate(() => window.scrollTo({ top: 100, behavior: "instant" }));
  await page.getByRole("button", { name: "Record payment", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const before = await page.evaluate(() => scrollY);
  await page.mouse.move(2, 400);
  await page.mouse.wheel(0, 450);
  // Wheel scrolling is processed by the compositor after dispatch.
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  const rect = await dialog.boundingBox();
  await page.mouse.move(rect!.x + rect!.width / 2, rect!.y + 120);
  await page.mouse.wheel(0, 450);
  await expect.poll(() => dialog.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(() => scrollY)).toBe(before);
  // Verify restored page scrolling through the keyboard as well as pointer input.
  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
});
