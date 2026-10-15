-- Run as the database owner after migrations. The application role must be
-- provisioned by your database provider. Never use the migration owner at runtime.
-- Example runtime role name: stokvel_app (NOLOGIN in test fixtures).
GRANT USAGE ON SCHEMA public TO stokvel_app;
GRANT EXECUTE ON FUNCTION society_role(uuid), app_actor(), app_society() TO stokvel_app;
GRANT SELECT ON societies, memberships, rule_versions, contribution_obligations,
  ledger_accounts, journal_entries, journal_lines, bank_transactions, payments,
  payment_allocations, approval_requests, approval_decisions, audit_events TO stokvel_app;
-- Minimise writes. No table grants for role assignment or governance configuration yet.
GRANT INSERT ON journal_entries, journal_lines, payments, payment_allocations, audit_events, approval_decisions, bank_transactions TO stokvel_app;
GRANT UPDATE(status) ON journal_entries TO stokvel_app;
GRANT UPDATE(status, journal_entry_id, bank_transaction_id) ON payments TO stokvel_app;

-- SELECT FOR UPDATE requires UPDATE permission. Immutable triggers still reject
-- actual edits; these narrow column grants enable transactional row locks only.
GRANT UPDATE(id) ON contribution_obligations, bank_transactions, approval_requests TO stokvel_app;

-- No grants are issued for society_invitations, burial_claims, society_documents,
-- billing_subscriptions or billing_webhook_events. Their RLS is default-deny.
