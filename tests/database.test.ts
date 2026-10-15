import { beforeAll, afterAll, beforeEach, afterEach, describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFile } from "node:fs/promises";
import { verifyReportedPayment } from "../src/server/accounting/verify-payment";
import { withSocietyAccess } from "../src/server/auth/tenant-context";
import type { Database } from "../src/server/db/client";
import * as schema from "../src/server/db/schema";
const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const tenant = uid(1),
  other = uid(2),
  treasurer = uid(3),
  chair = uid(4),
  member = uid(5),
  outsider = uid(6);
let pg: PGlite;
let db: Database;
let seed: string;
async function query(sql: string) {
  return pg.exec(sql);
}
async function context(actor = treasurer, society = tenant) {
  await query(
    `SET ROLE stokvel_app; SELECT set_config('app.actor_id','${actor}',false),set_config('app.society_id','${society}',false);`,
  );
}
async function resetRole() {
  await query("RESET ROLE;");
}
describe("PostgreSQL constraints and transactional payment service", () => {
  beforeAll(async () => {
    pg = new PGlite();
    await pg.waitReady;
    await query(await readFile("drizzle/0000_volatile_network.sql", "utf8"));
    await query(await readFile("drizzle/0001_financial_guards.sql", "utf8"));
    await query("CREATE ROLE stokvel_app;");
    await query(await readFile("scripts/provision.sql", "utf8"));
    seed = `INSERT INTO users(id,email) VALUES('${treasurer}','treasurer@example.test'),('${chair}','chair@example.test'),('${member}','member@example.test'),('${outsider}','other@example.test');
   INSERT INTO societies(id,name,type) VALUES('${tenant}','A','rotating'),('${other}','B','burial');
   INSERT INTO memberships(id,society_id,user_id,role) VALUES('${uid(10)}','${tenant}','${treasurer}','treasurer'),('${uid(11)}','${tenant}','${chair}','chairperson'),('${uid(12)}','${tenant}','${member}','member'),('${uid(13)}','${other}','${outsider}','treasurer');
   INSERT INTO rule_versions(id,society_id,version,contribution_cents,effective_at) VALUES('${uid(20)}','${tenant}',1,50000,'2026-01-01'),('${uid(21)}','${other}',1,50000,'2026-01-01');
   INSERT INTO contribution_obligations(id,society_id,membership_id,rule_version_id,amount_cents,period,due_at) VALUES('${uid(30)}','${tenant}','${uid(12)}','${uid(20)}',50000,'2026-10','2026-10-05');
   INSERT INTO ledger_accounts(id,society_id,code,name) VALUES('${uid(40)}','${tenant}','bank','Bank'),('${uid(41)}','${tenant}','member-fund','Member fund'),('${uid(42)}','${other}','bank','Other bank');
   INSERT INTO bank_transactions(id,society_id,external_id,reference,amount_cents,transaction_at) VALUES('${uid(50)}','${tenant}','BANK-1','REF-1',30000,'2026-10-01'),('${uid(51)}','${tenant}','BANK-2','REF-2',30000,'2026-10-02');
   INSERT INTO payments(id,society_id,membership_id,reported_by,amount_cents,idempotency_key,reference) VALUES('${uid(60)}','${tenant}','${uid(12)}','${treasurer}',30000,'REPORT-1','REF-1'),('${uid(61)}','${tenant}','${uid(12)}','${treasurer}',30000,'REPORT-2','REF-2');
   INSERT INTO approval_requests(id,society_id,proposer_id,kind,reference) VALUES('${uid(70)}','${tenant}','${treasurer}','payout','PAYOUT-1');`;
    await query(seed);
    db = drizzle(pg, { schema }) as unknown as Database;
  });
  afterAll(async () => {
    await pg?.close();
  });
  beforeEach(async () => {
    await query("RESET ROLE; TRUNCATE users,societies CASCADE;");
    await query(seed);
  });
  afterEach(async () => {
    await query(
      "RESET ROLE; SELECT set_config('app.actor_id','',false),set_config('app.society_id','',false);",
    );
  });
  const verify = async () => {
    await query("SET ROLE stokvel_app");
    return verifyReportedPayment(
      db,
      { userId: treasurer },
      { societyId: tenant, paymentId: uid(60), bankTransactionId: uid(50), obligationId: uid(30) },
    );
  };
  it("rejects ended memberships in the tenant-scoped service helper", async () => {
    await query(`UPDATE memberships SET ended_at=now() WHERE society_id='${tenant}' AND user_id='${treasurer}'`);
    await query("SET ROLE stokvel_app");
    const now = Date.now();
    await expect(withSocietyAccess(
      db,
      {
        userId: treasurer,
        authenticatedAt: new Date(now - 60_000),
        expiresAt: new Date(now + 3_600_000),
        mfaVerifiedAt: null,
      },
      tenant,
      ["treasurer"],
      async () => "access granted",
    )).rejects.toThrow("FORBIDDEN");
  });
  it("service allocates R300 against R500 and replays without a second posting", async () => {
    const first = await verify();
    const second = await verify();
    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    await resetRole();
    const result = await pg.query<{ due: string }>(
      `SELECT (o.amount_cents-coalesce(sum(a.amount_cents),0))::text AS due FROM contribution_obligations o LEFT JOIN payment_allocations a ON a.society_id=o.society_id AND a.obligation_id=o.id WHERE o.id='${uid(30)}' GROUP BY o.id`,
    );
    expect(result.rows[0].due).toBe("20000");
    const count = await pg.query<{ n: number }>(
      "SELECT count(*)::int n FROM journal_entries WHERE status='posted'",
    );
    expect(count.rows[0].n).toBe(1);
  });
  it("journal rejects an unbalanced posting at the database layer", async () => {
    await query(
      `INSERT INTO journal_entries(id,society_id,actor_id,idempotency_key,reference) VALUES('${uid(80)}','${tenant}','${treasurer}','J-1','Test'); INSERT INTO journal_lines(society_id,entry_id,account_id,debit_cents,credit_cents) VALUES('${tenant}','${uid(80)}','${uid(40)}',100,0),('${tenant}','${uid(80)}','${uid(41)}',0,99);`,
    );
    await expect(
      query(`UPDATE journal_entries SET status='posted' WHERE id='${uid(80)}'`),
    ).rejects.toThrow("balance");
  });
  it("posted entries cannot be edited", async () => {
    await verify();
    await resetRole();
    await expect(
      query("UPDATE journal_entries SET reference='rewritten' WHERE status='posted'"),
    ).rejects.toThrow("immutable");
  });
  it("new lines cannot be appended to a posted journal", async () => {
    const result = await verify();
    await resetRole();
    await expect(
      query(
        `INSERT INTO journal_lines(society_id,entry_id,account_id,debit_cents) VALUES('${tenant}','${result.journalEntryId}','${uid(40)}',1)`,
      ),
    ).rejects.toThrow("immutable");
  });
  it("same-tenant foreign keys reject a bank account from another society", async () => {
    await query(
      `INSERT INTO journal_entries(id,society_id,actor_id,idempotency_key,reference) VALUES('${uid(80)}','${tenant}','${treasurer}','J-1','Test')`,
    );
    await expect(
      query(
        `INSERT INTO journal_lines(society_id,entry_id,account_id,debit_cents) VALUES('${tenant}','${uid(80)}','${uid(42)}',100)`,
      ),
    ).rejects.toThrow();
  });
  it("RLS denies a society A actor when context points at society B", async () => {
    await context(treasurer, other);
    const result = await pg.query("SELECT * FROM ledger_accounts");
    expect(result.rows).toHaveLength(0);
  });
  it("members cannot read the committee journal or other members' payment details", async () => {
    await verify();
    await resetRole();
    await context(member);
    expect((await pg.query("SELECT * FROM journal_entries")).rows).toHaveLength(0);
    expect((await pg.query("SELECT * FROM payments")).rows).toHaveLength(2);
  });
  it("self-approval is rejected by a trigger", async () => {
    await context();
    await expect(
      query(
        `INSERT INTO approval_decisions(society_id,request_id,actor_id,decision,reason) VALUES('${tenant}','${uid(70)}','${treasurer}','approve','Self approve')`,
      ),
    ).rejects.toThrow("self approval");
  });
  it("same individual cannot create two approval decisions", async () => {
    await context(chair);
    await query(
      `INSERT INTO approval_decisions(society_id,request_id,actor_id,decision,reason) VALUES('${tenant}','${uid(70)}','${chair}','approve','Reviewed funds')`,
    );
    await expect(
      query(
        `INSERT INTO approval_decisions(society_id,request_id,actor_id,decision,reason) VALUES('${tenant}','${uid(70)}','${chair}','approve','Second role approval')`,
      ),
    ).rejects.toThrow();
  });
  it("allocation ceilings roll back all of a second overpaying verification", async () => {
    await verify();
    await expect(
      verifyReportedPayment(
        db,
        { userId: treasurer },
        {
          societyId: tenant,
          paymentId: uid(61),
          bankTransactionId: uid(51),
          obligationId: uid(30),
        },
      ),
    ).rejects.toThrow();
    await resetRole();
    const r = await pg.query<{ status: string }>(
      `SELECT status FROM payments WHERE id='${uid(61)}'`,
    );
    expect(r.rows[0].status).toBe("reported");
    expect(
      (await pg.query("SELECT * FROM journal_entries WHERE status='posted'")).rows,
    ).toHaveLength(1);
  });
  it("rule changes cannot rewrite historical obligations", async () => {
    await expect(
      query(`UPDATE rule_versions SET contribution_cents=60000 WHERE id='${uid(20)}'`),
    ).rejects.toThrow("append-only");
  });
});
