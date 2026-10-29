import { getDb, parseJson } from "./db";

export type Job = {
  id: number;
  employer_id: number;
  title: string;
  industry: string;
  city: string;
  locality: string;
  description: string;
  responsibilities: string;
  salary_min: number;
  salary_max: number;
  salary_period: string;
  hours: string;
  weekly_holiday: string;
  accommodation: "none" | "free" | "paid";
  accommodation_cost: number;
  accommodation_details: string;
  accommodation_confirmed: number;
  meals: string;
  benefits: string;
  deductions: string;
  deposit_amount: number;
  education_req: string;
  experience_req: string;
  languages: string[];
  skills_offered: string[];
  learning_notes: string;
  learning_confirmed: number;
  joining_date: string | null;
  openings: number;
  status: "open" | "filled" | "closed" | "removed";
  removed_reason: string | null;
  expires_at: string | null;
  expiry_reminded: number;
  flagged_reason: string | null;
  description_hi: string;
  responsibilities_hi: string;
  learning_notes_hi: string;
  created_at: string;
  updated_at: string;
  // joined employer fields
  business_name: string;
  business_type: string;
  verification_status: "unsubmitted" | "pending" | "verified" | "rejected";
  verified_checks: string[];
  emp_city: string;
  years_in_business: number | null;
  clarity: number;
  applicants?: number;
};

export type Employer = {
  id: number;
  user_id: number;
  business_name: string;
  owner_name: string;
  industry: string;
  business_type: string;
  city: string;
  address: string;
  contact_phone: string;
  years_in_business: number | null;
  staff_count: number | null;
  about: string;
  gst_number: string | null;
  id_proof_note: string | null;
  origin_district: string | null;
  verification_status: "unsubmitted" | "pending" | "verified" | "rejected";
  verified_checks: string[];
  verification_note: string | null;
  verified_at: string | null;
  gst_norm: string | null;
  flagged_reason: string | null;
  created_at: string;
};

export type CandidateProfile = {
  user_id: number;
  district: string | null;
  education: string | null;
  languages: string[];
  experience: string;
  industries: string[];
  cities: string[];
  relocate: number;
  needs_accommodation: number;
  goals: string[];
  learn_notes: string;
  age: number | null;
  family_name: string | null;
  family_phone: string | null;
  completed: number;
  searchable: number;
};

const JOB_SELECT = `
  SELECT j.*, e.business_name, e.business_type, e.verification_status, e.verified_checks,
         e.city AS emp_city, e.years_in_business,
         (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicants
  FROM jobs j JOIN employers e ON e.id = j.employer_id
`;

/** 0–10: how completely and honestly a listing is described (not pay-based). */
export function clarityScore(j: {
  salary_min: number; salary_max: number; hours: string; weekly_holiday: string;
  deductions: string; accommodation: string; accommodation_confirmed: number;
  skills_offered: string[]; learning_confirmed: number; responsibilities: string;
  verification_status: string;
}): number {
  let s = 0;
  if (j.salary_min > 0) s += 1;
  if (j.salary_max >= j.salary_min && j.salary_max > 0) s += 0.5;
  if (j.hours.trim()) s += 1.5;
  if (j.weekly_holiday.trim()) s += 1;
  if (j.deductions.trim()) s += 1.5;
  if (j.accommodation === "none" || j.accommodation_confirmed) s += 1;
  if (j.responsibilities.trim().length > 40) s += 1;
  if (j.skills_offered.length >= 3 && j.learning_confirmed) s += 1.5;
  else if (j.skills_offered.length >= 1) s += 0.5;
  if (j.verification_status === "verified") s += 1;
  return Math.min(10, Math.round(s * 10) / 10);
}

function hydrate(row: Record<string, unknown>): Job {
  const j = {
    ...row,
    languages: parseJson<string[]>(row.languages as string, []),
    skills_offered: parseJson<string[]>(row.skills_offered as string, []),
    verified_checks: parseJson<string[]>(row.verified_checks as string, []),
  } as unknown as Job;
  j.clarity = clarityScore(j);
  return j;
}

export function hydrateEmployer(row: Record<string, unknown> | undefined): Employer | null {
  if (!row) return null;
  return { ...row, verified_checks: parseJson<string[]>(row.verified_checks as string, []) } as unknown as Employer;
}

export function getJob(id: number): Job | null {
  const row = getDb().prepare(`${JOB_SELECT} WHERE j.id = ?`).get(id) as Record<string, unknown> | undefined;
  return row ? hydrate(row) : null;
}

export type JobFilters = {
  q?: string; industry?: string; city?: string; minSalary?: number; stay?: string;
  exp?: string; verified?: boolean; learn?: boolean; sort?: string; limit?: number;
};

export function searchJobs(f: JobFilters): Job[] {
  const where: string[] = [
    "j.status = 'open'", "e.verification_status != 'rejected'", "j.flagged_reason IS NULL",
    "(j.expires_at IS NULL OR j.expires_at > datetime('now'))",
  ];
  const args: unknown[] = [];
  if (f.q) {
    where.push("(j.title LIKE ? OR e.business_name LIKE ? OR j.description LIKE ?)");
    const like = `%${f.q}%`;
    args.push(like, like, like);
  }
  if (f.industry) { where.push("j.industry = ?"); args.push(f.industry); }
  if (f.city) { where.push("j.city = ?"); args.push(f.city); }
  if (f.minSalary) {
    where.push(`(CASE j.salary_period WHEN 'day' THEN j.salary_max*26 WHEN 'week' THEN j.salary_max*4 ELSE j.salary_max END) >= ?`);
    args.push(f.minSalary);
  }
  if (f.stay === "yes") where.push("j.accommodation != 'none'");
  if (f.stay === "free") where.push("j.accommodation = 'free'");
  if (f.exp === "fresher") where.push("j.experience_req = 'fresher'");
  if (f.verified) where.push("e.verification_status = 'verified'");
  const rows = getDb()
    .prepare(`${JOB_SELECT} WHERE ${where.join(" AND ")} ORDER BY j.created_at DESC, j.id DESC`)
    .all(...args) as Record<string, unknown>[];
  let jobs = rows.map(hydrate);
  if (f.learn) jobs = jobs.filter((j) => j.skills_offered.length >= 3);
  const monthly = (j: Job) =>
    (j.salary_period === "day" ? j.salary_max * 26 : j.salary_period === "week" ? j.salary_max * 4 : j.salary_max);
  switch (f.sort) {
    case "new": break;
    case "salary": jobs.sort((a, b) => monthly(b) - monthly(a)); break;
    case "learn": jobs.sort((a, b) => b.skills_offered.length - a.skills_offered.length); break;
    default: {
      const trust = (j: Job) => j.clarity + (j.verification_status === "verified" ? 3 : 0) + (j.accommodation === "free" ? 0.5 : 0);
      jobs.sort((a, b) => trust(b) - trust(a));
    }
  }
  return f.limit ? jobs.slice(0, f.limit) : jobs;
}

export function employerJobs(employerId: number): Job[] {
  const rows = getDb()
    .prepare(`${JOB_SELECT} WHERE j.employer_id = ? AND j.status != 'removed' ORDER BY j.created_at DESC`)
    .all(employerId) as Record<string, unknown>[];
  return rows.map(hydrate);
}

export function getEmployerByUser(userId: number): Employer | null {
  return hydrateEmployer(getDb().prepare("SELECT * FROM employers WHERE user_id = ?").get(userId) as Record<string, unknown> | undefined);
}
export function getEmployer(id: number): Employer | null {
  return hydrateEmployer(getDb().prepare("SELECT * FROM employers WHERE id = ?").get(id) as Record<string, unknown> | undefined);
}

export function getCandidateProfile(userId: number): CandidateProfile | null {
  const r = getDb().prepare("SELECT * FROM candidate_profiles WHERE user_id = ?").get(userId) as Record<string, unknown> | undefined;
  if (!r) return null;
  return {
    ...r,
    languages: parseJson<string[]>(r.languages as string, []),
    industries: parseJson<string[]>(r.industries as string, []),
    cities: parseJson<string[]>(r.cities as string, []),
    goals: parseJson<string[]>(r.goals as string, []),
  } as unknown as CandidateProfile;
}

export function siteStats() {
  const db = getDb();
  const one = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  return {
    openJobs: one("SELECT COUNT(*) n FROM jobs WHERE status='open' AND flagged_reason IS NULL AND (expires_at IS NULL OR expires_at > datetime('now'))"),
    verified: one("SELECT COUNT(*) n FROM employers WHERE verification_status='verified'"),
    cities: one("SELECT COUNT(DISTINCT city) n FROM jobs WHERE status='open' AND flagged_reason IS NULL"),
  };
}

export function isSaved(userId: number, jobId: number): boolean {
  return Boolean(getDb().prepare("SELECT 1 FROM saved_jobs WHERE user_id=? AND job_id=?").get(userId, jobId));
}

export function employerRating(employerId: number): { avg: number; count: number } {
  const r = getDb().prepare(`
    SELECT AVG(f.rating) avg, COUNT(*) count FROM feedback f
    JOIN applications a ON a.id=f.application_id JOIN jobs j ON j.id=a.job_id
    WHERE j.employer_id=? AND f.from_role='candidate' AND f.hidden=0`).get(employerId) as { avg: number | null; count: number };
  return { avg: r.avg ?? 0, count: r.count };
}

/** A listing is publicly visible only when open, unflagged, unexpired and from a non-rejected employer. */
export function isPubliclyVisible(j: Pick<Job, "status" | "flagged_reason" | "expires_at" | "verification_status">, now = new Date()): boolean {
  if (j.status !== "open" || j.flagged_reason || j.verification_status === "rejected") return false;
  if (j.expires_at && new Date(j.expires_at.replace(" ", "T") + "Z") <= now) return false;
  return true;
}

export function isExpired(j: Pick<Job, "expires_at">, now = new Date()): boolean {
  return Boolean(j.expires_at && new Date(j.expires_at.replace(" ", "T") + "Z") <= now);
}
