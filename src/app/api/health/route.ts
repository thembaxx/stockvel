import { NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

/**
 * This endpoint deliberately returns no connection strings, schema details,
 * tenant records, query results or database errors.
 */
export async function GET() {
  const connection = process.env.DATABASE_URL;
  if (!connection) {
    return NextResponse.json(
      { status: "unavailable", database: "not_configured" },
      { status: 503, headers },
    );
  }

  const sql = postgres(connection, {
    max: 1,
    connect_timeout: 3,
    idle_timeout: 1,
    max_lifetime: 10,
    prepare: false,
  });
  try {
    await sql`select 1`;
    return NextResponse.json(
      { status: "ok", database: "reachable" },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { status: "unavailable", database: "unreachable" },
      { status: 503, headers },
    );
  } finally {
    await sql.end({ timeout: 1 }).catch(() => undefined);
  }
}
