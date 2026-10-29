import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getEmployerByUser, getJob, getCandidateProfile } from "@/lib/queries";
import { getDb } from "@/lib/db";
import { getI18n, bi } from "@/lib/i18n";
import { APPLICATION_STATUSES, EDUCATION, GOALS, INDUSTRIES, byId } from "@/lib/constants";
import { setJobStatus, updateApplication } from "@/app/actions";
import { Badge, btn, Card, Empty, Notice, PageHeader } from "@/components/ui";
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

  const statusButtons = (st: string) => (
    <form action={setJobStatus} className="inline">
      <input type="hidden" name="job_id" value={job.id} /><input type="hidden" name="status" value={st} />
    </form>
  );
  void statusButtons;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/employer" className="text-sm font-semibold text-indigo-700 hover:underline">← Dashboard</Link>
      <div className="mt-3">
        <PageHeader
          title={job.title}
          sub={`${job.city} · ${salaryRange(job.salary_min, job.salary_max)} · clarity ${job.clarity}/10`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={job.status === "open" ? "green" : job.status === "removed" ? "rose" : "slate"}>{job.status}</Badge>
              <Link href={`/jobs/${job.id}`} className={btn("outline", "sm")}>View public page</Link>
              {job.status !== "removed" && <Link href={`/employer/jobs/${job.id}/edit`} className={btn("outline", "sm")}>Edit</Link>}
              {job.status === "open" ? (
                <>
                  <form action={setJobStatus}><input type="hidden" name="job_id" value={job.id} /><input type="hidden" name="status" value="filled" /><button className={btn("success", "sm")}>✓ Mark as filled</button></form>
                  <form action={setJobStatus}><input type="hidden" name="job_id" value={job.id} /><input type="hidden" name="status" value="closed" /><button className={btn("ghost", "sm")}>Close</button></form>
                </>
              ) : job.status !== "removed" ? (
                <form action={setJobStatus}><input type="hidden" name="job_id" value={job.id} /><input type="hidden" name="status" value="open" /><button className={btn("primary", "sm")}>Reopen</button></form>
              ) : null}
            </div>
          }
        />
      </div>

      {sp.posted && <div className="mb-6"><Notice tone="ok">🎉 Your listing is live! Candidates can now find and apply to it.</Notice></div>}
      {sp.saved && <div className="mb-6"><Notice tone="ok">✓ Changes saved.</Notice></div>}
      {job.status === "removed" && <div className="mb-6"><Notice tone="bad">This listing was removed by moderators: {job.removed_reason}. Contact support if you believe this is a mistake.</Notice></div>}

      <h2 className="font-display text-2xl font-semibold text-indigo-900">Applicants ({apps.length})</h2>
      <div className="mt-5 space-y-4">
        {apps.length === 0 && <Empty icon="📭" title="No applicants yet" sub="Share your listing link with people you know, and check back soon." />}
        {apps.map((a) => {
          const p = getCandidateProfile(a.candidate_id);
          const edu = byId(EDUCATION, p?.education);
          return (
            <Card key={a.id} className={`p-5 ${sp.updated === String(a.id) ? "ring-2 ring-leaf-500" : ""}`}>
              <div id={`app-${a.id}`} className="scroll-mt-28" />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-semibold text-indigo-900">{a.name}</p>
                  <p className="text-sm text-ink-soft">
                    {p?.district && <>{p.district}, Rajasthan · </>}{p?.age && <>{p.age} yrs · </>}{bi(edu, lang)} · applied {timeAgo(a.created_at, lang)}
                  </p>
                </div>
                <Badge tone={byId([...APPLICATION_STATUSES], a.status)?.tone}>{bi(byId([...APPLICATION_STATUSES], a.status), lang)}</Badge>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-2xl bg-cream-100 p-3.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Contact (shared because they applied)</p>
                  {a.phone ? <a href={`tel:${a.phone}`} className="mt-1 block text-lg font-semibold text-indigo-800 hover:underline">📞 {a.phone}</a> : <p className="mt-1 text-ink-soft">No phone provided</p>}
                  {a.phone && <a href={`https://wa.me/${a.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-leaf-600 hover:underline">Open WhatsApp</a>}
                </div>
                <div className="rounded-2xl bg-cream-100 p-3.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Languages & experience</p>
                  <p className="mt-1">{p?.languages.join(", ") || "—"}</p>
                  <p className="text-ink-soft">{p?.experience || "Fresher"}</p>
                </div>
                <div className="rounded-2xl bg-cream-100 p-3.5 sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Goals & interests</p>
                  <p className="mt-1">{p?.goals.map((g) => byId(GOALS, g)?.en).filter(Boolean).join(" · ") || "—"}</p>
                  <p className="text-ink-soft">{p?.industries.map((i) => byId(INDUSTRIES, i)?.en).filter(Boolean).join(", ")}</p>
                  {p?.learn_notes && <p className="mt-1 italic text-ink-soft">Wants to learn: {p.learn_notes}</p>}
                  <p className="mt-1 text-ink-soft">{p?.needs_accommodation ? "Needs accommodation" : "Has own accommodation"} · {p?.relocate ? "Willing to relocate" : "Local only"}</p>
                </div>
              </div>
              {a.message && <p className="mt-3 rounded-2xl border border-line p-3.5 italic text-ink-soft">“{a.message}”</p>}

              <form action={updateApplication} className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
                <input type="hidden" name="application_id" value={a.id} />
                <label className="text-sm font-semibold">Status
                  <select name="status" defaultValue={a.status} className="field mt-1 !w-auto !py-2">
                    {APPLICATION_STATUSES.filter((s) => s.id !== "withdrawn").map((s) => <option key={s.id} value={s.id}>{s.en}</option>)}
                  </select>
                </label>
                <label className="min-w-48 flex-1 text-sm font-semibold">Private note
                  <input name="employer_note" defaultValue={a.employer_note} className="field mt-1 !py-2" placeholder="e.g. Interview Sat 11 am" />
                </label>
                <button className={btn("primary", "sm")}>Update</button>
                {["selected", "joined"].includes(a.status) && !a.has_feedback && (
                  <Link href={`/feedback/${a.id}`} className={btn("gold", "sm")}>★ Feedback</Link>
                )}
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
