# Society domain storage foundation

This milestone adds migration-owned PostgreSQL tables for pending invitations, burial claims, private document metadata, billing subscriptions and billing webhook deduplication. All five tables have row-level security enabled with **no access policies** and **no runtime grants**. They are inaccessible to the application role until separate, audited services are implemented.

Run `pnpm db:migrate` only with a separate `MIGRATION_DATABASE_URL` under an approved migration owner. The migration is tracked under `stokvel_guard_migrations` and guarded by an advisory transaction lock. Re-apply `scripts/provision.sql` with an authorized owner to explicitly revoke access from `stokvel_app`.

**Not implemented:** live society creation, invitation sending or acceptance, contribution/payout persistence UI, burial claim submission, private object storage, billing collection or webhook processing. No production migration has been executed as part of this change. Do not use owner credentials in `DATABASE_URL` or collect real financial/member records until least-privilege runtime roles, Neon identity mapping, end-to-end tests, and operational release gates are completed.
