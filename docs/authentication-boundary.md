# Production authentication integration boundary

This milestone introduces a fail-closed session validation contract and a tenant-scoped transaction helper. **It does not implement login, registration, invitations, or production user sessions.** The public demo remains fictional and unauthenticated. No financial API is exposed.

## Provider integration requirements

1. Choose a maintained authentication provider compatible with Next.js App Router and PostgreSQL. Verify provider session signatures and revocation server-side. Never trust browser-supplied `userId`, role, society ID, or MFA flags.
2. Resolve the provider subject to the internal `users.id` UUID. Construct `VerifiedIdentity` only after verification. Do not expose `validateVerifiedIdentity` as an API that accepts arbitrary JSON: structural validation is **not** authentication.
3. Enforce CSRF/origin checks, secure HTTP-only cookies, rate limits, session rotation, recovery flows and email verification before enabling onboarding.
4. Use `withSocietyAccess` with the least-privileged application database role and explicit allowed roles for every tenant operation. Membership must be checked against the database inside the transaction. No app role may own protected tables or have `BYPASSRLS`.
5. Require fresh, server-attested MFA using `requireFreshMfa` before sensitive approvals, beneficiary changes, bank evidence changes and payouts. Add server-side replay and reauthentication tests.
6. Validate access against a managed PostgreSQL instance with concurrent connections, including revoked membership, cross-society access, unauthenticated requests, expired sessions and tenant context cleanup.
7. Provisioning a new society needs a separate carefully reviewed, narrowly privileged bootstrap transaction: the current runtime role intentionally has no society or membership creation grants. Do not grant broad insert rights to bypass onboarding.

## Important limits

- These helpers do not create trusted sessions by themselves.
- The schema's `memberships` table currently has one row per user/society; committee appointment history and invitations need separate schema migrations.
- No private data, banking credentials or real member information should be entered into the public prototype.
- This is a preparatory security slice, not a production-ready release.
