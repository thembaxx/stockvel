CREATE TABLE "payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"society_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"obligation_id" uuid NOT NULL,
	"amount_cents" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "allocation_pair" UNIQUE("society_id","payment_id","obligation_id"),
	CONSTRAINT "allocation_positive" CHECK ("payment_allocations"."amount_cents">0)
);
--> statement-breakpoint
CREATE TABLE "approval_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"society_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"decision" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "approval_distinct_actor" UNIQUE("society_id","request_id","actor_id"),
	CONSTRAINT "decision_value" CHECK ("approval_decisions"."decision" in ('approve','decline','information')),
	CONSTRAINT "decision_reason" CHECK (length(trim("approval_decisions"."reason"))>=5)
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"society_id" uuid NOT NULL,
	"proposer_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"reference" text NOT NULL,
	"required_approvals" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "approval_tenant_id" UNIQUE("society_id","id"),
	CONSTRAINT "approval_threshold" CHECK ("approval_requests"."required_approvals">=2)
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"society_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"society_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"reference" text NOT NULL,
	"amount_cents" bigint NOT NULL,
	"transaction_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_tenant_id" UNIQUE("society_id","id"),
	CONSTRAINT "bank_external_id" UNIQUE("society_id","external_id"),
	CONSTRAINT "bank_positive" CHECK ("bank_transactions"."amount_cents">0)
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"society_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"reference" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"reverses_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journal_tenant_id" UNIQUE("society_id","id"),
	CONSTRAINT "journal_idempotency" UNIQUE("society_id","idempotency_key"),
	CONSTRAINT "journal_reversal" UNIQUE("society_id","reverses_id"),
	CONSTRAINT "journal_status" CHECK ("journal_entries"."status" in ('draft','posted'))
);
--> statement-breakpoint
CREATE TABLE "journal_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"society_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"debit_cents" bigint DEFAULT 0 NOT NULL,
	"credit_cents" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "line_one_side" CHECK (("journal_lines"."debit_cents">0 and "journal_lines"."credit_cents"=0) or ("journal_lines"."credit_cents">0 and "journal_lines"."debit_cents"=0))
);
--> statement-breakpoint
CREATE TABLE "ledger_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"society_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "account_tenant_id" UNIQUE("society_id","id"),
	CONSTRAINT "account_code" UNIQUE("society_id","code")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"society_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membership_tenant_id" UNIQUE("society_id","id"),
	CONSTRAINT "membership_user" UNIQUE("society_id","user_id"),
	CONSTRAINT "membership_role" CHECK ("memberships"."role" in ('chairperson','treasurer','secretary','approver','member'))
);
--> statement-breakpoint
CREATE TABLE "contribution_obligations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"society_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"rule_version_id" uuid NOT NULL,
	"amount_cents" bigint NOT NULL,
	"period" text NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "obligation_tenant_id" UNIQUE("society_id","id"),
	CONSTRAINT "obligation_period" UNIQUE("society_id","membership_id","period"),
	CONSTRAINT "obligation_positive" CHECK ("contribution_obligations"."amount_cents">0),
	CONSTRAINT "obligation_period_format" CHECK ("contribution_obligations"."period" ~ '^\d{4}-\d{2}$')
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"society_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"reported_by" uuid NOT NULL,
	"amount_cents" bigint NOT NULL,
	"idempotency_key" text NOT NULL,
	"reference" text NOT NULL,
	"status" text DEFAULT 'reported' NOT NULL,
	"journal_entry_id" uuid,
	"bank_transaction_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_tenant_id" UNIQUE("society_id","id"),
	CONSTRAINT "payment_idempotency" UNIQUE("society_id","idempotency_key"),
	CONSTRAINT "payment_bank_match" UNIQUE("society_id","bank_transaction_id"),
	CONSTRAINT "payment_journal_entry" UNIQUE("society_id","journal_entry_id"),
	CONSTRAINT "payment_positive" CHECK ("payments"."amount_cents">0),
	CONSTRAINT "payment_status" CHECK ("payments"."status" in ('reported','verified','rejected','reversed')),
	CONSTRAINT "payment_verified_evidence" CHECK ("payments"."status" not in ('verified','reversed') or ("payments"."journal_entry_id" is not null and "payments"."bank_transaction_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "rule_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"society_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"contribution_cents" bigint NOT NULL,
	"effective_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rule_tenant_id" UNIQUE("society_id","id"),
	CONSTRAINT "rule_version" UNIQUE("society_id","version"),
	CONSTRAINT "rule_positive" CHECK ("rule_versions"."contribution_cents">0)
);
--> statement-breakpoint
CREATE TABLE "societies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"timezone" text DEFAULT 'Africa/Johannesburg' NOT NULL,
	"currency" text DEFAULT 'ZAR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "society_type" CHECK ("societies"."type" in ('rotating','burial')),
	CONSTRAINT "society_currency" CHECK ("societies"."currency"='ZAR')
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_society_id_societies_id_fk" FOREIGN KEY ("society_id") REFERENCES "public"."societies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_society_id_payment_id_payments_society_id_id_fk" FOREIGN KEY ("society_id","payment_id") REFERENCES "public"."payments"("society_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_society_id_obligation_id_contribution_obligations_society_id_id_fk" FOREIGN KEY ("society_id","obligation_id") REFERENCES "public"."contribution_obligations"("society_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_society_id_societies_id_fk" FOREIGN KEY ("society_id") REFERENCES "public"."societies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_society_id_request_id_approval_requests_society_id_id_fk" FOREIGN KEY ("society_id","request_id") REFERENCES "public"."approval_requests"("society_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_society_id_societies_id_fk" FOREIGN KEY ("society_id") REFERENCES "public"."societies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_proposer_id_users_id_fk" FOREIGN KEY ("proposer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_society_id_societies_id_fk" FOREIGN KEY ("society_id") REFERENCES "public"."societies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_society_id_societies_id_fk" FOREIGN KEY ("society_id") REFERENCES "public"."societies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_society_id_societies_id_fk" FOREIGN KEY ("society_id") REFERENCES "public"."societies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_society_id_reverses_id_journal_entries_society_id_id_fk" FOREIGN KEY ("society_id","reverses_id") REFERENCES "public"."journal_entries"("society_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_society_id_societies_id_fk" FOREIGN KEY ("society_id") REFERENCES "public"."societies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_society_id_entry_id_journal_entries_society_id_id_fk" FOREIGN KEY ("society_id","entry_id") REFERENCES "public"."journal_entries"("society_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_society_id_account_id_ledger_accounts_society_id_id_fk" FOREIGN KEY ("society_id","account_id") REFERENCES "public"."ledger_accounts"("society_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_accounts" ADD CONSTRAINT "ledger_accounts_society_id_societies_id_fk" FOREIGN KEY ("society_id") REFERENCES "public"."societies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_society_id_societies_id_fk" FOREIGN KEY ("society_id") REFERENCES "public"."societies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribution_obligations" ADD CONSTRAINT "contribution_obligations_society_id_societies_id_fk" FOREIGN KEY ("society_id") REFERENCES "public"."societies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribution_obligations" ADD CONSTRAINT "contribution_obligations_society_id_membership_id_memberships_society_id_id_fk" FOREIGN KEY ("society_id","membership_id") REFERENCES "public"."memberships"("society_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribution_obligations" ADD CONSTRAINT "contribution_obligations_society_id_rule_version_id_rule_versions_society_id_id_fk" FOREIGN KEY ("society_id","rule_version_id") REFERENCES "public"."rule_versions"("society_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_society_id_societies_id_fk" FOREIGN KEY ("society_id") REFERENCES "public"."societies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_society_id_membership_id_memberships_society_id_id_fk" FOREIGN KEY ("society_id","membership_id") REFERENCES "public"."memberships"("society_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_society_id_journal_entry_id_journal_entries_society_id_id_fk" FOREIGN KEY ("society_id","journal_entry_id") REFERENCES "public"."journal_entries"("society_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_society_id_bank_transaction_id_bank_transactions_society_id_id_fk" FOREIGN KEY ("society_id","bank_transaction_id") REFERENCES "public"."bank_transactions"("society_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_versions" ADD CONSTRAINT "rule_versions_society_id_societies_id_fk" FOREIGN KEY ("society_id") REFERENCES "public"."societies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_society_time" ON "audit_events" USING btree ("society_id","created_at");--> statement-breakpoint
CREATE INDEX "journal_line_entry_idx" ON "journal_lines" USING btree ("society_id","entry_id");--> statement-breakpoint
CREATE INDEX "obligation_due_idx" ON "contribution_obligations" USING btree ("society_id","due_at");