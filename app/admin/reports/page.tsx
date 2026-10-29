import Link from "next/link";
import { getDb } from "@/lib/db";
import { REPORT_TYPES, byId } from "@/lib/constants";
import { adminHideFeedback, adminRemoveJob, adminUpdateReport } from "@/app/actions";
import { Badge, btn, Card, Empty, Notice, PageHeader } from "@/components/ui";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

type R = { id: number; job_id: number | null; type: string; details: string; status: string; resolution: string | null; created_at: string; title: string | null; business_name: string | null; reporter: string | null; job_status: string | null };

export default async function AdminReports({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const db = getDb();
  const reports = db.prepare(`SELECT r.*, j.title, j.status AS job_status, e.business_name, u.name AS reporter FROM reports r
    LEFT JOIN jobs j ON j.id=r.job_id LEFT JOIN employers e ON e.id=r.employer_id LEFT JOIN users u ON u.id=r.reporter_id
    ORDER BY CASE r.status WHEN 'open' THEN 0 WHEN 'investigating' THEN 1 ELSE 2 END, r.created_at DESC`).all() as R[];
  const comments = db.prepare(`SELECT f.id, f.rating, f.comment, f.hidden, f.from_role, e.business_name FROM feedback f
    JOIN applications a ON a.id=f.application_id JOIN jobs j ON j.id=a.job_id JOIN employers e ON e.id=j.employer_id
    WHERE f.comment != '' ORDER BY f.created_at DESC LIMIT 10`).all() as { id: number; rating: number; comment: string; hidden: number; from_role: string; business_name: string }[];

  return (
    <>
      <PageHeader deva="शिकायतें" title="Complaints" sub="Investigate, contact the employer, and record the outcome. Remove fraudulent or abusive listings." />
      {sp.done && <div className="mb-6"><Notice tone="ok">Updated.</Notice></div>}
      <div className="space-y-4">
        {reports.length === 0 && <Empty title="No reports" />}
        {reports.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="rose">{byId(REPORT_TYPES, r.type)?.en ?? r.type}</Badge>
                  <Badge tone={{ open: "marigold", investigating: "indigo", resolved: "green", dismissed: "slate" }[r.status]}>{r.status}</Badge>
                  <span className="text-xs text-ink-soft">{timeAgo(r.created_at)} · by {r.reporter ?? "unknown"}</span>
                </div>
                <p className="mt-2 font-semibold">{r.business_name} — {r.job_id ? <Link href={`/jobs/${r.job_id}`} className="text-sindoor-700 hover:underline">{r.title}</Link> : "—"}</p>
                <p className="mt-1 leading-relaxed text-ink-soft">{r.details}</p>
              </div>
            </div>
            <form action={adminUpdateReport} className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
              <input type="hidden" name="report_id" value={r.id} />
              <label className="text-sm font-semibold">Status
                <select name="status" defaultValue={r.status} className="field mt-1 !w-auto !py-2">{["open", "investigating", "resolved", "dismissed"].map((s) => <option key={s}>{s}</option>)}</select>
              </label>
              <label className="min-w-56 flex-1 text-sm font-semibold">Outcome / resolution note
                <input name="resolution" defaultValue={r.resolution ?? ""} className="field mt-1 !py-2" />
              </label>
              <button className={btn("primary", "sm")}>Save</button>
            </form>
            {r.job_id && (
              <form action={adminRemoveJob} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="job_id" value={r.job_id} />
                {r.job_status === "removed" ? (
                  <><input type="hidden" name="restore" value="1" /><button className={btn("outline", "sm")}>Restore listing</button></>
                ) : (
                  <><input name="reason" className="field !w-64 !py-1.5 text-sm" placeholder="Reason for removal" /><button className={btn("danger", "sm")}>Remove listing</button></>
                )}
              </form>
            )}
          </Card>
        ))}
      </div>

      <h2 className="mb-4 mt-14 font-display text-[2rem] font-semibold text-ink">Review moderation</h2>
      <div className="space-y-2">
        {comments.length === 0 && <p className="text-ink-soft">No reviews yet.</p>}
        {comments.map((c) => (
          <Card key={c.id} className="flex items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink-soft">{c.from_role} on {c.business_name} · <span className="text-marigold-600">{"★".repeat(c.rating)}</span></p>
              <p className={c.hidden ? "line-through opacity-50" : ""}>{c.comment}</p>
            </div>
            <form action={adminHideFeedback}><input type="hidden" name="feedback_id" value={c.id} /><button className={btn("outline", "sm")}>{c.hidden ? "Show" : "Hide"}</button></form>
          </Card>
        ))}
      </div>
    </>
  );
}
