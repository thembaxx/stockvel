# Production feature release gates

Neon Auth handles sign-in. The public dashboard is fictional and **must not be used for actual financial or member records**. Invitation token primitives exist but **are not connected to live APIs**.

## Society onboarding and invitations
- [ ] Map verified Neon Auth subjects to immutable internal user IDs, verifying email ownership.
- [ ] Provision separate least-privileged runtime and migration roles; validate RLS.
- [ ] Transactionally create society, founder membership, rules and audit record.
- [ ] Store only hashed 256-bit invitation tokens; bind to one society and verified email, enforce expiry, one-time acceptance and revocation atomically.
- [ ] Prevent self-assignment of chairperson and require quorum for role changes.
- [ ] Add rate limits, tenant-isolation and replay tests.

## Persistent contributions and payouts
- [ ] Replace fictional demo memory with tenant-authorized persistent server APIs.
- [ ] Enforce idempotent reconciliation, allocations and payouts.
- [ ] Preserve balanced immutable journals, reversals and audit history.
- [ ] Enforce independent dual approvals and recent MFA.
- [ ] Integrate bank/payment providers only after credentials and reconciliation verification.

## Burial claims and documents
- [ ] Define benefit eligibility, waiting periods and claim state machine.
- [ ] Use private encrypted object storage, short-lived URLs and server-side authorization.
- [ ] Scan uploads, restrict size and MIME type, enforce POPIA retention and access logs.

## Billing and operations
- [ ] Select South Africa-supported billing provider and cancellation/refund policies.
- [ ] Verify webhook signatures and idempotency; separate billing from contributions.
- [ ] Add error monitoring, alerts, rate limits, secure backups and restore drills.
- [ ] Validate concurrent transactions, isolation and security on a separate Neon staging branch.
- [ ] Complete controlled pilot and security review before accepting real member records.
