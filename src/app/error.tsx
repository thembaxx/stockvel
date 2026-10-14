"use client";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { Brand } from "@/components/brand";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main-content" className="loading-screen">
      <Brand />
      <h1>Let’s get you back on track.</h1>
      <p>We couldn’t load this view. Your connection may have changed.</p>
      <button className="button button-primary" onClick={reset}>
        Try again
      </button>
      <a className="text-link" href="/demo">
        Return to your workspace <ArrowUpRightIcon size={17} />
      </a>
    </main>
  );
}
