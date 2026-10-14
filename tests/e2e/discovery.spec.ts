import { test, expect } from "@playwright/test";

test("public pages expose unique canonicals and accessible social previews", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Stokvel & Burial Society Management | StokvelOS");
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical).toMatch(/^https:\/\//);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical!);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  const image = await request.get("/social-preview.png");
  expect(image.ok()).toBe(true);
  expect(image.headers()["content-type"]).toContain("image/png");
  const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
  expect(graph["@graph"][1].description).toContain("prototype");
  await page.goto("/privacy");
  await expect(page).toHaveTitle("Prototype privacy · StokvelOS");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    new URL("/privacy", canonical!).toString(),
  );
  await page.goto("/demo/contributions");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  expect((await request.get("/demo")).headers()["x-robots-tag"]).toBe("noindex, nofollow");
});

test("robots, sitemap and LLM index expose only public, reachable sources", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain("Disallow: /demo");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).not.toContain("/demo");
  const index = await request.get("/llms.txt");
  expect(index.ok()).toBe(true);
  expect(index.headers()["content-type"]).toContain("text/plain");
  const content = await index.text();
  expect(content).toContain("does not hold or transfer money");
  for (const path of ["/about.md", "/privacy.md"]) {
    expect(content).toContain(path);
    const document = await request.get(path);
    expect(document.ok()).toBe(true);
    expect(document.headers()["content-type"]).toContain("text/markdown");
  }
  const alias = await request.get("/llm.txt", { maxRedirects: 0 });
  expect(alias.status()).toBe(308);
  expect(alias.headers().location).toBe("/llms.txt");
});
