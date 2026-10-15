import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

// All authentication is verified by Neon's server SDK. We never accept
// user IDs or session/MFA claims from request JSON or headers.
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
    sessionDataTtl: 60,
  },
});
