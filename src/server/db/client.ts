import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
/** Lazy creation keeps the public prototype independent of database credentials. */
export function createDatabase(connection = process.env.DATABASE_URL) {
  if (!connection) throw new Error("DATABASE_URL is required for live financial services.");
  const client = postgres(connection, { max: 5, prepare: false });
  return { db: drizzle(client, { schema }), close: () => client.end() };
}
export type Database = ReturnType<typeof createDatabase>["db"];
