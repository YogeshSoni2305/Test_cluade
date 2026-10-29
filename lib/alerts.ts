import { getDb } from "./db";
import { getJob, type Job } from "./queries";
import { notify } from "./notify";
import { INDUSTRIES, byId } from "./constants";
import { monthlySalary, salaryRange } from "./format";

export type Alert = {
  id: number; user_id: number; label: string; q: string; industry: string; city: string;
  min_salary: number; stay: string; verified_only: number; active: number; last_matched_at: string | null; created_at: string;
};

/** Pure matcher — shared by the publish hook and unit tests. */
export function jobMatchesAlert(job: Pick<Job, "title" | "business_name" | "industry" | "city" | "salary_max" | "salary_period" | "accommodation" | "verification_status">, a: Pick<Alert, "q" | "industry" | "city" | "min_salary" | "stay" | "verified_only">): boolean {
  if (a.industry && a.industry !== job.industry) return false;
  if (a.city && a.city !== job.city) return false;
  if (a.min_salary && monthlySalary(job.salary_max, job.salary_period) < a.min_salary) return false;
  if (a.stay === "yes" && job.accommodation === "none") return false;
  if (a.stay === "free" && job.accommodation !== "free") return false;
  if (a.verified_only && job.verification_status !== "verified") return false;
  if (a.q) {
    const hay = `${job.title} ${job.business_name}`.toLowerCase();
    if (!a.q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w))) return false;
  }
  return true;
}

export function describeAlert(a: Pick<Alert, "q" | "industry" | "city" | "min_salary" | "stay" | "verified_only">, lang: "en" | "hi" = "en"): string {
  const hi = lang === "hi";
  const parts: string[] = [];
  if (a.q) parts.push(`“${a.q}”`);
  const ind = byId(INDUSTRIES, a.industry);
  if (ind) parts.push(hi ? ind.hi : ind.en);
  if (a.city) parts.push(hi ? `${a.city} में` : `in ${a.city}`);
  if (a.min_salary) parts.push(hi ? `₹${a.min_salary.toLocaleString("en-IN")}+ / माह` : `₹${a.min_salary.toLocaleString("en-IN")}+ / month`);
  if (a.stay === "yes") parts.push(hi ? "रहना मिले" : "with stay");
  if (a.stay === "free") parts.push(hi ? "मुफ़्त रहना" : "free stay");
  if (a.verified_only) parts.push(hi ? "सिर्फ़ सत्यापित" : "verified only");
  return parts.join(" · ") || (hi ? "सभी नए काम" : "All new jobs");
}

/** Notify every candidate whose active alert matches a newly published, visible job. */
export function notifyAlertMatches(jobId: number): number {
  const job = getJob(jobId);
  if (!job || job.status !== "open" || job.flagged_reason || job.verification_status === "rejected") return 0;
  const db = getDb();
  const alerts = db.prepare(`SELECT a.* FROM job_alerts a JOIN users u ON u.id = a.user_id
    WHERE a.active = 1 AND u.suspended = 0 AND u.role = 'candidate'`).all() as Alert[];
  const notified = new Set<number>();
  for (const a of alerts) {
    if (notified.has(a.user_id) || !jobMatchesAlert(job, a)) continue;
    notified.add(a.user_id);
    db.prepare("UPDATE job_alerts SET last_matched_at = datetime('now') WHERE id = ?").run(a.id);
    notify(a.user_id, {
      kind: "alert_match",
      en: { title: `New job: ${job.title}`, body: `${job.business_name}, ${job.city} · ${salaryRange(job.salary_min, job.salary_max)}` },
      hi: { title: `नया काम: ${job.title}`, body: `${job.business_name}, ${job.city} · ${salaryRange(job.salary_min, job.salary_max)}` },
      link: `/jobs/${job.id}`,
    });
  }
  return notified.size;
}
