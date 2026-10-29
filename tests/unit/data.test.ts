import { beforeAll, describe, expect, it } from "vitest";
import { getDb } from "@/lib/db";
import { seed } from "@/lib/seed";
import { clarityScore, getJob, isExpired, isPubliclyVisible, searchJobs } from "@/lib/queries";
import { describeAlert, jobMatchesAlert, notifyAlertMatches } from "@/lib/alerts";
import { runHousekeeping, maybeRunHousekeeping } from "@/lib/housekeeping";
import { searchCandidates } from "@/lib/candidates";
import { exportUserData, deleteUserData } from "@/lib/account";
import { jobPostingJsonLd } from "@/lib/seo";
import { pilotMetrics } from "@/lib/metrics";
import { getEmployer } from "@/lib/queries";

const db = () => getDb();
const userId = (name: string) => (db().prepare("SELECT id FROM users WHERE name LIKE ?").get(`${name}%`) as { id: number }).id;

beforeAll(() => seed());

describe("job search & visibility", () => {
  it("ranks by trust + clarity by default, not salary", () => {
    const jobs = searchJobs({});
    expect(jobs.length).toBeGreaterThan(5);
    const firstUnverified = jobs.findIndex((j) => j.verification_status !== "verified");
    const lastVerified = jobs.map((j) => j.verification_status).lastIndexOf("verified");
    expect(firstUnverified).toBeGreaterThan(lastVerified - 1);
    const bySalary = searchJobs({ sort: "salary" });
    expect(bySalary[0].salary_max).toBeGreaterThanOrEqual(bySalary[bySalary.length - 1].salary_max);
  });

  it("filters by stay, city and minimum monthly salary", () => {
    expect(searchJobs({ stay: "free" }).every((j) => j.accommodation === "free")).toBe(true);
    expect(searchJobs({ city: "Surat" }).every((j) => j.city === "Surat")).toBe(true);
    expect(searchJobs({ minSalary: 18000 }).every((j) => j.salary_max >= 18000)).toBe(true);
  });

  it("hides flagged and expired listings", () => {
    const id = searchJobs({})[0].id;
    db().prepare("UPDATE jobs SET flagged_reason='asks for a fee' WHERE id=?").run(id);
    expect(searchJobs({}).some((j) => j.id === id)).toBe(false);
    expect(isPubliclyVisible(getJob(id)!)).toBe(false);
    db().prepare("UPDATE jobs SET flagged_reason=NULL, expires_at=datetime('now','-1 day') WHERE id=?").run(id);
    expect(isExpired(getJob(id)!)).toBe(true);
    expect(searchJobs({}).some((j) => j.id === id)).toBe(false);
    db().prepare("UPDATE jobs SET expires_at=datetime('now','+20 days') WHERE id=?").run(id);
    expect(searchJobs({}).some((j) => j.id === id)).toBe(true);
  });

  it("scores clarity from disclosure, capped at 10", () => {
    const base = { salary_min: 10000, salary_max: 12000, hours: "10-8", weekly_holiday: "Sunday", deductions: "No deductions", accommodation: "free", accommodation_confirmed: 1, skills_offered: ["a", "b", "c"], learning_confirmed: 1, responsibilities: "x".repeat(50), verification_status: "verified" };
    expect(clarityScore(base)).toBe(10);
    expect(clarityScore({ ...base, hours: "", deductions: "", verification_status: "pending" })).toBeLessThan(7);
  });
});

describe("job alerts", () => {
  const job = { title: "Showroom Sales Trainee", business_name: "Shree Ram Menswear", industry: "menswear", city: "Surat", salary_max: 15000, salary_period: "month", accommodation: "free" as const, verification_status: "verified" as const };
  it("matches on every filter", () => {
    const a = { q: "sales", industry: "menswear", city: "Surat", min_salary: 12000, stay: "free", verified_only: 1 };
    expect(jobMatchesAlert(job, a)).toBe(true);
    expect(jobMatchesAlert(job, { ...a, city: "Pune" })).toBe(false);
    expect(jobMatchesAlert(job, { ...a, min_salary: 20000 })).toBe(false);
    expect(jobMatchesAlert({ ...job, salary_max: 700, salary_period: "day" }, { ...a, min_salary: 15000 })).toBe(true); // 700 × 26 days
    expect(jobMatchesAlert(job, { ...a, q: "mechanic" })).toBe(false);
  });
  it("describes alerts in both languages", () => {
    expect(describeAlert({ q: "", industry: "menswear", city: "Surat", min_salary: 0, stay: "free", verified_only: 0 })).toBe("Men's clothing & apparel retail · in Surat · free stay");
    expect(describeAlert({ q: "", industry: "", city: "", min_salary: 0, stay: "", verified_only: 0 }, "hi")).toBe("सभी नए काम");
  });
  it("notifies matching candidates once when a job is published", () => {
    const jobId = searchJobs({ city: "Surat", industry: "menswear" })[0].id;
    const mahendra = userId("Mahendra");
    const before = (db().prepare("SELECT COUNT(*) n FROM notifications WHERE user_id=? AND kind='alert_match'").get(mahendra) as { n: number }).n;
    expect(notifyAlertMatches(jobId)).toBeGreaterThanOrEqual(1);
    const after = (db().prepare("SELECT COUNT(*) n FROM notifications WHERE user_id=? AND kind='alert_match'").get(mahendra) as { n: number }).n;
    expect(after).toBe(before + 1);
  });
});

describe("housekeeping", () => {
  it("reminds before expiry, notices expiry, and sends 30-day check-ins exactly once", () => {
    const [a, b] = searchJobs({ sort: "new" });
    db().prepare("UPDATE jobs SET expires_at=datetime('now','+2 days'), expiry_reminded=0 WHERE id=?").run(a.id);
    db().prepare("UPDATE jobs SET expires_at=datetime('now','-1 hour'), expiry_reminded=0 WHERE id=?").run(b.id);
    const r1 = runHousekeeping();
    expect(r1.reminded).toBeGreaterThanOrEqual(1);
    expect(r1.expired).toBeGreaterThanOrEqual(1);
    expect(r1.checkins).toBeGreaterThanOrEqual(2); // Pooja joined 40 days ago: candidate + employer
    const r2 = runHousekeeping();
    expect(r2).toEqual({ reminded: 0, expired: 0, checkins: 0 });
    expect(maybeRunHousekeeping(10)).toBeNull(); // throttled
  });
});

describe("candidate search", () => {
  it("returns only opted-in candidates without phone numbers", () => {
    const results = searchCandidates({});
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((c) => /^[^\s]+( [A-Z]\.)?$/.test(c.display_name))).toBe(true);
    expect(JSON.stringify(results)).not.toMatch(/\+91/);
    expect(results.some((c) => c.display_name.startsWith("Ravi"))).toBe(false); // Ravi didn't opt in
    expect(searchCandidates({ industry: "garage" }).every((c) => c.industries.includes("garage"))).toBe(true);
  });
});

describe("structured data", () => {
  it("produces a valid-looking JobPosting", () => {
    const job = searchJobs({})[0];
    const ld = jobPostingJsonLd(job, getEmployer(job.employer_id)!) as Record<string, unknown>;
    expect(ld["@type"]).toBe("JobPosting");
    expect(ld).toHaveProperty("baseSalary.currency", "INR");
    expect(ld).toHaveProperty("jobLocation.address.addressCountry", "IN");
    expect(ld).toHaveProperty("hiringOrganization.name");
    expect(String(ld.validThrough)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("pilot metrics", () => {
  it("computes the concept-note metrics", () => {
    const m = pilotMetrics();
    expect(m.verified_employers).toBeGreaterThan(0);
    expect(m.applications).toBeGreaterThan(0);
    expect(m.interview_rate_pct).not.toBeNull();
  });
});

describe("account data rights", () => {
  it("exports everything about a user and deletes it completely", () => {
    const id = userId("Pooja");
    const data = exportUserData(id);
    expect(data.account).toMatchObject({ id });
    expect(data.candidate_profile).not.toBeNull();
    expect(data.applications.length).toBeGreaterThan(0);
    deleteUserData(id);
    for (const [table, col] of [["users", "id"], ["candidate_profiles", "user_id"], ["applications", "candidate_id"], ["notifications", "user_id"], ["job_alerts", "user_id"]]) {
      expect(db().prepare(`SELECT COUNT(*) n FROM ${table} WHERE ${col}=?`).get(id)).toEqual({ n: 0 });
    }
  });

  it("keeps experience letters valid when the employer deletes their account", () => {
    const app = db().prepare("SELECT a.id, a.candidate_id, j.employer_id, e.user_id FROM applications a JOIN jobs j ON j.id=a.job_id JOIN employers e ON e.id=j.employer_id LIMIT 1").get() as { id: number; candidate_id: number; user_id: number };
    db().prepare(`INSERT INTO experience_letters (application_id, candidate_id, candidate_name, business_name, business_city, code, role_title, industry, from_date, to_date)
      VALUES (?, ?, 'X', 'Biz', 'City', 'RK-TEST-0001', 'Helper', 'menswear', '2025-01-01', '2025-12-01')`).run(app.id, app.candidate_id);
    deleteUserData(app.user_id);
    const letter = db().prepare("SELECT * FROM experience_letters WHERE code='RK-TEST-0001'").get() as { application_id: number | null; business_name: string };
    expect(letter).toBeTruthy();
    expect(letter.application_id).toBeNull();
    expect(letter.business_name).toBe("Biz");
  });
});
