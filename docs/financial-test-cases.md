# Financial cases for prototype and pilot validation

All money values are ZAR, implemented in integer cents. The executable cases live in `tests/financial.test.ts`, `tests/database.test.ts` and `tests/e2e/workflows.spec.ts`.

| Real-world case | Expected result |
| --- | --- |
| Member owes R500 and reports R300 | R500 remains outstanding until the receipt is matched and verified; then R200 remains |
| Same report is retried | Same receipt returned; conflicting reuse of the request key fails |
| Verification request is retried | One journal entry and allocation; subsequent request replays the result |
| Second receipt uses an already-matched bank transaction | Rejected; bank evidence is not reused |
| A second R300 receipt targets an obligation with R200 remaining | Entire verification transaction rolls back; no partial journal or audit posting |
| Receipt is reversed for a recorded error | Original posting/evidence remains; compensating entry restores obligation and bank balance |
| Unbalanced journal is posted | PostgreSQL rejects posting even if frontend validation is bypassed |
| Posted entry is edited or receives another line | PostgreSQL rejects the mutation |
| Society A journal line references Society B account | Composite foreign key rejects it |
| Society A actor selects Society B context | RLS returns no private tenant rows |
| Member tries to read committee journal | Denied; own operational payments remain readable |
| One person approves twice under different roles | Unique identity constraint and domain guard reject it |
| Payout proposer attempts self-approval | Rejected; the reasoned decision history is preserved |
| 12 members each owe R500 | Nominal R6000 payout displayed separately from verified funds and collection shortfall |
| Scheduled payout lacks two approvals or external evidence | Cannot be labelled completed or posted as paid |
| Parent coverage starts 31 January with one calendar-month wait | Eligible from 28 February; not 27 February |
| Benefit request is declined | Decision reason, reviewer and applicable rule version are retained |
| Rules change for next cycle | Existing obligations retain amount/rule version and cannot be rewritten |
| Browser goes offline during a payment form | Save fails with a reconnect message; no mutation is queued |
| Browser reloads a private view offline | A non-sensitive offline shell appears; no dashboard HTML or private data is cached |

The seeded demo separates R6200 of reconciled prior-cycle carryover from R4300 verified October contributions. There are R1000 reported payments outside the journal and R1700 outstanding monthly obligations. This yields R10500 available verified funds; it does not imply that October's R6000 collection target has been reached.

PGlite tests establish PostgreSQL constraint and rollback behavior in one connection. An additional real PostgreSQL suite verifies simultaneous service requests over two independent unprivileged runtime connections, bank-match uniqueness, allocation ceilings and transaction-context cleanup. Pilot release still needs real managed-PostgreSQL multi-connection/concurrency tests, reviewed bank CSV samples and an accountant-approved opening-balance/clearing policy.
