import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/server/db/client";
import {
  memberships,
  payments,
  bankTransactions,
  obligations,
  journalEntries,
  journalLines,
  ledgerAccounts,
  allocations,
  auditEvents,
} from "@/server/db/schema";

const inputSchema = z
  .object({
    societyId: z.uuid(),
    paymentId: z.uuid(),
    bankTransactionId: z.uuid(),
    obligationId: z.uuid(),
  })
  .strict();
export type AuthenticatedActor = { userId: string };
/** Internal service, deliberately NOT exposed by an unauthenticated API.
 * The caller must derive actor.userId from a verified server session, never request JSON.
 * RLS context is transaction-local and membership is checked before financial work.
 */
export async function verifyReportedPayment(db: Database, actor: AuthenticatedActor, raw: unknown) {
  const input = inputSchema.parse(raw);
  z.uuid().parse(actor.userId);
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.actor_id',${actor.userId},true),set_config('app.society_id',${input.societyId},true)`,
    );
    const [membership] = await tx
      .select()
      .from(memberships)
      .where(and(eq(memberships.societyId, input.societyId), eq(memberships.userId, actor.userId)));
    if (
      !membership ||
      membership.endedAt ||
      !["treasurer", "chairperson"].includes(membership.role)
    )
      throw new Error("FORBIDDEN");
    // Retried or simultaneous requests lock the same receipt before inspecting its state.
    const [payment] = await tx
      .select()
      .from(payments)
      .where(and(eq(payments.societyId, input.societyId), eq(payments.id, input.paymentId)))
      .for("update");
    if (!payment) throw new Error("PAYMENT_NOT_FOUND");
    if (payment.status === "verified") {
      if (payment.bankTransactionId !== input.bankTransactionId)
        throw new Error("IDEMPOTENCY_CONFLICT");
      const [allocation] = await tx
        .select()
        .from(allocations)
        .where(
          and(
            eq(allocations.societyId, input.societyId),
            eq(allocations.paymentId, payment.id),
            eq(allocations.obligationId, input.obligationId),
          ),
        );
      if (!allocation) throw new Error("IDEMPOTENCY_CONFLICT");
      return { paymentId: payment.id, journalEntryId: payment.journalEntryId, replayed: true };
    }
    if (payment.status !== "reported") throw new Error("INVALID_PAYMENT_STATE");
    const [bank] = await tx
      .select()
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.societyId, input.societyId),
          eq(bankTransactions.id, input.bankTransactionId),
        ),
      )
      .for("update");
    const [obligation] = await tx
      .select()
      .from(obligations)
      .where(
        and(eq(obligations.societyId, input.societyId), eq(obligations.id, input.obligationId)),
      )
      .for("update");
    if (!bank || bank.amountCents !== payment.amountCents)
      throw new Error("BANK_EVIDENCE_MISMATCH");
    if (!obligation || obligation.membershipId !== payment.membershipId)
      throw new Error("OBLIGATION_MISMATCH");
    const accounts = await tx
      .select()
      .from(ledgerAccounts)
      .where(eq(ledgerAccounts.societyId, input.societyId));
    const bankAccount = accounts.find((a) => a.code === "bank");
    const clearing = accounts.find((a) => a.code === "member-fund");
    if (!bankAccount || !clearing) throw new Error("CHART_OF_ACCOUNTS_NOT_CONFIGURED");
    const [entry] = await tx
      .insert(journalEntries)
      .values({
        societyId: input.societyId,
        actorId: actor.userId,
        idempotencyKey: `verify:${payment.id}`,
        reference: `Verified contribution: ${payment.reference}`,
      })
      .returning();
    await tx.insert(journalLines).values([
      {
        societyId: input.societyId,
        entryId: entry.id,
        accountId: bankAccount.id,
        debitCents: payment.amountCents,
        creditCents: 0n,
      },
      {
        societyId: input.societyId,
        entryId: entry.id,
        accountId: clearing.id,
        debitCents: 0n,
        creditCents: payment.amountCents,
      },
    ]);
    await tx
      .update(journalEntries)
      .set({ status: "posted" })
      .where(and(eq(journalEntries.societyId, input.societyId), eq(journalEntries.id, entry.id)));
    await tx
      .update(payments)
      .set({ status: "verified", journalEntryId: entry.id, bankTransactionId: bank.id })
      .where(and(eq(payments.societyId, input.societyId), eq(payments.id, payment.id)));
    // DB trigger enforces both payment and obligation allocation ceilings under locks.
    await tx.insert(allocations).values({
      societyId: input.societyId,
      paymentId: payment.id,
      obligationId: obligation.id,
      amountCents: payment.amountCents,
    });
    await tx.insert(auditEvents).values({
      societyId: input.societyId,
      actorId: actor.userId,
      action: "payment.verified",
      entityId: payment.id,
      reason: `Bank evidence ${bank.id}; obligation ${obligation.id}`,
    });
    return { paymentId: payment.id, journalEntryId: entry.id, replayed: false };
  });
}
