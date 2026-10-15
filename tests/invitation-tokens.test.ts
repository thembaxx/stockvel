import { describe, expect, it } from "vitest";
import {
  createInvitationToken, hashInvitationToken, invitationEmail,
  invitationIsActive, invitationRole, invitationTokenMatches,
} from "../src/server/invitations/tokens";

describe("invitation security", () => {
  it("generates random 256-bit tokens and stores only digests", () => {
    const a = createInvitationToken();
    const b = createInvitationToken();
    expect(a.token).toMatch(/^[a-f0-9]{64}$/);
    expect(a.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(a.tokenHash).not.toBe(a.token);
    expect(a.token).not.toBe(b.token);
    expect(invitationTokenMatches(a.token, a.tokenHash)).toBe(true);
    expect(invitationTokenMatches(b.token, a.tokenHash)).toBe(false);
  });
  it("rejects malformed tokens safely", () => {
    const { tokenHash } = createInvitationToken();
    expect(invitationTokenMatches("hello", tokenHash)).toBe(false);
    expect(invitationTokenMatches("a".repeat(64), "bad")).toBe(false);
    expect(() => hashInvitationToken("abc")).toThrow("INVALID_INVITATION_TOKEN");
  });
  it("denies expired, accepted and revoked invitations", () => {
    const future = new Date(Date.now() + 10000);
    const past = new Date(Date.now() - 10000);
    expect(invitationIsActive({ expiresAt: future, acceptedAt: null, revokedAt: null })).toBe(true);
    expect(invitationIsActive({ expiresAt: past, acceptedAt: null, revokedAt: null })).toBe(false);
    expect(invitationIsActive({ expiresAt: future, acceptedAt: new Date(), revokedAt: null })).toBe(false);
    expect(invitationIsActive({ expiresAt: future, acceptedAt: null, revokedAt: new Date() })).toBe(false);
  });
  it("restricts invited roles and normalizes email", () => {
    expect(invitationRole.safeParse("chairperson").success).toBe(false);
    expect(invitationRole.safeParse("treasurer").success).toBe(true);
    expect(invitationEmail.parse("Someone@Example.co.za")).toBe("someone@example.co.za");
  });
});
