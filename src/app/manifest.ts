import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "StokvelOS",
    short_name: "StokvelOS",
    description: "Community money. Clearly recorded.",
    start_url: "/demo?source=installed",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#F7F9FC",
    theme_color: "#F7F9FC",
    lang: "en-ZA",
    categories: ["finance", "productivity"],
    orientation: "any",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Contributions",
        short_name: "Contributions",
        url: "/demo/contributions",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Society overview",
        short_name: "Overview",
        url: "/demo",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
