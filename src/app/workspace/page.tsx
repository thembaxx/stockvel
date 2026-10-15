import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your secure workspace", robots: { index: false, follow: false } };
export default async function WorkspaceHome() {
  const result = await auth.getSession();
  if (!result.data?.user) redirect("/auth/sign-in");
  const user = result.data.user;
  return (
    <main id="main-content" className="min-h-screen bg-[#f2f7fc] px-6 py-10 text-[#253552]">
      <div className="mx-auto max-w-4xl">
        <nav className="flex items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-semibold tracking-[-.07em]">StokvelOS<span className="text-[#7db3e3]">.</span></Link>
          <Link href="/auth/sign-out" className="rounded-full border border-[#cfdfee] px-4 py-2 text-sm">Sign out</Link>
        </nav>
        <section className="mt-16 rounded-[2rem] border border-[#e0ecf7] bg-white p-8 shadow-sm md:p-12">
          <span className="rounded-full bg-[#e4f2ff] px-4 py-2 text-xs text-[#385e85]">Private workspace</span>
          <h1 className="mt-8 text-4xl font-light tracking-[-.06em] md:text-6xl">
            Welcome, {user.name || "there"}.
          </h1>
          <p className="mt-4 text-[#687993]">{user.email}</p>
          <div className="mt-10 rounded-3xl bg-[#eff5fb] p-6 md:p-8">
            <h2 className="text-xl font-medium">Your account is protected.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#596d88]">
              Your sign-in session is checked on the server. Society creation, member invitations and real financial records will become available only after the database roles and onboarding policies are deployed and verified.
            </p>
            <p className="mt-4 text-xs text-[#596d88]">
              Please do not enter real member or banking information in the public demo.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/demo" className="rounded-full bg-[#293b70] px-6 py-3 text-sm font-medium text-white">Explore fictional demo →</Link>
            <Link href="/auth/sign-out" className="rounded-full border border-[#c6d3e6] px-6 py-3 text-sm">Manage sign-in</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
