import { describe, expect, it, afterEach } from "vitest";
import {
  DEFAULT_SITE_URL,
  isIndexable,
  jsonLd,
  publicPageMetadata,
  publicStructuredData,
  resolveSiteUrl,
  searchRobots,
} from "@/lib/site";
import { llmsIndex, privacyMarkdown, productMarkdown } from "@/lib/public-content";
import sitemap from "@/app/sitemap";

const originalEnvironment = process.env.VERCEL_ENV;
const originalOrigin = process.env.SITE_URL;
afterEach(() => {
  if (originalEnvironment === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalEnvironment;
  if (originalOrigin === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = originalOrigin;
});

describe("public discovery and crawl boundaries", () => {
  it("uses the production canonical on every public page and supports a custom domain", () => {
    delete process.env.SITE_URL;
    expect(resolveSiteUrl()).toBe(DEFAULT_SITE_URL);
    process.env.SITE_URL = "https://society.example/";
    expect(publicPageMetadata("/").alternates?.canonical).toBe("https://society.example/");
    expect(publicPageMetadata("/privacy").alternates?.canonical).toBe(
      "https://society.example/privacy",
    );
    expect(llmsIndex()).toContain("https://society.example/about.md");
    expect(sitemap().map((entry) => entry.url)).toEqual([
      "https://society.example/",
      "https://society.example/privacy",
    ]);
  });

  it.each([
    "example.com",
    "http://example.com",
    "https://user:password@example.com",
    "https://example.com/private",
    "https://example.com/?key=secret",
    "https://example.com/#demo",
    "javascript:alert(1)",
  ])("rejects an invalid canonical origin: %s", (origin) => {
    expect(() => resolveSiteUrl(origin)).toThrow("SITE_URL must be an absolute HTTPS origin");
  });

  it("excludes private and demo paths from production crawls and sitemap", () => {
    process.env.VERCEL_ENV = "production";
    const robots = searchRobots();
    expect(robots.rules).toMatchObject({
      disallow: expect.arrayContaining(["/demo", "/societies/", "/api/", "/documents/"]),
    });
    expect(sitemap().map((entry) => new URL(entry.url).pathname)).toEqual(["/", "/privacy"]);
  });

  it.each(["preview", "development"])("prevents indexing of %s deployments", (environment) => {
    process.env.VERCEL_ENV = environment;
    expect(isIndexable()).toBe(false);
    expect(searchRobots().rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(sitemap()).toEqual([]);
  });

  it("describes the prototype truthfully without invented offers, ratings or private records", () => {
    const data = publicStructuredData();
    expect(data["@graph"][1].description).toContain("prototype");
    expect(JSON.stringify(data)).not.toMatch(/aggregateRating|offers|bankAccount/);
    const index = llmsIndex();
    expect(index).toMatch(/^# StokvelOS\n\n>/);
    expect(index).toContain("does not hold or transfer money");
    expect(index).toContain("Pricing is hypothetical");
    expect(index).not.toMatch(/\/demo|societies\/|Ayanda|Naledi/);
    expect(productMarkdown()).toContain("There is no live checkout");
    expect(privacyMarkdown()).toContain("Do not enter real identity");
  });

  it("escapes HTML delimiters before embedding structured data in a script", () => {
    const encoded = jsonLd({ text: "</script><script>alert(1)</script>" });
    expect(encoded).not.toContain("<");
    expect(JSON.parse(encoded).text).toBe("</script><script>alert(1)</script>");
  });
});
