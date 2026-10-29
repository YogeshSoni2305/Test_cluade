import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getEmployerByUser, getJob, getCandidateProfile } from "@/lib/queries";
import { getDb } from "@/lib/db";
import { getI18n, bi } from "@/lib/i18n";
import { APPLICATION_STATUSES, EDUCATION, GOALS, INDUSTRIES, byId } from "@/lib/constants";
import { setJobStatus, updateApplication } from "@/app/actions";
import { Badge, btn, Empty, Notice, PageHeader } from "@/components/ui";
import { IArrowLeft, IPhone } from "@/components/icons";
import { salaryRange, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

type AppRow = { id: number; candidate_id: number; message: string; status: string; employer_note: string; created_at: string; name: string; phone: string | null; has_feedback: number };

export default async function ManageJob({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  if (!emp) redirect("/employer/profile");
  const job = getJob(Number((await params).id));
  if (!job || job.employer_id !== emp!.id) notFound();
  const sp = await searchParams;
  const { lang } = await getI18n();

  const apps = getDb().prepare(`
    SELECT a.id, a.candidate_id, a.message, a.status, a.employer_note, a.created_at, u.name, u.phone,
      (SELECT COUNT(*) FROM feedback f WHERE f.application_id=a.id AND f.from_role='employer') AS has_feedback
    FROM applications a JOIN users u ON u.id=a.candidate_id WHERE a.job_id=? AND a.status != 'withdrawn' ORDER BY a.created_at DESC`).all(job.id) as AppRow[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link href="/employer" className="mb-6 inline-flex items-center gap-1.5 text-[0.95rem] font-semibold text-ink-soft hover:text-sindoor-700"><IArrowLeft size={16} />Dashboard</Link>
      <PageHeader
        deva="आवेदक"
        title={job.title}
        sub={`${job.city} · ${salaryRange(job.salary_min, job.salary_max)} · clarity ${job.clarity}/10`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={job.status === "open" ? "green" : job.status === "removed" ? "rose" : "slate"}>{job.status}</Badge>
            <Link href={`/jobs/${job.id}`} className={btn("ghost", "sm")}>Public page</Link>
            {job.status !== "removed" && <Link href={`/employer/jobs/${job.id}/edit`} className={btn("outline", "sm")}>Edit</Link>}
            {job.status === "open" ? (
              <>
                <form action={setJobStatus}><input type="hidden" name="job_id" value={job.id} /><input type="hidden" name="status" value="filled" /><button className={btn("success", "sm")}>Mark as filled</button></form>
                <form action={setJobStatus}><input type="hidden" name="job_id" value={job.id} /><input type="hidden" name="status" value="closed" /><button className={btn("ghost", "sm")}>Close</button></form>
              </>
            ) : job.status !== "removed" ? (
              <form action={setJobStatus}><input type="hidden" name="job_id" value={job.id} /><input type="hidden" name="status" value="open" /><button className={btn("primary", "sm")}>Reopen</button></form>
            ) : null}
          </div>
        }
      />

      <div className="mb-8 space-y-3">
        {sp.posted && <Notice tone="ok">Your listing is live. Candidates can now find and apply to it.</Notice>}
        {sp.saved && <Notice tone="ok">Changes saved.</Notice>}
        {job.status === "removed" && <Notice tone="bad">This listing was removed by moderators: {job.removed_reason}. Contact support if you believe this is a mistake.</Notice>}
      </div>

      <h2 className="border-b-2 border-ink pb-2 font-display text-[2rem] font-semibold text-ink">Applicants <span className="num">({apps.length})</span></h2>
      <div className="mt-6 space-y-6">
        {apps.length === 0 && <Empty title="No applicants yet" sub="Share your listing link with people you know, and check back soon." />}
        {apps.map((a) => {
          const p = getCandidateProfile(a.candidate_id);
          const edu = byId(EDUCATION, p?.education);
          const st = byId([...APPLICATION_STATUSES], a.status);
          return (
            <article key={a.id} id={`app-${a.id}`} className={`scroll-mt-28 rounded-[4px] border bg-paper-50 shadow-card ${sp.updated === String(a.id) ? "border-peacock-500" : "border-line"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-6 py-5">
                <div>
                  <p className="font-display text-[1.7rem] font-semibold leading-tight text-ink">{a.name}</p>
                  <p className="text-[0.95rem] text-ink-soft">
                    {p?.district && <>{p.district}, Rajasthan · </>}{p?.age && <>{p.age} yrs · </>}{bi(edu, lang)} · applied {timeAgo(a.created_at, lang)}
                  </p>
                </div>
                <Badge tone={st?.tone}>{bi(st, lang)}</Badge>
              </div>

              <dl className="grid gap-x-8 gap-y-4 px-6 py-5 text-[0.96rem] sm:grid-cols-3">
                <div>
                  <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Contact</dt>
                  <dd className="mt-1">
                    {a.phone ? <a href={`tel:${a.phone}`} className="inline-flex items-center gap-1.5 font-semibold text-sindoor-700 hover:underline"><IPhone size={16} />{a.phone}</a> : <span className="text-ink-faint">No phone</span>}
                    {a.phone && <a href={`https://wa.me/${a.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="block text-[0.85rem] font-semibold text-peacock-600 hover:underline">WhatsApp</a>}
                    <span className="block text-[0.8rem] text-ink-faint">Shared because they applied</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Languages & experience</dt>
                  <dd className="mt-1">{p?.languages.join(", ") || "—"}<span className="block text-ink-soft">{p?.experience || "Fresher"}</span></dd>
                </div>
                <div>
                  <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Needs</dt>
                  <dd className="mt-1">{p?.needs_accommodation ? "Needs accommodation" : "Has own stay"}<span className="block text-ink-soft">{p?.relocate ? "Willing to relocate" : "Local only"}</span></dd>
                </div>
                <div className="sm:col-span-3">
                  <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">Goals & interests</dt>
                  <dd className="mt-1">{p?.goals.map((g) => byId(GOALS, g)?.en).filter(Boolean).join(" · ") || "—"}
                    <span className="block text-ink-soft">{p?.industries.map((i) => byId(INDUSTRIES, i)?.en).filter(Boolean).join(", ")}</span>
                    {p?.learn_notes && <span className="block italic text-ink-soft">Wants to learn: {p.learn_notes}</span>}
                  </dd>
                </div>
              </dl>
              {a.message && <p className="mx-6 mb-5 border-l-2 border-haldi-400 pl-4 font-display text-[1.2rem] italic text-ink">“{a.message}”</p>}

              <form action={updateApplication} className="flex flex-wrap items-end gap-3 border-t border-line bg-paper-100/60 px-6 py-4">
                <input type="hidden" name="application_id" value={a.id} />
                <label className="text-[0.85rem] font-semibold">Status
                  <select name="status" defaultValue={a.status} className="field mt-1 !w-auto !py-2">
                    {APPLICATION_STATUSES.filter((s) => s.id !== "withdrawn").map((s) => <option key={s.id} value={s.id}>{s.en}</option>)}
                  </select>
                </label>
                <label className="min-w-48 flex-1 text-[0.85rem] font-semibold">Private note
                  <input name="employer_note" defaultValue={a.employer_note} className="field mt-1 !py-2" placeholder="e.g. Interview Sat 11 am" />
                </label>
                <button className={btn("ink", "md")}>Update</button>
                {["selected", "joined"].includes(a.status) && !a.has_feedback && (
                  <Link href={`/feedback/${a.id}`} className={btn("gold", "md")}>Feedback</Link>
                )}
              </form>
            </article>
          );
        })}
      </div>
    </div>
  );
}
