import "server-only";
import { z } from "zod";

/**
 * Authentication-provider adapter boundary. No caller may construct a session
 * from request JSON, cookies, headers, or client-supplied user identifiers.
 *
 * The adapter must verify the session cryptographically and resolve its
 * subject to an existing internal users.id before returning an identity.
 */
const verifiedIdentitySchema = z.object({
  userId: z.uuid(),
  expiresAt: z.date(),
  authenticatedAt: z.date(),
  mfaVerifiedAt: z.date().nullable(),
}).strict();

export type VerifiedIdentity = Readonly<z.infer<typeof verifiedIdentitySchema>>;

export class AuthenticationRequired extends Error {
  constructor() {
    super("AUTHENTICATION_REQUIRED");
  }
}

export class StepUpRequired extends Error {
  constructor() {
    super("STEP_UP_REQUIRED");
  }
}

export function validateVerifiedIdentity(
  identity: unknown,
  now: Date = new Date(),
): VerifiedIdentity {
  const parsed = verifiedIdentitySchema.safeParse(identity);
  if (!parsed.success) throw new AuthenticationRequired();
  const session = parsed.data;
  if (
    Number.isNaN(now.getTime()) ||
    session.expiresAt.getTime() <= now.getTime() ||
    session.authenticatedAt.getTime() > now.getTime() ||
    session.authenticatedAt.getTime() >= session.expiresAt.getTime() ||
    (session.mfaVerifiedAt !== null &&
      (session.mfaVerifiedAt.getTime() > now.getTime() ||
        session.mfaVerifiedAt.getTime() < session.authenticatedAt.getTime()))
  ) throw new AuthenticationRequired();
  return Object.freeze(session);
}

/**
 * Enforce fresh MFA for sensitive committee decisions and payouts.
 * A verified identity alone does NOT confer membership or financial rights.
 */
export function requireFreshMfa(
  identity: VerifiedIdentity,
  now: Date = new Date(),
  maxAgeMs = 5 * 60_000,
): void {
  const session = validateVerifiedIdentity(identity, now);
  const at = session.mfaVerifiedAt?.getTime();
  if (
    at === undefined ||
    !Number.isFinite(maxAgeMs) ||
    maxAgeMs <= 0 ||
    now.getTime() - at > maxAgeMs
  ) throw new StepUpRequired();
}
