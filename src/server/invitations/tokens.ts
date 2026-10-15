import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const invitationEmail = z.email().max(320).transform((value) => value.trim().toLowerCase());
export const invitationRole = z.enum(["treasurer", "secretary", "approver", "member"]);
// Chairperson privileges require a separately audited governance process.
export const invitationLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const tokenPattern = /^[a-f0-9]{64}$/;

export function createInvitationToken() {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashInvitationToken(token) };
}

/** Persist only the digest; never log or store the bearer token. */
export function hashInvitationToken(token: string) {
  if (!tokenPattern.test(token)) throw new Error("INVALID_INVITATION_TOKEN");
  return createHash("sha256").update(token, "ascii").digest("hex");
}

export function invitationTokenMatches(token: string, storedHash: string) {
  if (!tokenPattern.test(token) || !tokenPattern.test(storedHash)) return false;
  return timingSafeEqual(
    Buffer.from(hashInvitationToken(token), "hex"),
    Buffer.from(storedHash, "hex"),
  );
}

export function invitationIsActive(
  record: { expiresAt: Date; acceptedAt: Date | null; revokedAt: Date | null },
  now = new Date(),
) {
  return record.acceptedAt === null && record.revokedAt === null && record.expiresAt > now;
}
