import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";

describe("unreleased society domain storage", () => {
  it("creates constrained tables with default-deny RLS and no runtime grants", async () => {
    const pg = new PGlite();
    try {
      await pg.exec(await readFile("drizzle/0000_volatile_network.sql", "utf8"));
      await pg.exec(await readFile("drizzle/0002_domain_storage.sql", "utf8"));
      const { rows } = await pg.query<{ relname: string; relrowsecurity: boolean }>(
        "select relname, relrowsecurity from pg_class where relname in ('society_invitations','burial_claims','society_documents','billing_subscriptions','billing_webhook_events') order by relname",
      );
      expect(rows).toHaveLength(5);
      expect(rows.every(row => row.relrowsecurity)).toBe(true);
      await pg.exec("CREATE ROLE stokvel_app;");
      await pg.exec("GRANT USAGE ON SCHEMA public TO stokvel_app;");
      await pg.exec("SET ROLE stokvel_app;");
      await expect(pg.exec("SELECT * FROM society_invitations")).rejects.toThrow(/permission denied/);
    } finally {
      await pg.close();
    }
  });
});
