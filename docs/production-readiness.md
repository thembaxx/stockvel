# Production readiness and implementation sequence

The first blueprint deliverable is implemented: a clickable dual-society prototype, domain test cases and an isolated shared financial foundation. Demo interactions are not production services. Real personal or financial data must not be entered in the prototype.

| Area | Delivered | Release gate still required |
| --- | --- | --- |
| UX | Responsive website/workspace, themes, loading/errors, accessible dialogs | Pilot usability and physical low-cost Android/iOS testing |
| PWA | Installation, public static cache, private offline fallback, native share, update prompt | Real-device install/splash/update and low-bandwidth testing |
| Money | Integer cents, journal balance checks, partial-payment model | Accountant validation of account mapping and opening-balance policy |
| Tenancy | Composite tenant foreign keys, RLS, scoped runtime grants | Real session/API adversarial tests and independent review |
| Contributions | Versioned obligations, immutable records, Drizzle verification transaction | Dues scheduler, authenticated member reporting, import migration and correction approval service |
| Reconciliation | Exact-amount manual match, duplicate IDs, immutable bank evidence | Reviewed adapters for real bank CSV formats and overpayments/split allocations |
| Governance | Unique reviewers, anti-self-approval DB guard, append-only decisions | MFA/reauthentication, versioned appointments, handover and complete policy engine |
| Rotations | Clickable locked schedule, approvals and external payment evidence | Persisted rotation/payout tables and transactional disbursement/advance service |
| Benefits | Clickable coverage, calendar waiting periods and rule-aware decisions | Persisted covered persons/rule rules/requests, full eligibility policies and review permissions |
| Reporting | Balanced demo journal CSV, print/Save PDF, safe aggregate sharing | Scoped production report generation, independent reconciliation sample |
| Identity | None exposed; live financial service has no public endpoint | Verified registration, secure sessions, rate limits, passkeys/MFA, recovery |
| Documents | None accepted or stored | Private buckets, authorisation, malware controls, retention, expiring links |
| Reliability | Automated tests, real PostgreSQL concurrency cases and pinned CI | Managed PostgreSQL multi-connection retries/deadlocks, observability and incident response |
| Recovery | Local test database only | Encrypted monitored backups and a documented restoration exercise |
| Commercial | Pricing hypotheses displayed, no purchases accepted | Billing entitlements, signed webhook validation, paid pilot measurements |
| POPIA | Prototype privacy statement, data minimisation | Legal privacy notice, processing terms, access/deletion/retention processes |

## Next vertical slices

1. Secure identity and society creation: verified sessions, MFA for approvers, invites, scoped roles, committee history, a real authenticated workspace. Keep operator access denied by default.
2. Complete shared financial cycle: durable due generation, member payment reporting, validated CSV adapters, partial/split allocations, dual-approved corrections, imported opening balances and production statements.
3. Complete rotating payouts: persisted locked rotations, resignation/delay rules, approval policy, funds checks, idempotent external-disbursement recording and rotation advancement.
4. Persist burial administration: minimised covered-person records, effective rule versions, event-date eligibility and evidence review, committee decisions and external benefit-payment recording.
5. Operate a private pilot: restore backup, test cross-tenant APIs, review dependencies/security, reconcile real reports, measure onboarding and accuracy. Add billing after launch gates pass.

## Required deployment controls

Use TLS, distinct owner/runtime DB roles, encrypted storage/backups and a private document bucket. Never give browser clients direct SQL access. Never use unverified user IDs to set PostgreSQL context. Set context inside each transaction so pooled connections cannot leak a previous tenant. Reject unauthenticated mutations, limit input/body size, validate origin/CSRF as applicable, and redact sensitive fields from logs.

The service worker must continue to bypass financial/private data and every non-GET request when live auth/API routes are added. Its whitelist caches only public static paths. No financial offline writes are queued. Browser chrome and installation capabilities vary; progressive fallback guidance is intentional.

## Release evidence

A launch review needs recorded results for cross-society access, duplicate verification under two independent PostgreSQL connections, approval impersonation/self-approval, concurrent allocations, reversal consistency, rule-history preservation, bank-match duplication, external payout evidence, report-to-ledger reconciliation, authorised document access/malware checks and backup restoration. Document remediation of all high-severity independent-review findings before paying societies are onboarded.
