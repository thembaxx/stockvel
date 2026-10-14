import { notFound } from "next/navigation";
import { Suspense } from "react";
import Loading from "../loading";
import { Workspace, type View } from "@/features/demo/workspace";
const views: View[] = [
  "overview",
  "members",
  "contributions",
  "reconciliation",
  "payouts",
  "benefits",
  "approvals",
  "reports",
  "settings",
];
export default async function DemoPage({ params }: { params: Promise<{ view?: string[] }> }) {
  const { view } = await params;
  const screen = view?.[0] ?? "overview";
  if ((view?.length ?? 0) > 1 || !views.includes(screen as View)) notFound();
  return (
    <Suspense fallback={<Loading />}>
      <Workspace view={screen as View} />
    </Suspense>
  );
}
