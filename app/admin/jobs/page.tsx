import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminBulkJobs } from "@/app/actions";
import { Badge, btn, Empty, Notice, PageHeader } from "@/components/ui";
import { Pager } from "@/components/Pager";
import { salaryRange } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Listings", robots: { index: false } };

const PER = 30;
type Row = { id: number; title: string; status: string; city: string; salary_min: number; salary_max: number; business_name: string; verification_status: string; open_reports: number; flagged_reason: string | null; expires_at: string | null; expired: number };

export default async function AdminJobs({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin("moderate");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: string[] = [];
  const args: unknown[] = [];
  if (sp.q) { where.push("(j.title LIKE ? OR e.business_name LIKE ? OR j.city LIKE ?)"); const l = `%${sp.q}%`; args.push(l, l, l); }
  if (sp.status === "flagged") where.push("j.flagged_reason IS NOT NULL");
  else if (sp.status === "expired") where.push("j.status='open' AND j.expires_at <= datetime('now')");
  else if (sp.status === "reported") where.push("EXISTS (SELECT 1 FROM reports r WHERE r.job_id=j.id AND r.status IN ('open','investigating'))");
  else if (sp.status) { where.push("j.status = ?"); args.push(sp.status); }
  const W = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const db = getDb();
  const total = (db.prepare(`SELECT COUNT(*) n FROM jobs j JOIN employers e ON e.id=j.employer_id ${W}`).get(...args) as { n: number }).n;
  const jobs = db.prepare(`SELECT j.id, j.title, j.status, j.city, j.salary_min, j.salary_max, j.flagged_reason, j.expires_at, e.business_name, e.verification_status,
      (j.expires_at <= datetime('now')) AS expired,
      (SELECT COUNT(*) FROM reports r WHERE r.job_id=j.id AND r.status IN ('open','investigating')) AS open_reports
      FROM jobs j JOIN employers e ON e.id=j.employer_id ${W} ORDER BY j.created_at DESC LIMIT ? OFFSET ?`).all(...args, PER, (page - 1) * PER) as Row[];
  return (
    <>
      <PageHeader deva="लिस्टिंग" title="All listings" sub="Spot-check for misleading terms. Removing a listing hides it from candidates immediately and tells the employer why." />
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <label className="min-w-56 flex-1 text-[0.85rem] font-semibold">Search<input name="q" defaultValue={sp.q} className="field mt-1 !py-2" placeholder="Title, business or city" /></label>
        <label className="text-[0.85rem] font-semibold">Show
          <select name="status" defaultValue={sp.status ?? ""} className="field mt-1 !w-auto !py-2">
            <option value="">All</option>{["open", "flagged", "reported", "expired", "filled", "closed", "removed"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <button className={btn("ink", "md")}>Filter</button>
      </form>
      {sp.done && <div className="mb-4"><Notice tone="ok">Updated {sp.done} listing(s).</Notice></div>}
      {jobs.length === 0 ? <Empty title="No listings match" /> : (
        <form action={adminBulkJobs}>
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[3px] border border-line bg-paper-50 p-3 text-[0.92rem]">
            <span className="font-semibold">With selected:</span>
            <select name="bulk_op" className="field !w-auto !py-1.5" aria-label="Bulk action"><option value="remove">Remove</option><option value="restore">Restore</option></select>
            <input name="bulk_reason" className="field !w-72 !py-1.5" placeholder="Reason (sent to employer)" aria-label="Reason" />
            <button className={btn("danger", "sm")}>Apply</button>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {jobs.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center gap-3 py-3">
                <input type="checkbox" name="ids" value={j.id} className="h-4 w-4 accent-sindoor-600" aria-label={`Select ${j.title}`} />
                <div className="min-w-0 flex-1">
                  <Link href={`/jobs/${j.id}`} className="font-semibold text-sindoor-700 hover:underline">{j.title}</Link>
                  <p className="text-[0.9rem] text-ink-soft">{j.business_name} · {j.city} · <span className="num">{salaryRange(j.salary_min, j.salary_max)}</span>{j.flagged_reason && <span className="font-semibold text-haldi-700"> · flag: {j.flagged_reason}</span>}</p>
                </div>
                {j.open_reports > 0 && <Badge tone="rose">{j.open_reports} open report{j.open_reports > 1 ? "s" : ""}</Badge>}
                <Badge tone={j.verification_status === "verified" ? "green" : "slate"}>{j.verification_status}</Badge>
                <Badge tone={j.status === "open" && !j.expired ? "green" : j.status === "removed" ? "rose" : "slate"}>{j.status === "open" && j.expired ? "expired" : j.status}</Badge>
                <Link href={`/admin/audit?entity=job&entity_id=${j.id}`} className="text-[0.85rem] text-ink-soft hover:underline">history</Link>
              </li>
            ))}
          </ul>
        </form>
      )}
      <Pager page={page} total={total} perPage={PER} base="/admin/jobs" params={{ q: sp.q, status: sp.status }} />
    </>
  );
}
