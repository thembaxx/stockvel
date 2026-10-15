import { auth } from "@/lib/auth/server";

// Never intercept the public marketing site, demo, login pages, or API assets.
// Server components and API handlers independently verify the session.
export default auth.middleware({ loginUrl: "/auth/sign-in" });
export const config = { matcher: ["/workspace/:path*"] };
