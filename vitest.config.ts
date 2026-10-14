import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["tests/**/*.test.ts"], testTimeout: 30000, hookTimeout: 30000 },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
      "server-only": new URL("./tests/empty-server-only.ts", import.meta.url).pathname,
    },
  },
});
