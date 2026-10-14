import type { Metadata, MetadataRoute } from "next";

// This is the public production URL recorded in the repository settings.
// Set SITE_URL when moving to a custom domain; never derive canonicals from request headers.
export const DEFAULT_SITE_URL = "https://stockvel-seven.vercel.app";
export const site = {
  name: "StokvelOS",
  tagline: "Good things grow together.",
  title: "Stokvel & Burial Society Management | StokvelOS",
  description:
    "Explore StokvelOS, a South African stokvel and burial society management prototype for contribution records, payment verification and committee decisions.",
  locale: "en_ZA",
  language: "en-ZA",
  repository: "https://github.com/thembaxx/stockvel",
} as const;

export function resolveSiteUrl(value = process.env.SITE_URL): string {
  let url: URL;
  try {
    url = new URL(value || DEFAULT_SITE_URL);
  } catch {
    throw new Error("SITE_URL must be an absolute HTTPS origin.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "SITE_URL must be an absolute HTTPS origin without credentials, paths or queries.",
    );
  }
  return url.origin;
}

export function publicUrl(path = "/") {
  return new URL(path, `${resolveSiteUrl()}/`).toString();
}

export function isIndexable(environment = process.env.VERCEL_ENV) {
  return environment !== "preview" && environment !== "development";
}

export const publicPages = ["/", "/privacy"] as const;
export const excludedPaths = ["/demo", "/api/", "/societies/", "/auth/", "/documents/"];

export function searchRobots(environment = process.env.VERCEL_ENV): MetadataRoute.Robots {
  return isIndexable(environment)
    ? {
        rules: { userAgent: "*", allow: "/", disallow: excludedPaths },
        sitemap: publicUrl("/sitemap.xml"),
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}

export function publicPageMetadata(path: (typeof publicPages)[number]): Metadata {
  const privacy = path === "/privacy";
  const title = privacy ? "Prototype privacy" : site.title;
  const description = privacy
    ? "How the StokvelOS prototype handles fictional records, reports, local fonts and sharing. Do not enter real personal or financial information."
    : site.description;
  return {
    ...(privacy ? { title } : {}),
    description,
    alternates: { canonical: publicUrl(path) },
    openGraph: {
      type: "website",
      locale: site.locale,
      siteName: site.name,
      title: privacy ? `${title} · ${site.name}` : title,
      description,
      url: publicUrl(path),
      images: [
        {
          url: publicUrl("/social-preview.png"),
          width: 1200,
          height: 630,
          alt: `${site.name}: ${site.tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: privacy ? `${title} · ${site.name}` : title,
      description,
      images: [publicUrl("/social-preview.png")],
    },
  };
}

export function publicStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": publicUrl("/#website"),
        url: publicUrl(),
        name: site.name,
        description: site.description,
        inLanguage: site.language,
      },
      {
        "@type": "WebApplication",
        "@id": publicUrl("/#application"),
        name: site.name,
        url: publicUrl(),
        description: site.description,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Stokvel and burial society administration",
        operatingSystem: "Web browser",
        inLanguage: site.language,
        featureList: [
          "Contribution recording and bank-evidence verification demonstrations",
          "Rotating payout and burial benefit committee review demonstrations",
          "Sample CSV reports and group-safe WhatsApp sharing",
          "Installable progressive web app with a non-sensitive offline screen",
        ],
        isAccessibleForFree: true,
      },
    ],
  };
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
