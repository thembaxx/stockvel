"use client";
import { useState, type FormEvent } from "react";
import {
  CheckCircleIcon,
  CopyIcon,
  WhatsappLogoIcon,
  WarningCircleIcon,
  ShareNetworkIcon,
} from "@phosphor-icons/react";
import { Dialog } from "@/components/dialog";
import { useDemo } from "./context";
import { reportPayment, summary } from "./model";
import { parseRand, formatZar, centsToDecimal } from "@/lib/money";

export function RecordPaymentDialog({ onClose }: { onClose: () => void }) {
  const { state, actor, update, notify } = useDemo();
  const [error, setError] = useState("");
  const [key] = useState(() => crypto.randomUUID());
  const [member, setMember] = useState("m10");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      update((s) =>
        reportPayment(s, actor, {
          memberId: member,
          amount: parseRand(String(form.get("amount"))),
          reference: String(form.get("reference")),
          idempotencyKey: key,
        }),
      );
      notify("Payment reported. It will affect balances only after bank verification.");
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Dialog title="Record a payment" onClose={onClose}>
      <p className="muted">
        Record what a member has reported. Verify against bank evidence before it reduces their
        outstanding contribution.
      </p>
      <div className="info-note">
        <WarningCircleIcon size={20} /> Sample data only. Do not enter real financial information.
      </div>
      <form onSubmit={submit} className="form-stack">
        <label>
          Member
          <select value={member} onChange={(e) => setMember(e.target.value)}>
            {state.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          <label>
            Amount (ZAR)
            <input
              name="amount"
              inputMode="decimal"
              placeholder="500.00"
              required
              pattern="[0-9]+(\.[0-9]{1,2})?"
            />
          </label>
          <label>
            Payment date
            <input type="date" defaultValue="2026-10-14" readOnly aria-describedby="date-note" />
          </label>
        </div>
        <small id="date-note" className="muted">
          The prototype uses 14 October 2026 as its fixed reporting date.
        </small>
        <label>
          Payment reference
          <input
            name="reference"
            key={member}
            defaultValue={state.members.find((m) => m.id === member)?.reference}
            required
            maxLength={80}
          />
        </label>
        <p className="form-help">
          Status on save: <span className="status reported">Reported · Unverified</span>
        </p>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button button-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="button button-primary" type="submit">
            Record reported payment
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function ShareDialog({ onClose }: { onClose: () => void }) {
  const { state } = useDemo();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const sums = summary(state);
  const text = `DEMO · ${state.name}\nOctober 2026 society update\n\nVerified contributions: ${formatZar(sums.verified)}\nMonthly collection target: ${formatZar(sums.target)}\nPending verification: ${formatZar(sums.pending)}\n\n${state.type === "rotating" ? `Next scheduled payout: ${formatZar(state.payout.amount)} on 25 October. Subject to committee approval and verified funds.` : "Benefit requests are reviewed privately by the committee under society rules."}\n\nSample data · Prepared with StokvelOS. No member payment details are included.`;
  return (
    <Dialog title="Share a society update" onClose={onClose}>
      <p className="muted">
        This group-safe summary contains aggregate figures. Private member balances and benefit
        evidence are excluded.
      </p>
      <pre className="share-preview">{text}</pre>
      <button
        className="button button-outline native-share-button"
        onClick={async () => {
          try {
            if (navigator.share)
              await navigator.share({ title: `${state.name} · Demo summary`, text });
            else {
              await navigator.clipboard.writeText(text);
              setCopied(true);
            }
          } catch (e) {
            if ((e as Error).name !== "AbortError")
              setError("Native sharing is unavailable. Use Copy summary or WhatsApp below.");
          }
        }}
      >
        <ShareNetworkIcon size={18} /> Share with your device
      </button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="dialog-actions">
        <button
          className="button button-outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
            } catch {
              setError("Copy is unavailable. Select the preview text and copy it manually.");
            }
          }}
        >
          {copied ? <CheckCircleIcon size={18} /> : <CopyIcon size={18} />}{" "}
          {copied ? "Copied" : "Copy summary"}
        </button>
        <a
          className="button button-primary"
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsappLogoIcon size={19} /> Open in WhatsApp
        </a>
      </div>
    </Dialog>
  );
}

/** Quote CSV cells and neutralise formulas before exporting user-controlled text. */
export function csvCell(value: string): string {
  return `"${(/^[=+\-@\t\r]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;
}
export function downloadReport(state: ReturnType<typeof useDemo>["state"]) {
  const sums = summary(state);
  const rows = [
    ["DEMO MONTHLY REPORT", state.name, "October 2026"],
    ["Verified bank ledger balance ZAR", centsToDecimal(sums.funds)],
    ["Verified October contributions ZAR", centsToDecimal(sums.verified)],
    ["Unverified October reported payments ZAR", centsToDecimal(sums.pending)],
    ["Outstanding October obligations ZAR", centsToDecimal(sums.due)],
    [],
    ["Journal reference", "Date", "Account", "Debit ZAR", "Credit ZAR", "Actor"],
  ];
  for (const j of state.journal)
    for (const line of j.lines)
      rows.push([
        j.reference,
        j.date,
        line.account,
        centsToDecimal(line.debit),
        centsToDecimal(line.credit),
        j.actorId,
      ]);
  rows.push(
    [],
    ["Reported payments excluded from journal"],
    ["Reference", "Date", "Amount ZAR", "Status"],
  );
  for (const p of state.payments.filter((p) => p.status !== "verified"))
    rows.push([p.reference, p.date, centsToDecimal(p.amount), p.status]);
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `stokvelos-${state.societyId}-2026-10-demo.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
