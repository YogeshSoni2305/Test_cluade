import { getDb } from "./db";

export type DayStat = { day: string; views: number; applies: number };

/** Daily views and applications for the last `days` days, oldest first (zero-filled). */
export function jobDailyStats(jobId: number, days = 14, now = new Date()): DayStat[] {
  const db = getDb();
  const views = new Map((db.prepare("SELECT day, views FROM job_views WHERE job_id=? AND day >= date(?, ?)").all(jobId, now.toISOString(), `-${days - 1} days`) as { day: string; views: number }[]).map((r) => [r.day, r.views]));
  const applies = new Map((db.prepare("SELECT date(created_at) day, COUNT(*) n FROM applications WHERE job_id=? AND date(created_at) >= date(?, ?) GROUP BY 1").all(jobId, now.toISOString(), `-${days - 1} days`) as { day: string; n: number }[]).map((r) => [r.day, r.n]));
  const out: DayStat[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400_000).toISOString().slice(0, 10);
    out.push({ day: d, views: views.get(d) ?? 0, applies: applies.get(d) ?? 0 });
  }
  return out;
}

export function jobTotals(employerId: number): Map<number, { views30: number; applies: number }> {
  const rows = getDb().prepare(`SELECT j.id,
      COALESCE((SELECT SUM(views) FROM job_views v WHERE v.job_id=j.id AND v.day >= date('now','-29 days')), 0) AS views30,
      (SELECT COUNT(*) FROM applications a WHERE a.job_id=j.id) AS applies
    FROM jobs j WHERE j.employer_id=?`).all(employerId) as { id: number; views30: number; applies: number }[];
  return new Map(rows.map((r) => [r.id, { views30: r.views30, applies: r.applies }]));
}
