import { describe, expect, it } from "vitest";
import { getDb, normalizePhone } from "@/lib/db";
import { hit } from "@/lib/ratelimit";
import { formToken, verifyToken } from "@/lib/antibot";
import { newLetterCode, normalizeCode, monthsBetween, durationLabel } from "@/lib/letters";
import { toCsv } from "@/lib/metrics";
import { jsonLdScript } from "@/lib/seo";
import { displayName } from "@/lib/candidates";
import { systemText } from "@/lib/sysmsg";
import { dict } from "@/lib/i18n";

describe("phone normalisation", () => {
  it.each([
    ["9876543210", "+919876543210"],
    ["+91 98765 43210", "+919876543210"],
    ["09876543210", "+919876543210"],
    ["919876543210", "+919876543210"],
  ])("%s → %s", (raw, out) => expect(normalizePhone(raw)).toBe(out));
  it("rejects non-mobile numbers", () => {
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("1234567890")).toBeNull(); // Indian mobiles start 6-9
    expect(normalizePhone("")).toBeNull();
  });
});

describe("migrations", () => {
  it("brings a new database to the latest schema", () => {
    const db = getDb();
    expect(db.pragma("user_version", { simple: true })).toBeGreaterThanOrEqual(1);
    const cols = (db.prepare("PRAGMA table_info(jobs)").all() as { name: string }[]).map((c) => c.name);
    expect(cols).toEqual(expect.arrayContaining(["expires_at", "flagged_reason", "description_hi"]));
    for (const t of ["messages", "notifications", "audit_log", "job_alerts", "invitations", "experience_letters", "events"]) {
      expect(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(t)).toBeTruthy();
    }
  });
});

describe("rate limiter", () => {
  it("allows up to the limit within a window, then blocks, then resets", () => {
    const cfg = { limit: 3, windowSec: 60 };
    const t0 = Date.UTC(2026, 0, 1, 10, 0, 5);
    expect([1, 2, 3].map(() => hit("t:a", cfg, t0).ok)).toEqual([true, true, true]);
    const blocked = hit("t:a", cfg, t0);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(55);
    expect(hit("t:a", cfg, t0 + 60_000).ok).toBe(true);
    expect(hit("t:other", cfg, t0).ok).toBe(true);
  });
});

describe("form timing token", () => {
  it("rejects instant, tampered and stale submissions", () => {
    const now = 1_700_000_000_000;
    const tok = formToken(now);
    expect(verifyToken(tok, now + 100, 1500)).toMatch(/fast/);
    expect(verifyToken(tok, now + 2000, 1500)).toBeNull();
    expect(verifyToken(tok.replace(/.$/, (c) => (c === "A" ? "B" : "A")), now + 2000, 1500)).toMatch(/expired/);
    expect(verifyToken(tok, now + 13 * 3600_000, 1500)).toMatch(/expired/);
    expect(verifyToken("garbage", now, 0)).toMatch(/expired/);
  });
});

describe("experience letters", () => {
  it("generates readable, unambiguous codes", () => {
    for (let i = 0; i < 50; i++) expect(newLetterCode()).toMatch(/^RK-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
    expect(normalizeCode("rk 7g2k 9qxa")).toBe("RK-7G2K-9QXA");
  });
  it("computes durations", () => {
    expect(monthsBetween("2025-01-15", "2026-03-14")).toBe(13);
    expect(durationLabel("2025-01-15", "2026-03-20")).toBe("1 year 2 months");
    expect(durationLabel("2026-01-01", "2026-01-20")).toBe("less than a month");
    expect(durationLabel("2025-01-01", "2025-07-01", "hi")).toBe("6 महीने");
  });
});

describe("CSV export", () => {
  it("adds a BOM, quotes, and neutralises formula injection", () => {
    const csv = toCsv([{ a: 'He said "hi"', b: "=HYPERLINK(x)", c: "line\nbreak", d: null }]);
    expect(csv.startsWith("﻿a,b,c,d\r\n")).toBe(true);
    expect(csv).toContain('"He said ""hi"""');
    expect(csv).toContain("'=HYPERLINK(x)");
    expect(csv).toContain('"line\nbreak"');
  });
});

describe("misc helpers", () => {
  it("escapes JSON-LD so it cannot close the script tag", () => {
    expect(jsonLdScript({ x: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });
  it("shows only first name and initial in candidate search", () => {
    expect(displayName("Mahendra Singh Rathore")).toBe("Mahendra R.");
    expect(displayName("Pooja")).toBe("Pooja");
  });
  it("renders system messages in both languages", () => {
    const names = { candidate: "Ravi", employer: "Shop" };
    expect(systemText("status:interview", "en", names)).toBe("Status changed: Interview");
    expect(systemText("status:interview", "hi", names)).toBe("स्थिति बदली: इंटरव्यू");
    expect(systemText("candidate_shared_phone", "hi", names)).toContain("Ravi");
  });
  it("has a non-empty Hindi string for every key", () => {
    const missing = Object.entries(dict.hi).filter(([, v]) => !v.trim()).map(([k]) => k);
    expect(missing).toEqual([]);
    expect(Object.keys(dict.hi).sort()).toEqual(Object.keys(dict.en).sort());
  });
});

describe("redirect helpers", async () => {
  const { withParam, safeNext } = await import("@/lib/form");
  it("puts query params before the #anchor", () => {
    expect(withParam("/account#delete", "error", "Type DELETE")).toBe("/account?error=Type%20DELETE#delete");
    expect(withParam("/admin/users?q=x", "done", "1")).toBe("/admin/users?q=x&done=1");
  });
  it("only allows same-site relative redirects", () => {
    expect(safeNext("//evil.com", "/")).toBe("/");
    expect(safeNext("https://evil.com", "/")).toBe("/");
    expect(safeNext("/jobs?x=1", "/")).toBe("/jobs?x=1");
  });
});
