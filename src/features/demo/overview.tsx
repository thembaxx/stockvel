"use client";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  PlusIcon,
  WhatsappLogoIcon,
  ShieldCheckIcon,
  ClockIcon,
  WarningCircleIcon,
  CalendarDotsIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ReceiptIcon,
} from "@phosphor-icons/react";
import { useDemo } from "./context";
import { summary, outstanding } from "./model";
import { formatZar } from "@/lib/money";
import { PageHeading, PanelHeading, PeriodPill, Status } from "./ui";

export function Overview({ onRecord, onShare }: { onRecord: () => void; onShare: () => void }) {
  const { state, actor } = useDemo();
  const sums = summary(state);
  const percent = Number((sums.verified * 100n + sums.target / 2n) / sums.target);
  const recipient = state.members.find((m) => m.id === state.payout.memberId)!;
  return (
    <>
      <PageHeading
        eyebrow={`${state.name} · OVERVIEW`}
        title={`A good day to grow together, ${actor.name.split(" ")[0]}.`}
        description="Your contributions, records and next shared decision in one place."
      >
        <PeriodPill />
        <button className="button button-primary button-small" onClick={onRecord}>
          <PlusIcon size={18} /> Record payment
        </button>
      </PageHeading>
      <div className="dashboard-stats">
        <article className="stat-card stat-main">
          <div className="flex-between">
            <span>Verified available funds</span>
            <ShieldCheckIcon size={22} weight="light" />
          </div>
          <strong>{formatZar(sums.funds)}</strong>
          <small>
            <span className="tiny-dot" /> Recorded in your society’s bank account
          </small>
        </article>
        <article className="stat-card">
          <div className="flex-between">
            <span>Pending verification</span>
            <span className="stat-icon amber">
              <ClockIcon size={20} />
            </span>
          </div>
          <strong>{formatZar(sums.pending)}</strong>
          <Link href="/demo/contributions?status=reported">
            {sums.pendingCount} reported payments to review <ArrowUpRightIcon size={14} />
          </Link>
        </article>
        <article className="stat-card">
          <div className="flex-between">
            <span>Outstanding contributions</span>
            <span className="stat-icon rose">
              <WarningCircleIcon size={20} />
            </span>
          </div>
          <strong>{formatZar(sums.due)}</strong>
          <small>
            {state.members.filter((m) => outstanding(state, m.id) > 0n).length} members with a
            balance due
          </small>
        </article>
        <article className="stat-card">
          <div className="flex-between">
            <span>
              {state.type === "rotating" ? "Next scheduled payout" : "Benefit under review"}
            </span>
            <span className="stat-icon sage">
              <CalendarDotsIcon size={20} />
            </span>
          </div>
          <strong>
            {formatZar(state.type === "rotating" ? state.payout.amount : state.benefit.amount)}
          </strong>
          <small>
            {state.type === "rotating"
              ? "25 October · Subject to approval"
              : "Request BEN-2026-004 · Rule 2026.1"}
          </small>
        </article>
      </div>
      <div className="dashboard-middle">
        <section className="panel collection-panel">
          <PanelHeading
            title="Monthly contributions"
            description="October contributions · Only verified payments count"
          />
          <div className="collection-body">
            <div className="collection-details">
              <span className="eyebrow">VERIFIED THIS MONTH</span>
              <strong>{formatZar(sums.verified)}</strong>
              <p>of {formatZar(sums.target)} expected</p>
              <div className="chart-legend">
                <span>
                  <i className="legend-verified" />
                  Verified
                </span>
                <span>
                  <i className="legend-pending" />
                  Reported
                </span>
                <span>
                  <i className="legend-due" />
                  Unreported due
                </span>
              </div>
              <Link href="/demo/contributions" className="text-link">
                Open contribution ledger <ArrowRightIcon size={16} />
              </Link>
            </div>
            <div
              className="donut"
              role="img"
              aria-label={`${percent}% of monthly obligations verified`}
              style={
                {
                  "--verified": `${percent}%`,
                  "--reported": `${Number(((sums.verified + sums.pending) * 100n) / sums.target)}%`,
                } as CSSProperties
              }
            >
              <div>
                <strong>
                  {percent}
                  <span>%</span>
                </strong>
                <small>of target verified</small>
              </div>
            </div>
          </div>
          <div className="collection-foot">
            <span>
              <CheckCircleIcon size={17} />{" "}
              {state.payments.filter((p) => p.status === "verified").length} payments verified
            </span>
            <span>Due date: 5 October</span>
          </div>
        </section>
        <section className="next-action-card">
          <div className="flex-between">
            <span className="eyebrow">YOUR NEXT SHARED DECISION</span>
            <ArrowUpRightIcon size={20} />
          </div>
          <h2>
            {state.type === "rotating" ? "Next payout to review" : "Benefit request to review"}
          </h2>
          <p>
            {state.type === "rotating"
              ? "Keep the next payout moving with your committee."
              : "Review the request under your society’s constitution."}
          </p>
          <div className="next-recipient">
            <span className="avatar cream">
              {state.type === "rotating" ? recipient.initials : "LM"}
            </span>
            <div>
              <b>{state.type === "rotating" ? recipient.name : "Lerato Mokoena"}</b>
              <small>
                {state.type === "rotating"
                  ? "October recipient · Position 10 of 12"
                  : "Request BEN-2026-004 · Parent benefit"}
              </small>
            </div>
          </div>
          <div className="next-action-status">
            <span>
              {state.type === "rotating"
                ? `${state.payout.decisions.length} of 2 approvals`
                : "Human review required"}
            </span>
            <Status
              value={state.type === "rotating" ? state.payout.status : state.benefit.status}
            />
          </div>
          <Link
            className="button button-light"
            href={state.type === "rotating" ? "/demo/payouts" : "/demo/benefits"}
          >
            Review {state.type === "rotating" ? "next payout" : "benefit request"}{" "}
            <ArrowUpRightIcon size={17} />
          </Link>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="panel recent-contributions">
          <PanelHeading
            title="Recent contributions"
            description="A clear view of what’s reported and what’s verified"
            href="/demo/contributions"
          />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...state.payments.filter((p) => p.status === "reported"),
                  ...state.payments
                    .filter((p) => p.status !== "reported")
                    .slice()
                    .reverse(),
                ]
                  .slice(0, 5)
                  .map((p) => {
                    const m = state.members.find((m) => m.id === p.memberId)!;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="member-cell">
                            <span
                              className={`avatar ${p.status === "reported" ? "cream" : "mint"}`}
                            >
                              {m.initials}
                            </span>
                            <div>
                              <b>{m.name}</b>
                              <small>{p.reference} · October</small>
                            </div>
                          </div>
                        </td>
                        <td className="recent-payment">
                          <span className="amount">{formatZar(p.amount)}</span>
                          <Status value={p.status} />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel activity-panel">
          <PanelHeading title="Recent activity" href="/demo/approvals" label="Audit trail" />
          <div className="activity-list">
            {state.audit.slice(0, 3).map((a, i) => (
              <div className="activity-item" key={a.id}>
                <span className={`activity-icon ${i === 0 ? "mint" : "cream"}`}>
                  <ReceiptIcon size={17} />
                </span>
                <div>
                  <b>{a.action}</b>
                  <p>{a.actor}</p>
                  <small>{a.time}</small>
                </div>
              </div>
            ))}
          </div>
          <button className="share-action" onClick={onShare}>
            <span className="stat-icon mint">
              <WhatsappLogoIcon size={21} />
            </span>
            <span>
              <b>Keep your people in the picture.</b>
              <small>Share a group-safe monthly update</small>
            </span>
            <ArrowUpRightIcon size={18} />
          </button>
        </section>
      </div>
    </>
  );
}
