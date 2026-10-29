import { NextResponse } from "next/server";
import { can, getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { pilotMetrics, METRIC_LABELS, toCsv, type Metrics } from "@/lib/metrics";
import { audit } from "@/lib/audit";

const QUERIES: Record<string, string> = {
  applications: `SELECT a.id, a.created_at, a.status, a.source, a.share_phone, a.joined_at, a.left_at, j.id AS job_id, j.title, j.industry, j.city,
      e.business_name, cp.district AS candidate_district, cp.education AS candidate_education
    FROM applications a JOIN jobs j ON j.id=a.job_id JOIN employers e ON e.id=j.employer_id LEFT JOIN candidate_profiles cp ON cp.user_id=a.candidate_id ORDER BY a.id`,
  jobs: `SELECT j.id, j.created_at, j.expires_at, j.status, j.flagged_reason, j.title, j.industry, j.city, j.salary_min, j.salary_max, j.salary_period,
      j.accommodation, j.deductions, j.deposit_amount, e.business_name, e.verification_status,
      (SELECT COUNT(*) FROM applications a WHERE a.job_id=j.id) AS applicants,
      (SELECT COALESCE(SUM(views),0) FROM job_views v WHERE v.job_id=j.id) AS views
    FROM jobs j JOIN employers e ON e.id=j.employer_id ORDER BY j.id`,
  employers: `SELECT e.id, e.created_at, e.business_name, e.industry, e.business_type, e.city, e.origin_district, e.verification_status, e.verified_at,
      e.verified_checks, e.flagged_reason, (SELECT COUNT(*) FROM jobs j WHERE j.employer_id=e.id) AS listings FROM employers e ORDER BY e.id`,
  reports: `SELECT r.id, r.created_at, r.updated_at, r.type, r.status, r.resolution, r.job_id, e.business_name FROM reports r LEFT JOIN employers e ON e.id=r.employer_id ORDER BY r.id`,
};

/** CSV exports for spreadsheets. Contains no candidate names or phone numbers. */
export async function GET(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  const user = await getCurrentUser();
  if (!user || !can(user, "export")) return new NextResponse("Forbidden", { status: 403 });
  let csv: string;
  if (kind === "metrics") {
    const m = pilotMetrics();
    csv = toCsv((Object.keys(m) as (keyof Metrics)[]).map((k) => ({ metric: METRIC_LABELS[k], value: m[k] })), ["metric", "value"]);
  } else if (QUERIES[kind]) {
    csv = toCsv(getDb().prepare(QUERIES[kind]).all() as Record<string, unknown>[]);
  } else {
    return new NextResponse("Not found", { status: 404 });
  }
  audit({ id: user.id, name: user.name }, "export", kind, null);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rajasthan-kaam-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
