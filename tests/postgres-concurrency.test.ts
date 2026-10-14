import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { readFile } from "node:fs/promises";
import { verifyReportedPayment } from "../src/server/accounting/verify-payment";
const url = process.env.POSTGRES_TEST_URL;
const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const suite = url ? describe : describe.skip;
suite("independent PostgreSQL connections", () => {
  const tenant = uid(1),
    treasurer = uid(3),
    member = uid(5);
  let owner: postgres.Sql;
  let first: postgres.Sql;
  let second: postgres.Sql;
  beforeAll(async () => {
    const connection = new URL(url!);
    if (!connection.pathname.endsWith("_test"))
      throw new Error(
        "POSTGRES_TEST_URL must point at a dedicated database whose name ends in _test.",
      );
    owner = postgres(url!, { max: 1 });
    // Dedicated disposable test database only. Never run this fixture against production.
    await owner.unsafe("DROP SCHEMA public CASCADE;CREATE SCHEMA public;");
    await owner.unsafe(await readFile("drizzle/0000_volatile_network.sql", "utf8"));
    await owner.unsafe(await readFile("drizzle/0001_financial_guards.sql", "utf8"));
    await owner.unsafe(
      "DO $$ BEGIN IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='stokvel_app') THEN CREATE ROLE stokvel_app LOGIN PASSWORD 'isolated-test-only'; END IF; END $$;",
    );
    await owner.unsafe("ALTER ROLE stokvel_app LOGIN PASSWORD 'isolated-test-only';");
    await owner.unsafe(await readFile("scripts/provision.sql", "utf8"));
    connection.username = "stokvel_app";
    connection.password = "isolated-test-only";
    first = postgres(connection.toString(), { max: 1 });
    second = postgres(connection.toString(), { max: 1 });
  });
  afterAll(async () => {
    await Promise.all([first?.end(), second?.end(), owner?.end()]);
  });
  beforeEach(async () => {
    await owner.unsafe(`TRUNCATE users,societies CASCADE;
   INSERT INTO users(id,email) VALUES('${treasurer}','treasurer@example.test'),('${member}','member@example.test');
   INSERT INTO societies(id,name,type) VALUES('${tenant}','Concurrent society','rotating');
   INSERT INTO memberships(id,society_id,user_id,role) VALUES('${uid(10)}','${tenant}','${treasurer}','treasurer'),('${uid(12)}','${tenant}','${member}','member');
   INSERT INTO rule_versions(id,society_id,version,contribution_cents,effective_at) VALUES('${uid(20)}','${tenant}',1,50000,'2026-01-01');
   INSERT INTO contribution_obligations(id,society_id,membership_id,rule_version_id,amount_cents,period,due_at) VALUES('${uid(30)}','${tenant}','${uid(12)}','${uid(20)}',50000,'2026-10','2026-10-05');
   INSERT INTO ledger_accounts(id,society_id,code,name) VALUES('${uid(40)}','${tenant}','bank','Bank'),('${uid(41)}','${tenant}','member-fund','Fund');
   INSERT INTO bank_transactions(id,society_id,external_id,reference,amount_cents,transaction_at) VALUES('${uid(50)}','${tenant}','B1','REF1',30000,'2026-10-01'),('${uid(51)}','${tenant}','B2','REF2',30000,'2026-10-02');
   INSERT INTO payments(id,society_id,membership_id,reported_by,amount_cents,idempotency_key,reference) VALUES('${uid(60)}','${tenant}','${uid(12)}','${treasurer}',30000,'R1','REF1'),('${uid(61)}','${tenant}','${uid(12)}','${treasurer}',30000,'R2','REF2');`);
  });
  const verify = (client: postgres.Sql, payment = 60, bank = 50) =>
    verifyReportedPayment(
      drizzle(client),
      { userId: treasurer },
      {
        societyId: tenant,
        paymentId: uid(payment),
        bankTransactionId: uid(bank),
        obligationId: uid(30),
      },
    );
  it("simultaneous verification of one receipt produces one posting and audit event", async () => {
    const results = await Promise.all([verify(first), verify(second)]);
    expect(results.filter((r) => r.replayed)).toHaveLength(1);
    const [count] =
      await owner`SELECT (SELECT count(*)::int FROM journal_entries WHERE status='posted') postings,(SELECT count(*)::int FROM audit_events) audits,(SELECT count(*)::int FROM payment_allocations) allocations`;
    expect(count).toMatchObject({ postings: 1, audits: 1, allocations: 1 });
  });
  it("concurrent receipts cannot reconcile the same bank evidence twice", async () => {
    const results = await Promise.allSettled([verify(first, 60, 50), verify(second, 61, 50)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    const [count] =
      await owner`SELECT count(*)::int postings FROM journal_entries WHERE status='posted'`;
    expect(count.postings).toBe(1);
  });
  it("concurrent allocations cannot pay R600 against a R500 obligation", async () => {
    const results = await Promise.allSettled([verify(first, 60, 50), verify(second, 61, 51)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const [total] = await owner`SELECT sum(amount_cents)::text allocated FROM payment_allocations`;
    expect(total.allocated).toBe("30000");
    const [count] = await owner`SELECT count(*)::int n FROM payments WHERE status='reported'`;
    expect(count.n).toBe(1);
  });
  it("pooled runtime connections do not retain the prior transaction's tenant context", async () => {
    await verify(first);
    const [context] =
      await first`SELECT nullif(current_setting('app.society_id',true),'') society,nullif(current_setting('app.actor_id',true),'') actor`;
    expect(context).toMatchObject({ society: null, actor: null });
    expect(await first`SELECT * FROM payments`).toHaveLength(0);
  });
});
