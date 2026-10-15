import "server-only";
import { sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/server/db/client";
import { memberships } from "@/server/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import {
  validateVerifiedIdentity,
  type VerifiedIdentity,
} from "./session";

export type SocietyRole = "chairperson" | "treasurer" | "secretary" | "approver" | "member";
export const COMMITTEE_ROLES: readonly SocietyRole[] = [
  "chairperson", "treasurer", "secretary", "approver",
];

/**
 * All tenant-scoped work runs in one transaction with LOCAL PostgreSQL
 * context, so pooled connections cannot leak a previous tenant's identity.
 *
 * Only pass an identity obtained from a trusted server-side auth adapter.
 * The application DB role must be unprivileged and subject to RLS.
 */
export async function withSocietyAccess<T>(
  db: Database,
  identity: VerifiedIdentity,
  rawSocietyId: string,
  allowedRoles: readonly SocietyRole[],
  work: (tx: Parameters<Parameters<Database["transaction"]>[0]>[0], role: SocietyRole) => Promise<T>,
): Promise<T> {
  const session = validateVerifiedIdentity(identity);
  const societyId = z.uuid().parse(rawSocietyId);
  if (allowedRoles.length === 0) throw new Error("FORBIDDEN");
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.actor_id', ${session.userId}, true), set_config('app.society_id', ${societyId}, true)`);
    const [membership] = await tx.select({ role: memberships.role })
      .from(memberships)
      .where(and(
        eq(memberships.societyId, societyId),
        eq(memberships.userId, session.userId),
        isNull(memberships.endedAt),
      ));
    if (!membership || !allowedRoles.includes(membership.role as SocietyRole)) {
      throw new Error("FORBIDDEN");
    }
    return work(tx, membership.role as SocietyRole);
  });
}
