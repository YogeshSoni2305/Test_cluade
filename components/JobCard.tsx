import Link from "next/link";
import { skillLabel, INDUSTRIES, byId } from "@/lib/constants";
import { bi, type Lang, type Key } from "@/lib/i18n";
import type { Job } from "@/lib/queries";
import { rupees, salaryRange, timeAgo } from "@/lib/format";
import { ClarityMeter, cx } from "./ui";
import { Stamp } from "./ornaments";
import { IHeart, IndustryIcon, IPin } from "./icons";

/** A listing drawn as a slip torn from a bahi-khata ledger. */
export function JobCard({ job, lang, t, saved }: { job: Job; lang: Lang; t: (k: Key) => string; saved?: boolean }) {
  const ind = byId(INDUSTRIES, job.industry);
  const per = job.salary_period === "day" ? (lang === "hi" ? "दिन" : "day") : job.salary_period === "week" ? (lang === "hi" ? "सप्ताह" : "week") : (lang === "hi" ? "माह" : "month");
  const skills = job.skills_offered.slice(0, 3).map((id) => skillLabel(job.industry, id)?.en).filter(Boolean);
  const noDed = /^no\b/i.test(job.deductions.trim()) && !job.deposit_amount;
  const verified = job.verification_status === "verified";

  const Row = ({ k, children, strong }: { k: string; children: React.ReactNode; strong?: boolean }) => (
    <div className="flex h-8 items-end gap-2 text-[0.95rem]">
      <dt className="shrink-0 text-ink-soft">{k}</dt>
      <span className="leader" />
      <dd className={cx("shrink-0 text-right", strong ? "font-semibold text-ink" : "text-ink")}>{children}</dd>
    </div>
  );

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="slip ledger group relative flex flex-col rounded-[3px] border border-line py-5 pl-[3.6rem] pr-5 shadow-card"
    >
      <span className="absolute left-[9px] top-5 text-sindoor-500" title={bi(ind, lang)}><IndustryIcon id={job.industry} size={18} /></span>
      {verified ? (
        <Stamp size={66} className="pointer-events-none absolute -right-2 -top-3 -rotate-12 opacity-90" />
      ) : (
        <span className="absolute right-4 top-4 border border-dashed border-ink-faint/60 px-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">{t("not_verified")}</span>
      )}

      <p className="pr-16 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">{job.business_name}</p>
      <h3 className="mt-1 pr-14 font-display text-[1.7rem] font-semibold leading-[1.1] text-ink transition group-hover:text-sindoor-700">{job.title}</h3>
      <p className="mt-2 flex items-center gap-1.5 text-[0.95rem] text-ink-soft">
        <IPin size={16} className="text-sindoor-500" />{job.city}{job.locality ? `, ${job.locality}` : ""}
        {saved && <IHeart filled size={15} className="ml-1 text-sindoor-500" />}
      </p>

      <dl className="mt-3">
        <Row k={t("salary")} strong>
          <span className="num font-display text-[1.35rem] font-semibold text-sindoor-700">{salaryRange(job.salary_min, job.salary_max)}</span>
          <span className="ml-1 text-[0.85rem] font-normal text-ink-soft">/ {per}</span>
        </Row>
        <Row k={t("stay")}>
          {job.accommodation === "free" ? <span className="font-semibold text-peacock-600">{t("stay_free")}</span> : job.accommodation === "paid" ? `${rupees(job.accommodation_cost)} / ${lang === "hi" ? "माह" : "mo"}` : <span className="text-ink-faint">{t("stay_none")}</span>}
        </Row>
        <Row k={t("deductions")}>
          {noDed ? <span className="font-semibold text-peacock-600">{t("no_deductions")}</span> : <span className="text-haldi-700">{t("has_deductions")}</span>}
        </Row>
      </dl>

      {skills.length > 0 && (
        <p className="mt-4 text-[0.92rem] leading-snug text-ink-soft">
          <span className="mr-1.5 font-deva text-sindoor-600">सीख</span>
          {skills.join(" · ")}
          {job.skills_offered.length > 3 && <span className="font-semibold text-ink"> +{job.skills_offered.length - 3}</span>}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-5 text-[0.85rem] text-ink-faint">
        <ClarityMeter score={job.clarity} label={t("clarity")} />
        <span>{timeAgo(job.created_at, lang)}</span>
      </div>
    </Link>
  );
}
