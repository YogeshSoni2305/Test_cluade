import { notFound } from "next/navigation";
import { getEmployer, employerJobs, employerRating } from "@/lib/queries";
import { getI18n, bi } from "@/lib/i18n";
import { BUSINESS_TYPES, INDUSTRIES, VERIFICATION_CHECKS, byId } from "@/lib/constants";
import { getDb } from "@/lib/db";
import { JobCard } from "@/components/JobCard";
import { cx } from "@/components/ui";
import { Jharokha, Ornament, Stamp } from "@/components/ornaments";
import { ICheck, IndustryIcon, IPin, IStar } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const emp = getEmployer(Number((await params).id));
  if (!emp || emp.verification_status === "rejected") return { title: "Business not found", robots: { index: false } };
  return {
    title: `${emp.business_name}, ${emp.city} — jobs & verification`,
    description: `${emp.business_name} (${emp.city}) on Rajasthan Kaam: open positions, what was verified, and reviews from workers.`,
    alternates: { canonical: `/employers/${emp.id}` },
  };
}

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
  const verified = emp.verification_status === "verified";

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl items-end gap-10 px-4 pb-12 pt-14 sm:px-6 md:grid-cols-[11rem_1fr_auto]">
          <Jharokha className="hidden h-52 w-40 md:block">
            <div className="flex h-full items-end justify-center pb-10 text-haldi-300"><IndustryIcon id={emp.industry} size={48} /></div>
          </Jharokha>
          <div>
            <p className="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-sindoor-600">{bi(byId(BUSINESS_TYPES, emp.business_type), lang)} · {bi(ind, lang)}</p>
            <h1 className="mt-2 font-display text-[3rem] font-medium leading-none tracking-[-0.015em] text-ink sm:text-[4rem]">{emp.business_name}</h1>
            <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-ink-soft">
              <span className="inline-flex items-center gap-1.5"><IPin size={17} className="text-sindoor-500" />{emp.city}</span>
              {emp.years_in_business ? <span>{emp.years_in_business} {t("emp_years_in_business")}</span> : null}
              {emp.staff_count ? <span>{emp.staff_count} {t("emp_staff")}</span> : null}
              {rating.count > 0 && <span className="inline-flex items-center gap-1 text-haldi-700"><IStar filled size={16} />{rating.avg.toFixed(1)} · {rating.count} {t("emp_reviews")}</span>}
            </p>
            {emp.origin_district && <p className="mt-2 font-semibold text-sindoor-700">{t("emp_origin")} {emp.origin_district}, Rajasthan</p>}
          </div>
          {verified ? <Stamp size={130} className="-rotate-12" /> : <span className="border border-dashed border-ink-faint px-3 py-1 text-[0.8rem] font-semibold uppercase tracking-wider text-ink-faint">{t("not_verified")}</span>}
        </div>
      </section>

      <div className="mx-auto mt-12 grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_20rem]">
        <div>
          {emp.about && <p className="font-display text-[1.5rem] italic leading-snug text-ink">{emp.about}</p>}
          <h2 className="mt-12 font-display text-[2rem] font-semibold text-ink">{jobs.length} {t("open_positions")}</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {jobs.map((j) => <JobCard key={j.id} job={j} lang={lang} t={t} />)}
          </div>
          {reviews.length > 0 && (
            <>
              <h2 className="mt-14 font-display text-[2rem] font-semibold text-ink">{t("emp_workers_say")}</h2>
              <ul className="mt-5 divide-y divide-line border-y border-line">
                {reviews.map((r, i) => (
                  <li key={i} className="py-5">
                    <p className="flex gap-0.5 text-haldi-500">{Array.from({ length: 5 }, (_, k) => <IStar key={k} size={16} filled={k < r.rating} />)}</p>
                    <p className="mt-2 font-display text-[1.25rem] italic leading-snug text-ink">“{r.comment}”</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[0.85rem] text-ink-soft">{t("emp_reviews_note")}</p>
            </>
          )}
        </div>
        <aside className="h-fit rounded-[4px] border border-line bg-paper-50 p-6 shadow-card">
          <h3 className="font-display text-xl font-semibold text-ink">{t("what_checked")}</h3>
          <Ornament className="my-4" color="text-paper-300" />
          <ul className="space-y-2.5">
            {VERIFICATION_CHECKS.map((c) => {
              const ok = verified && emp.verified_checks.includes(c.id);
              return (
                <li key={c.id} className={cx("flex items-start gap-2 text-[0.95rem]", ok ? "text-ink" : "text-ink-faint")}>
                  {ok ? <ICheck size={18} className="mt-0.5 shrink-0 text-peacock-500" /> : <span className="mt-2.5 h-px w-3.5 shrink-0 bg-ink-faint" />}{bi(c, lang)}
                </li>
              );
            })}
          </ul>
          {emp.verified_at && <p className="mt-4 text-[0.82rem] text-ink-soft">{t("emp_last_verified")} {emp.verified_at.slice(0, 10)}</p>}
        </aside>
      </div>
    </div>
  );
}
