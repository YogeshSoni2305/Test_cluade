import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { REPORT_TYPES, byId } from "@/lib/constants";
import { adminBulkReports, adminClearJobFlag, adminHideFeedback, adminRemoveJob, adminUpdateReport } from "@/app/actions";
import { Badge, btn, cx, Empty, Notice, PageHeader } from "@/components/ui";
import { Pager } from "@/components/Pager";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Moderation", robots: { index: false } };

const PER = 20;
type R = { id: number; job_id: number | null; type: string; details: string; status: string; resolution: string | null; created_at: string; title: string | null; business_name: string | null; reporter: string | null; reporter_id: number | null; job_status: string | null };

export default async function AdminReports({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin("moderate");
  const sp = await searchParams;
  const tab = sp.tab ?? "reports";
  const db = getDb();
  const counts = {
    reports: (db.prepare("SELECT COUNT(*) n FROM reports WHERE status IN ('open','investigating')").get() as { n: number }).n,
    flagged: (db.prepare("SELECT (SELECT COUNT(*) FROM jobs WHERE flagged_reason IS NOT NULL AND status='open') + (SELECT COUNT(*) FROM messages WHERE flagged IS NOT NULL AND created_at > datetime('now','-30 days')) n").get() as { n: number }).n,
    reviews: (db.prepare("SELECT COUNT(*) n FROM feedback WHERE hidden=1").get() as { n: number }).n,
  };
  const tabs: [string, string, number][] = [["reports", "Complaints", counts.reports], ["flagged", "Flagged content", counts.flagged], ["reviews", "Reviews", counts.reviews]];

  return (
    <>
      <PageHeader deva="शिकायतें" title="Moderation" sub="Investigate, contact the employer, and record the outcome. The reporter is told when a report moves forward." />
      <nav className="mb-6 flex gap-1 border-b border-line" aria-label="Moderation sections">
        {tabs.map(([k, label, n]) => (
          <Link key={k} href={`/admin/reports?tab=${k}`} aria-current={tab === k ? "page" : undefined}
            className={cx("-mb-px border-b-2 px-4 py-2 font-semibold", tab === k ? "border-sindoor-600 text-ink" : "border-transparent text-ink-soft hover:text-ink")}>
            {label}{n > 0 && <span className="ml-1.5 rounded-[2px] bg-sindoor-600 px-1.5 text-[0.72rem] text-paper-50">{n}</span>}
          </Link>
        ))}
      </nav>
      {sp.done && <div className="mb-4"><Notice tone="ok">Updated.</Notice></div>}
      {tab === "reports" && <Reports sp={sp} />}
      {tab === "flagged" && <Flagged />}
      {tab === "reviews" && <Reviews />}
    </>
  );
}

function Reports({ sp }: { sp: Record<string, string | undefined> }) {
  const db = getDb();
  const page = Math.max(1, Number(sp.page) || 1);
  const where: string[] = [];
  const args: unknown[] = [];
  if (sp.q) { where.push("(r.details LIKE ? OR e.business_name LIKE ? OR j.title LIKE ?)"); const l = `%${sp.q}%`; args.push(l, l, l); }
  if (sp.status) { where.push("r.status = ?"); args.push(sp.status); } else if (!sp.all) where.push("r.status IN ('open','investigating')");
  if (sp.type) { where.push("r.type = ?"); args.push(sp.type); }
  const W = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = (db.prepare(`SELECT COUNT(*) n FROM reports r LEFT JOIN jobs j ON j.id=r.job_id LEFT JOIN employers e ON e.id=r.employer_id ${W}`).get(...args) as { n: number }).n;
  const reports = db.prepare(`SELECT r.*, j.title, j.status AS job_status, e.business_name, u.name AS reporter FROM reports r
    LEFT JOIN jobs j ON j.id=r.job_id LEFT JOIN employers e ON e.id=r.employer_id LEFT JOIN users u ON u.id=r.reporter_id ${W}
    ORDER BY CASE r.status WHEN 'open' THEN 0 WHEN 'investigating' THEN 1 ELSE 2 END, r.created_at DESC LIMIT ? OFFSET ?`).all(...args, PER, (page - 1) * PER) as R[];
  const here = `/admin/reports?${new URLSearchParams(Object.entries({ tab: "reports", q: sp.q, status: sp.status, type: sp.type, all: sp.all, page: sp.page }).filter(([, v]) => v) as [string, string][])}`;
  return (
    <>
      <form className="mb-5 flex flex-wrap items-end gap-3">
        <input type="hidden" name="tab" value="reports" />
        <label className="min-w-56 flex-1 text-[0.85rem] font-semibold">Search<input name="q" defaultValue={sp.q} className="field mt-1 !py-2" placeholder="Details, business or listing" /></label>
        <label className="text-[0.85rem] font-semibold">Status
          <select name="status" defaultValue={sp.status ?? ""} className="field mt-1 !w-auto !py-2"><option value="">Open & investigating</option>{["open", "investigating", "resolved", "dismissed"].map((s) => <option key={s}>{s}</option>)}</select>
        </label>
        <label className="text-[0.85rem] font-semibold">Type
          <select name="type" defaultValue={sp.type ?? ""} className="field mt-1 !w-auto !py-2"><option value="">All</option>{REPORT_TYPES.map((r) => <option key={r.id} value={r.id}>{r.en}</option>)}</select>
        </label>
        <button className={btn("ink", "md")}>Filter</button>
      </form>
      {reports.length === 0 ? <Empty title="No reports here" /> : (
        <>
          <form action={adminBulkReports} id="bulk" className="mb-3 flex flex-wrap items-center gap-2 rounded-[3px] border border-line bg-paper-50 p-3 text-[0.92rem]">
            <span className="font-semibold">With selected:</span>
            <select name="bulk_status" className="field !w-auto !py-1.5" aria-label="New status"><option value="investigating">Mark investigating</option><option value="resolved">Mark resolved</option><option value="dismissed">Dismiss</option></select>
            <input name="bulk_resolution" className="field !w-72 !py-1.5" placeholder="Outcome note (sent to reporters)" aria-label="Outcome note" />
            <button className={btn("ink", "sm")}>Apply</button>
          </form>
          <div className="space-y-4">
            {reports.map((r) => (
              <article key={r.id} className="rounded-[4px] border border-line bg-paper-50 p-5 shadow-card">
                <div className="flex items-start gap-3">
                  <input type="checkbox" form="bulk" name="ids" value={r.id} className="mt-1.5 h-4 w-4 accent-sindoor-600" aria-label={`Select report ${r.id}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="rose">{byId(REPORT_TYPES, r.type)?.en ?? r.type}</Badge>
                      <Badge tone={{ open: "marigold", investigating: "indigo", resolved: "green", dismissed: "slate" }[r.status]}>{r.status}</Badge>
                      <span className="text-[0.82rem] text-ink-faint">#{r.id} · {timeAgo(r.created_at)} · by {r.reporter ?? "deleted user"}</span>
                    </div>
                    <p className="mt-2 font-semibold">{r.business_name ?? "—"} — {r.job_id ? <Link href={`/jobs/${r.job_id}`} className="text-sindoor-700 hover:underline">{r.title}</Link> : "listing deleted"}</p>
                    <p className="mt-1 whitespace-pre-line leading-relaxed text-ink-soft">{r.details}</p>
                  </div>
                </div>
                <form action={adminUpdateReport} className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
                  <input type="hidden" name="report_id" value={r.id} />
                  <input type="hidden" name="next" value={here} />
                  <label className="text-[0.85rem] font-semibold">Status
                    <select name="status" defaultValue={r.status} className="field mt-1 !w-auto !py-2">{["open", "investigating", "resolved", "dismissed"].map((s) => <option key={s}>{s}</option>)}</select>
                  </label>
                  <label className="min-w-56 flex-1 text-[0.85rem] font-semibold">Outcome (sent to the reporter)
                    <input name="resolution" defaultValue={r.resolution ?? ""} className="field mt-1 !py-2" />
                  </label>
                  <button className={btn("primary", "sm")}>Save</button>
                </form>
                {r.job_id && (
                  <form action={adminRemoveJob} className="mt-3 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="job_id" value={r.job_id} />
                    <input type="hidden" name="next" value={here} />
                    {r.job_status === "removed" ? (
                      <><input type="hidden" name="restore" value="1" /><button className={btn("outline", "sm")}>Restore listing</button></>
                    ) : (
                      <><input name="reason" className="field !w-72 !py-1.5" placeholder="Reason for removal (sent to employer)" aria-label="Removal reason" /><button className={btn("danger", "sm")}>Remove listing</button></>
                    )}
                  </form>
                )}
              </article>
            ))}
          </div>
        </>
      )}
      <Pager page={page} total={total} perPage={PER} base="/admin/reports" params={{ tab: "reports", q: sp.q, status: sp.status, type: sp.type, all: sp.all }} />
    </>
  );
}

function Flagged() {
  const db = getDb();
  const jobs = db.prepare(`SELECT j.id, j.title, j.flagged_reason, j.description, j.created_at, e.business_name FROM jobs j JOIN employers e ON e.id=j.employer_id
    WHERE j.flagged_reason IS NOT NULL AND j.status='open' ORDER BY j.created_at DESC`).all() as { id: number; title: string; flagged_reason: string; description: string; created_at: string; business_name: string }[];
  const msgs = db.prepare(`SELECT m.id, m.body, m.flagged, m.created_at, m.application_id, u.name AS sender, u.id AS sender_id, u.role
    FROM messages m LEFT JOIN users u ON u.id=m.sender_id WHERE m.flagged IS NOT NULL AND m.created_at > datetime('now','-30 days') ORDER BY m.id DESC LIMIT 50`).all() as
    { id: number; body: string; flagged: string; created_at: string; application_id: number; sender: string | null; sender_id: number | null; role: string | null }[];
  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 font-display text-[1.6rem] font-semibold text-ink">Listings held for review</h2>
        {jobs.length === 0 ? <p className="text-ink-soft">Nothing held.</p> : (
          <ul className="space-y-3">
            {jobs.map((j) => (
              <li key={j.id} className="rounded-[4px] border-l-[3px] border-haldi-500 bg-paper-50 p-4 shadow-card">
                <p className="font-semibold"><Link href={`/jobs/${j.id}`} className="text-sindoor-700 hover:underline">{j.title}</Link> · {j.business_name} <span className="text-[0.85rem] font-normal text-ink-faint">{timeAgo(j.created_at)}</span></p>
                <p className="text-[0.9rem] font-semibold text-haldi-700">{j.flagged_reason}</p>
                {j.description && <p className="mt-1 text-[0.92rem] text-ink-soft">{j.description.slice(0, 240)}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={adminClearJobFlag}><input type="hidden" name="job_id" value={j.id} /><button className={btn("success", "sm")}>Approve & publish</button></form>
                  <form action={adminRemoveJob} className="flex gap-2"><input type="hidden" name="job_id" value={j.id} /><input type="hidden" name="next" value="/admin/reports?tab=flagged" /><input name="reason" defaultValue={`Removed: ${j.flagged_reason}`} className="field !w-64 !py-1.5" aria-label="Removal reason" /><button className={btn("danger", "sm")}>Remove</button></form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="mb-3 font-display text-[1.6rem] font-semibold text-ink">Flagged messages (30 days)</h2>
        <p className="mb-3 text-[0.9rem] text-ink-soft">Delivered with a safety warning to the recipient. Suspend the sender from the Users tab if this is a pattern.</p>
        {msgs.length === 0 ? <p className="text-ink-soft">No flagged messages.</p> : (
          <ul className="divide-y divide-line border-y border-line">
            {msgs.map((m) => (
              <li key={m.id} className="py-3 text-[0.95rem]">
                <p><b>{m.sender ?? "deleted"}</b> <span className="text-ink-faint">({m.role}) · {timeAgo(m.created_at)} · {m.flagged}</span></p>
                <p className="text-ink-soft">{m.body}</p>
                {m.sender_id && <Link href={`/admin/users?q=${encodeURIComponent(m.sender ?? "")}`} className="text-[0.85rem] text-sindoor-700 hover:underline">Open user</Link>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Reviews() {
  const comments = getDb().prepare(`SELECT f.id, f.rating, f.comment, f.hidden, f.from_role, f.checkpoint, f.created_at, e.business_name FROM feedback f
    JOIN applications a ON a.id=f.application_id JOIN jobs j ON j.id=a.job_id JOIN employers e ON e.id=j.employer_id
    WHERE f.comment != '' ORDER BY f.hidden DESC, f.created_at DESC LIMIT 60`).all() as { id: number; rating: number; comment: string; hidden: number; from_role: string; checkpoint: string; created_at: string; business_name: string }[];
  return comments.length === 0 ? <Empty title="No written reviews yet" /> : (
    <ul className="space-y-2">
      {comments.map((c) => (
        <li key={c.id} className="flex items-center gap-4 rounded-[4px] border border-line bg-paper-50 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-[0.88rem] text-ink-soft">{c.from_role} on {c.business_name} · {c.checkpoint} · <span className="text-haldi-700">{"★".repeat(c.rating)}</span>{c.hidden ? <Badge tone="marigold" className="ml-2">hidden</Badge> : null}</p>
            <p className={c.hidden ? "text-ink-faint line-through" : ""}>{c.comment}</p>
          </div>
          <form action={adminHideFeedback}><input type="hidden" name="feedback_id" value={c.id} /><input type="hidden" name="next" value="/admin/reports?tab=reviews" /><button className={btn("outline", "sm")}>{c.hidden ? "Show" : "Hide"}</button></form>
        </li>
      ))}
    </ul>
  );
}
