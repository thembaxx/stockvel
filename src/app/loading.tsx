import { Brand } from "@/components/brand";
export default function Loading() {
  return (
    <main id="main-content" className="loading-screen" aria-busy="true">
      <Brand />
      <div className="loading-orbit" aria-hidden="true" />
      <p role="status">Bringing your workspace together…</p>
    </main>
  );
}
