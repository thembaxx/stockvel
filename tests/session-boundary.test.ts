import { describe, expect, it } from "vitest";
import {
  AuthenticationRequired,
  StepUpRequired,
  requireFreshMfa,
  validateVerifiedIdentity,
} from "../src/server/auth/session";

const now = new Date("2026-10-15T12:00:00.000Z");
const identity = {
  userId: "2c0f3e8e-f782-4d52-8b7a-f92bd4cce874",
  authenticatedAt: new Date("2026-10-15T11:00:00.000Z"),
  expiresAt: new Date("2026-10-15T13:00:00.000Z"),
  mfaVerifiedAt: new Date("2026-10-15T11:59:00.000Z"),
};
describe("verified session boundary", () => {
  it("accepts an unexpired server-verified identity", () => {
    expect(validateVerifiedIdentity(identity, now).userId).toBe(identity.userId);
  });
  it("fails closed for missing, forged-shape, expired or future sessions", () => {
    for (const candidate of [
      null, {}, { ...identity, userId: "not-a-uuid" },
      { ...identity, userId: identity.userId, extra: "untrusted" },
      { ...identity, expiresAt: now },
      { ...identity, authenticatedAt: new Date("2026-10-15T12:01:00Z") },
      { ...identity, mfaVerifiedAt: new Date("2026-10-15T12:01:00Z") },
    ]) expect(() => validateVerifiedIdentity(candidate, now)).toThrow(AuthenticationRequired);
  });
  it("requires recent MFA for sensitive actions", () => {
    expect(() => requireFreshMfa(identity, now)).not.toThrow();
    expect(() => requireFreshMfa({ ...identity, mfaVerifiedAt: null }, now)).toThrow(StepUpRequired);
    expect(() => requireFreshMfa({
      ...identity, mfaVerifiedAt: new Date("2026-10-15T11:54:00Z"),
    }, now)).toThrow(StepUpRequired);
  });
});
