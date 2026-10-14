import { describe, it, expect } from "vitest";
import {
  createDemo,
  summary,
  outstanding,
  reportPayment,
  verifyPayment,
  reversePayment,
  decidePayout,
  completePayout,
  decideBenefit,
  coverageEligible,
  completeBenefit,
  type Actor,
} from "../src/features/demo/model";
import { formatZar, parseRand } from "../src/lib/money";
import { parseBankCsv } from "../src/lib/bank-csv";
const treasurer: Actor = {
  id: "naledi",
  name: "Naledi Molefe",
  role: "treasurer",
  societyId: "ubuntu",
};
const chair: Actor = {
  id: "sipho",
  name: "Sipho Dlamini",
  role: "chairperson",
  societyId: "ubuntu",
};
const secretary: Actor = {
  id: "thandi",
  name: "Thandi Nkosi",
  role: "secretary",
  societyId: "ubuntu",
};
describe("integer-cent money", () => {
  it("groups four-digit rand amounts consistently across browser locales", () => {
    expect(formatZar(480000n)).toBe("R 4 800.00");
  });
  it("parses rand without floating point", () => {
    expect(parseRand("0.29")).toBe(29n);
    expect(parseRand("500.1")).toBe(50010n);
    expect(formatZar(50010n)).toBe("R 500.10");
  });
  it.each(["1e3", "0.001", "-1", "NaN", "1,000.00", ""])("rejects ambiguous input %s", (value) =>
    expect(() => parseRand(value)).toThrow(),
  );
  it("formats values beyond the JS safe integer range without losing cents", () =>
    expect(formatZar(9007199254740993n)).toBe("R 90 071 992 547 409.93"));
});
describe("real-world contribution cases", () => {
  it("reported R300 leaves R500 due until verified, then R200 remains", () => {
    let s = createDemo();
    s = reportPayment(s, treasurer, {
      memberId: "m12",
      amount: 30000n,
      reference: "UBU-012",
      idempotencyKey: "partial",
    });
    expect(outstanding(s, "m12")).toBe(50000n);
    const payment = s.payments[0];
    s = {
      ...s,
      banks: [
        ...s.banks,
        { id: "partial-bank", date: "2026-10-14", reference: "UBU-012", amount: 30000n },
      ],
    };
    s = verifyPayment(s, treasurer, payment.id, "partial-bank");
    expect(outstanding(s, "m12")).toBe(20000n);
  });
  it("retrying a reported payment does not create a second receipt", () => {
    const input = {
      memberId: "m12",
      amount: 30000n,
      reference: "UBU-012",
      idempotencyKey: "retry",
    };
    const first = reportPayment(createDemo(), treasurer, input);
    expect(reportPayment(first, treasurer, input)).toBe(first);
    expect(() => reportPayment(first, treasurer, { ...input, amount: 40000n })).toThrow(
      "different payment",
    );
  });
  it("verification retry posts only once", () => {
    const once = verifyPayment(createDemo(), treasurer, "p10", "b10");
    expect(verifyPayment(once, treasurer, "p10", "b10")).toBe(once);
    expect(once.journal.filter((j) => j.id === "j-p10")).toHaveLength(1);
  });
  it("one bank transaction cannot reconcile two payments", () => {
    let s = verifyPayment(createDemo(), treasurer, "p10", "b10");
    expect(() => verifyPayment(s, treasurer, "p11", "b10")).toThrow("already been reconciled");
  });
  it("cross-society verification fails", () =>
    expect(() =>
      verifyPayment(createDemo(), { ...treasurer, societyId: "elsewhere" }, "p10", "b10"),
    ).toThrow("permission"));
  it("member cannot verify a payment", () =>
    expect(() =>
      verifyPayment(createDemo(), { ...treasurer, role: "member" }, "p10", "b10"),
    ).toThrow("permission"));
  it("a reversal restores dues and retains original posting and evidence", () => {
    const initial = createDemo();
    const reversed = reversePayment(initial, chair, "p9", "Wrong payment allocation");
    expect(outstanding(reversed, "m9")).toBe(50000n);
    expect(reversed.journal).toHaveLength(initial.journal.length + 1);
    expect(reversed.journal.find((j) => j.id === "j-p9")).toEqual(
      initial.journal.find((j) => j.id === "j-p9"),
    );
    expect(summary(reversed).funds).toBe(summary(initial).funds - 30000n);
    expect(reversed.banks.find((b) => b.id === "b9")?.matchedPaymentId).toBe("p9");
  });
  it("reversal proposer cannot approve their own correction", () => {
    const s = createDemo();
    s.journal.find((j) => j.id === "j-p9")!.actorId = "sipho";
    expect(() => reversePayment(s, chair, "p9", "Mistaken reference")).toThrow(
      "different committee member",
    );
  });
  it("every journal entry balances and pending receipts stay outside it", () => {
    const s = createDemo();
    for (const j of s.journal)
      expect(j.lines.reduce((n, l) => n + l.debit - l.credit, 0n)).toBe(0n);
    expect(summary(s)).toMatchObject({
      verified: 430000n,
      pending: 100000n,
      due: 170000n,
      funds: 1050000n,
    });
  });
});
describe("rotating payout governance", () => {
  it("shows nominal R6000 separately from verified available funds", () => {
    const s = createDemo();
    expect(s.payout.amount).toBe(600000n);
    expect(summary(s).funds).toBe(1050000n);
  });
  it("one individual with multiple roles cannot approve twice", () => {
    let s = decidePayout(createDemo(), chair, "Reviewed available funds");
    expect(() =>
      decidePayout(s, { ...chair, role: "secretary" }, "Approve under second role"),
    ).toThrow("different authorised person");
    expect(s.payout.status).toBe("scheduled");
  });
  it("payout proposer cannot approve their own request", () =>
    expect(() =>
      decidePayout(createDemo(), { ...treasurer, role: "chairperson" }, "Self approval attempt"),
    ).toThrow("proposer"));
  it("cannot complete before two approvals and external evidence", () => {
    let s = createDemo();
    expect(() => completePayout(s, treasurer, "DEMO-EFT-025")).toThrow("Two independent");
    s = decidePayout(
      decidePayout(s, chair, "Funds and constitution reviewed"),
      secretary,
      "Rotation checked",
    );
    expect(s.payout.status).toBe("approved");
    expect(() => completePayout(s, treasurer, "")).toThrow("reference");
    s = completePayout(s, treasurer, "DEMO-EFT-025");
    expect(s.payout.status).toBe("completed");
    expect(summary(s).funds).toBe(450000n);
    expect(() => completePayout(s, treasurer, "DEMO-EFT-025")).toThrow();
  });
  it("insufficient verified funds blocks approval", () => {
    const s = createDemo();
    s.journal = [];
    expect(() => decidePayout(s, chair, "Insufficient funds")).toThrow("below");
  });
});
describe("burial society review", () => {
  it("waiting period uses event date and calendar months", () => {
    expect(coverageEligible("2026-01-31", "2026-02-28", 1)).toBe(true);
    expect(coverageEligible("2026-01-31", "2026-02-27", 1)).toBe(false);
    expect(coverageEligible("2026-01-01", "2026-06-30", 6)).toBe(false);
  });
  it("declines retain reason and applicable rule version", () => {
    const s = decideBenefit(
      createDemo("burial"),
      { ...chair, societyId: "sisonke" },
      "decline",
      "Required evidence was not supplied",
    );
    expect(s.benefit.status).toBe("declined");
    expect(s.benefit.decisions[0].reason).toContain("evidence");
    expect(s.benefit.ruleVersion).toBe("2026.1");
  });
  it("benefit remains unpaid until two reviewers and recorded external evidence", () => {
    let s = createDemo("burial");
    s = decideBenefit(
      s,
      { ...chair, societyId: "sisonke" },
      "approve",
      "Rules and relationship reviewed",
    );
    expect(s.benefit.status).toBe("review");
    s = decideBenefit(
      s,
      { ...treasurer, societyId: "sisonke" },
      "approve",
      "Waiting period reviewed",
    );
    expect(s.benefit.status).toBe("approved");
    expect(() => completeBenefit(s, { ...treasurer, societyId: "sisonke" }, "")).toThrow();
    s = completeBenefit(s, { ...treasurer, societyId: "sisonke" }, "DEMO-BEN-EFT-004");
    expect(s.benefit.status).toBe("completed");
    expect(summary(s).funds).toBe(750000n);
  });
});
describe("bank CSV import", () => {
  it("handles quoted references and idempotent duplicate rows", () => {
    const rows = parseBankCsv(
      'id,date,reference,amount\r\nb1,2026-10-01,"REF, 1",500.00\r\nb1,2026-10-01,"REF, 1",500.00',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].reference).toBe("REF, 1");
    expect(rows[0].amount).toBe(50000n);
  });
  it("conflicting transaction IDs fail instead of silently merging", () =>
    expect(() =>
      parseBankCsv("id,date,reference,amount\nb1,2026-10-01,R1,500\nb1,2026-10-01,R1,400"),
    ).toThrow("conflicting"));
  it("invalid dates and negative incoming amounts fail", () => {
    expect(() => parseBankCsv("id,date,reference,amount\nb1,2026-02-30,R1,500")).toThrow("valid");
    expect(() => parseBankCsv("id,date,reference,amount\nb1,2026-10-01,R1,-500")).toThrow();
  });
});
