import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { employerJobs, getEmployerByUser, employerRating, isExpired } from "@/lib/queries";
import { getDb } from "@/lib/db";
import { getI18n, type Key } from "@/lib/i18n";
import { setJobStatus } from "@/app/actions";
import { renewJob } from "@/app/_actions/jobs";
import { jobTotals } from "@/lib/jobstats";
import { Badge, btn, Empty, LinkButton, Notice, PageHeader, SectionTitle, Stat, VerifiedBadge } from "@/components/ui";
import { ButaBand, Jharokha, Stamp, toDeva } from "@/components/ornaments";
import { IArrow, IBook, ICheck, ICopy, IEye, IPlus, IRefresh, IShield, ISteps, IUser, IRupee, IndustryIcon, ISearch } from "@/components/icons";
import { salaryRange, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "For employers", description: "Hire motivated young people from Rajasthan for your shop, showroom, workshop or wholesale business. Free to post during the pilot." };

export default async function EmployerHome({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getCurrentUser();
  const { t, lang } = await getI18n();
  const sp = await searchParams;

  if (!user || user.role !== "employer") return <EmployerLanding signedIn={!!user} role={user?.role ?? null} t={t} />;

  const emp = getEmployerByUser(user.id);
  if (!emp) redirect("/employer/profile");
  const jobs = employerJobs(emp.id);
  const totals = jobTotals(emp.id);
  const counts = getDb().prepare(`SELECT
      SUM(CASE WHEN a.status='applied' THEN 1 ELSE 0 END) AS new_apps,
      SUM(CASE WHEN a.status IN ('selected','joined') THEN 1 ELSE 0 END) AS hires
    FROM applications a JOIN jobs j ON j.id=a.job_id WHERE j.employer_id=?`).get(emp.id) as { new_apps: number | null; hires: number | null };
  const views30 = [...totals.values()].reduce((a, v) => a + v.views30, 0);
  const rating = employerRating(emp.id);
  const statusLabel = (j: (typeof jobs)[number]) =>
    j.flagged_reason ? { tone: "marigold", text: t("ej_under_review") }
    : j.status === "open" && isExpired(j) ? { tone: "rose", text: t("ej_expired") }
    : { tone: j.status === "open" ? "green" : j.status === "removed" ? "rose" : "slate", text: t(`ej_status_${j.status}` as Key) };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        deva="भर्ती खाता"
        title={emp.business_name}
        sub={`${emp.city} · ${t("ej_dashboard")}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/employer/profile" className={btn("outline", "sm")}>{t("ej_edit_business")}</Link>
            <Link href="/employer/candidates" className={btn("outline", "sm")}><ISearch size={16} />{t("nav_find_candidates")}</Link>
            <Link href="/employer/jobs/new" className={btn("primary", "sm")}><IPlus size={16} />{t("cta_employer_btn")}</Link>
          </div>
        }
      />

      <div className="mb-10 space-y-3">
        {sp.renewed && <Notice tone="ok">{t("ej_renewed")}</Notice>}
        {emp.verification_status !== "verified" && (
          <Notice tone={emp.verification_status === "rejected" ? "bad" : "warn"}>
            {emp.verification_status === "pending" ? t("ej_verif_pending") : emp.verification_status === "rejected" ? `${t("ej_verif_rejected")} ${emp.verification_note ?? ""}` : t("ej_verif_none")}{" "}
            <Link href="/employer/verification" className="font-semibold underline">{emp.verification_status === "pending" ? t("ej_view_status") : t("cs_get_verified")}</Link>
          </Notice>
        )}
      </div>

      <div className="mb-14 grid grid-cols-2 gap-6 sm:gap-10 lg:grid-cols-5">
        <Stat value={jobs.filter((j) => j.status === "open" && !isExpired(j)).length} label={t("ej_open")} />
        <Stat value={views30} label={t("ej_views30")} />
        <Stat value={counts.new_apps ?? 0} label={t("ej_new_apps")} tone="gold" />
        <Stat value={counts.hires ?? 0} label={t("ej_hires")} tone="green" />
        <Stat value={rating.count ? rating.avg.toFixed(1) : "—"} label={`${t("ej_rating")} (${rating.count})`} tone="rose" />
      </div>

      <div className="flex items-end justify-between gap-3 border-b-2 border-ink pb-3">
        <h2 className="font-display text-[2rem] font-semibold leading-none text-ink">{t("ej_listings")} <span className="deva-accent font-deva text-lg font-normal text-sindoor-600">लिस्टिंग</span></h2>
        <VerifiedBadge status={emp.verification_status} label={t("verified")} pendingLabel={t("not_verified")} />
      </div>
      {jobs.length === 0 && <div className="mt-6"><Empty title={t("ej_empty")} sub={t("ej_empty_sub")} action={<Link href="/employer/jobs/new" className={btn("primary")}>{t("cta_employer_btn")}</Link>} /></div>}
      <ul className="divide-y divide-line">
        {jobs.map((j) => {
          const st = statusLabel(j);
          const tot = totals.get(j.id) ?? { views30: 0, applies: 0 };
          const expired = j.status === "open" && isExpired(j);
          return (
            <li key={j.id} className="grid items-center gap-x-5 gap-y-3 py-5 md:grid-cols-[1fr_auto_auto]">
              <div className="min-w-0">
                <Link href={`/employer/jobs/${j.id}`} className="font-display text-[1.5rem] font-semibold leading-tight text-ink hover:text-sindoor-700">{j.title}</Link>
                <p className="text-[0.92rem] text-ink-soft">
                  {j.city} · <span className="num">{salaryRange(j.salary_min, j.salary_max)}</span> · {t("ej_posted")} {timeAgo(j.created_at, lang)}
                  {j.expires_at && j.status === "open" && !expired && <> · {t("ej_expires")} {j.expires_at.slice(0, 10)}</>}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 text-[0.88rem] text-ink-soft">
                  <span className="inline-flex items-center gap-1"><IEye size={15} />{tot.views30} {t("ej_views")}</span>
                  <span className="inline-flex items-center gap-1"><IUser size={15} />{tot.applies} {t("ej_applicants")}</span>
                  <span>{t("clarity")} {j.clarity}/10</span>
                </p>
              </div>
              <Badge tone={st.tone}>{st.text}</Badge>
              <div className="flex flex-wrap gap-2">
                {(expired || ["closed", "filled"].includes(j.status)) && (
                  <form action={renewJob}><input type="hidden" name="job_id" value={j.id} /><input type="hidden" name="next" value="/employer" /><button className={btn("primary", "sm")}><IRefresh size={15} />{t("ej_renew")}</button></form>
                )}
                {j.status === "open" && !expired && (
                  <form action={setJobStatus}><input type="hidden" name="job_id" value={j.id} /><input type="hidden" name="next" value="/employer" /><input type="hidden" name="status" value="filled" /><button className={btn("outline", "sm")}>{t("ej_mark_filled")}</button></form>
                )}
                <Link href={`/employer/jobs/new?from=${j.id}`} className={btn("ghost", "sm")} title={t("ej_duplicate")}><ICopy size={15} />{t("ej_duplicate")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EmployerLanding({ signedIn, role, t }: { signedIn: boolean; role: string | null; t: (k: Key) => string }) {
  const reasons = [
    [IUser, "el_r1_t", "el_r1_d"], [IShield, "el_r2_t", "el_r2_d"], [ISteps, "el_r3_t", "el_r3_d"],
    [IBook, "el_r4_t", "el_r4_d"], [ICheck, "el_r5_t", "el_r5_d"], [IRupee, "el_r6_t", "el_r6_d"],
  ] as const;
  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="font-deva text-xl text-sindoor-600">{t("el_kicker")}</p>
            <h1 className="mt-4 font-display text-[3rem] font-medium leading-[1] tracking-[-0.015em] text-ink sm:text-[4.4rem]">
              {t("el_title_1")} <span className="italic text-sindoor-600">{t("el_title_2")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-[1.15rem] leading-relaxed text-ink-soft">{t("el_sub")}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              {signedIn && role !== "employer" ? (
                <Notice tone="warn">{t("el_wrong_role")}</Notice>
              ) : (
                <>
                  <LinkButton href="/sign-up" variant="primary" size="lg">{t("el_register")} <IArrow size={18} /></LinkButton>
                  <LinkButton href="/sign-in" variant="outline" size="lg">{t("el_signin")}</LinkButton>
                </>
              )}
            </div>
          </div>
          <div className="relative mx-auto hidden h-[26rem] w-[20rem] lg:block" aria-hidden>
            <Jharokha className="h-full w-full">
              <div className="flex h-full flex-col items-center justify-end gap-4 pb-14 text-haldi-300">
                <div className="flex gap-4">{["menswear", "auto_parts", "jewellery"].map((i) => <IndustryIcon key={i} id={i} size={34} />)}</div>
                <div className="flex gap-4">{["hardware", "mobile_retail"].map((i) => <IndustryIcon key={i} id={i} size={34} />)}</div>
              </div>
            </Jharokha>
            <Stamp size={120} className="absolute -bottom-6 -left-10 -rotate-12" />
          </div>
        </div>
        <ButaBand id="buta-emp" />
      </section>
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <SectionTitle deva="क्यों" kicker={t("el_why_kicker")} title={t("el_why_title")} />
        <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-3">
          {reasons.map(([Icon, ti, d], i) => (
            <div key={ti} className="border-t-2 border-ink pt-5">
              <div className="flex items-center justify-between"><Icon size={26} className="text-sindoor-600" /><span className="font-deva text-xl text-ink-faint">{toDeva(i + 1)}</span></div>
              <h3 className="mt-4 font-display text-[1.6rem] font-semibold leading-tight text-ink">{t(ti)}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{t(d)}</p>
            </div>
          ))}
        </div>
        <p className="mt-16 flex items-start gap-3 border-l-[3px] border-peacock-500 bg-peacock-50 px-5 py-4 text-peacock-700"><IShield size={22} className="mt-0.5 shrink-0" />{t("el_rules")}</p>
      </section>
    </div>
  );
}
