import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  bigint,
  integer,
  unique,
  uniqueIndex,
  foreignKey,
  check,
  index,
} from "drizzle-orm/pg-core";
const id = () => uuid("id").primaryKey().defaultRandom();
const societyId = () => uuid("society_id").notNull();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const cents = (name: string) => bigint(name, { mode: "bigint" }).notNull();
export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  createdAt: createdAt(),
});
export const societies = pgTable(
  "societies",
  {
    id: id(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    timezone: text("timezone").notNull().default("Africa/Johannesburg"),
    currency: text("currency").notNull().default("ZAR"),
    createdAt: createdAt(),
  },
  (t) => [
    check("society_type", sql`${t.type} in ('rotating','burial')`),
    check("society_currency", sql`${t.currency}='ZAR'`),
  ],
);
export const memberships = pgTable(
  "memberships",
  {
    id: id(),
    societyId: societyId().references(() => societies.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: text("role").notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    unique("membership_tenant_id").on(t.societyId, t.id),
    unique("membership_user").on(t.societyId, t.userId),
    check(
      "membership_role",
      sql`${t.role} in ('chairperson','treasurer','secretary','approver','member')`,
    ),
  ],
);
export const ruleVersions = pgTable(
  "rule_versions",
  {
    id: id(),
    societyId: societyId().references(() => societies.id),
    version: integer("version").notNull(),
    contributionCents: cents("contribution_cents"),
    effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("rule_tenant_id").on(t.societyId, t.id),
    unique("rule_version").on(t.societyId, t.version),
    check("rule_positive", sql`${t.contributionCents}>0`),
  ],
);
export const obligations = pgTable(
  "contribution_obligations",
  {
    id: id(),
    societyId: societyId().references(() => societies.id),
    membershipId: uuid("membership_id").notNull(),
    ruleVersionId: uuid("rule_version_id").notNull(),
    amountCents: cents("amount_cents"),
    period: text("period").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("obligation_tenant_id").on(t.societyId, t.id),
    unique("obligation_period").on(t.societyId, t.membershipId, t.period),
    foreignKey({
      columns: [t.societyId, t.membershipId],
      foreignColumns: [memberships.societyId, memberships.id],
    }),
    foreignKey({
      columns: [t.societyId, t.ruleVersionId],
      foreignColumns: [ruleVersions.societyId, ruleVersions.id],
    }),
    check("obligation_positive", sql`${t.amountCents}>0`),
    check("obligation_period_format", sql`${t.period} ~ '^\\d{4}-\\d{2}$'`),
    index("obligation_due_idx").on(t.societyId, t.dueAt),
  ],
);
export const ledgerAccounts = pgTable(
  "ledger_accounts",
  {
    id: id(),
    societyId: societyId().references(() => societies.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
  },
  (t) => [
    unique("account_tenant_id").on(t.societyId, t.id),
    unique("account_code").on(t.societyId, t.code),
  ],
);
export const journalEntries = pgTable(
  "journal_entries",
  {
    id: id(),
    societyId: societyId().references(() => societies.id),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id),
    idempotencyKey: text("idempotency_key").notNull(),
    reference: text("reference").notNull(),
    status: text("status").notNull().default("draft"),
    reversesId: uuid("reverses_id"),
    createdAt: createdAt(),
  },
  (t) => [
    unique("journal_tenant_id").on(t.societyId, t.id),
    unique("journal_idempotency").on(t.societyId, t.idempotencyKey),
    unique("journal_reversal").on(t.societyId, t.reversesId),
    foreignKey({ columns: [t.societyId, t.reversesId], foreignColumns: [t.societyId, t.id] }),
    check("journal_status", sql`${t.status} in ('draft','posted')`),
  ],
);
export const journalLines = pgTable(
  "journal_lines",
  {
    id: id(),
    societyId: societyId().references(() => societies.id),
    entryId: uuid("entry_id").notNull(),
    accountId: uuid("account_id").notNull(),
    debitCents: cents("debit_cents").default(sql`0`),
    creditCents: cents("credit_cents").default(sql`0`),
  },
  (t) => [
    foreignKey({
      columns: [t.societyId, t.entryId],
      foreignColumns: [journalEntries.societyId, journalEntries.id],
    }),
    foreignKey({
      columns: [t.societyId, t.accountId],
      foreignColumns: [ledgerAccounts.societyId, ledgerAccounts.id],
    }),
    check(
      "line_one_side",
      sql`(${t.debitCents}>0 and ${t.creditCents}=0) or (${t.creditCents}>0 and ${t.debitCents}=0)`,
    ),
    index("journal_line_entry_idx").on(t.societyId, t.entryId),
  ],
);
export const bankTransactions = pgTable(
  "bank_transactions",
  {
    id: id(),
    societyId: societyId().references(() => societies.id),
    externalId: text("external_id").notNull(),
    reference: text("reference").notNull(),
    amountCents: cents("amount_cents"),
    transactionAt: timestamp("transaction_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("bank_tenant_id").on(t.societyId, t.id),
    unique("bank_external_id").on(t.societyId, t.externalId),
    check("bank_positive", sql`${t.amountCents}>0`),
  ],
);
export const payments = pgTable(
  "payments",
  {
    id: id(),
    societyId: societyId().references(() => societies.id),
    membershipId: uuid("membership_id").notNull(),
    reportedBy: uuid("reported_by")
      .notNull()
      .references(() => users.id),
    amountCents: cents("amount_cents"),
    idempotencyKey: text("idempotency_key").notNull(),
    reference: text("reference").notNull(),
    status: text("status").notNull().default("reported"),
    journalEntryId: uuid("journal_entry_id"),
    bankTransactionId: uuid("bank_transaction_id"),
    createdAt: createdAt(),
  },
  (t) => [
    unique("payment_tenant_id").on(t.societyId, t.id),
    unique("payment_idempotency").on(t.societyId, t.idempotencyKey),
    unique("payment_bank_match").on(t.societyId, t.bankTransactionId),
    unique("payment_journal_entry").on(t.societyId, t.journalEntryId),
    foreignKey({
      columns: [t.societyId, t.membershipId],
      foreignColumns: [memberships.societyId, memberships.id],
    }),
    foreignKey({
      columns: [t.societyId, t.journalEntryId],
      foreignColumns: [journalEntries.societyId, journalEntries.id],
    }),
    foreignKey({
      columns: [t.societyId, t.bankTransactionId],
      foreignColumns: [bankTransactions.societyId, bankTransactions.id],
    }),
    check("payment_positive", sql`${t.amountCents}>0`),
    check("payment_status", sql`${t.status} in ('reported','verified','rejected','reversed')`),
    check(
      "payment_verified_evidence",
      sql`${t.status} not in ('verified','reversed') or (${t.journalEntryId} is not null and ${t.bankTransactionId} is not null)`,
    ),
  ],
);
export const allocations = pgTable(
  "payment_allocations",
  {
    id: id(),
    societyId: societyId().references(() => societies.id),
    paymentId: uuid("payment_id").notNull(),
    obligationId: uuid("obligation_id").notNull(),
    amountCents: cents("amount_cents"),
    createdAt: createdAt(),
  },
  (t) => [
    unique("allocation_pair").on(t.societyId, t.paymentId, t.obligationId),
    foreignKey({
      columns: [t.societyId, t.paymentId],
      foreignColumns: [payments.societyId, payments.id],
    }),
    foreignKey({
      columns: [t.societyId, t.obligationId],
      foreignColumns: [obligations.societyId, obligations.id],
    }),
    check("allocation_positive", sql`${t.amountCents}>0`),
  ],
);
export const approvalRequests = pgTable(
  "approval_requests",
  {
    id: id(),
    societyId: societyId().references(() => societies.id),
    proposerId: uuid("proposer_id")
      .notNull()
      .references(() => users.id),
    kind: text("kind").notNull(),
    reference: text("reference").notNull(),
    requiredApprovals: integer("required_approvals").notNull().default(2),
    createdAt: createdAt(),
  },
  (t) => [
    unique("approval_tenant_id").on(t.societyId, t.id),
    check("approval_threshold", sql`${t.requiredApprovals}>=2`),
  ],
);
export const approvalDecisions = pgTable(
  "approval_decisions",
  {
    id: id(),
    societyId: societyId().references(() => societies.id),
    requestId: uuid("request_id").notNull(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id),
    decision: text("decision").notNull(),
    reason: text("reason").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("approval_distinct_actor").on(t.societyId, t.requestId, t.actorId),
    foreignKey({
      columns: [t.societyId, t.requestId],
      foreignColumns: [approvalRequests.societyId, approvalRequests.id],
    }),
    check("decision_value", sql`${t.decision} in ('approve','decline','information')`),
    check("decision_reason", sql`length(trim(${t.reason}))>=5`),
  ],
);
export const auditEvents = pgTable(
  "audit_events",
  {
    id: id(),
    societyId: societyId().references(() => societies.id),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id),
    action: text("action").notNull(),
    entityId: uuid("entity_id").notNull(),
    reason: text("reason"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_society_time").on(t.societyId, t.createdAt)],
);
