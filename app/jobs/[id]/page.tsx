import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getI18n, bi } from "@/lib/i18n";
import {
  ACCOMMODATION, EDUCATION, EXPERIENCE_REQ, INDUSTRIES, STAGES, VERIFICATION_CHECKS, BUSINESS_TYPES,
  byId, skillsFor, APPLICATION_STATUSES,
} from "@/lib/constants";
import { getCandidateProfile, getEmployer, getJob, isSaved, employerRating } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { applyToJob, toggleSave } from "@/app/actions";
import { salaryRange, rupees, timeAgo } from "@/lib/format";
import { Badge, btn, ClarityMeter, Notice, cx } from "@/components/ui";
import { Corner, Ornament, Stamp, toDeva } from "@/components/ornaments";
import {
  IArrowLeft, IBed, ICalendar, ICheck, IClock, ICompass, ICut, IFlag, IHeart, IndustryIcon, IPin, IRupee, IShare, IStar, IThali,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const job = getJob(Number((await params).id));
  return { title: job ? `${job.title} — ${job.business_name}` : "Job" };
}

function H2({ deva, children }: { deva: string; children: React.ReactNode }) {
  return (
    <h2 className="flex items-baseline gap-3 font-display text-[2rem] font-semibold leading-tight text-ink">
      {children}<span className="deva-accent font-deva text-lg font-normal text-sindoor-600">{deva}</span>
    </h2>
  );
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
  const rating = employerRating(emp.id);
  const ind = byId(INDUSTRIES, job.industry);
  const isCandidate = user?.role === "candidate";
  const isOwner = user?.id === emp.user_id;
  const existing = isCandidate
    ? (getDb().prepare("SELECT * FROM applications WHERE job_id=? AND candidate_id=?").get(job.id, user!.id) as
        | { id: number; status: string } | undefined)
    : undefined;
  const profile = isCandidate ? getCandidateProfile(user!.id) : null;
  const saved = isCandidate ? isSaved(user!.id, job.id) : false;
  const verified = job.verification_status === "verified";

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const per = job.salary_period === "day" ? "day" : job.salary_period === "week" ? "week" : "month";
  const stay = byId(ACCOMMODATION, job.accommodation);
  const skills = skillsFor(job.industry).filter((s) => job.skills_offered.includes(s.id));
  const noDeductions = /^no\b/i.test(job.deductions.trim());
  const status = existing ? byId([...APPLICATION_STATUSES], existing.status) : null;

  const shareText =
    `Job opportunity: ${job.title} at ${job.business_name}, ${job.city}\n` +
    `Salary ${salaryRange(job.salary_min, job.salary_max)} per ${per} · Hours: ${job.hours}\n` +
    `Stay: ${stay?.en}${job.accommodation === "paid" ? ` (${rupees(job.accommodation_cost)}/month)` : ""} · Deductions: ${job.deductions}\n` +
    `${origin}/jobs/${job.id}`;
  const familyDigits = profile?.family_phone?.replace(/\D/g, "");
  const shareHref = `https://wa.me/${familyDigits ?? ""}?text=${encodeURIComponent(shareText)}`;

  const terms: { icon: React.ReactNode; en: string; hi: string; value: React.ReactNode; note?: React.ReactNode; tone?: "good" | "warn" }[] = [
    { icon: <IRupee />, en: t("salary"), hi: "वेतन", value: <><span className="num font-display text-[1.6rem] font-semibold text-sindoor-700">{salaryRange(job.salary_min, job.salary_max)}</span> <span className="text-ink-soft">per {per}</span></> },
    { icon: <IClock />, en: t("hours"), hi: "समय", value: job.hours },
    { icon: <ICalendar />, en: t("holiday"), hi: "छुट्टी", value: job.weekly_holiday },
    {
      icon: <IBed />, en: t("stay"), hi: "रहना", tone: job.accommodation === "free" ? "good" : undefined,
      value: <>{bi(stay, lang)}{job.accommodation === "paid" && <> — <span className="num">{rupees(job.accommodation_cost)}</span>/month</>}</>,
      note: job.accommodation !== "none" && (
        <>
          {job.accommodation_details && <span className="block">{job.accommodation_details}</span>}
          <span className={cx("mt-1 inline-flex items-center gap-1 text-[0.82rem] font-semibold", job.accommodation_confirmed ? "text-peacock-600" : "text-ink-faint")}>
            {job.accommodation_confirmed ? <><ICheck size={14} />{t("confirmed_employer")}</> : t("not_stated")}
          </span>
        </>
      ),
    },
    { icon: <IThali />, en: t("meals"), hi: "खाना", value: job.meals || job.benefits ? [job.meals, job.benefits].filter(Boolean).join(" · ") : <span className="text-ink-faint">{t("not_stated")}</span> },
    {
      icon: <ICut />, en: t("deductions"), hi: "कटौती", tone: noDeductions && !job.deposit_amount ? "good" : "warn",
      value: job.deductions,
      note: job.deposit_amount > 0 && <span className="font-semibold text-sindoor-700">Security deposit: {rupees(job.deposit_amount)}</span>,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-[0.95rem] font-semibold text-ink-soft hover:text-sindoor-700"><IArrowLeft size={16} />{t("nav_jobs")}</Link>

      <div className="mt-4 space-y-3">
        {job.status !== "open" && (
          <Notice tone={job.status === "removed" ? "bad" : "warn"}>
            {job.status === "filled" && "This position has been filled."}
            {job.status === "closed" && "The employer has closed this listing."}
            {job.status === "removed" && `This listing was removed by moderators. ${job.removed_reason ?? ""}`}
          </Notice>
        )}
        {sp.applied && <Notice tone="ok">Application sent. The employer can now see your profile and phone number and will contact you. Always confirm terms in writing before travelling.</Notice>}
        {sp.error && <Notice tone="bad">{sp.error}</Notice>}
      </div>

      {/* ───── Title page ───── */}
      <header className="relative mt-8 pb-8">
        {verified && <Stamp size={130} className="absolute -top-4 right-0 hidden rotate-[-14deg] sm:block" />}
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
          <span className="text-sindoor-600"><IndustryIcon id={job.industry} size={18} /></span>
          <Link href={`/employers/${emp.id}`} className="hover:text-sindoor-700">{job.business_name}</Link>
          <span className="text-ink-faint">·</span>
          <span>{bi(ind, lang)}</span>
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-[2.9rem] font-medium leading-[1] tracking-[-0.015em] text-ink sm:text-[4.2rem]">{job.title}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-ink-soft">
          <span className="inline-flex items-center gap-1.5"><IPin size={18} className="text-sindoor-500" />{job.city}{job.locality ? `, ${job.locality}` : ""}</span>
          <span>{timeAgo(job.created_at, lang)}</span>
          {!verified && <Badge tone="slate" className="border border-dashed border-ink-faint/50 !bg-transparent">{t("not_verified")}</Badge>}
          {rating.count > 0 && <span className="inline-flex items-center gap-1 text-haldi-700"><IStar filled size={16} />{rating.avg.toFixed(1)} <span className="text-ink-faint">({rating.count})</span></span>}
        </div>
        <div className="leheriya mt-8 h-[4px] w-full opacity-90" />
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_21rem]">
        <div className="min-w-0 space-y-14">
          {job.description && <p className="font-display text-[1.55rem] italic leading-snug text-ink">{job.description}</p>}

          {/* ───── Terms as a ledger ───── */}
          <section aria-label="Job conditions">
            <H2 deva="शर्तें">The terms</H2>
            <p className="mt-1 text-[0.95rem] text-ink-soft">Exactly as stated by the employer. Ask for these in writing before you travel.</p>
            <dl className="ledger mt-5 rounded-[3px] border border-line pl-12 shadow-card">
              {terms.map((r) => (
                <div key={r.en} className="grid grid-cols-1 gap-1 border-b border-line/70 py-4 pr-5 last:border-0 sm:grid-cols-[12rem_1fr] sm:gap-4">
                  <dt className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-sindoor-500 [&_svg]:h-5 [&_svg]:w-5">{r.icon}</span>
                    <span>
                      <span className="block font-semibold text-ink">{r.en}</span>
                      <span className="deva-accent block font-deva text-[0.92rem] text-ink-faint">{r.hi}</span>
                    </span>
                  </dt>
                  <dd className="pl-7 sm:pl-0">
                    <span className={cx("text-[1.05rem]", r.tone === "good" && "font-semibold text-peacock-600", r.tone === "warn" && "font-semibold text-haldi-700")}>{r.value}</span>
                    {r.note && <span className="mt-1 block text-[0.92rem] leading-snug text-ink-soft">{r.note}</span>}
                  </dd>
                </div>
              ))}
            </dl>
            {job.deposit_amount > 0 && (
              <div className="mt-4"><Notice tone="warn">This employer asks for a deposit. Never pay anyone before you reach the city and see the workplace, and always get a written receipt. {t("brand")} never charges candidates.</Notice></div>
            )}
          </section>

          {job.responsibilities && (
            <section>
              <H2 deva="रोज़ का काम">{t("responsibilities")}</H2>
              <p className="mt-4 whitespace-pre-line text-[1.08rem] leading-relaxed text-ink-soft">{job.responsibilities}</p>
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
                      <li key={st.stage} className={cx("relative", !on && "opacity-50")}>
                        <span className={cx("relative flex h-10 w-10 items-center justify-center rounded-full font-deva text-lg", on ? "bg-sindoor-600 text-paper-50" : "border border-dashed border-ink-faint bg-paper-100 text-ink-faint")}>{toDeva(st.stage)}</span>
                        <p className="mt-4 font-display text-[1.4rem] font-semibold text-ink">{st.en} <span className="deva-accent font-deva text-base font-normal text-ink-faint">{st.hi}</span></p>
                        <ul className="mt-2 space-y-1.5 text-[0.98rem]">
                          {on ? inStage.map((s) => <li key={s.id} className="flex gap-2"><ICheck size={18} className="mt-0.5 shrink-0 text-peacock-500" />{s.en}</li>) : <li className="text-ink-soft">Not part of this role</li>}
                        </ul>
                      </li>
                    );
                  })}
                </ol>
                {job.learning_notes && (
                  <blockquote className="mt-8 border-l-2 border-haldi-400 pl-5 font-display text-[1.35rem] italic leading-snug text-ink">
                    “{job.learning_notes}”
                    <footer className="mt-2 font-sans text-[0.9rem] not-italic text-ink-soft">— {emp.owner_name || emp.business_name}</footer>
                  </blockquote>
                )}
                <p className="mt-5 text-[0.88rem] text-ink-soft">A guide, not a promise. Actual training depends on the employer and your performance — nobody can guarantee you’ll be ready to run a business after a fixed time.</p>
              </>
            ) : (
              <p className="mt-4 text-ink-soft">The employer hasn’t listed specific skills for this role. Ask what you’ll be allowed to learn before you accept.</p>
            )}
          </section>

          <section>
            <H2 deva="कौन आवेदन करे">{t("requirements")}</H2>
            <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-ink pt-5 sm:grid-cols-4">
              {[
                ["Education", job.education_req === "any" ? "Any" : bi(byId(EDUCATION, job.education_req), lang)],
                ["Experience", bi(byId(EXPERIENCE_REQ, job.experience_req), lang)],
                ["Languages", job.languages.join(", ") || "—"],
                ["Joining", `${job.joining_date ?? "Flexible"} · ${job.openings} ${job.openings > 1 ? "openings" : "opening"}`],
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
              <span className="text-ink-soft">{bi(byId(BUSINESS_TYPES, emp.business_type), lang)} · {emp.city}{emp.years_in_business ? ` · ${emp.years_in_business} years` : ""}</span>
            </p>
            {emp.about && <p className="mt-3 leading-relaxed text-ink-soft">{emp.about}</p>}
            <Ornament className="my-6" color="text-paper-300" />
            <h3 className="font-semibold text-ink">{t("what_checked")} <span className="deva-accent font-deva font-normal text-ink-faint">· हमने क्या जाँचा</span></h3>
            <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {VERIFICATION_CHECKS.map((c) => {
                const ok = verified && emp.verified_checks.includes(c.id);
                return (
                  <li key={c.id} className={cx("flex items-start gap-2 text-[0.96rem]", ok ? "text-ink" : "text-ink-faint")}>
                    {ok ? <ICheck size={18} className="mt-0.5 shrink-0 text-peacock-500" /> : <span className="mt-2.5 h-px w-3.5 shrink-0 bg-ink-faint" />}
                    {bi(c, lang)}
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-[0.85rem] text-ink-soft">Anything not ticked was supplied by the employer but not independently confirmed. Verification is not a guarantee of a safe workplace.</p>
          </section>

          {/* ───── Know before you go ───── */}
          <section className="relative bg-neel-800 px-7 py-9 text-paper-100 sm:px-10">
            <Corner className="absolute left-3 top-3 text-haldi-300/70" />
            <Corner className="absolute bottom-3 right-3 rotate-180 text-haldi-300/70" />
            <h2 className="flex items-center gap-3 font-display text-[2rem] font-semibold"><ICompass size={26} className="text-haldi-300" />{t("know_before")}</h2>
            <ol className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {[
                "Get salary, hours, holiday and stay terms in writing — a WhatsApp message is enough — before you travel.",
                "Never pay money to anyone to get this job. A deposit, if any, is listed above — ask for a receipt.",
                "Tell your family the employer’s name, address and phone number before you leave.",
                "See the workplace and the stay on day one before handing over any documents.",
                "Keep your own ID documents. No employer may hold your originals.",
                "If anything differs from this listing, report it — we investigate every report.",
              ].map((x, i) => (
                <li key={x} className="grid grid-cols-[1.6rem_1fr] gap-2 leading-relaxed text-paper-100/90">
                  <span className="font-deva text-lg leading-snug text-haldi-300">{toDeva(i + 1)}</span>{x}
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* ───── Sidebar ───── */}
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[4px] border border-line bg-paper-50 shadow-lift">
            <div className="leheriya h-[5px] rounded-t-[4px]" />
            <div className="p-6">
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">{t("salary")}</p>
              <p className="num mt-1 font-display text-[2.1rem] font-semibold leading-none text-sindoor-700">{salaryRange(job.salary_min, job.salary_max)}</p>
              <p className="mt-1 text-[0.9rem] text-ink-soft">per {per} · {bi(stay, lang).toLowerCase()} stay</p>
              <div className="mt-4 border-t border-line pt-4"><ClarityMeter score={job.clarity} label={t("clarity")} /></div>
              <div className="mt-5">
                {isOwner ? (
                  <Link href={`/employer/jobs/${job.id}`} className={btn("ink", "lg", "w-full")}>Manage listing</Link>
                ) : job.status !== "open" ? (
                  <button disabled className={btn("primary", "lg", "w-full")}>Not accepting applications</button>
                ) : existing ? (
                  <div className="space-y-3">
                    <p className="flex items-center gap-2 font-semibold text-peacock-600"><ICheck size={18} />{t("applied")}</p>
                    <p className="text-[0.95rem] text-ink-soft">Status: <strong className="text-ink">{bi(status!, lang)}</strong></p>
                    <Link href="/candidate" className={btn("outline", "md", "w-full")}>{t("nav_dashboard")}</Link>
                  </div>
                ) : isCandidate ? (
                  <form action={applyToJob} className="space-y-3">
                    <input type="hidden" name="job_id" value={job.id} />
                    <textarea name="message" className="field !min-h-24 text-[0.95rem]" placeholder="A line to the owner — why this job? (optional)" />
                    <button className={btn("primary", "lg", "w-full")}>{t("apply_now")}</button>
                    <p className="text-[0.82rem] leading-relaxed text-ink-soft">Applying shares your name, phone and profile with this employer only.</p>
                  </form>
                ) : user ? (
                  <Notice tone="info">Sign in with a candidate account to apply.</Notice>
                ) : (
                  <div className="space-y-2">
                    <Link href="/sign-up" className={btn("primary", "lg", "w-full")}>{t("apply_now")}</Link>
                    <p className="text-center text-[0.85rem] text-ink-soft">Free · sign up with your phone in 2 minutes</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="divide-y divide-line rounded-[4px] border border-line bg-paper-50">
            <a href={shareHref} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-3.5 font-semibold text-ink hover:bg-paper-200/50">
              <IShare size={19} className="text-peacock-600" />{t("share_family")}
              <span className="deva-accent ml-auto font-deva text-sm font-normal text-ink-faint">परिवार</span>
            </a>
            {isCandidate && (
              <form action={toggleSave}>
                <input type="hidden" name="job_id" value={job.id} />
                <button className="flex w-full items-center gap-3 px-5 py-3.5 text-left font-semibold text-ink hover:bg-paper-200/50">
                  <IHeart filled={saved} size={19} className="text-sindoor-500" />{saved ? t("saved") : t("save")}
                </button>
              </form>
            )}
            <Link href={`/jobs/${job.id}/report`} className="flex items-center gap-3 px-5 py-3.5 text-[0.95rem] text-sindoor-700 hover:bg-sindoor-50">
              <IFlag size={18} />{t("report")}
            </Link>
          </div>
          <p className="px-1 text-[0.82rem] leading-relaxed text-ink-soft">
            {familyDigits ? "Opens WhatsApp to your saved family contact. You choose whether to send." : "Sharing is always your choice. Nothing is sent automatically."}
          </p>
        </aside>
      </div>
    </div>
  );
}
