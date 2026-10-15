import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
export async function GET() {
  try {
    const { data } = await auth.getSession();
    if (!data?.user) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401, headers });
    }
    return NextResponse.json(
      { account: { name: data.user.name, email: data.user.email }, financeEnabled: false },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json({ error: "AUTHENTICATION_UNAVAILABLE" }, { status: 503, headers });
  }
}
