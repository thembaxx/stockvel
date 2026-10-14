import type { MetadataRoute } from "next";
import { isIndexable, publicPages, publicUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexable()) return [];
  return publicPages.map((path) => ({ url: publicUrl(path) }));
}
