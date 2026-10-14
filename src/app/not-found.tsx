import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import { Brand } from "@/components/brand";
import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="loading-screen">
      <Brand />
      <h1>Let’s find your way back.</h1>
      <p>This page isn’t available. Your society dashboard is a good place to start.</p>
      <Link className="button button-primary" href="/demo">
        Open your workspace <ArrowUpRightIcon size={17} />
      </Link>
    </main>
  );
}
