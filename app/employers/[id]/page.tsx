import { notFound } from "next/navigation";
import { getEmployer, employerJobs, employerRating } from "@/lib/queries";
import { getI18n, bi } from "@/lib/i18n";
import { BUSINESS_TYPES, INDUSTRIES, VERIFICATION_CHECKS, byId } from "@/lib/constants";
import { getDb } from "@/lib/db";
import { JobCard } from "@/components/JobCard";
import { Badge, VerifiedBadge, cx } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EmployerPublic({ params }: { params: Promise<{ id: string }> }) {
  const emp = getEmployer(Number((await params).id));
  if (!emp || emp.verification_status === "rejected") notFound();
  const { t, lang } = await getI18n();
  const jobs = employerJobs(emp.id).filter((j) => j.status === "open");
  const rating = employerRating(emp.id);
  const reviews = getDb().prepare(`
    SELECT f.rating, f.comment, f.created_at FROM feedback f JOIN applications a ON a.id=f.application_id JOIN jobs j ON j.id=a.job_id
    WHERE j.employer_id=? AND f.from_role='candidate' AND f.hidden=0 AND f.comment != '' ORDER BY f.created_at DESC LIMIT 5`).all(emp.id) as { rating: number; comment: string }[];
  const ind = byId(INDUSTRIES, emp.industry);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-indigo-900 p-8 text-white sm:p-12">
        <div className="pattern-jali absolute inset-0 opacity-70" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="arch flex h-28 w-24 items-center justify-center bg-marigold-400 text-5xl">{ind?.icon}</div>
          <div>
            <div className="flex flex-wrap gap-2">
              <VerifiedBadge status={emp.verification_status} label={t("verified")} pendingLabel={t("not_verified")} />
              <Badge tone="cream">{bi(byId(BUSINESS_TYPES, emp.business_type), lang)}</Badge>
              {rating.count > 0 && <Badge tone="marigold">★ {rating.avg.toFixed(1)} · {rating.count} reviews</Badge>}
            </div>
            <h1 className="mt-3 font-display text-4xl font-semibold">{emp.business_name}</h1>
            <p className="mt-1 text-indigo-100/85">📍 {emp.city} · {bi(ind, lang)}{emp.years_in_business ? ` · ${emp.years_in_business} years in business` : ""}{emp.staff_count ? ` · ${emp.staff_count} staff` : ""}</p>
            {emp.origin_district && <p className="mt-1 text-sm text-marigold-300">Owner’s family is from {emp.origin_district}, Rajasthan</p>}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          {emp.about && <p className="text-lg leading-relaxed text-ink-soft">{emp.about}</p>}
          <h2 className="mt-10 font-display text-2xl font-semibold text-indigo-900">{jobs.length} open {jobs.length === 1 ? "position" : "positions"}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {jobs.map((j) => <JobCard key={j.id} job={j} lang={lang} t={t} />)}
          </div>
          {reviews.length > 0 && (
            <>
              <h2 className="mt-12 font-display text-2xl font-semibold text-indigo-900">What workers say</h2>
              <ul className="mt-4 space-y-3">
                {reviews.map((r, i) => (
                  <li key={i} className="rounded-2xl border border-line bg-white p-4">
                    <p className="text-marigold-600">{"★".repeat(r.rating)}<span className="text-cream-300">{"★".repeat(5 - r.rating)}</span></p>
                    <p className="mt-1 text-ink-soft">“{r.comment}”</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-ink-soft">Reviews are moderated and anonymous.</p>
            </>
          )}
        </div>
        <aside className="h-fit rounded-3xl border border-line bg-white p-6 shadow-card">
          <h3 className="font-display text-lg font-semibold text-indigo-900">{t("what_checked")}</h3>
          <ul className="mt-4 space-y-2">
            {VERIFICATION_CHECKS.map((c) => {
              const ok = emp.verification_status === "verified" && emp.verified_checks.includes(c.id);
              return <li key={c.id} className={cx("flex gap-2 rounded-xl px-3 py-2 text-sm", ok ? "bg-leaf-50 text-leaf-700" : "bg-cream-100 text-ink-soft")}><b>{ok ? "✓" : "—"}</b>{bi(c, lang)}</li>;
            })}
          </ul>
          {emp.verified_at && <p className="mt-3 text-xs text-ink-soft">Last verified {emp.verified_at.slice(0, 10)}</p>}
        </aside>
      </div>
    </div>
  );
}
