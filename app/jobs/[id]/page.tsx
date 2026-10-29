import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getI18n, bi, type Key, type Lang } from "@/lib/i18n";
import {
  ACCOMMODATION, EDUCATION, EXPERIENCE_REQ, INDUSTRIES, STAGES, VERIFICATION_CHECKS, BUSINESS_TYPES,
  byId, skillsFor, APPLICATION_STATUSES,
} from "@/lib/constants";
import { getCandidateProfile, getEmployer, getJob, isSaved, employerRating, isExpired, type Job } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { applyToJob, toggleSave } from "@/app/actions";
import { salaryRange, rupees, timeAgo } from "@/lib/format";
import { siteUrl, jobPostingJsonLd, jsonLdScript } from "@/lib/seo";
import { Badge, btn, ClarityMeter, Notice, cx } from "@/components/ui";
import { Corner, Ornament, Stamp, toDeva } from "@/components/ornaments";
import { HumanCheck } from "@/components/HumanCheck";
import { ListenButton } from "@/components/ListenButton";
import { TrackJobView, TrackClick } from "@/components/Analytics";
import { SaveOffline } from "@/components/SaveOffline";
import {
  IArrowLeft, IBed, ICalendar, ICheck, IClock, ICompass, ICut, IFlag, IHeart, IndustryIcon, IPin, IRupee, IShare, IStar, IThali,
} from "@/components/icons";

export const dynamic = "force-dynamic";

const periodKey = (p: string): Key => (p === "day" ? "per_day" : p === "week" ? "per_week" : "per_month_word");

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const job = getJob(Number((await params).id));
  if (!job) return { title: "Job not found", robots: { index: false } };
  const hidden = job.status === "removed" || job.flagged_reason || job.verification_status === "rejected";
  const stay = byId(ACCOMMODATION, job.accommodation)?.en.toLowerCase();
  const description = `${job.title} at ${job.business_name}, ${job.city}. Salary ${salaryRange(job.salary_min, job.salary_max)} per ${job.salary_period}. Stay: ${stay}. ${job.hours}. ${/^no\b/i.test(job.deductions) ? "No deductions." : ""}`.trim();
  return {
    title: `${job.title} — ${job.business_name}, ${job.city}`,
    description,
    alternates: { canonical: `/jobs/${job.id}` },
    robots: hidden || job.status !== "open" || isExpired(job) ? { index: false, follow: true } : undefined,
    openGraph: { type: "website", title: `${job.title} · ${salaryRange(job.salary_min, job.salary_max)}`, description, url: `/jobs/${job.id}` },
  };
}

function H2({ deva, children }: { deva: string; children: React.ReactNode }) {
  return (
    <h2 className="flex items-baseline gap-3 font-display text-[2rem] font-semibold leading-tight text-ink">
      {children}<span className="deva-accent font-deva text-lg font-normal text-sindoor-600">{deva}</span>
    </h2>
  );
}

/** Employer free text in the reader's language when the employer supplied a Hindi version. */
function localText(job: Job, field: "description" | "responsibilities" | "learning_notes", lang: Lang) {
  const hi = job[`${field}_hi` as const];
  return lang === "hi" && hi ? { text: hi, translated: false } : { text: job[field], translated: lang === "hi" && Boolean(job[field]) };
}

function spokenSummary(job: Job, lang: Lang, t: (k: Key) => string, stayText: string) {
  const sal = `${job.salary_min.toLocaleString("en-IN")} ${lang === "hi" ? "से" : "to"} ${job.salary_max.toLocaleString("en-IN")} ${lang === "hi" ? "रुपये" : "rupees"} ${t(periodKey(job.salary_period))}`;
  return [
    `${job.title}, ${job.business_name}, ${job.city}.`,
    `${t("salary")}: ${sal}.`,
    `${t("hours")}: ${job.hours}.`,
    `${t("holiday")}: ${job.weekly_holiday}.`,
    `${t("stay")}: ${stayText}${job.accommodation === "paid" ? `, ${job.accommodation_cost} ${lang === "hi" ? "रुपये महीना" : "rupees a month"}` : ""}.`,
    `${t("deductions")}: ${/^no\b/i.test(job.deductions.trim()) ? t("no_deductions") : job.deductions}.`,
  ].join(" ");
}

export default async function JobPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const job = getJob(Number(id));
  if (!job) notFound();
  const { t, lang } = await getI18n();
  const user = await getCurrentUser();
  const emp = getEmployer(job.employer_id)!;
  const isOwner = user?.id === emp.user_id;
  const isAdmin = user?.role === "admin";
  // listings held for review (possible scams) are not shown to the public at all
  if ((job.flagged_reason || emp.verification_status === "rejected") && !isOwner && !isAdmin) notFound();

  const rating = employerRating(emp.id);
  const ind = byId(INDUSTRIES, job.industry);
  const isCandidate = user?.role === "candidate";
  const existing = isCandidate
    ? (getDb().prepare("SELECT * FROM applications WHERE job_id=? AND candidate_id=?").get(job.id, user!.id) as { id: number; status: string } | undefined)
    : undefined;
  const profile = isCandidate ? getCandidateProfile(user!.id) : null;
  const saved = isCandidate ? isSaved(user!.id, job.id) : false;
  const verified = job.verification_status === "verified";
  const expired = isExpired(job);
  const open = job.status === "open" && !expired;

  const per = t(periodKey(job.salary_period));
  const stay = byId(ACCOMMODATION, job.accommodation);
  const skills = skillsFor(job.industry).filter((s) => job.skills_offered.includes(s.id));
  const noDeductions = /^no\b/i.test(job.deductions.trim());
  const status = existing ? byId([...APPLICATION_STATUSES], existing.status) : null;
  const description = localText(job, "description", lang);
  const responsibilities = localText(job, "responsibilities", lang);
  const learningNotes = localText(job, "learning_notes", lang);

  const shareText = lang === "hi"
    ? `काम का अवसर: ${job.title}, ${job.business_name}, ${job.city}\nवेतन ${salaryRange(job.salary_min, job.salary_max)} ${per} · समय: ${job.hours}\nरहना: ${stay?.hi}${job.accommodation === "paid" ? ` (${rupees(job.accommodation_cost)}/माह)` : ""} · कटौती: ${noDeductions ? "कोई नहीं" : job.deductions}\n${siteUrl()}/jobs/${job.id}`
    : `Job opportunity: ${job.title} at ${job.business_name}, ${job.city}\nSalary ${salaryRange(job.salary_min, job.salary_max)} ${per} · Hours: ${job.hours}\nStay: ${stay?.en}${job.accommodation === "paid" ? ` (${rupees(job.accommodation_cost)}/month)` : ""} · Deductions: ${job.deductions}\n${siteUrl()}/jobs/${job.id}`;
  const familyDigits = profile?.family_phone?.replace(/\D/g, "");
  const shareHref = `https://wa.me/${familyDigits ?? ""}?text=${encodeURIComponent(shareText)}`;
  const translatedNote = <span className="mt-1 block text-[0.8rem] not-italic text-ink-faint">{t("jd_employer_english")}</span>;

  const terms: { icon: React.ReactNode; label: string; hi: string; value: React.ReactNode; note?: React.ReactNode; tone?: "good" | "warn" }[] = [
    { icon: <IRupee />, label: t("salary"), hi: "वेतन", value: <><span className="num font-display text-[1.6rem] font-semibold text-sindoor-700">{salaryRange(job.salary_min, job.salary_max)}</span> <span className="text-ink-soft">{per}</span></> },
    { icon: <IClock />, label: t("hours"), hi: "समय", value: job.hours },
    { icon: <ICalendar />, label: t("holiday"), hi: "छुट्टी", value: job.weekly_holiday },
    {
      icon: <IBed />, label: t("stay"), hi: "रहना", tone: job.accommodation === "free" ? "good" : undefined,
      value: <>{bi(stay, lang)}{job.accommodation === "paid" && <> — <span className="num">{rupees(job.accommodation_cost)}</span>{t("per_month")}</>}</>,
      note: job.accommodation !== "none" && (
        <>
          {job.accommodation_details && <span className="block">{job.accommodation_details}</span>}
          <span className={cx("mt-1 inline-flex items-center gap-1 text-[0.82rem] font-semibold", job.accommodation_confirmed ? "text-peacock-600" : "text-ink-faint")}>
            {job.accommodation_confirmed ? <><ICheck size={14} />{t("confirmed_employer")}</> : t("not_stated")}
          </span>
        </>
      ),
    },
    { icon: <IThali />, label: t("meals"), hi: "खाना", value: job.meals || job.benefits ? [job.meals, job.benefits].filter(Boolean).join(" · ") : <span className="text-ink-faint">{t("not_stated")}</span> },
    {
      icon: <ICut />, label: t("deductions"), hi: "कटौती", tone: noDeductions && !job.deposit_amount ? "good" : "warn",
      value: noDeductions ? t("no_deductions") : job.deductions,
      note: job.deposit_amount > 0 && <span className="font-semibold text-sindoor-700">{t("jd_deposit")}: {rupees(job.deposit_amount)}</span>,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {open && !job.flagged_reason && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jobPostingJsonLd(job, emp)) }} />}
      <TrackJobView jobId={job.id} />
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-[0.95rem] font-semibold text-ink-soft hover:text-sindoor-700"><IArrowLeft size={16} />{t("nav_jobs")}</Link>

      <div className="mt-4 space-y-3" role="status">
        {job.flagged_reason && <Notice tone="warn">{t("jd_under_review")}</Notice>}
        {job.status === "open" && expired && <Notice tone="warn">{t("jd_expired")}</Notice>}
        {job.status === "filled" && <Notice tone="warn">{t("jd_filled")}</Notice>}
        {job.status === "closed" && <Notice tone="warn">{t("jd_closed")}</Notice>}
        {job.status === "removed" && <Notice tone="bad">{t("jd_removed")} {job.removed_reason ?? ""}</Notice>}
        {sp.applied && <Notice tone="ok">{t("jd_applied_ok")}</Notice>}
        {sp.invite && !existing && <Notice tone="info">{t("jd_invite_note")}</Notice>}
        {sp.error && <Notice tone="bad">{sp.error}</Notice>}
      </div>

      {/* ───── Title page ───── */}
      <header className="relative mt-8 pb-8">
        {verified && <Stamp size={130} className="absolute -top-4 right-0 hidden rotate-[-14deg] sm:block" />}
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
          <span className="text-sindoor-600"><IndustryIcon id={job.industry} size={18} /></span>
          <Link href={`/employers/${emp.id}`} className="hover:text-sindoor-700">{job.business_name}</Link>
          <span className="text-ink-faint" aria-hidden>·</span>
          <span>{bi(ind, lang)}</span>
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-[2.9rem] font-medium leading-[1] tracking-[-0.015em] text-ink sm:text-[4.2rem]">{job.title}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-ink-soft">
          <span className="inline-flex items-center gap-1.5"><IPin size={18} className="text-sindoor-500" />{job.city}{job.locality ? `, ${job.locality}` : ""}</span>
          <span>{timeAgo(job.created_at, lang)}</span>
          {!verified && <Badge tone="slate" className="border border-dashed border-ink-faint/50 !bg-transparent">{t("not_verified")}</Badge>}
          {rating.count > 0 && <span className="inline-flex items-center gap-1 text-haldi-700"><IStar filled size={16} />{rating.avg.toFixed(1)} <span className="text-ink-faint">({rating.count})</span></span>}
          <ListenButton text={spokenSummary(job, lang, t, bi(stay, lang))} lang={lang} label={t("jd_listen")} stopLabel={t("jd_listen_stop")}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-line px-2.5 py-1 text-[0.9rem] font-semibold text-ink hover:border-ink-soft" />
        </div>
        <div className="leheriya mt-8 h-[4px] w-full opacity-90" aria-hidden />
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_21rem]">
        <div className="min-w-0 space-y-14">
          {description.text && <p className="font-display text-[1.55rem] italic leading-snug text-ink">{description.text}{description.translated && translatedNote}</p>}

          {/* ───── Terms as a ledger ───── */}
          <section aria-labelledby="terms-h">
            <H2 deva="शर्तें"><span id="terms-h">{t("jd_terms")}</span></H2>
            <p className="mt-1 text-[0.95rem] text-ink-soft">{t("jd_terms_sub")}</p>
            <dl className="ledger mt-5 rounded-[3px] border border-line pl-12 shadow-card">
              {terms.map((r) => (
                <div key={r.hi} className="grid grid-cols-1 gap-1 border-b border-line/70 py-4 pr-5 last:border-0 sm:grid-cols-[12rem_1fr] sm:gap-4">
                  <dt className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-sindoor-500 [&_svg]:h-5 [&_svg]:w-5" aria-hidden>{r.icon}</span>
                    <span>
                      <span className="block font-semibold text-ink">{r.label}</span>
                      <span className="deva-accent block font-deva text-[0.92rem] text-ink-faint" lang="hi">{r.hi}</span>
                    </span>
                  </dt>
                  <dd className="pl-7 sm:pl-0">
                    <span className={cx("text-[1.05rem]", r.tone === "good" && "font-semibold text-peacock-600", r.tone === "warn" && "font-semibold text-haldi-700")}>{r.value}</span>
                    {r.note && <span className="mt-1 block text-[0.92rem] leading-snug text-ink-soft">{r.note}</span>}
                  </dd>
                </div>
              ))}
            </dl>
            {job.deposit_amount > 0 && <div className="mt-4"><Notice tone="warn">{t("jd_deposit_warning")}</Notice></div>}
          </section>

          {responsibilities.text && (
            <section>
              <H2 deva="रोज़ का काम">{t("responsibilities")}</H2>
              <p className="mt-4 whitespace-pre-line text-[1.08rem] leading-relaxed text-ink-soft">{responsibilities.text}</p>
              {responsibilities.translated && translatedNote}
            </section>
          )}

          {/* ───── Learning path ───── */}
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <H2 deva="सीख">{t("you_learn")}</H2>
              {skills.length > 0 && (
                <span className={cx("inline-flex items-center gap-1.5 text-[0.88rem] font-semibold", job.learning_confirmed ? "text-peacock-600" : "text-ink-faint")}>
                  {job.learning_confirmed ? <><ICheck size={16} />{t("confirmed_employer")}</> : t("not_stated")}
                </span>
              )}
            </div>
            {skills.length ? (
              <>
                <ol className="relative mt-8 grid gap-8 md:grid-cols-3 md:gap-5">
                  <span className="absolute left-5 right-5 top-5 hidden border-t-2 border-dotted border-paper-300 md:block" aria-hidden />
                  {STAGES.map((st) => {
                    const inStage = skills.filter((s) => s.stage === st.stage);
                    const on = inStage.length > 0;
                    return (
                      <li key={st.stage} className={cx("relative", !on && "opacity-55")}>
                        <span className={cx("relative flex h-10 w-10 items-center justify-center rounded-full font-deva text-lg", on ? "bg-sindoor-600 text-paper-50" : "border border-dashed border-ink-faint bg-paper-100 text-ink-faint")} aria-hidden>{toDeva(st.stage)}</span>
                        <p className="mt-4 font-display text-[1.4rem] font-semibold text-ink">{bi(st, lang)} <span className="deva-accent font-deva text-base font-normal text-ink-faint" lang="hi">{st.hi}</span></p>
                        <ul className="mt-2 space-y-1.5 text-[0.98rem]">
                          {on ? inStage.map((s) => <li key={s.id} className="flex gap-2"><ICheck size={18} className="mt-0.5 shrink-0 text-peacock-500" />{bi(s, lang)}</li>) : <li className="text-ink-soft">{t("jd_not_in_role")}</li>}
                        </ul>
                      </li>
                    );
                  })}
                </ol>
                {learningNotes.text && (
                  <blockquote className="mt-8 border-l-2 border-haldi-400 pl-5 font-display text-[1.35rem] italic leading-snug text-ink">
                    “{learningNotes.text}”
                    <footer className="mt-2 font-sans text-[0.9rem] not-italic text-ink-soft">— {emp.owner_name || emp.business_name}</footer>
                    {learningNotes.translated && translatedNote}
                  </blockquote>
                )}
                <p className="mt-5 text-[0.88rem] text-ink-soft">{t("jd_learn_disclaimer")}</p>
              </>
            ) : (
              <p className="mt-4 text-ink-soft">{t("jd_no_skills")}</p>
            )}
          </section>

          <section>
            <H2 deva="कौन आवेदन करे">{t("requirements")}</H2>
            <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-ink pt-5 sm:grid-cols-4">
              {[
                [t("jd_education"), job.education_req === "any" ? t("jd_any") : bi(byId(EDUCATION, job.education_req), lang)],
                [t("jd_experience"), bi(byId(EXPERIENCE_REQ, job.experience_req), lang)],
                [t("jd_languages"), job.languages.join(", ") || "—"],
                [t("jd_joining"), `${job.joining_date ?? t("jd_flexible")} · ${job.openings} ${job.openings > 1 ? t("jd_openings") : t("jd_opening")}`],
              ].map(([k, v]) => (
                <div key={k}><dt className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">{k}</dt><dd className="mt-1 font-semibold leading-snug text-ink">{v}</dd></div>
              ))}
            </dl>
          </section>

          {/* ───── Business ───── */}
          <section className="rounded-[4px] border border-line bg-paper-50 p-6 shadow-card sm:p-8">
            <H2 deva="कारोबार">{t("about_business")}</H2>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
              <Link href={`/employers/${emp.id}`} className="font-display text-[1.5rem] font-semibold text-sindoor-700 hover:underline">{emp.business_name}</Link>
              <span className="text-ink-soft">{bi(byId(BUSINESS_TYPES, emp.business_type), lang)} · {emp.city}{emp.years_in_business ? ` · ${emp.years_in_business} ${t("jd_years")}` : ""}</span>
            </p>
            {emp.about && <p className="mt-3 leading-relaxed text-ink-soft">{emp.about}</p>}
            <Ornament className="my-6" color="text-paper-300" />
            <h3 className="font-semibold text-ink">{t("what_checked")}</h3>
            <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {VERIFICATION_CHECKS.map((c) => {
                const ok = verified && emp.verified_checks.includes(c.id);
                return (
                  <li key={c.id} className={cx("flex items-start gap-2 text-[0.96rem]", ok ? "text-ink" : "text-ink-faint")}>
                    {ok ? <ICheck size={18} className="mt-0.5 shrink-0 text-peacock-500" /> : <span className="mt-2.5 h-px w-3.5 shrink-0 bg-ink-faint" aria-hidden />}
                    <span>{bi(c, lang)}<span className="sr-only">{ok ? ` — ${t("jd_checked")}` : ` — ${t("jd_not_checked")}`}</span></span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-[0.85rem] text-ink-soft">{t("jd_checks_note")}</p>
          </section>

          {/* ───── Know before you go ───── */}
          <section className="relative bg-neel-800 px-7 py-9 text-paper-100 sm:px-10">
            <Corner className="absolute left-3 top-3 text-haldi-300/70" />
            <Corner className="absolute bottom-3 right-3 rotate-180 text-haldi-300/70" />
            <h2 className="flex items-center gap-3 font-display text-[2rem] font-semibold"><ICompass size={26} className="text-haldi-300" />{t("know_before")}</h2>
            <ol className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {(["kb_1", "kb_2", "kb_3", "kb_4", "kb_5", "kb_6"] as const).map((k, i) => (
                <li key={k} className="grid grid-cols-[1.6rem_1fr] gap-2 leading-relaxed text-paper-100/90">
                  <span className="font-deva text-lg leading-snug text-haldi-300" aria-hidden>{toDeva(i + 1)}</span>{t(k)}
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* ───── Sidebar ───── */}
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[4px] border border-line bg-paper-50 shadow-lift">
            <div className="leheriya h-[5px] rounded-t-[4px]" aria-hidden />
            <div className="p-6">
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">{t("salary")}</p>
              <p className="num mt-1 font-display text-[2.1rem] font-semibold leading-none text-sindoor-700">{salaryRange(job.salary_min, job.salary_max)}</p>
              <p className="mt-1 text-[0.9rem] text-ink-soft">{per} · {t("stay")}: {bi(stay, lang)}</p>
              <div className="mt-4 border-t border-line pt-4"><ClarityMeter score={job.clarity} label={t("clarity")} /></div>
              <div className="mt-5">
                {isOwner ? (
                  <Link href={`/employer/jobs/${job.id}`} className={btn("ink", "lg", "w-full")}>{t("jd_manage")}</Link>
                ) : !open ? (
                  <button disabled className={btn("primary", "lg", "w-full")}>{t("jd_not_accepting")}</button>
                ) : existing ? (
                  <div className="space-y-3">
                    <p className="flex items-center gap-2 font-semibold text-peacock-600"><ICheck size={18} />{t("applied")}</p>
                    <p className="text-[0.95rem] text-ink-soft">{t("jd_status")}: <strong className="text-ink">{bi(status!, lang)}</strong></p>
                    <Link href={`/messages/${existing.id}`} className={btn("primary", "md", "w-full")}>{t("msg_open")}</Link>
                    <Link href="/candidate" className={btn("outline", "md", "w-full")}>{t("nav_dashboard")}</Link>
                  </div>
                ) : isCandidate ? (
                  <form action={applyToJob} className="space-y-3" id="apply">
                    <HumanCheck />
                    {sp.invite && <input type="hidden" name="source" value="invite" />}
                    <input type="hidden" name="job_id" value={job.id} />
                    <label className="block">
                      <span className="sr-only">{t("apply_message")}</span>
                      <textarea name="message" maxLength={1000} className="field !min-h-24 text-[0.95rem]" placeholder={t("apply_message")} />
                    </label>
                    <label className="flex cursor-pointer items-start gap-2.5 text-[0.9rem] leading-snug text-ink">
                      <input type="checkbox" name="share_phone" className="mt-1 h-4 w-4 accent-sindoor-600" />
                      <span>{t("apply_share_phone")}<span className="block text-[0.82rem] text-ink-soft">{t("apply_share_phone_hint")}</span></span>
                    </label>
                    <TrackClick name="apply_click" props={{ job: job.id }}><button className={btn("primary", "lg", "w-full")}>{t("apply_now")}</button></TrackClick>
                    <p className="text-[0.82rem] leading-relaxed text-ink-soft">{t("apply_privacy")}</p>
                  </form>
                ) : user ? (
                  <Notice tone="info">{t("jd_candidate_only")}</Notice>
                ) : (
                  <div className="space-y-2">
                    <Link href="/sign-up" className={btn("primary", "lg", "w-full")}>{t("apply_now")}</Link>
                    <p className="text-center text-[0.85rem] text-ink-soft">{t("jd_signup_hint")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="divide-y divide-line rounded-[4px] border border-line bg-paper-50">
            <TrackClick name="share_family" props={{ job: job.id }}>
              <a href={shareHref} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-3.5 font-semibold text-ink hover:bg-paper-200/50">
                <IShare size={19} className="text-peacock-600" />{t("share_family")}
                <span className="deva-accent ml-auto font-deva text-sm font-normal text-ink-faint" lang="hi">परिवार</span>
              </a>
            </TrackClick>
            {isCandidate && (
              <form action={toggleSave}>
                <input type="hidden" name="job_id" value={job.id} />
                <button className="flex w-full items-center gap-3 px-5 py-3.5 text-left font-semibold text-ink hover:bg-paper-200/50" aria-pressed={saved}>
                  <IHeart filled={saved} size={19} className="text-sindoor-500" />{saved ? t("saved") : t("save")}
                </button>
              </form>
            )}
            <SaveOffline path={`/jobs/${job.id}`} label={t("jd_save_offline")} savedLabel={t("jd_saved_offline")}
              className="flex w-full items-center gap-3 px-5 py-3.5 text-left font-semibold text-ink hover:bg-paper-200/50" />
            <Link href={`/jobs/${job.id}/report`} className="flex items-center gap-3 px-5 py-3.5 text-[0.95rem] text-sindoor-700 hover:bg-sindoor-50">
              <IFlag size={18} />{t("report")}
            </Link>
          </div>
          <p className="px-1 text-[0.82rem] leading-relaxed text-ink-soft">{familyDigits ? t("jd_share_family_saved") : t("jd_share_choice")}</p>
        </aside>
      </div>
    </div>
  );
}
