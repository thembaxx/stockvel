import { test, expect, type Page } from "@playwright/test";

async function expectDialogFits(page: Page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const bounds = await dialog.evaluate((element) => {
    const body = element.querySelector(".dialog-body")!;
    const rect = body.getBoundingClientRect();
    const style = getComputedStyle(body);
    const left = rect.left + parseFloat(style.paddingLeft);
    const right = rect.right - parseFloat(style.paddingRight);
    const previousLeft = element.scrollLeft;
    element.scrollLeft = 10000;
    const horizontalTravel = element.scrollLeft;
    element.scrollLeft = previousLeft;
    return {
      overflow: element.scrollWidth - element.clientWidth,
      horizontalTravel,
      innerOverflow: [
        ...body.querySelectorAll(
          ".form-stack, .form-grid, label, .dialog-actions, .share-preview, .invite-preview",
        ),
      ]
        .filter((child) => child.scrollWidth > child.clientWidth + 1)
        .map((child) => child.className || child.tagName),
      offscreen:
        element.getBoundingClientRect().right > innerWidth ||
        element.getBoundingClientRect().left < 0,
      escaped: [
        ...body.querySelectorAll(
          "input, select, textarea, button, a.button, .detail-grid, .share-preview, .invite-preview, .statement-row",
        ),
      ].flatMap((child) => {
        const box = child.getBoundingClientRect();
        return box.width && (box.left < left - 1 || box.right > right + 1)
          ? [
              {
                element: child.tagName,
                text: child.getAttribute("type") || child.textContent?.slice(0, 40),
              },
            ]
          : [];
      }),
    };
  });
  expect(bounds.overflow, "Popup must not have a horizontal scroll area").toBeLessThanOrEqual(1);
  expect(bounds.horizontalTravel, "Popup must not move horizontally").toBe(0);
  expect(
    bounds.innerOverflow,
    "Nested form containers must not overflow behind clipped popup edges",
  ).toEqual([]);
  expect(bounds.offscreen, "Popup must stay within the viewport").toBe(false);
  expect(bounds.escaped, "Controls must fit inside the popup's padded content area").toEqual([]);
  const lastAction = dialog.locator(".dialog-body button, .dialog-body a.button").last();
  if (await lastAction.count()) {
    await lastAction.scrollIntoViewIfNeeded();
    const actionFits = await lastAction.evaluate((button) => {
      const action = button.getBoundingClientRect();
      const popup = button.closest("dialog")!.getBoundingClientRect();
      const header = button
        .closest("dialog")!
        .querySelector(".dialog-heading")!
        .getBoundingClientRect();
      return action.top >= header.bottom - 1 && action.bottom <= popup.bottom + 1;
    });
    expect(actionFits, "The final action must be reachable by vertical scrolling").toBe(true);
  }
}

const popups = [
  ["contributions", "Record payment"],
  ["members", "View statement"],
  ["members", "Preview an invitation"],
  ["reconciliation", "Import bank CSV"],
  ["payouts", "Review & approve"],
  ["benefits", "Review & record decision"],
  ["reports", "Prepare a group-safe summary"],
  ["settings", "Preview onboarding & rules"],
  ["settings", "Install StokvelOS"],
] as const;

for (const width of [320, 390, 768]) {
  test(`all popup controls fit at ${width}px, including long content and error states`, async ({
    browser,
    browserName,
  }, testInfo) => {
    test.setTimeout(60000);
    const context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: { width, height: 740 },
      reducedMotion: "reduce",
      // Firefox does not support mobile emulation. WebKit exercises native date/file controls.
      isMobile: width < 760 && browserName !== "firefox",
      hasTouch: width < 760,
    });
    const page = await context.newPage();
    try {
      for (const [path, action] of popups) {
        await page.goto(`/demo/${path}`);
        await page.getByRole("heading", { level: 1 }).waitFor();
        await page.getByRole("button", { name: action, exact: true }).first().click();
        await expectDialogFits(page);
        await page.screenshot({
          path: testInfo.outputPath(`${path}-${action.replaceAll(/[^a-z0-9]+/gi, "-")}.png`),
        });

        if (action === "Record payment") {
          const reference = `DIALOG-REPORT-${width}`;
          await page.getByLabel("Amount (ZAR)").fill("300.00");
          await page.getByLabel("Payment reference").fill(reference);
          await expect(page.getByLabel("Payment date")).toHaveValue("14 Oct 2026");
          await expect(page.getByLabel("Payment date")).toHaveAttribute("readonly");
          await page.getByRole("button", { name: "Record reported payment", exact: true }).click();
          await expect(page.getByRole("dialog")).not.toBeVisible();
          await page
            .getByRole("row")
            .filter({ hasText: reference })
            .getByRole("button", { name: "Review", exact: true })
            .click();
          await expectDialogFits(page);
          await page.getByLabel("Review action").selectOption("reject");
          await expectDialogFits(page);
        }
        if (action === "Preview an invitation") {
          await page.getByLabel("Member’s first name").fill("W".repeat(60));
          await page
            .getByRole("dialog")
            .getByRole("button", { name: "Preview invitation", exact: true })
            .click();
          await expectDialogFits(page);
        }
        if (action === "Import bank CSV") {
          await page.getByLabel("Choose a sample CSV").setInputFiles({
            name: `${"very-long-sample-bank-reference-".repeat(5)}.csv`,
            mimeType: "text/csv",
            buffer: Buffer.from(
              "id,date,reference,amount\nsample,2026-10-14," + "R".repeat(80) + ",500.00",
            ),
          });
          await expectDialogFits(page);
        }
        if (action === "Review & approve") {
          await page
            .getByLabel("Decision reason")
            .fill("Testing the self-approval validation layout");
          await page.getByRole("button", { name: "Save decision", exact: true }).click();
          await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
          await expectDialogFits(page);
        }
        if (action === "Preview onboarding & rules") {
          await page.getByLabel("Society name").fill("Community".repeat(8));
          await page.getByRole("button", { name: "Continue to rules", exact: true }).click();
          await expectDialogFits(page);
          await page.getByRole("button", { name: "Review setup", exact: true }).click();
          await expectDialogFits(page);
        }
      }
    } finally {
      await context.close();
    }
  });
}

test("recording external payout evidence fits on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo/payouts");
  for (const reviewer of ["sipho", "thandi"]) {
    await page.getByLabel("Act as demo reviewer").selectOption(reviewer);
    await page.getByRole("button", { name: "Review & approve", exact: true }).click();
    await page
      .getByLabel("Decision reason")
      .fill("Committee reviewed verified funds and recipient");
    await page.getByRole("button", { name: "Save decision", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  }
  await page.getByLabel("Act as demo reviewer").selectOption("naledi");
  await page.getByRole("button", { name: "Record external payout", exact: true }).click();
  await page.getByLabel("External bank payment reference").fill("REFERENCE".repeat(11));
  await expectDialogFits(page);
});
