import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getEmployerByUser, getJob, getCandidateProfile, isExpired } from "@/lib/queries";
import { jobDailyStats } from "@/lib/jobstats";
import { Sparkline } from "@/components/Sparkline";
import { renewJob } from "@/app/_actions/jobs";
import { getDb } from "@/lib/db";
import { getI18n, bi, type Key } from "@/lib/i18n";
import { APPLICATION_STATUSES, EDUCATION, GOALS, INDUSTRIES, byId, skillsFor } from "@/lib/constants";
import { setJobStatus, updateApplication } from "@/app/actions";
import { issueLetter, revokeLetter } from "@/app/_actions/letters";
import { Badge, btn, Chips, Empty, Field, FieldGroup, Notice, PageHeader } from "@/components/ui";
import { IArrowLeft, ICopy, IDoc, ILock, IPhone, IRefresh } from "@/components/icons";
import { maskPhone } from "@/lib/telephony";
import { salaryRange, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

type AppRow = { id: number; candidate_id: number; message: string; status: string; employer_note: string; created_at: string; name: string; phone: string | null; has_feedback: number; share_phone: number; unread: number; source: string; joined_at: string | null; left_at: string | null; letter_code: string | null };

export default async function ManageJob({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  if (!emp) redirect("/employer/profile");
  const job = getJob(Number((await params).id));
  if (!job || job.employer_id !== emp!.id) notFound();
  const sp = await searchParams;
  const { t, lang } = await getI18n();
  const today = new Date().toISOString().slice(0, 10);
  const expired = job.status === "open" && isExpired(job);
  const stats = jobDailyStats(job.id, 14);
  const views14 = stats.reduce((a, d) => a + d.views, 0);
  const applies14 = stats.reduce((a, d) => a + d.applies, 0);

  const apps = getDb().prepare(`
    SELECT a.id, a.candidate_id, a.message, a.status, a.employer_note, a.created_at, a.share_phone, a.source, a.joined_at, a.left_at, u.name, u.phone_norm AS phone,
      (SELECT COUNT(*) FROM feedback f WHERE f.application_id=a.id AND f.from_role='employer') AS has_feedback,
      (SELECT COUNT(*) FROM messages m WHERE m.application_id=a.id AND m.read_at IS NULL AND (m.sender_id IS NULL OR m.sender_id != ?)) AS unread,
      (SELECT code FROM experience_letters l WHERE l.application_id=a.id AND l.revoked=0) AS letter_code
    FROM applications a JOIN users u ON u.id=a.candidate_id WHERE a.job_id=? AND a.status != 'withdrawn' ORDER BY a.created_at DESC`).all(user.id, job.id) as AppRow[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link href="/employer" className="mb-6 inline-flex items-center gap-1.5 text-[0.95rem] font-semibold text-ink-soft hover:text-sindoor-700"><IArrowLeft size={16} />{t("nav_dashboard")}</Link>
      <PageHeader
        deva="आवेदक"
        title={job.title}
        sub={`${job.city} · ${salaryRange(job.salary_min, job.salary_max)} · ${t("clarity")} ${job.clarity}/10`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={job.flagged_reason ? "marigold" : expired ? "rose" : job.status === "open" ? "green" : job.status === "removed" ? "rose" : "slate"}>
              {job.flagged_reason ? t("ej_under_review") : expired ? t("ej_expired") : t(`ej_status_${job.status}` as Key)}
            </Badge>
            <Link href={`/jobs/${job.id}`} className={btn("ghost", "sm")}>{t("mj_public")}</Link>
            {job.status !== "removed" && <Link href={`/employer/jobs/${job.id}/edit`} className={btn("outline", "sm")}>{t("mj_edit")}</Link>}
            <Link href={`/employer/jobs/new?from=${job.id}`} className={btn("ghost", "sm")}><ICopy size={15} />{t("ej_duplicate")}</Link>
            {job.status === "open" && !expired ? (
              <>
                <form action={setJobStatus}><input type="hidden" name="job_id" value={job.id} /><input type="hidden" name="status" value="filled" /><button className={btn("success", "sm")}>{t("ej_mark_filled")}</button></form>
                <form action={setJobStatus}><input type="hidden" name="job_id" value={job.id} /><input type="hidden" name="status" value="closed" /><button className={btn("ghost", "sm")}>{t("mj_close")}</button></form>
              </>
            ) : job.status !== "removed" ? (
              <form action={renewJob}><input type="hidden" name="job_id" value={job.id} /><button className={btn("primary", "sm")}><IRefresh size={15} />{t("ej_renew")}</button></form>
            ) : null}
          </div>
        }
      />

      <div className="mb-8 space-y-3">
        {sp.posted && <Notice tone="ok">{job.flagged_reason ? t("mj_posted_review") : t("mj_posted")}</Notice>}
        {sp.renewed && <Notice tone="ok">{t("ej_renewed")}</Notice>}
        {sp.letter && <Notice tone="ok">{t("letter_issued_ok")} <b className="num">{sp.letter}</b></Notice>}
        {sp.error && <Notice tone="bad">{sp.error}</Notice>}
        {sp.saved && <Notice tone="ok">{t("mj_saved")}</Notice>}
        {job.flagged_reason && <Notice tone="warn">{t("mj_flagged")} <b>{job.flagged_reason}</b></Notice>}
        {expired && <Notice tone="warn">{t("mj_expired")}</Notice>}
        {job.status === "removed" && <Notice tone="bad">{t("mj_removed")} {job.removed_reason}</Notice>}
      </div>

      <section className="mb-12 grid gap-6 rounded-[4px] border border-line bg-paper-50 p-6 shadow-card md:grid-cols-[1fr_16rem]">
        <div>
          <h2 className="font-semibold text-ink">{t("mj_last14")}</h2>
          <Sparkline data={stats} labels={{ views: t("ej_views"), applies: t("ej_applicants"), day: t("mj_day") }} />
          <p className="flex gap-5 text-[0.82rem] text-ink-soft"><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-neel-500/60" />{t("ej_views")}</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rotate-45 bg-sindoor-500" />{t("ej_applicants")}</span></p>
        </div>
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-1">
          <div><dt className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">{t("mj_views14")}</dt><dd className="num font-display text-3xl font-semibold text-ink">{views14}</dd></div>
          <div><dt className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">{t("mj_conversion")}</dt><dd className="num font-display text-3xl font-semibold text-sindoor-700">{views14 ? `${Math.round((applies14 / views14) * 100)}%` : "—"}</dd></div>
          <div className="col-span-2 md:col-span-1"><dt className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">{t("ej_expires")}</dt><dd className="font-semibold text-ink">{job.expires_at?.slice(0, 10) ?? "—"}</dd></div>
        </dl>
      </section>

      <h2 className="border-b-2 border-ink pb-2 font-display text-[2rem] font-semibold text-ink">{t("mj_applicants")} <span className="num">({apps.length})</span></h2>
      <div className="mt-6 space-y-6">
        {apps.length === 0 && <Empty title={t("mj_no_apps")} sub={t("mj_no_apps_sub")} action={<Link href="/employer/candidates" className={btn("outline")}>{t("nav_find_candidates")}</Link>} />}
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
                    {p?.district && <>{p.district}, Rajasthan · </>}{p?.age && <>{p.age} {t("cs_yrs")} · </>}{bi(edu, lang)} · {t("cd_applied")} {timeAgo(a.created_at, lang)}{a.source === "invite" && <> · <span className="text-haldi-700">{t("mj_via_invite")}</span></>}
                  </p>
                </div>
                <Badge tone={st?.tone}>{bi(st, lang)}</Badge>
              </div>

              <dl className="grid gap-x-8 gap-y-4 px-6 py-5 text-[0.96rem] sm:grid-cols-3">
                <div>
                  <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">{t("emp_contact")}</dt>
                  <dd className="mt-1">
                    {a.share_phone && a.phone ? (
                      <a href={`tel:${a.phone}`} className="num inline-flex items-center gap-1.5 font-semibold text-sindoor-700 hover:underline"><IPhone size={16} />{a.phone}</a>
                    ) : (
                      <span className="num inline-flex items-center gap-1.5 font-semibold text-ink-soft"><ILock size={15} />{maskPhone(a.phone)}</span>
                    )}
                    <Link href={`/messages/${a.id}`} className="mt-1 flex items-center gap-1.5 text-[0.9rem] font-semibold text-peacock-600 hover:underline">
                      {t("msg_open")}{a.unread > 0 && <span className="rounded-[2px] bg-sindoor-600 px-1.5 text-[0.72rem] text-paper-50">{a.unread}</span>}
                    </Link>
                    <span className="block text-[0.8rem] text-ink-faint">{a.share_phone ? t("emp_phone_shared") : t("emp_phone_hidden")}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">{t("mj_lang_exp")}</dt>
                  <dd className="mt-1">{p?.languages.join(", ") || "—"}<span className="block text-ink-soft">{p?.experience || t("mj_fresher")}</span></dd>
                </div>
                <div>
                  <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">{t("mj_needs")}</dt>
                  <dd className="mt-1">{p?.needs_accommodation ? t("mj_needs_stay") : t("mj_own_stay")}<span className="block text-ink-soft">{p?.relocate ? t("mj_relocate") : t("mj_local")}</span></dd>
                </div>
                <div className="sm:col-span-3">
                  <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">{t("mj_goals")}</dt>
                  <dd className="mt-1">{p?.goals.map((g) => bi(byId(GOALS, g), lang)).filter(Boolean).join(" · ") || "—"}
                    <span className="block text-ink-soft">{p?.industries.map((i) => bi(byId(INDUSTRIES, i), lang)).filter(Boolean).join(", ")}</span>
                    {p?.learn_notes && <span className="block italic text-ink-soft">{t("mj_wants_learn")}: {p.learn_notes}</span>}
                  </dd>
                </div>
              </dl>
              

              <form action={updateApplication} className="flex flex-wrap items-end gap-3 border-t border-line bg-paper-100/60 px-6 py-4">
                <input type="hidden" name="application_id" value={a.id} />
                <label className="text-[0.85rem] font-semibold">{t("emp_status")}
                  <select name="status" defaultValue={a.status} className="field mt-1 !w-auto !py-2">
                    {APPLICATION_STATUSES.filter((s) => s.id !== "withdrawn").map((s) => <option key={s.id} value={s.id}>{bi(s, lang)}</option>)}
                  </select>
                </label>
                {a.status !== "joined" && (
                  <label className="text-[0.85rem] font-semibold">{t("emp_joined_on")}
                    <input type="date" name="joined_at" max={today} className="field mt-1 !w-auto !py-2" />
                  </label>
                )}
                <label className="min-w-48 flex-1 text-[0.85rem] font-semibold">{t("emp_note")}
                  <input name="employer_note" defaultValue={a.employer_note} className="field mt-1 !py-2" placeholder={t("emp_note_ph")} />
                </label>
                <button className={btn("ink", "md")}>{t("emp_update")}</button>
                {["selected", "joined"].includes(a.status) && !a.has_feedback && (
                  <Link href={`/feedback/${a.id}`} className={btn("gold", "md")}>{t("emp_feedback")}</Link>
                )}
              </form>

              {a.letter_code ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4 text-[0.95rem]">
                  <p className="flex items-center gap-2 text-peacock-700"><IDoc size={18} />{t("letter_issued_ok")} <Link href={`/letters/${a.letter_code}`} className="num font-semibold underline">{a.letter_code}</Link></p>
                  <details className="text-[0.9rem]">
                    <summary className="cursor-pointer text-sindoor-700">{t("letter_revoke")}</summary>
                    <form action={revokeLetter} className="mt-2 flex gap-2">
                      <input type="hidden" name="code" value={a.letter_code} />
                      <input name="reason" required minLength={5} className="field !py-1.5" placeholder={t("letter_revoke_reason")} />
                      <button className={btn("danger", "sm")}>{t("letter_revoke")}</button>
                    </form>
                  </details>
                </div>
              ) : ["joined", "selected"].includes(a.status) ? (
                <details className="border-t border-line px-6 py-4">
                  <summary className="flex cursor-pointer items-center gap-2 font-semibold text-ink"><IDoc size={18} className="text-sindoor-600" />{t("letter_issue")}</summary>
                  <form action={issueLetter} className="mt-4 grid gap-4 sm:grid-cols-3">
                    <input type="hidden" name="application_id" value={a.id} />
                    <Field label={t("letter_from")}><input type="date" name="from_date" required max={today} defaultValue={a.joined_at?.slice(0, 10) ?? ""} className="field" /></Field>
                    <Field label={t("letter_to")}><input type="date" name="to_date" required max={today} defaultValue={today} className="field" /></Field>
                    <Field label={t("letter_role")}><input name="role_title" defaultValue={job.title} className="field" /></Field>
                    <div className="sm:col-span-3">
                      <FieldGroup label={t("letter_skills")}>
                        <Chips name="skills" selected={job.skills_offered} options={skillsFor(job.industry).map((x) => ({ value: x.id, label: bi(x, lang) }))} />
                      </FieldGroup>
                    </div>
                    <Field label={t("letter_remarks")} className="sm:col-span-3"><textarea name="remarks" maxLength={800} className="field !min-h-20" /></Field>
                    <label className="flex items-start gap-2.5 text-[0.92rem] sm:col-span-3"><input type="checkbox" name="confirm" required className="mt-1 h-4 w-4 accent-sindoor-600" />{t("letter_confirm")}</label>
                    <div className="sm:col-span-3"><button className={btn("primary", "md")}>{t("letter_issue_btn")}</button></div>
                  </form>
                </details>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
