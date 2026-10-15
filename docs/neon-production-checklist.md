# Neon + Vercel production setup

The Vercel Neon integration provides `DATABASE_URL`, `DATABASE_URL_UNPOOLED` and `NEON_AUTH_BASE_URL`. **Presence of these variables does not imply the schema, grants, or login are ready.**

## Database

1. Use a **separate Neon branch** for preview and CI; never run migrations from arbitrary preview deployments against production.
2. Use the unpooled, **owner** connection only from a controlled migration job. Set `MIGRATION_DATABASE_URL` there and run `pnpm db:migrate`. Do not expose it to the web runtime.
3. The financial guards migration and runtime grants require manual review. Create a distinct least-privileged application role `stokvel_app` with no ownership, no BYPASSRLS, and apply `scripts/provision.sql` using the migration owner.
4. Set the production `DATABASE_URL` to the **application role's pooled URL**, not the Neon integration's default owner URL. Verify with `select current_user, rolbypassrls from pg_roles where rolname=current_user` as a privileged operator. Never return these values from a public endpoint.
5. Verify RLS, tenancy isolation, revocation, journal balancing, audit immutability and concurrent allocation tests against an isolated managed PostgreSQL branch.
6. GET `/api/health` reports database reachability only, not migration status or readiness for money movement. Do not mistake a 200 response for authorization or financial compliance.

## Neon Auth

Neon exposes `NEON_AUTH_BASE_URL` when configured, but the application does not yet install or wire the Neon Auth SDK. Follow the official `@neondatabase/auth/next/server` integration and provision `NEON_AUTH_COOKIE_SECRET` (random 32+ characters) as a sensitive production variable. Verify cookie/session signatures server-side and map the provider subject to an internal `users.id` before granting society access. Do not treat the provider subject as an internal UUID without an explicit mapping.

## Release gates

- Authentication and recovery with verified email
- Role-based onboarding and invitation acceptance
- Independent committee approval and recent MFA for payouts
- Private document storage with strict access checks
- Payment evidence integrity, idempotency and reversal tests
- Billing webhook signatures and idempotency
- Backup/restore rehearsal, audit monitoring, rate limiting and POPIA retention policies

**Current state:** prototype + financial database foundation; not production-ready for real member or financial data.
