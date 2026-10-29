import { describe, expect, it } from "vitest";
import { flagReason, normalizeGst, scamSignals, spamSignals } from "@/lib/moderation";

describe("scam detection", () => {
  it.each([
    ["Registration fee 1000 must be paid before joining.", "asks for a fee"],
    ["Joining charges Rs 500 applicable", "asks for a fee"],
    ["Pay ₹2000 to confirm your seat", "asks the candidate to pay"],
    ["Send security money of 3000", "asks for advance money"],
    ["रजिस्ट्रेशन फीस 500 रुपये", "asks for a fee"],
    ["पहले पैसे भेजो फिर नौकरी", "asks for advance money"],
    ["Submit original aadhaar at office", "asks to hold original documents"],
    ["send on gpay to confirm", "asks for a UPI transfer"],
  ])("flags %j", (text, reason) => {
    expect(scamSignals(text)).toContain(reason);
  });

  it("does not flag honest listings", () => {
    expect(flagReason("Free stay. No deductions. Lunch provided. Weekly holiday Sunday.")).toBeNull();
    expect(flagReason("₹1,500/month for accommodation", "Bonus after 1 year")).toBeNull();
  });

  it("detects spam patterns", () => {
    expect(spamSignals("join t.me/jobsgroup now")).toContain("off-platform link");
    expect(spamSignals("aaaaaaaaaaaaaaaa")).toContain("repeated characters");
    expect(spamSignals("CALL NOW FOR THE BEST JOB OFFER IN THE WHOLE CITY TODAY")).toContain("shouting");
  });
});

describe("GST normalisation", () => {
  it("accepts valid GSTINs in any case/spacing", () => {
    expect(normalizeGst("08abcde1234f1z5")).toBe("08ABCDE1234F1Z5");
    expect(normalizeGst(" 08 ABCDE 1234 F1Z5 ")).toBe("08ABCDE1234F1Z5");
  });
  it("rejects malformed numbers", () => {
    expect(normalizeGst("12345")).toBeNull();
    expect(normalizeGst("")).toBeNull();
  });
});

describe("no false alarms on normal shop work", () => {
  it.each([
    "Billing counter: accept cash and UPI payments, keep the daily tally.",
    "Customers pay at the counter; you will learn GST billing.",
    "Keep your original documents with you.",
  ])("%j", (text) => expect(scamSignals(text)).toEqual([]));
});

describe("document-holding detection", () => {
  it.each([
    ["Original marksheet will be kept by owner for 6 months", true],
    ["Please deposit original passport with manager", true],
    ["Keep your original documents with you.", false],
  ])("%j → flagged=%s", (text, flagged) => expect(scamSignals(text).includes("asks to hold original documents")).toBe(flagged));
});
