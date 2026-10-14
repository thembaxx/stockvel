# StokvelOS

A mobile-first administration platform for South African rotating stokvels and burial societies. This repository delivers the blueprint’s **first milestone: a clickable prototype, financial test cases and a PostgreSQL financial foundation**.

**Status:** reviewable prototype and tested foundation. The public app uses fictional records in browser memory. Real authentication, live society persistence and production onboarding are not enabled. No money is held or transferred.

## Run locally

Requires Node.js 24 and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
```

Open `http://localhost:3000` for the website, or `/demo` for the workspace. The demo reviewer selector switches between fictional committee identities. Both society types retain their independent state while navigating. Refresh resets all demo changes.

For installation, service-worker and offline verification, run a production build:

```sh
pnpm build
pnpm start
```

PWA features require HTTPS or localhost. Development mode intentionally does not register a service worker. An existing production worker can still control the same origin; unregister it in browser devtools before switching that origin to development mode.

## Delivered workflows

- A reference-inspired, responsive website and treasurer dashboard in powder blue, navy and frosted white.
- Society switching; member register and sample statements; contribution search and status filters.
- Reported payments, manual bank CSV import, evidence matching, verification, rejection and compensating corrections.
- Locked rotation preview, two distinct reviewers and recording of an evidenced external payout.
- Burial coverage/waiting-period review, reasoned committee decisions and external benefit-payment recording under the captured rule version.
- An audit view; balanced monthly CSV export; browser printing / Save as PDF; aggregate WhatsApp and native device sharing.
- An onboarding/rule preview that preserves historical obligations. Invitation previews do not send invitations.

Demo corrections demonstrate an independent chairperson reversal; a complete production correction-request and dual-approval service still needs implementation. The database payment-verification service is internal and deliberately has **no public unauthenticated route**.

## PWA and native behavior

- Installable manifest, 192px/512px icons, a maskable icon, Apple touch icon and home-screen shortcuts.
- Chromium installation prompt when supported; Safari, Android and desktop installation guidance otherwise.
- System light/dark themes with matching early browser `theme-color`, root backgrounds, loading states, offline screen and form colors. The manifest splash background matches the cool off-white page; browsers that ignore theme metadata control their own chrome.
- Safe-area insets, dynamic viewport height, touch targets, accessible dialogs, reduced-motion and forced-colors support.
- Phosphor icons throughout, with no emoji decoration. Restrained Motion transitions for routes, dialogs, toasts and hero imagery; reduced-motion preferences are respected and money values are never animated or approximated.
- Native Web Share API with copy/WhatsApp alternatives. Nothing is sent without the user choosing a destination.
- A small versioned service-worker cache for public interface assets. It never caches dashboard HTML, private society routes, API responses, documents or RSC payloads.
- Offline navigation displays a branded, non-sensitive reconnect screen. Financial mutations require an online connection; no background sync or offline payment/approval queue exists.
- Worker updates wait for an explicit “Update & reload” action. Unsaved demo changes reset on refresh, including update reloads.

Push notifications, automated messages and complex offline financial editing are deferred as specified in the blueprint. The Google AI Mode link returned only a redirect; theming follows https://web.dev/learn/design/theming and the latest powder-blue/navy references.

## Financial foundation

`src/server/db/schema.ts` defines 14 Drizzle/PostgreSQL tables for identity references, tenancy, versioned obligations, receipts, reconciliation evidence, accounts, journal entries/lines, allocations, approvals and audit events.

`drizzle/0001_financial_guards.sql` adds protections not expressed by the generated schema: row-level security, role-scoped reads/writes, immutable posted journal records, balanced posting, immutable rules/obligations/evidence, allocation ceilings under row locks, and distinct authorised approval actors. Same-society composite foreign keys protect tenant relationships. Money uses `bigint` cents end to end.

`src/server/accounting/verify-payment.ts` is a transaction-scoped, validated internal service. It verifies active committee membership, locks receipt/bank/obligation records, posts a balanced journal, allocates funds and writes the audit event atomically. Retries return the existing posting; conflicting evidence fails. `AuthenticatedActor.userId` must be supplied from a verified server session, never from client input.

No production auth provider or financial API is exposed. Do not attach this service to an endpoint without session authentication, MFA/reauthentication policy, request limits, CSRF/origin protection and integration tests for the deployed environment.

### Database setup

Copy `.env.example` to `.env.local` and use distinct migration-owner and application credentials. Do not use the owner or a `BYPASSRLS` role at runtime.

```sh
pnpm db:migrate
```

After reviewing your runtime role, apply `scripts/provision.sql` as the owner. Its example role is `stokvel_app`. It has no role-assignment or governance-configuration writes. PostgreSQL context variables are set transaction-locally by a trusted server; they are not credentials and must never be populated from unverified request identities.

The trigger migration is tracked separately by the runner; future trigger changes must be added as new numbered migrations. `pnpm db:generate` handles schema changes only. Accountants must validate the chart of accounts; the example uses a bank asset and member-fund clearing account.

## Validation

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install --with-deps chromium firefox webkit
pnpm test:e2e
```

Vitest covers real-world partial payments, retries, reversals, tenant access, approval abuse, waiting periods, evidence import and DB constraints. Database tests execute real PostgreSQL semantics in PGlite with an unprivileged runtime role, and exercise the Drizzle verification service. A separate `POSTGRES_TEST_URL` suite exercises two independent PostgreSQL connections: concurrent retries, bank-evidence reuse, allocation ceilings and cleared transaction context. It runs in CI against a disposable PostgreSQL service and was verified locally on PostgreSQL 15.18. Revalidation against the actual managed database remains a deployment gate. The test database name must end in `_test`; its public schema is disposable.

Playwright covers the payment/payout/benefit journeys, reports, 360/768/1440px layouts, dark theme, installation metadata, public-only service-worker caches and offline write rejection. Axe checks automated WCAG issues. Physical budget Android and iOS device testing, low-bandwidth profiling and independent accessibility review remain necessary.

CI uses pinned action commits, read-only permissions, a committed dependency lockfile and ignored lifecycle scripts. The current dependencies ship the platform binaries required by Next.js and the test runner; unrestricted dependency build scripts are not enabled.

## Before live pilot or paid production

See [docs/production-readiness.md](docs/production-readiness.md). This milestone is not a completed 17-week implementation or a production launch. Required follow-on work includes verified sessions and approver MFA, authenticated API wiring, full persisted payout/benefit/correction workflows, document controls, database concurrency testing, monitored backups with a restore drill, POPIA terms/retention processes and independent security/accounting review.

## Design and assets

Visual references inform generous spacing, calm gradients, prominent amounts and restrained cards. Inter and Instrument Serif are served locally, with system fallbacks. The lifestyle image is generated editorial artwork: a woman using her phone in a South African city, with a blue cardigan, soft daylight and a cool palette. It is illustrative, not a testimonial or pilot customer. No analytics or third-party fonts are loaded.
