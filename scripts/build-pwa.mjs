import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
// Tiny precache: fonts and chunks are cached on use, so installation stays fast on low-data devices.
const precache = [
  "/offline.html",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
];
const buildId = await readFile(".next/BUILD_ID", "utf8");
const template = await readFile("scripts/sw-template.js", "utf8");
const version = createHash("sha256")
  .update(buildId + template)
  .digest("hex")
  .slice(0, 12);
await writeFile(
  "public/sw.js",
  template
    .replace('"__VERSION__"', JSON.stringify(version))
    .replace("__PRECACHE__", JSON.stringify(precache)),
);
console.log(`PWA worker built: ${version} (${precache.length} public assets)`);
