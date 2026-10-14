"use client";
import type { ReactNode } from "react";
import { ArrowUpRightIcon, CalendarBlankIcon } from "@phosphor-icons/react";
import Link from "next/link";
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="page-heading-actions">{children}</div>
    </div>
  );
}
export function PanelHeading({
  title,
  description,
  href,
  label = "View all",
}: {
  title: string;
  description?: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {label}
          <ArrowUpRightIcon size={16} />
        </Link>
      )}
    </div>
  );
}
export function PeriodPill() {
  return (
    <span className="period-pill">
      <CalendarBlankIcon size={17} /> October 2026
    </span>
  );
}
export function Status({ value }: { value: string }) {
  const labels: Record<string, string> = {
    reported: "Reported",
    verified: "Verified",
    rejected: "Rejected",
    reversed: "Reversed",
    scheduled: "Awaiting approval",
    review: "Under review",
    information: "More information",
    approved: "Approved",
    completed: "Payment recorded",
    declined: "Declined",
  };
  return (
    <span className={`status ${value}`}>
      <i />
      {labels[value] ?? value}
    </span>
  );
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
