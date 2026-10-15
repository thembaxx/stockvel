import Link from "next/link";
import type { ReactNode } from "react";
import { AuthProviders } from "./providers";
import "@neondatabase/auth-ui/css";

export const metadata = { title: "Your account", robots: { index: false, follow: false } };
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProviders>
      <div className="min-h-screen bg-[#f2f7fc] text-[#293b70]">
        <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-7">
          <Link href="/" className="text-xl font-semibold tracking-[-0.06em]">StokvelOS<span className="text-[#74a8d9]">.</span></Link>
          <Link href="/" className="text-sm underline-offset-4 hover:underline">Back to website</Link>
        </header>
        {children}
        <p className="mx-auto max-w-xl px-6 pb-10 text-center text-xs text-[#65758d]">
          Your society's funds remain in its own bank account. Financial operations are not enabled for new accounts.
        </p>
      </div>
    </AuthProviders>
  );
}
