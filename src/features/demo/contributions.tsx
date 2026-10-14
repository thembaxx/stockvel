"use client";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowUpRightIcon,
  DownloadSimpleIcon,
  BankIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { Dialog } from "@/components/dialog";
import { useDemo } from "./context";
import {
  verifyPayment,
  rejectPayment,
  reversePayment,
  outstanding,
  summary,
  type Payment,
} from "./model";
import { formatZar } from "@/lib/money";
import { downloadReport } from "./forms";
import { PageHeading, Status, PeriodPill, EmptyState } from "./ui";

export function PaymentReview({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const { state, actor, update, notify } = useDemo();
  const [error, setError] = useState("");
  const [mode, setMode] = useState("verify");
  const member = state.members.find((m) => m.id === payment.memberId)!;
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      if (mode === "reverse")
        update((s) => reversePayment(s, actor, payment.id, String(form.get("reason"))));
      else if (mode === "reject")
        update((s) => rejectPayment(s, actor, payment.id, String(form.get("reason"))));
      else update((s) => verifyPayment(s, actor, payment.id, String(form.get("bankId"))));
      notify(
        mode === "verify"
          ? "Payment verified and posted to the journal. Outstanding balances updated."
          : mode === "reverse"
            ? "Compensating journal entry posted. The original record is preserved."
            : "Payment rejected. The obligation remains outstanding.",
      );
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const banks = state.banks.filter((b) => !b.matchedPaymentId && b.amount === payment.amount);
  return (
    <Dialog title="Payment record" onClose={onClose}>
      <div className="payment-detail-top">
        <span className="avatar mint">{member.initials}</span>
        <div>
          <h3>{member.name}</h3>
          <small>October 2026 · {payment.reference}</small>
        </div>
        <Status value={payment.status} />
      </div>
      <div className="detail-amount">{formatZar(payment.amount)}</div>
      <div className="detail-grid">
        <div>
          <small>Monthly obligation</small>
          <b>{formatZar(state.contribution)}</b>
        </div>
        <div>
          <small>Outstanding now</small>
          <b>{formatZar(outstanding(state, member.id))}</b>
        </div>
      </div>
      {payment.status === "reported" && (
        <div className="info-note">
          <BankIcon size={21} /> This reported payment has not reduced the member’s obligation.
        </div>
      )}
      {payment.evidence && (
        <div className="evidence">
          <ShieldCheckIcon size={21} />
          <div>
            <b>Recorded bank evidence</b>
            <p>{payment.evidence}</p>
          </div>
        </div>
      )}
      {["reported", "verified"].includes(payment.status) && (
        <form className="form-stack" onSubmit={submit}>
          {payment.status === "reported" ? (
            <label>
              Review action
              <select
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                  setError("");
                }}
              >
                <option value="verify">Verify against bank evidence</option>
                <option value="reject">Reject reported payment</option>
              </select>
            </label>
          ) : (
            <label>
              <input
                type="checkbox"
                checked={mode === "reverse"}
                onChange={(e) => setMode(e.target.checked ? "reverse" : "verify")}
              />{" "}
              Request a correction (chairperson only)
            </label>
          )}
          {payment.status === "reported" && mode === "verify" ? (
            <label>
              Bank transaction
              <select name="bankId" required>
                <option value="">Choose matching evidence</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.date} · {b.reference} · {formatZar(b.amount)}
                  </option>
                ))}
              </select>
              {!banks.length && (
                <small>
                  No unmatched transaction for this amount. Import evidence in Reconciliation first.
                </small>
              )}
            </label>
          ) : mode !== "verify" ? (
            <label>
              Recorded reason
              <textarea
                name="reason"
                required
                minLength={5}
                placeholder="Explain this decision for the audit record…"
              />
            </label>
          ) : null}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button type="button" className="button button-outline" onClick={onClose}>
              Close
            </button>
            {(payment.status === "reported" || mode === "reverse") && (
              <button className="button button-primary" type="submit">
                {mode === "verify"
                  ? "Verify & post receipt"
                  : mode === "reverse"
                    ? "Record reversal"
                    : "Reject payment"}
              </button>
            )}
          </div>
        </form>
      )}
    </Dialog>
  );
}

export function Contributions({ onRecord }: { onRecord: () => void }) {
  const { state } = useDemo();
  const params = useSearchParams();
  const [filter, setFilter] = useState(params.get("status") ?? "all");
  const [query, setQuery] = useState("");
  const [review, setReview] = useState<Payment | null>(null);
  const sums = summary(state);
  const payments = state.payments.filter(
    (p) =>
      (filter === "all" || p.status === filter) &&
      `${state.members.find((m) => m.id === p.memberId)?.name} ${p.reference}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="EVERY CONTRIBUTION, CLEARLY RECORDED"
        title="Contribution ledger"
        description="Reported is not verified. Keep every payment and its evidence in view."
      >
        <button
          className="button button-outline button-small"
          onClick={() => downloadReport(state)}
        >
          <DownloadSimpleIcon size={18} /> Export CSV
        </button>
        <button className="button button-primary button-small" onClick={onRecord}>
          <PlusIcon size={18} /> Record payment
        </button>
      </PageHeading>
      <div className="ledger-summary">
        {[
          ["Verified this month", sums.verified],
          ["Pending verification", sums.pending],
          ["Outstanding obligations", sums.due],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <small>{String(label)}</small>
            <strong>{formatZar(value as bigint)}</strong>
          </div>
        ))}
        <PeriodPill />
      </div>
      <section className="panel">
        <div className="table-toolbar">
          <div className="filter-tabs" role="group" aria-label="Payment status filter">
            {["all", "reported", "verified", "reversed"].map((f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                className={filter === f ? "active" : ""}
                onClick={() => setFilter(f)}
              >
                {f === "all"
                  ? "All payments"
                  : f === "reported"
                    ? "To verify"
                    : f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "reported" && <span>{sums.pendingCount}</span>}
              </button>
            ))}
          </div>
          <label className="search-field">
            <MagnifyingGlassIcon size={18} />
            <input
              aria-label="Search contributions"
              placeholder="Search member or reference"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Payment date</th>
                <th>Amount reported</th>
                <th>Still due</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const m = state.members.find((m) => m.id === p.memberId)!;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="member-cell">
                        <span className="avatar mint">{m.initials}</span>
                        <div>
                          <b>{m.name}</b>
                          <small>{p.reference}</small>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{p.date.slice(8)} Oct 2026</td>
                    <td className="amount">{formatZar(p.amount)}</td>
                    <td className="amount">{formatZar(outstanding(state, m.id))}</td>
                    <td>
                      <Status value={p.status} />
                    </td>
                    <td>
                      <button className="table-action" onClick={() => setReview(p)}>
                        {p.status === "reported" ? "Review" : "View record"}
                        <ArrowUpRightIcon size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {payments.length === 0 && (
          <EmptyState
            title="No matching payments"
            description="Try another member name or choose a different status."
          />
        )}
        <div className="table-foot">
          <span>{payments.length} payment records · October 2026</span>
          <span>
            <ShieldCheckIcon size={15} /> Historical obligations retain rule version 2026.1
          </span>
        </div>
      </section>
      {review && <PaymentReview payment={review} onClose={() => setReview(null)} />}
    </>
  );
}
