export type SocietyType = "rotating" | "burial";
export type Role = "treasurer" | "chairperson" | "secretary" | "member";
export type Actor = { id: string; name: string; role: Role; societyId: string };
export type Member = {
  id: string;
  name: string;
  initials: string;
  reference: string;
  joinedAt: string;
  role: Role;
};
export type Payment = {
  id: string;
  memberId: string;
  amount: bigint;
  reference: string;
  date: string;
  status: "reported" | "verified" | "rejected" | "reversed";
  idempotencyKey: string;
  evidence?: string;
  bankId?: string;
};
export type BankTransaction = {
  id: string;
  date: string;
  reference: string;
  amount: bigint;
  matchedPaymentId?: string;
};
export type JournalEntry = {
  id: string;
  actorId: string;
  reference: string;
  date: string;
  lines: { account: "bank" | "member-fund"; debit: bigint; credit: bigint }[];
  reversesId?: string;
};
export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  detail: string;
  time: string;
};
export type Decision = {
  actorId: string;
  name: string;
  reason: string;
  decision: "approve" | "decline" | "information";
};
export type DemoState = {
  societyId: string;
  name: string;
  type: SocietyType;
  ruleVersion: string;
  contribution: bigint;
  members: Member[];
  payments: Payment[];
  banks: BankTransaction[];
  journal: JournalEntry[];
  audit: AuditEvent[];
  payout: {
    memberId: string;
    amount: bigint;
    date: string;
    proposerId: string;
    decisions: Decision[];
    status: "scheduled" | "approved" | "completed";
    evidence?: string;
  };
  benefit: {
    id: string;
    memberId: string;
    coveredPerson: string;
    relationship: string;
    coveredSince: string;
    waitingMonths: number;
    eventDate: string;
    amount: bigint;
    ruleVersion: string;
    proposerId: string;
    decisions: Decision[];
    status: "review" | "information" | "approved" | "declined" | "completed";
    evidence?: string;
  };
};

export const DEMO_TODAY = "2026-10-14";
export const actors: Omit<Actor, "societyId">[] = [
  { id: "naledi", name: "Naledi Molefe", role: "treasurer" },
  { id: "sipho", name: "Sipho Dlamini", role: "chairperson" },
  { id: "thandi", name: "Thandi Nkosi", role: "secretary" },
];
const names = [
  "Naledi Molefe",
  "Thandi Nkosi",
  "Sipho Dlamini",
  "Lerato Mokoena",
  "Bongani Zulu",
  "Zanele Khumalo",
  "Mpho Sello",
  "Nomsa Mthembu",
  "Palesa Radebe",
  "Ayanda Ndlovu",
  "Kabelo Mosime",
  "Themba Sithole",
];

export function createDemo(type: SocietyType = "rotating"): DemoState {
  const members = names.map((name, i) => ({
    id: `m${i + 1}`,
    name,
    initials: name
      .split(" ")
      .map((s) => s[0])
      .join(""),
    reference: `UBU-${String(i + 1).padStart(3, "0")}`,
    joinedAt: "2026-01-01",
    role: (i === 0
      ? "treasurer"
      : i === 1
        ? "secretary"
        : i === 2
          ? "chairperson"
          : "member") as Role,
  }));
  const payments: Payment[] = members.slice(0, 11).map((m, i) => ({
    id: `p${i + 1}`,
    memberId: m.id,
    amount: i === 8 ? 30000n : 50000n,
    reference: m.reference,
    date: `2026-10-${String(i + 1).padStart(2, "0")}`,
    status: i < 9 ? "verified" : "reported",
    idempotencyKey: `seed-${i}`,
    evidence: i < 9 ? `DEMO-STMT-OCT-${i + 1}` : undefined,
    bankId: i < 9 ? `b${i + 1}` : undefined,
  }));
  const banks = payments.map((p, i) => ({
    id: `b${i + 1}`,
    date: p.date,
    reference: p.reference,
    amount: p.amount,
    matchedPaymentId: i < 9 ? p.id : undefined,
  }));
  const journal: JournalEntry[] = [
    {
      id: "j-opening",
      actorId: "sipho",
      reference: "Reconciled prior-cycle carryover · DEMO-OPEN-01",
      date: "2026-09-30",
      lines: [
        { account: "bank", debit: 620000n, credit: 0n },
        { account: "member-fund", debit: 0n, credit: 620000n },
      ],
    },
  ];
  for (const p of payments.filter((p) => p.status === "verified"))
    journal.push(receiptEntry(p, "naledi"));
  return {
    societyId: type === "rotating" ? "ubuntu" : "sisonke",
    name: type === "rotating" ? "Ubuntu Savings Circle" : "Sisonke Burial Society",
    type,
    ruleVersion: "2026.1",
    contribution: 50000n,
    members,
    payments,
    banks,
    journal,
    audit: [
      {
        id: "a1",
        actor: "Naledi Molefe",
        action: "Payment verified",
        detail: "Palesa Radebe · R 300.00 · DEMO-STMT-OCT-9",
        time: "11 Oct, 09:42",
      },
      {
        id: "a2",
        actor: "Sipho Dlamini",
        action: "Rotation locked",
        detail: "12 members · Constitution 2026.1",
        time: "01 Oct, 10:15",
      },
      {
        id: "a3",
        actor: "Thandi Nkosi",
        action: "Monthly obligations generated",
        detail: "12 × R 500.00 · Rule 2026.1",
        time: "01 Oct, 08:30",
      },
    ],
    payout: {
      memberId: "m2",
      amount: 600000n,
      date: "2026-10-25",
      proposerId: "naledi",
      decisions: [],
      status: "scheduled",
    },
    benefit: {
      id: "BEN-2026-004",
      memberId: "m4",
      coveredPerson: "Joseph Mokoena",
      relationship: "Parent",
      coveredSince: "2026-01-01",
      waitingMonths: 6,
      eventDate: "2026-10-10",
      amount: 300000n,
      ruleVersion: "2026.1",
      proposerId: "thandi",
      decisions: [],
      status: "review",
    },
  };
}

function receiptEntry(p: Payment, actorId: string): JournalEntry {
  return {
    id: `j-${p.id}`,
    actorId,
    reference: `Contribution ${p.reference}`,
    date: DEMO_TODAY,
    lines: [
      { account: "bank", debit: p.amount, credit: 0n },
      { account: "member-fund", debit: 0n, credit: p.amount },
    ],
  };
}
function authorize(state: DemoState, actor: Actor, roles: Role[]) {
  if (actor.societyId !== state.societyId || !roles.includes(actor.role))
    throw new Error("You do not have permission to perform this action in this society.");
}
function audit(state: DemoState, actor: Actor, action: string, detail: string): DemoState {
  return {
    ...state,
    audit: [
      { id: crypto.randomUUID(), actor: actor.name, action, detail, time: "14 Oct, just now" },
      ...state.audit,
    ],
  };
}
export function outstanding(state: DemoState, memberId: string): bigint {
  const paid = state.payments
    .filter((p) => p.memberId === memberId && p.status === "verified")
    .reduce((sum, p) => sum + p.amount, 0n);
  return state.contribution > paid ? state.contribution - paid : 0n;
}
export function summary(state: DemoState) {
  const verified = state.payments
    .filter((p) => p.status === "verified")
    .reduce((s, p) => s + p.amount, 0n);
  const pending = state.payments
    .filter((p) => p.status === "reported")
    .reduce((s, p) => s + p.amount, 0n);
  const due = state.members.reduce((s, m) => s + outstanding(state, m.id), 0n);
  const funds = state.journal.reduce(
    (sum, j) =>
      sum +
      j.lines.filter((l) => l.account === "bank").reduce((s, l) => s + l.debit - l.credit, 0n),
    0n,
  );
  return {
    verified,
    pending,
    due,
    funds,
    target: state.contribution * BigInt(state.members.length),
    pendingCount: state.payments.filter((p) => p.status === "reported").length,
  };
}

export function reportPayment(
  state: DemoState,
  actor: Actor,
  input: { memberId: string; amount: bigint; reference: string; idempotencyKey: string },
): DemoState {
  authorize(state, actor, ["treasurer", "chairperson", "secretary"]);
  const existing = state.payments.find((p) => p.idempotencyKey === input.idempotencyKey);
  if (existing) {
    if (
      existing.memberId !== input.memberId ||
      existing.amount !== input.amount ||
      existing.reference !== input.reference
    )
      throw new Error("This request key was already used for a different payment.");
    return state;
  }
  if (!state.members.some((m) => m.id === input.memberId))
    throw new Error("Choose a member of this society.");
  if (input.amount <= 0n) throw new Error("Payment amount must be greater than zero.");
  if (!input.reference.trim()) throw new Error("Add a payment reference.");
  const payment: Payment = {
    ...input,
    id: crypto.randomUUID(),
    date: DEMO_TODAY,
    status: "reported",
  };
  return audit(
    { ...state, payments: [payment, ...state.payments] },
    actor,
    "Payment reported",
    `${input.reference} · Awaiting bank verification`,
  );
}
export function verifyPayment(
  state: DemoState,
  actor: Actor,
  paymentId: string,
  bankId: string,
): DemoState {
  authorize(state, actor, ["treasurer", "chairperson"]);
  const p = state.payments.find((p) => p.id === paymentId);
  const bank = state.banks.find((b) => b.id === bankId);
  if (!p || !bank) throw new Error("Payment or bank evidence could not be found.");
  if (p.status === "verified" && p.bankId === bankId) return state;
  if (p.status !== "reported") throw new Error("Only a reported payment can be verified.");
  if (bank.matchedPaymentId) throw new Error("This bank transaction has already been reconciled.");
  if (bank.amount !== p.amount)
    throw new Error("The bank transaction amount must match the reported payment.");
  if (p.amount > outstanding(state, p.memberId))
    throw new Error(
      "This exceeds the current obligation. Split allocations require committee review.",
    );
  const entry = receiptEntry(p, actor.id);
  return audit(
    {
      ...state,
      payments: state.payments.map((x) =>
        x.id === p.id
          ? { ...x, status: "verified", bankId, evidence: `Bank transaction ${bank.id}` }
          : x,
      ),
      banks: state.banks.map((b) => (b.id === bankId ? { ...b, matchedPaymentId: p.id } : b)),
      journal: [...state.journal, entry],
    },
    actor,
    "Payment verified",
    `${p.reference} · Bank transaction ${bank.id}`,
  );
}
export function rejectPayment(
  state: DemoState,
  actor: Actor,
  paymentId: string,
  reason: string,
): DemoState {
  authorize(state, actor, ["treasurer", "chairperson"]);
  if (!reason.trim()) throw new Error("Record a reason for rejecting this payment.");
  if (!state.payments.some((p) => p.id === paymentId && p.status === "reported"))
    throw new Error("Only a reported payment can be rejected.");
  return audit(
    {
      ...state,
      payments: state.payments.map((p) => (p.id === paymentId ? { ...p, status: "rejected" } : p)),
    },
    actor,
    "Payment rejected",
    reason,
  );
}
export function reversePayment(
  state: DemoState,
  actor: Actor,
  paymentId: string,
  reason: string,
): DemoState {
  authorize(state, actor, ["chairperson"]);
  if (!reason.trim()) throw new Error("Record a reason for the correction.");
  const payment = state.payments.find((p) => p.id === paymentId);
  const original = state.journal.find((j) => j.id === `j-${paymentId}`);
  if (!payment || !original || payment.status !== "verified")
    throw new Error("Only a verified, unreversed payment can be corrected.");
  if (original.actorId === actor.id)
    throw new Error("A different committee member must approve this correction.");
  if (summary(state).funds < payment.amount)
    throw new Error("This correction would overdraw the verified balance.");
  const reversal: JournalEntry = {
    ...original,
    id: `reversal-${paymentId}`,
    actorId: actor.id,
    reference: `Reversal: ${reason}`,
    date: DEMO_TODAY,
    reversesId: original.id,
    lines: original.lines.map((l) => ({ ...l, debit: l.credit, credit: l.debit })),
  };
  return audit(
    {
      ...state,
      payments: state.payments.map((p) => (p.id === paymentId ? { ...p, status: "reversed" } : p)),
      journal: [...state.journal, reversal],
    },
    actor,
    "Receipt reversed",
    `${payment.reference} · ${reason}`,
  );
}
export function decidePayout(state: DemoState, actor: Actor, reason: string): DemoState {
  authorize(state, actor, ["chairperson", "secretary"]);
  if (state.type !== "rotating") throw new Error("Payout rotations apply to rotating societies.");
  if (state.payout.status !== "scheduled")
    throw new Error("This payout is no longer awaiting approval.");
  if (actor.id === state.payout.proposerId)
    throw new Error("The payout proposer cannot approve their own request.");
  if (state.payout.decisions.some((d) => d.actorId === actor.id))
    throw new Error("You have already approved. A different authorised person must also approve.");
  if (!reason.trim()) throw new Error("Add a reason for your decision.");
  if (summary(state).funds < state.payout.amount)
    throw new Error("Verified funds are below the scheduled payout.");
  const decisions = [
    ...state.payout.decisions,
    { actorId: actor.id, name: actor.name, reason, decision: "approve" as const },
  ];
  return audit(
    {
      ...state,
      payout: {
        ...state.payout,
        decisions,
        status: decisions.length >= 2 ? "approved" : "scheduled",
      },
    },
    actor,
    "Payout approved",
    `${decisions.length} of 2 independent approvals · ${reason}`,
  );
}
export function completePayout(state: DemoState, actor: Actor, evidence: string): DemoState {
  authorize(state, actor, ["treasurer", "chairperson"]);
  if (state.payout.status !== "approved")
    throw new Error("Two independent approvals are required before recording a payout.");
  if (!evidence.trim()) throw new Error("An external payment reference is required.");
  if (summary(state).funds < state.payout.amount)
    throw new Error("There are insufficient verified funds.");
  const amount = state.payout.amount;
  const entry: JournalEntry = {
    id: "j-payout-oct",
    actorId: actor.id,
    reference: `External payout · ${evidence}`,
    date: DEMO_TODAY,
    lines: [
      { account: "member-fund", debit: amount, credit: 0n },
      { account: "bank", debit: 0n, credit: amount },
    ],
  };
  return audit(
    {
      ...state,
      payout: { ...state.payout, status: "completed", evidence },
      journal: [...state.journal, entry],
    },
    actor,
    "External payout recorded",
    evidence,
  );
}
export function coverageEligible(
  coveredSince: string,
  eventDate: string,
  waitingMonths: number,
): boolean {
  const date = new Date(`${coveredSince}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return false;
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + waitingMonths);
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, end));
  return new Date(`${eventDate}T00:00:00Z`).getTime() >= date.getTime();
}
export function decideBenefit(
  state: DemoState,
  actor: Actor,
  decision: Decision["decision"],
  reason: string,
): DemoState {
  authorize(state, actor, ["chairperson", "treasurer"]);
  if (state.type !== "burial") throw new Error("Benefit requests apply to burial societies.");
  if (!["review", "information"].includes(state.benefit.status))
    throw new Error("This request is no longer under review.");
  if (
    actor.id === state.benefit.proposerId ||
    state.benefit.decisions.some((d) => d.actorId === actor.id && d.decision === "approve")
  )
    throw new Error("This decision requires a different authorised reviewer.");
  if (!reason.trim()) throw new Error("Add the reason for your decision.");
  if (
    decision === "approve" &&
    !coverageEligible(
      state.benefit.coveredSince,
      state.benefit.eventDate,
      state.benefit.waitingMonths,
    )
  )
    throw new Error("The waiting period was not completed on the event date.");
  const decisions = [
    ...state.benefit.decisions,
    { actorId: actor.id, name: actor.name, reason, decision },
  ];
  const approvals = decisions.filter((d) => d.decision === "approve").length;
  const status =
    decision === "decline"
      ? "declined"
      : decision === "information"
        ? "information"
        : approvals >= 2
          ? "approved"
          : "review";
  return audit(
    { ...state, benefit: { ...state.benefit, decisions, status } },
    actor,
    `Benefit decision: ${decision}`,
    `${state.benefit.id} · Rule ${state.benefit.ruleVersion} · ${reason}`,
  );
}
export function completeBenefit(state: DemoState, actor: Actor, evidence: string): DemoState {
  authorize(state, actor, ["treasurer", "chairperson"]);
  if (state.type !== "burial" || state.benefit.status !== "approved")
    throw new Error("The benefit must be approved by two independent reviewers first.");
  if (!evidence.trim()) throw new Error("An external payment reference is required.");
  if (summary(state).funds < state.benefit.amount)
    throw new Error("There are insufficient verified funds.");
  const amount = state.benefit.amount;
  return audit(
    {
      ...state,
      benefit: { ...state.benefit, status: "completed", evidence },
      journal: [
        ...state.journal,
        {
          id: "j-benefit",
          actorId: actor.id,
          reference: `Benefit ${state.benefit.id} · ${evidence}`,
          date: DEMO_TODAY,
          lines: [
            { account: "member-fund", debit: amount, credit: 0n },
            { account: "bank", debit: 0n, credit: amount },
          ],
        },
      ],
    },
    actor,
    "External benefit payment recorded",
    evidence,
  );
}
