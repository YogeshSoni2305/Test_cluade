import Link from "next/link";
import { getDb } from "@/lib/db";
import { adminRemoveJob } from "@/app/actions";
import { Badge, btn, Card, PageHeader } from "@/components/ui";
import { salaryRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function AdminJobs() {
  const jobs = getDb().prepare(`SELECT j.id, j.title, j.status, j.city, j.salary_min, j.salary_max, e.business_name, e.verification_status,
      (SELECT COUNT(*) FROM reports r WHERE r.job_id=j.id AND r.status IN ('open','investigating')) AS open_reports
      FROM jobs j JOIN employers e ON e.id=j.employer_id ORDER BY j.created_at DESC`).all() as
    { id: number; title: string; status: string; city: string; salary_min: number; salary_max: number; business_name: string; verification_status: string; open_reports: number }[];
  return (
    <>
      <PageHeader deva="लिस्टिंग" title="All listings" sub="Spot-check for misleading terms. Removing a listing hides it from candidates immediately." />
      <div className="space-y-2">
        {jobs.map((j) => (
          <Card key={j.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <Link href={`/jobs/${j.id}`} className="font-semibold text-sindoor-700 hover:underline">{j.title}</Link>
              <p className="text-sm text-ink-soft">{j.business_name} · {j.city} · {salaryRange(j.salary_min, j.salary_max)}</p>
            </div>
            {j.open_reports > 0 && <Badge tone="rose">{j.open_reports} open report{j.open_reports > 1 ? "s" : ""}</Badge>}
            <Badge tone={j.verification_status === "verified" ? "green" : "slate"}>{j.verification_status}</Badge>
            <Badge tone={j.status === "open" ? "green" : j.status === "removed" ? "rose" : "slate"}>{j.status}</Badge>
            <form action={adminRemoveJob} className="flex gap-2">
              <input type="hidden" name="job_id" value={j.id} /><input type="hidden" name="next" value="/admin/jobs" />
              {j.status === "removed" ? <><input type="hidden" name="restore" value="1" /><button className={btn("outline", "sm")}>Restore</button></> : <button className={btn("danger", "sm")}>Remove</button>}
            </form>
          </Card>
        ))}
      </div>
    </>
  );
}
