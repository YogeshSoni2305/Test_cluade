import Link from "next/link";
import { skillLabel, INDUSTRIES, byId } from "@/lib/constants";
import { bi, type Lang, type Key } from "@/lib/i18n";
import type { Job } from "@/lib/queries";
import { salaryRange, timeAgo } from "@/lib/format";
import { Badge, ClarityMeter, ShieldIcon, cx } from "./ui";

export function JobCard({ job, lang, t, saved }: { job: Job; lang: Lang; t: (k: Key) => string; saved?: boolean }) {
  const ind = byId(INDUSTRIES, job.industry);
  const per = job.salary_period === "day" ? (lang === "hi" ? "/ दिन" : "/ day") : job.salary_period === "week" ? (lang === "hi" ? "/ सप्ताह" : "/ week") : t("per_month");
  const skills = job.skills_offered.slice(0, 3).map((id) => skillLabel(job.industry, id)?.en).filter(Boolean);
  const noDed = /^no\b/i.test(job.deductions.trim());

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-1 hover:shadow-lift"
    >
      <div className={cx("absolute inset-x-0 top-0 h-1.5", job.verification_status === "verified" ? "bg-leaf-500" : "bg-cream-300")} />
      <div className="flex items-start gap-3.5">
        <div className="arch flex h-14 w-12 shrink-0 items-center justify-center bg-indigo-50 text-2xl ring-1 ring-indigo-100" aria-hidden>
          {ind?.icon ?? "🏪"}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold leading-snug text-indigo-900 group-hover:text-indigo-600">{job.title}</h3>
          <p className="mt-0.5 truncate text-sm text-ink-soft">{job.business_name}</p>
        </div>
        {saved && <span title="Saved" className="text-rani-500">♥</span>}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold text-ink">📍 {job.city}{job.locality ? `, ${job.locality}` : ""}</span>
        <span className="font-display text-lg font-semibold text-marigold-700">
          {salaryRange(job.salary_min, job.salary_max)} <span className="font-sans text-xs font-medium text-ink-soft">{per}</span>
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.verification_status === "verified" ? (
          <Badge tone="green"><ShieldIcon className="h-3.5 w-3.5" />{t("verified")}</Badge>
        ) : (
          <Badge tone="slate">{t("not_verified")}</Badge>
        )}
        <Badge tone={job.accommodation === "free" ? "green" : job.accommodation === "paid" ? "indigo" : "cream"}>
          🛏 {job.accommodation === "free" ? t("stay_free") : job.accommodation === "paid" ? t("stay_paid") : t("stay_none")}
        </Badge>
        {noDed && <Badge tone="green">✓ {t("no_deductions")}</Badge>}
      </div>

      {skills.length > 0 && (
        <div className="mt-4 rounded-2xl bg-cream-100 px-3.5 py-2.5">
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-rani-600">{t("you_learn")}</p>
          <p className="mt-1 text-sm leading-snug text-ink-soft">
            {skills.join(" · ")}
            {job.skills_offered.length > 3 && <span className="font-semibold text-indigo-700"> +{job.skills_offered.length - 3}</span>}
          </p>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-ink-soft">
        <ClarityMeter score={job.clarity} label={t("clarity")} />
        <span>{timeAgo(job.created_at, lang)}</span>
      </div>
      <span className="sr-only">{bi(ind, lang)}</span>
    </Link>
  );
}
