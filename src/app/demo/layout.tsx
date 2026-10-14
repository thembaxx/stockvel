import { DemoProvider } from "@/features/demo/context";
export const metadata = {
  title: "Your society dashboard",
  robots: { index: false, follow: false },
};
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoProvider>{children}</DemoProvider>;
}
