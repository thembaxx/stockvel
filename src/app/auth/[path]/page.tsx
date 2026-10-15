import { AuthView } from "@neondatabase/auth-ui";
import { authViewPaths } from "@neondatabase/auth-ui/server";

export const dynamic = "force-dynamic";
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}
export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;
  return (
    <main id="main-content" className="mx-auto flex min-h-[75vh] w-full max-w-lg flex-col justify-center px-4 py-12">
      <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[.2em] text-[#6a85a7]">Welcome to your community</p>
      <AuthView path={path} />
    </main>
  );
}
