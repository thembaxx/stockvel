"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  DownloadSimpleIcon,
  UploadSimpleIcon,
  BankIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  LockKeyIcon,
  CalendarDotsIcon,
  HeartIcon,
  PrinterIcon,
  WhatsappLogoIcon,
  InfoIcon,
  WarningCircleIcon,
  CheckIcon,
  CopyIcon,
} from "@phosphor-icons/react";
import { Dialog } from "@/components/dialog";
import { useDemo } from "./context";
import {
  summary,
  outstanding,
  decidePayout,
  completePayout,
  decideBenefit,
  completeBenefit,
  coverageEligible,
  type Member,
  type Decision,
} from "./model";
import { formatZar } from "@/lib/money";
import { parseBankCsv } from "@/lib/bank-csv";
import { PageHeading, PanelHeading, Status, PeriodPill, EmptyState } from "./ui";
import { PaymentReview } from "./contributions";
import { downloadReport, ShareDialog } from "./forms";
import { InstallButton, usePwa } from "@/components/pwa-support";

export function Members() {
  const { state } = useDemo();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [invite, setInvite] = useState(false);
  const [preview, setPreview] = useState("");
  const members = state.members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <PageHeading
        eyebrow="THE PEOPLE BEHIND YOUR SOCIETY"
        title="Stronger, together."
        description={`${state.members.length} active members · Membership history stays with your society.`}
      >
        <button className="button button-primary button-small" onClick={() => setInvite(true)}>
          <UserPlusIcon size={18} /> Preview an invitation
        </button>
      </PageHeading>
      <div className="ledger-summary">
        <div>
          <small>Active members</small>
          <strong>{state.members.length}</strong>
        </div>
        <div>
          <small>Committee members</small>
          <strong>3</strong>
        </div>
        <div>
          <small>Monthly contribution</small>
          <strong>{formatZar(state.contribution)}</strong>
        </div>
        <PeriodPill />
      </div>
      <section className="panel">
        <div className="table-toolbar">
          <span className="muted">Your membership register</span>
          <label className="search-field">
            <MagnifyingGlassIcon size={18} />
            <input
              aria-label="Search members"
              placeholder="Find a member"
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
                <th>Society role</th>
                <th>Joined</th>
                <th>Payment reference</th>
                <th>October due</th>
                <th>Statement</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="member-cell">
                      <span className="avatar mint">{m.initials}</span>
                      <b>{m.name}</b>
                    </div>
                  </td>
                  <td className="role-cell">{m.role}</td>
                  <td className="muted">01 Jan 2026</td>
                  <td className="reference">{m.reference}</td>
                  <td className="amount">{formatZar(outstanding(state, m.id))}</td>
                  <td>
                    <button className="table-action" onClick={() => setSelected(m)}>
                      View statement <ArrowUpRightIcon size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!members.length && (
          <EmptyState
            title="No members found"
            description="Try searching by first name or surname."
          />
        )}
      </section>
      {selected && (
        <Dialog title={`${selected.name} · Statement`} onClose={() => setSelected(null)}>
          <p className="muted">Sample private member statement · October 2026</p>
          <div className="detail-grid">
            <div>
              <small>Monthly obligation</small>
              <b>{formatZar(state.contribution)}</b>
            </div>
            <div>
              <small>Still outstanding</small>
              <b>{formatZar(outstanding(state, selected.id))}</b>
            </div>
          </div>
          <p className="info-note">
            <LockKeyIcon size={21} /> In production, members can only access their own detailed
            payment information.
          </p>
          {state.payments
            .filter((p) => p.memberId === selected.id)
            .map((p) => (
              <div className="statement-row" key={p.id}>
                <div>
                  <b>{formatZar(p.amount)}</b>
                  <small>
                    {p.reference} · {p.date}
                  </small>
                </div>
                <Status value={p.status} />
              </div>
            ))}
          {!state.payments.some((p) => p.memberId === selected.id) && (
            <EmptyState
              title="No payment reported yet"
              description={`Use ${selected.reference} as the society payment reference.`}
            />
          )}
          <div className="dialog-actions">
            <button className="button button-primary" onClick={() => setSelected(null)}>
              Done
            </button>
          </div>
        </Dialog>
      )}
      {invite && (
        <Dialog
          title="Preview a member invitation"
          onClose={() => {
            setInvite(false);
            setPreview("");
          }}
        >
          <p className="muted">
            An invitation helps a member join the right society. No invitation is sent by this
            prototype.
          </p>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setPreview(
                `Hello ${form.get("name")}, you’re invited to join ${state.name}. When secure registration is available, you’ll authenticate before accessing private society records. This is a demonstration invitation; no join link has been created.`,
              );
            }}
          >
            <label>
              Member’s first name
              <input name="name" required placeholder="e.g. Lindiwe" maxLength={60} />
            </label>
            <button className="button button-primary" type="submit">
              Preview invitation <ArrowRightIcon size={17} />
            </button>
          </form>
          {preview && <div className="invite-preview">{preview}</div>}
        </Dialog>
      )}
    </>
  );
}

export function Reconciliation() {
  const { state, actor, update, notify } = useDemo();
  const [importing, setImporting] = useState(false);
  const [csv, setCsv] = useState("id,date,reference,amount\nbank-oct-12,2026-10-12,UBU-012,500.00");
  const [error, setError] = useState("");
  const [review, setReview] = useState<string | null>(null);
  const unmatched = state.banks.filter((b) => !b.matchedPaymentId);
  const payment = state.payments.find((p) => p.id === review);
  function importRows(e: FormEvent) {
    e.preventDefault();
    try {
      if (!["treasurer", "chairperson"].includes(actor.role))
        throw new Error("A treasurer or chairperson must import bank evidence.");
      const rows = parseBankCsv(csv);
      for (const row of rows) {
        const existing = state.banks.find((b) => b.id === row.id);
        if (
          existing &&
          (existing.amount !== row.amount ||
            existing.date !== row.date ||
            existing.reference !== row.reference)
        )
          throw new Error("A transaction ID is already used with different details.");
      }
      const added = rows.filter((row) => !state.banks.some((b) => b.id === row.id));
      update((s) => ({
        ...s,
        banks: [...s.banks, ...added],
        audit: [
          {
            id: crypto.randomUUID(),
            actor: actor.name,
            action: "Bank CSV imported",
            detail: `${added.length} new transactions · not yet matched`,
            time: "14 Oct, just now",
          },
          ...s.audit,
        ],
      }));
      notify(`${added.length} new bank transactions imported. Importing does not verify payments.`);
      setImporting(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="BANK EVIDENCE, NOT GUESSWORK"
        title="Bring the records together."
        description="Match reported payments to your statement. Importing alone never changes verified funds."
      >
        <button className="button button-primary button-small" onClick={() => setImporting(true)}>
          <UploadSimpleIcon size={18} /> Import bank CSV
        </button>
      </PageHeading>
      <div className="ledger-summary">
        <div>
          <small>Statement transactions</small>
          <strong>{state.banks.length}</strong>
        </div>
        <div>
          <small>Matched & verified</small>
          <strong>{state.banks.length - unmatched.length}</strong>
        </div>
        <div>
          <small>Awaiting reconciliation</small>
          <strong>{unmatched.length}</strong>
        </div>
        <PeriodPill />
      </div>
      <div className="info-note">
        <InfoIcon size={21} /> Bank statements remain the source of truth for actual funds. Each
        transaction can be matched once.
      </div>
      <section className="panel">
        <PanelHeading
          title="Statement transactions"
          description="October 2026 · Demonstration bank evidence"
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bank transaction</th>
                <th>Date</th>
                <th>Reference</th>
                <th>Credit amount</th>
                <th>Reconciliation</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {state.banks
                .slice()
                .reverse()
                .map((b) => {
                  const p = state.payments.find(
                    (p) =>
                      p.status === "reported" &&
                      p.reference === b.reference &&
                      p.amount === b.amount,
                  );
                  return (
                    <tr key={b.id}>
                      <td>
                        <div className="member-cell">
                          <span className="stat-icon mint">
                            <BankIcon size={19} />
                          </span>
                          <b>{b.id}</b>
                        </div>
                      </td>
                      <td className="muted">{b.date}</td>
                      <td className="reference">{b.reference}</td>
                      <td className="amount">{formatZar(b.amount)}</td>
                      <td>
                        <Status value={b.matchedPaymentId ? "verified" : "reported"} />
                      </td>
                      <td>
                        {p && !b.matchedPaymentId ? (
                          <button className="table-action" onClick={() => setReview(p.id)}>
                            Review match <ArrowUpRightIcon size={15} />
                          </button>
                        ) : (
                          <span className="muted">
                            {b.matchedPaymentId ? "Evidence recorded" : "No matching receipt"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
      {payment && <PaymentReview payment={payment} onClose={() => setReview(null)} />}{" "}
      {importing && (
        <Dialog title="Import bank transactions" onClose={() => setImporting(false)}>
          <p className="muted">
            The demonstration accepts a standardised incoming-payment CSV. No files are uploaded to
            a server.
          </p>
          <div className="info-note">
            <WarningCircleIcon size={20} /> Sample records only. Do not paste a real bank statement.
          </div>
          <form className="form-stack" onSubmit={importRows}>
            <label>
              Choose a sample CSV
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1_000_000) {
                    setError("Maximum file size is 1 MB.");
                    return;
                  }
                  setCsv(await file.text());
                }}
              />
            </label>
            <label>
              CSV preview
              <textarea
                className="csv-input"
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
                required
                rows={6}
              />
            </label>
            <small>
              Required columns: id,date,reference,amount. Dates use YYYY-MM-DD; amounts use 500.00.
              Duplicate transaction IDs are safely ignored unless their details conflict.
            </small>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="dialog-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setImporting(false)}
              >
                Cancel
              </button>
              <button className="button button-primary" type="submit">
                Review & import
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}

function DecisionDialog({
  kind,
  onClose,
}: {
  kind: "payout" | "benefit" | "payout-payment" | "benefit-payment";
  onClose: () => void;
}) {
  const { state, actor, update, notify } = useDemo();
  const [error, setError] = useState("");
  const [decision, setDecision] = useState<Decision["decision"]>("approve");
  const disbursement = kind.endsWith("payment");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      if (kind === "payout") update((s) => decidePayout(s, actor, String(f.get("reason"))));
      else if (kind === "benefit")
        update((s) => decideBenefit(s, actor, decision, String(f.get("reason"))));
      else if (kind === "payout-payment")
        update((s) => completePayout(s, actor, String(f.get("evidence"))));
      else update((s) => completeBenefit(s, actor, String(f.get("evidence"))));
      notify(
        disbursement
          ? "External payment recorded with evidence. The journal has been updated."
          : "Decision recorded. The audit history has been preserved.",
      );
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Dialog
      title={disbursement ? "Record external payment" : "Record a committee decision"}
      onClose={onClose}
    >
      <p className="muted">
        {disbursement
          ? "Confirm an external payment that has already happened in your society’s bank account. StokvelOS does not transfer money."
          : "Two distinct authorised reviewers are required. Holding multiple roles does not count as multiple people."}
      </p>
      <div className="reviewer-note">
        <span className="avatar sage">
          {actor.name
            .split(" ")
            .map((s) => s[0])
            .join("")}
        </span>
        <div>
          <b>{actor.name}</b>
          <small>Demo reviewer · {actor.role}</small>
        </div>
      </div>
      <form className="form-stack" onSubmit={submit}>
        {kind === "benefit" && (
          <label>
            Decision
            <select
              aria-label="Committee decision"
              value={decision}
              onChange={(e) => setDecision(e.target.value as Decision["decision"])}
            >
              <option value="approve">Approve request</option>
              <option value="information">Request more information</option>
              <option value="decline">Decline request</option>
            </select>
          </label>
        )}
        {disbursement ? (
          <label>
            External bank payment reference
            <input
              name="evidence"
              required
              minLength={5}
              maxLength={100}
              placeholder="e.g. DEMO-EFT-OCT-025"
            />
          </label>
        ) : (
          <label>
            Decision reason
            <textarea
              name="reason"
              required
              minLength={5}
              maxLength={500}
              placeholder="Record the reason for this decision…"
            />
          </label>
        )}
        <small>
          {kind.startsWith("benefit")
            ? `Applicable rule version: ${state.benefit.ruleVersion}`
            : `Rotation locked under constitution ${state.ruleVersion}`}
        </small>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button button-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="button button-primary" type="submit">
            {disbursement ? "Record external payment" : "Save decision"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function Payouts() {
  const { state } = useDemo();
  const [decision, setDecision] = useState<"payout" | "payout-payment" | null>(null);
  const sums = summary(state);
  const m = state.members.find((m) => m.id === state.payout.memberId)!;
  return (
    <>
      <PageHeading
        eyebrow="A SHARED GOAL. EVERYONE’S TURN."
        title="Your agreed payout rotation."
        description="The rotation is locked under constitution 2026.1. Arrears never silently reorder members."
      >
        <span className="period-pill">
          <LockKeyIcon size={17} /> Rotation locked
        </span>
      </PageHeading>
      <div className="payout-layout">
        <section className="panel payout-summary">
          <PanelHeading
            title="Next scheduled payout"
            description="Position 10 of 12 · 25 October 2026"
          />
          <div className="payout-member">
            <span className="avatar mint">{m.initials}</span>
            <div>
              <h2>{m.name}</h2>
              <p>October recipient</p>
            </div>
            <Status value={state.payout.status} />
          </div>
          <div className="payout-amount">
            {formatZar(state.payout.amount)}
            <small>Nominal payout · 12 members × R 500.00</small>
          </div>
          <div className="detail-grid">
            <div>
              <small>Verified available bank funds</small>
              <b>{formatZar(sums.funds)}</b>
            </div>
            <div>
              <small>October contribution shortfall</small>
              <b>{formatZar(sums.due)}</b>
            </div>
          </div>
          <div className="info-note">
            <InfoIcon size={20} /> Available funds include R 6 200.00 of reconciled prior-cycle
            carryover. The scheduled amount and current-cycle collection are different measures.
          </div>
          <div className="approval-progress">
            <span>Independent committee approvals</span>
            <b>{state.payout.decisions.length} / 2</b>
          </div>
          <div className="approval-bars">
            <span className={state.payout.decisions.length > 0 ? "filled" : ""} />
            <span className={state.payout.decisions.length > 1 ? "filled" : ""} />
          </div>
          {state.payout.decisions.map((d) => (
            <div className="decision-record" key={d.actorId}>
              <CheckCircleIcon size={19} />
              <div>
                <b>{d.name}</b>
                <p>{d.reason}</p>
              </div>
            </div>
          ))}
          <div className="payout-action">
            {state.payout.status === "scheduled" ? (
              <button className="button button-primary" onClick={() => setDecision("payout")}>
                Review & approve <ArrowUpRightIcon size={17} />
              </button>
            ) : state.payout.status === "approved" ? (
              <button
                className="button button-primary"
                onClick={() => setDecision("payout-payment")}
              >
                Record external payout <ArrowUpRightIcon size={17} />
              </button>
            ) : (
              <div className="success-note">
                <CheckCircleIcon size={22} /> External payment recorded: {state.payout.evidence}
              </div>
            )}
            <small>
              Prepared by Naledi Molefe. Review as Sipho and Thandi using the demo reviewer switch.
            </small>
          </div>
        </section>
        <section className="payout-help">
          <CalendarDotsIcon size={35} weight="light" />
          <h2>
            A payout is a process.
            <br />
            <em>Not just a date.</em>
          </h2>
          {[
            "Review the scheduled recipient and amount",
            "Check verified funds and any shortfall",
            "Obtain two independent committee approvals",
            "Record the external payment and evidence",
          ].map((text, i) => (
            <div key={text}>
              <span>{i + 1}</span>
              <p>{text}</p>
            </div>
          ))}
        </section>
      </div>
      <section className="panel">
        <PanelHeading
          title="The next turns"
          description="Fixed rotation · Changes require a versioned committee decision"
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Recipient</th>
                <th>Scheduled date</th>
                <th>Nominal payout</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {[state.members[1], state.members[3], state.members[2]].map((member, i) => (
                <tr key={member.id}>
                  <td className="muted">{10 + i} / 12</td>
                  <td>
                    <div className="member-cell">
                      <span className="avatar mint">{member.initials}</span>
                      <b>{member.name}</b>
                    </div>
                  </td>
                  <td>25 {["October", "November", "December"][i]} 2026</td>
                  <td className="amount">{formatZar(state.payout.amount)}</td>
                  <td>
                    {i === 0 ? (
                      <Status value={state.payout.status} />
                    ) : (
                      <span className="status upcoming">Upcoming</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {decision && <DecisionDialog kind={decision} onClose={() => setDecision(null)} />}
    </>
  );
}

export function Benefits() {
  const { state } = useDemo();
  const [decision, setDecision] = useState<"benefit" | "benefit-payment" | null>(null);
  const request = state.benefit;
  const member = state.members.find((m) => m.id === request.memberId)!;
  const eligible = coverageEligible(request.coveredSince, request.eventDate, request.waitingMonths);
  return (
    <>
      <PageHeading
        eyebrow="CARE, WITH A CLEAR PROCESS"
        title="Benefit request review"
        description="Your society’s rules guide the review. Authorised people make the decision."
      >
        <span className="period-pill">
          <HeartIcon size={17} /> {request.id}
        </span>
      </PageHeading>
      <div className="benefit-layout">
        <section className="panel">
          <PanelHeading
            title="Parent benefit request"
            description={`Created 12 October 2026 · Rule version ${request.ruleVersion}`}
          />
          <div className="payout-member">
            <span className="avatar cream">{member.initials}</span>
            <div>
              <h2>{member.name}</h2>
              <p>Requesting member</p>
            </div>
            <Status value={request.status} />
          </div>
          <div className="detail-grid">
            <div>
              <small>Covered person</small>
              <b>{request.coveredPerson}</b>
            </div>
            <div>
              <small>Relationship</small>
              <b>{request.relationship}</b>
            </div>
            <div>
              <small>Coverage started</small>
              <b>01 January 2026</b>
            </div>
            <div>
              <small>Event date</small>
              <b>10 October 2026</b>
            </div>
          </div>
          <div className="payout-amount">
            {formatZar(request.amount)}
            <small>Requested benefit · Not a guaranteed payment</small>
          </div>
          <div className="private-evidence">
            <LockKeyIcon size={24} />
            <div>
              <b>Supporting evidence is private.</b>
              <p>
                This prototype stores no identity or death-related documents. Production evidence
                requires authorised access, malware checks and retention controls.
              </p>
            </div>
          </div>
          <div className="payout-action">
            {["review", "information"].includes(request.status) ? (
              <button className="button button-primary" onClick={() => setDecision("benefit")}>
                Review & record decision <ArrowUpRightIcon size={17} />
              </button>
            ) : request.status === "approved" ? (
              <button
                className="button button-primary"
                onClick={() => setDecision("benefit-payment")}
              >
                Record external benefit payment <ArrowUpRightIcon size={17} />
              </button>
            ) : (
              <p className="info-note">
                {request.status === "completed"
                  ? `External payment recorded: ${request.evidence}`
                  : "Request declined. The decision reason and rule version are retained below."}
              </p>
            )}
            <small>
              Prepared by Thandi Nkosi. Review as Sipho and Naledi using the demo reviewer switch.
            </small>
          </div>
        </section>
        <div>
          <section className="panel eligibility-panel">
            <PanelHeading
              title="Eligibility review"
              description="Checks assist the committee. They do not make an automatic decision."
            />
            {[
              { t: "Active membership", d: "Member joined 01 January 2026", ok: true },
              { t: "Covered relationship", d: "Parent registered under rule 2026.1", ok: true },
              {
                t: "Waiting period",
                d: "6 calendar months · completed 01 July 2026",
                ok: eligible,
              },
              {
                t: "Contribution standing",
                d:
                  outstanding(state, member.id) === 0n
                    ? "October contribution verified"
                    : "Outstanding contribution requires review",
                ok: outstanding(state, member.id) === 0n,
              },
            ].map(({ t, d, ok }) => (
              <div className="eligibility-item" key={t}>
                {ok ? <CheckCircleIcon size={21} /> : <WarningCircleIcon size={21} />}
                <div>
                  <b>{t}</b>
                  <small>{d}</small>
                </div>
              </div>
            ))}
            <div className="info-note">
              <ShieldCheckIcon size={20} /> Two independent reviewers required.
            </div>
          </section>
          <section className="panel decision-history">
            <PanelHeading title="Decision history" />
            {request.decisions.length ? (
              request.decisions.map((d, i) => (
                <div className="decision-record" key={i}>
                  <CheckCircleIcon size={19} />
                  <div>
                    <b>
                      {d.name} · {d.decision}
                    </b>
                    <p>{d.reason}</p>
                    <small>Rule {request.ruleVersion}</small>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">
                No decision yet. Every decision and reason will be preserved here.
              </p>
            )}
          </section>
        </div>
      </div>
      {decision && <DecisionDialog kind={decision} onClose={() => setDecision(null)} />}
    </>
  );
}

export function Approvals() {
  const { state } = useDemo();
  const [decision, setDecision] = useState<"payout" | "benefit" | null>(null);
  const status = state.type === "rotating" ? state.payout.status : state.benefit.status;
  const pending = ["scheduled", "review", "information"].includes(status);
  return (
    <>
      <PageHeading
        eyebrow="SHARED DECISIONS. A LASTING RECORD."
        title="Committee approvals"
        description="The proposer cannot approve their own request. Every reviewer must be a distinct authorised person."
      />
      <section className="panel">
        <PanelHeading
          title="Financial decisions"
          description="A record of the request, the reviewers and the outcome"
        />
        <div className="approval-request">
          <span className="stat-icon mint">
            {state.type === "rotating" ? <CalendarDotsIcon size={25} /> : <HeartIcon size={25} />}
          </span>
          <div>
            <h3>
              {state.type === "rotating"
                ? "October rotating payout"
                : "Parent benefit · BEN-2026-004"}
            </h3>
            <p>
              {formatZar(state.type === "rotating" ? state.payout.amount : state.benefit.amount)} ·
              Constitution 2026.1
            </p>
          </div>
          <Status value={status} />
          {pending ? (
            <button
              className="button button-primary button-small"
              onClick={() => setDecision(state.type === "rotating" ? "payout" : "benefit")}
            >
              Review request
            </button>
          ) : (
            <Link
              className="text-link"
              href={state.type === "rotating" ? "/demo/payouts" : "/demo/benefits"}
            >
              View decision <ArrowUpRightIcon size={16} />
            </Link>
          )}
        </div>
      </section>
      <section className="panel audit-panel">
        <PanelHeading
          title="Society audit trail"
          description="Material actions, their actors and recorded reasons"
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor</th>
                <th>Details / reason</th>
                <th>Recorded</th>
              </tr>
            </thead>
            <tbody>
              {state.audit.map((a) => (
                <tr key={a.id}>
                  <td>
                    <b>{a.action}</b>
                  </td>
                  <td>{a.actor}</td>
                  <td className="audit-detail">{a.detail}</td>
                  <td className="muted">{a.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {decision && <DecisionDialog kind={decision} onClose={() => setDecision(null)} />}
    </>
  );
}

export function Reports() {
  const { state } = useDemo();
  const [share, setShare] = useState(false);
  const sums = summary(state);
  const debits = state.journal.reduce((s, j) => s + j.lines.reduce((v, l) => v + l.debit, 0n), 0n);
  const credits = state.journal.reduce(
    (s, j) => s + j.lines.reduce((v, l) => v + l.credit, 0n),
    0n,
  );
  return (
    <>
      <PageHeading
        eyebrow="A REPORT YOUR SOCIETY CAN TRUST"
        title="October, clearly recorded."
        description="Reconciled journal totals, with unverified payments disclosed separately."
      >
        <button className="button button-outline button-small" onClick={() => window.print()}>
          <PrinterIcon size={18} /> Print / Save PDF
        </button>
        <button
          className="button button-primary button-small"
          onClick={() => downloadReport(state)}
        >
          <DownloadSimpleIcon size={18} /> Download CSV
        </button>
      </PageHeading>
      <div className="report-document">
        <div className="report-title">
          <span className="eyebrow">STOKVELOS · DEMONSTRATION REPORT</span>
          <h2>{state.name}</h2>
          <p>October 2026 · ZAR · Africa/Johannesburg</p>
        </div>
        <div className="dashboard-stats report-stats">
          {[
            ["Verified available funds", sums.funds],
            ["Verified contributions", sums.verified],
            ["Unverified reported receipts", sums.pending],
            ["Outstanding obligations", sums.due],
          ].map(([label, amount]) => (
            <article className="stat-card" key={String(label)}>
              <span>{String(label)}</span>
              <strong>{formatZar(amount as bigint)}</strong>
            </article>
          ))}
        </div>
        <section className="panel">
          <PanelHeading
            title="Posted financial journal"
            description="Reported payments are excluded. Corrections appear as compensating entries."
          />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Account</th>
                  <th>Debit</th>
                  <th>Credit</th>
                </tr>
              </thead>
              <tbody>
                {state.journal.flatMap((j) =>
                  j.lines.map((line, i) => (
                    <tr key={`${j.id}-${i}`}>
                      <td className="audit-detail">{i === 0 ? j.reference : "Balancing entry"}</td>
                      <td>{line.account === "bank" ? "Society bank" : "Member fund / clearing"}</td>
                      <td className="amount">{formatZar(line.debit)}</td>
                      <td className="amount">{formatZar(line.credit)}</td>
                    </tr>
                  )),
                )}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={2}>Journal totals</th>
                  <th className="amount">{formatZar(debits)}</th>
                  <th className="amount">{formatZar(credits)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="table-foot">
            <span>
              <CheckCircleIcon size={17} /> Debits equal credits
            </span>
            <span>{state.journal.length} immutable postings</span>
          </div>
        </section>
        <div className="report-disclosures">
          <h3>What these figures include</h3>
          <p>
            Verified funds include R 6 200.00 of reconciled prior-cycle carryover and posted October
            events. {formatZar(sums.pending)} in reported payments remains outside the journal. The
            current obligation shortfall is {formatZar(sums.due)}.
          </p>
          <p>
            Sample data only. This report is not a bank statement, proof of funds or a guarantee of
            benefit entitlement. The chart of accounts requires accounting review before production
            use.
          </p>
        </div>
      </div>
      <button className="button button-outline" onClick={() => setShare(true)}>
        <WhatsappLogoIcon size={19} /> Prepare a group-safe summary
      </button>
      {share && <ShareDialog onClose={() => setShare(false)} />}
    </>
  );
}

export function Settings() {
  const { online, installed } = usePwa();
  const { state, actor, update, reset, notify } = useDemo();
  const [setup, setSetup] = useState(false);
  const [name, setName] = useState(state.name);
  const [step, setStep] = useState(0);
  const [contribution, setContribution] = useState("500.00");
  return (
    <>
      <PageHeading
        eyebrow="YOUR CONSTITUTION. YOUR COMMUNITY."
        title="Society settings"
        description="Rules apply prospectively. Historical obligations keep the version that generated them."
      />
      <div className="settings-grid">
        <section className="panel settings-panel">
          <PanelHeading title="Society profile" />
          <dl>
            <dt>Society name</dt>
            <dd>{state.name}</dd>
            <dt>Society type</dt>
            <dd>{state.type === "rotating" ? "Rotating savings stokvel" : "Burial society"}</dd>
            <dt>Currency / timezone</dt>
            <dd>ZAR · Africa/Johannesburg</dd>
            <dt>Current contribution</dt>
            <dd>{formatZar(state.contribution)} · Due on day 5</dd>
            <dt>Active constitution</dt>
            <dd>Version {state.ruleVersion} · Effective 1 January 2026</dd>
          </dl>
          <button
            className="button button-outline"
            onClick={() => {
              setSetup(true);
              setStep(0);
              setName(state.name);
            }}
          >
            Preview onboarding & rules <ArrowUpRightIcon size={17} />
          </button>
        </section>
        <section className="panel settings-panel">
          <PanelHeading title="Governance & access" />
          <div className="eligibility-item">
            <ShieldCheckIcon size={22} />
            <div>
              <b>Two distinct approvers</b>
              <small>The proposer cannot self-approve a payout.</small>
            </div>
          </div>
          <div className="eligibility-item">
            <LockKeyIcon size={22} />
            <div>
              <b>Private evidence</b>
              <small>Benefit documents are excluded from shared summaries.</small>
            </div>
          </div>
          <div className="info-note">
            <InfoIcon size={20} /> This demo has no real authentication. The reviewer switch
            demonstrates role rules using fictional identities.
          </div>
          <button className="button button-outline" onClick={reset}>
            Reset all demo data
          </button>
        </section>
        <section className="panel install-panel">
          <h2>A home on your device.</h2>
          <p>
            Install StokvelOS for a focused app window, home-screen shortcuts and a private offline
            reconnect screen.
          </p>
          <InstallButton />
          <p className="network-state">
            <span className="tiny-dot" />
            {online ? "Online · Financial actions available" : "Offline · Financial actions paused"}
            {installed ? " · Running as an installed app" : ""}
          </p>
        </section>
      </div>
      {setup && (
        <Dialog title="A clearer start for your society" onClose={() => setSetup(false)}>
          <div className="wizard-steps">
            {["Society", "Rules", "Review"].map((s, i) => (
              <span key={s} className={step === i ? "active" : ""}>
                {i + 1}. {s}
              </span>
            ))}
          </div>
          {step === 0 ? (
            <div className="form-stack">
              <label>
                Society name
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              </label>
              <div className="info-note">
                <InfoIcon size={20} /> You’re previewing a {state.type} society. No live society
                account is created.
              </div>
              <button
                className="button button-primary"
                disabled={!name.trim()}
                onClick={() => setStep(1)}
              >
                Continue to rules <ArrowRightIcon size={17} />
              </button>
            </div>
          ) : step === 1 ? (
            <div className="form-stack">
              <label>
                Next-cycle contribution (ZAR)
                <input
                  inputMode="decimal"
                  value={contribution}
                  onChange={(e) => setContribution(e.target.value)}
                />
              </label>
              <p className="muted">
                Any new contribution rule starts from the next cycle. Existing October obligations
                stay at R 500.00 under version 2026.1.
              </p>
              <div className="info-note">
                <ShieldCheckIcon size={20} /> Imported opening balances must be explicitly labelled
                as historical until independently reconciled.
              </div>
              <div className="dialog-actions">
                <button className="button button-outline" onClick={() => setStep(0)}>
                  Back
                </button>
                <button
                  className="button button-primary"
                  disabled={!/^\d+(\.\d{1,2})?$/.test(contribution)}
                  onClick={() => setStep(2)}
                >
                  Review setup
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3>{name}</h3>
              <p className="muted">
                {state.type} society · Proposed next-cycle amount: R {contribution}
              </p>
              <ul className="setup-checklist">
                <li>
                  <CheckIcon size={17} /> October history preserved
                </li>
                <li>
                  <CheckIcon size={17} /> Two-person financial approval required
                </li>
                <li>
                  <CheckIcon size={17} /> Historical imports disclosed
                </li>
                <li>
                  <CheckIcon size={17} /> Bank funds held externally
                </li>
              </ul>
              <p className="info-note">
                Onboarding preview complete. These proposed rules are not activated by the demo.
              </p>
              <button
                className="button button-primary"
                onClick={() => {
                  if (!["chairperson", "treasurer"].includes(actor.role)) {
                    notify("A chairperson or treasurer must review society setup.");
                    return;
                  }
                  try {
                    update((s) => ({ ...s, name: name.trim() }));
                  } catch (e) {
                    notify((e as Error).message);
                    return;
                  }
                  setSetup(false);
                  notify(
                    "Demo society name updated. Existing obligations and rule versions were preserved.",
                  );
                }}
              >
                Use demo society name
              </button>
            </div>
          )}
        </Dialog>
      )}
    </>
  );
}
