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
import { Badge, btn, Card, ClarityMeter, Notice, ShieldIcon, VerifiedBadge, cx } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const job = getJob(Number((await params).id));
  return { title: job ? `${job.title} — ${job.business_name}` : "Job" };
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

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const per = job.salary_period === "day" ? "/ day" : job.salary_period === "week" ? "/ week" : t("per_month");
  const stay = byId(ACCOMMODATION, job.accommodation);
  const skills = skillsFor(job.industry).filter((s) => job.skills_offered.includes(s.id));
  const noDeductions = /^no\b/i.test(job.deductions.trim());
  const status = existing ? byId([...APPLICATION_STATUSES], existing.status) : null;

  const shareText =
    `Job opportunity: ${job.title} at ${job.business_name}, ${job.city}\n` +
    `Salary ${salaryRange(job.salary_min, job.salary_max)} ${per} · Hours: ${job.hours}\n` +
    `Stay: ${stay?.en}${job.accommodation === "paid" ? ` (${rupees(job.accommodation_cost)}/month)` : ""} · Deductions: ${job.deductions}\n` +
    `${origin}/jobs/${job.id}`;
  const familyDigits = profile?.family_phone?.replace(/\D/g, "");
  const shareHref = `https://wa.me/${familyDigits ?? ""}?text=${encodeURIComponent(shareText)}`;

  const Fact = ({ icon, label, children, tone }: { icon: string; label: string; children: React.ReactNode; tone?: "good" | "warn" }) => (
    <div className={cx("rounded-2xl border p-4", tone === "good" ? "border-leaf-100 bg-leaf-50" : tone === "warn" ? "border-marigold-400/60 bg-marigold-300/20" : "border-line bg-white")}>
      <p className="text-xs font-bold uppercase tracking-wider text-ink-soft"><span aria-hidden>{icon}</span> {label}</p>
      <div className="mt-1.5 leading-snug text-ink">{children}</div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link href="/jobs" className="text-sm font-semibold text-indigo-700 hover:underline">← {t("nav_jobs")}</Link>

      {job.status !== "open" && (
        <div className="mt-4">
          <Notice tone={job.status === "removed" ? "bad" : "warn"}>
            {job.status === "filled" && "This position has been filled."}
            {job.status === "closed" && "The employer has closed this listing."}
            {job.status === "removed" && `This listing was removed by moderators. ${job.removed_reason ?? ""}`}
          </Notice>
        </div>
      )}
      {sp.applied && (
        <div className="mt-4"><Notice tone="ok">✓ Application sent. The employer can now see your profile and phone number and will contact you. Always confirm terms in writing before travelling.</Notice></div>
      )}
      {sp.error && <div className="mt-4"><Notice tone="bad">{sp.error}</Notice></div>}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_21rem]">
        <div className="min-w-0 space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-[2rem] bg-indigo-900 p-7 text-white sm:p-9">
            <div className="pattern-jali absolute inset-0 opacity-70" />
            <div className="relative flex items-start gap-5">
              <div className="arch hidden h-24 w-20 shrink-0 items-center justify-center bg-marigold-400 text-4xl sm:flex" aria-hidden>{ind?.icon}</div>
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <VerifiedBadge status={job.verification_status} label={t("verified")} pendingLabel={t("not_verified")} />
                  <Badge tone="cream">{bi(ind, lang)}</Badge>
                  <Badge tone="cream">{timeAgo(job.created_at, lang)}</Badge>
                </div>
                <h1 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">{job.title}</h1>
                <p className="mt-2 text-indigo-100/90">
                  <Link href={`/employers/${emp.id}`} className="font-semibold underline-offset-4 hover:underline">{job.business_name}</Link>
                  {" · "}📍 {job.city}{job.locality ? `, ${job.locality}` : ""}
                </p>
                <p className="mt-5 font-display text-3xl font-semibold text-marigold-400">
                  {salaryRange(job.salary_min, job.salary_max)} <span className="font-sans text-sm font-medium text-indigo-100/80">{per}</span>
                </p>
              </div>
            </div>
          </div>

          {job.description && <p className="text-lg leading-relaxed text-ink-soft">{job.description}</p>}

          {/* Facts */}
          <section aria-label="Job conditions">
            <div className="grid gap-3 sm:grid-cols-2">
              <Fact icon="💰" label={t("salary")}>
                <strong>{salaryRange(job.salary_min, job.salary_max)}</strong> {per}
              </Fact>
              <Fact icon="🕙" label={t("hours")}>{job.hours}</Fact>
              <Fact icon="🗓️" label={t("holiday")}>{job.weekly_holiday}</Fact>
              <Fact icon="🛏" label={t("stay")} tone={job.accommodation === "free" ? "good" : undefined}>
                <strong>{bi(stay, lang)}</strong>
                {job.accommodation === "paid" && <> — {rupees(job.accommodation_cost)}/month</>}
                {job.accommodation !== "none" && (
                  <>
                    {job.accommodation_details && <span className="mt-1 block text-sm text-ink-soft">{job.accommodation_details}</span>}
                    <span className="mt-2 block"><Badge tone={job.accommodation_confirmed ? "green" : "slate"}>{job.accommodation_confirmed ? `✓ ${t("confirmed_employer")}` : t("not_stated")}</Badge></span>
                  </>
                )}
              </Fact>
              <Fact icon="🍽️" label={t("meals")}>
                {job.meals || job.benefits ? <>{job.meals}{job.meals && job.benefits ? " · " : ""}{job.benefits}</> : <span className="text-ink-soft">{t("not_stated")}</span>}
              </Fact>
              <Fact icon="✂️" label={t("deductions")} tone={noDeductions && !job.deposit_amount ? "good" : "warn"}>
                <strong>{job.deductions}</strong>
                {job.deposit_amount > 0 && <span className="mt-1 block font-semibold text-rani-700">Security deposit: {rupees(job.deposit_amount)}</span>}
              </Fact>
            </div>
            {job.deposit_amount > 0 && (
              <div className="mt-3"><Notice tone="warn">⚠ This employer asks for a deposit. Never pay anyone before you reach the city and see the workplace, and always get a written receipt. {t("brand")} never charges candidates.</Notice></div>
            )}
          </section>

          {/* Responsibilities */}
          {job.responsibilities && (
            <section>
              <h2 className="font-display text-2xl font-semibold text-indigo-900">{t("responsibilities")}</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{job.responsibilities}</p>
            </section>
          )}

          {/* Learning path */}
          <section className="rounded-3xl bg-cream-100 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-semibold text-indigo-900">{t("you_learn")}</h2>
              {skills.length > 0 && <Badge tone={job.learning_confirmed ? "green" : "slate"}>{job.learning_confirmed ? `✓ ${t("confirmed_employer")}` : t("not_stated")}</Badge>}
            </div>
            {skills.length ? (
              <>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {STAGES.map((st) => {
                    const inStage = skills.filter((s) => s.stage === st.stage);
                    return (
                      <div key={st.stage} className={cx("relative rounded-2xl border p-4", inStage.length ? "border-marigold-400/70 bg-white" : "border-dashed border-line bg-transparent opacity-60")}>
                        <p className="text-xs font-bold uppercase tracking-wider text-rani-600">Stage {st.stage} · {bi(st, lang)}</p>
                        <ul className="mt-2 space-y-1.5 text-sm">
                          {inStage.length ? inStage.map((s) => <li key={s.id} className="flex gap-2"><span className="text-leaf-600">✓</span>{s.en}</li>) : <li className="text-ink-soft">Not covered in this role</li>}
                        </ul>
                      </div>
                    );
                  })}
                </div>
                {job.learning_notes && <p className="mt-5 border-l-4 border-marigold-400 pl-4 italic leading-relaxed text-ink-soft">“{job.learning_notes}”</p>}
                <p className="mt-4 text-xs text-ink-soft">This is a guide. Actual training depends on the employer and your performance — nobody can promise you will be ready to run a business after a fixed time.</p>
              </>
            ) : (
              <p className="mt-3 text-ink-soft">The employer hasn’t listed specific skills for this role. Ask what you will be allowed to learn before you accept.</p>
            )}
          </section>

          {/* Requirements */}
          <section>
            <h2 className="font-display text-2xl font-semibold text-indigo-900">{t("requirements")}</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-white p-4"><dt className="text-ink-soft">Education</dt><dd className="font-semibold">{job.education_req === "any" ? "Any" : bi(byId(EDUCATION, job.education_req), lang)}</dd></div>
              <div className="rounded-2xl border border-line bg-white p-4"><dt className="text-ink-soft">Experience</dt><dd className="font-semibold">{bi(byId(EXPERIENCE_REQ, job.experience_req), lang)}</dd></div>
              <div className="rounded-2xl border border-line bg-white p-4"><dt className="text-ink-soft">Useful languages</dt><dd className="font-semibold">{job.languages.join(", ") || "—"}</dd></div>
              <div className="rounded-2xl border border-line bg-white p-4"><dt className="text-ink-soft">Joining / openings</dt><dd className="font-semibold">{job.joining_date ?? "Flexible"} · {job.openings} {job.openings > 1 ? "openings" : "opening"}</dd></div>
            </dl>
          </section>

          {/* Business & verification */}
          <section className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-indigo-900">{t("about_business")}</h2>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <Link href={`/employers/${emp.id}`} className="text-lg font-semibold text-indigo-700 hover:underline">{emp.business_name}</Link>
              <span className="text-ink-soft">· {bi(byId(BUSINESS_TYPES, emp.business_type), lang)} · {emp.city}</span>
              {emp.years_in_business ? <Badge tone="cream">{emp.years_in_business} yrs in business</Badge> : null}
              {rating.count > 0 && <Badge tone="marigold">★ {rating.avg.toFixed(1)} ({rating.count})</Badge>}
            </div>
            {emp.about && <p className="mt-3 leading-relaxed text-ink-soft">{emp.about}</p>}
            <h3 className="mt-6 font-semibold text-indigo-900">{t("what_checked")}</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {VERIFICATION_CHECKS.map((c) => {
                const ok = emp.verification_status === "verified" && emp.verified_checks.includes(c.id);
                return (
                  <li key={c.id} className={cx("flex items-start gap-2.5 rounded-xl px-3 py-2 text-sm", ok ? "bg-leaf-50 text-leaf-700" : "bg-cream-100 text-ink-soft")}>
                    <span className="mt-0.5 font-bold">{ok ? "✓" : "—"}</span>{bi(c, lang)}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-ink-soft">Anything not ticked has been supplied by the employer but not independently confirmed. Verification is not a guarantee of a safe workplace.</p>
          </section>

          {/* Know before you go */}
          <section className="rounded-3xl bg-indigo-50 p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-indigo-900">🧭 {t("know_before")}</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-indigo-900 sm:grid-cols-2">
              {[
                "Get salary, hours, holiday and stay terms in writing (WhatsApp message or letter) before you travel.",
                "Never pay money to anyone to get this job. A deposit, if any, is listed above — ask for a receipt.",
                "Tell your family the employer’s name, address and phone number before you leave.",
                "Visit the workplace and stay on the first day before you hand over documents or originals.",
                "Keep your own ID documents. No employer may hold your originals.",
                "If anything differs from this listing, report it — we investigate every report.",
              ].map((x) => <li key={x} className="flex gap-2"><span className="text-leaf-600">✓</span>{x}</li>)}
            </ul>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <ClarityMeter score={job.clarity} label={t("clarity")} />
            <div className="mt-5">
              {isOwner ? (
                <Link href={`/employer/jobs/${job.id}`} className={btn("primary", "lg", "w-full")}>Manage listing</Link>
              ) : job.status !== "open" ? (
                <button disabled className={btn("primary", "lg", "w-full")}>Not accepting applications</button>
              ) : existing ? (
                <div className="space-y-3 text-center">
                  <Badge tone="green" className="!text-sm">✓ {t("applied")}</Badge>
                  <p className="text-sm text-ink-soft">Status: <strong className="text-ink">{bi(status!, lang)}</strong></p>
                  <Link href="/candidate" className={btn("outline", "md", "w-full")}>{t("nav_dashboard")}</Link>
                </div>
              ) : isCandidate ? (
                <form action={applyToJob} className="space-y-3">
                  <input type="hidden" name="job_id" value={job.id} />
                  <textarea name="message" className="field !min-h-24 text-sm" placeholder="Say hello to the employer — why do you want this job? (optional)" />
                  <button className={btn("gold", "lg", "w-full")}>{t("apply_now")}</button>
                  <p className="text-xs leading-relaxed text-ink-soft">Applying shares your name, phone number and profile with this employer. They are not shown to anyone else.</p>
                </form>
              ) : user ? (
                <Notice tone="info">Sign in with a candidate account to apply.</Notice>
              ) : (
                <div className="space-y-3">
                  <Link href="/sign-up" className={btn("gold", "lg", "w-full")}>{t("apply_now")}</Link>
                  <p className="text-center text-xs text-ink-soft">Sign up with your phone — it’s free and takes 2 minutes.</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="space-y-2 p-4">
            <a href={shareHref} target="_blank" rel="noreferrer" className={btn("outline", "md", "w-full")}>📲 {t("share_family")}</a>
            {isCandidate && (
              <form action={toggleSave}>
                <input type="hidden" name="job_id" value={job.id} />
                <button className={btn("ghost", "md", "w-full")}>{saved ? `♥ ${t("saved")}` : `♡ ${t("save")}`}</button>
              </form>
            )}
            <Link href={`/jobs/${job.id}/report`} className={btn("ghost", "sm", "w-full !text-rani-700 hover:!bg-rani-50")}>⚑ {t("report")}</Link>
          </Card>
          {familyDigits ? <p className="px-2 text-xs text-ink-soft">Opens WhatsApp to your saved family contact. You choose whether to send.</p> : <p className="px-2 text-xs text-ink-soft">Sharing is always your choice. Nothing is sent automatically.</p>}
        </aside>
      </div>
    </div>
  );
}
