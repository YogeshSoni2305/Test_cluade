import Link from "next/link";
import { getI18n, bi } from "@/lib/i18n";
import { CITIES, GOALS, INDUSTRIES, byId, EXPERIENCE_REQ } from "@/lib/constants";
import { searchJobs } from "@/lib/queries";
import { JobCard } from "@/components/JobCard";
import { btn, Empty } from "@/components/ui";
import { Ornament } from "@/components/ornaments";
import { GoalIcon, ISearch } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Find work" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">{children}</span>;
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { t, lang } = await getI18n();
  const goal = one(sp.goal);
  // A chosen goal pre-selects sensible defaults, but the user can always change them.
  const goalDefaults = goal === "learn" || goal === "family" || goal === "explore" ? { sort: "learn" } : goal === "manager" ? { sort: "best" } : {};
  const f = {
    q: one(sp.q), industry: one(sp.industry), city: one(sp.city), minSalary: Number(one(sp.minSalary)) || 0,
    stay: one(sp.stay), exp: one(sp.exp), verified: one(sp.verified) === "1", learn: one(sp.learn) === "1",
    sort: one(sp.sort) || goalDefaults.sort || "best",
  };
  const jobs = searchJobs(f);
  const user = await getCurrentUser();
  const saved = user?.role === "candidate"
    ? new Set((getDb().prepare("SELECT job_id FROM saved_jobs WHERE user_id=?").all(user.id) as { job_id: number }[]).map((r) => r.job_id))
    : new Set<number>();
  const activeGoal = byId(GOALS, goal);
  const activeInd = byId(INDUSTRIES, f.industry);
  const hasFilters = Boolean(f.q || f.industry || f.city || f.minSalary || f.stay || f.exp || f.verified || f.learn);

  const filters = (
    <form className="space-y-5">
      {goal && <input type="hidden" name="goal" value={goal} />}
      <label className="relative block">
        <ISearch size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input className="field !pl-10" name="q" defaultValue={f.q} placeholder={t("filter_search")} />
      </label>
      <label className="block"><Label>{t("filter_industry")}</Label>
        <select className="field" name="industry" defaultValue={f.industry}>
          <option value="">{t("all")}</option>
          {INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{bi(i, lang)}</option>)}
        </select>
      </label>
      <label className="block"><Label>{t("filter_city")}</Label>
        <select className="field" name="city" defaultValue={f.city}>
          <option value="">{t("all")}</option>
          {CITIES.filter((c) => c !== "Other").map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label className="block"><Label>{t("filter_salary")}</Label>
        <input className="field num" type="number" step="1000" min="0" name="minSalary" defaultValue={f.minSalary || ""} placeholder="12000" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><Label>{t("filter_stay")}</Label>
          <select className="field" name="stay" defaultValue={f.stay}>
            <option value="">{t("filter_stay_any")}</option>
            <option value="yes">{t("filter_stay_yes")}</option>
            <option value="free">{t("filter_stay_free")}</option>
          </select>
        </label>
        <label className="block"><Label>{t("filter_exp")}</Label>
          <select className="field" name="exp" defaultValue={f.exp}>
            <option value="">{t("all")}</option>
            <option value="fresher">{bi(EXPERIENCE_REQ[0], lang)}</option>
          </select>
        </label>
      </div>
      <div className="space-y-2.5 border-y border-line py-4 text-[0.95rem]">
        <label className="flex cursor-pointer items-center gap-2.5"><input type="checkbox" name="verified" value="1" defaultChecked={f.verified} className="h-4 w-4 accent-sindoor-600" />{t("filter_verified")}</label>
        <label className="flex cursor-pointer items-center gap-2.5"><input type="checkbox" name="learn" value="1" defaultChecked={f.learn} className="h-4 w-4 accent-sindoor-600" />{t("filter_learn")}</label>
      </div>
      <label className="block"><Label>{t("filter_sort")}</Label>
        <select className="field" name="sort" defaultValue={f.sort}>
          <option value="best">{t("sort_best")}</option>
          <option value="new">{t("sort_new")}</option>
          <option value="learn">{t("sort_learn")}</option>
          <option value="salary">{t("sort_salary")}</option>
        </select>
      </label>
      <div className="flex gap-2">
        <button className={btn("ink", "md", "flex-1")}>{t("apply_filters")}</button>
        {hasFilters && <Link href="/jobs" className={btn("outline", "md")}>{t("clear")}</Link>}
      </div>
    </form>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-10">
        <p className="deva-accent font-deva text-lg text-sindoor-600">काम खोजें</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-[2.8rem] font-medium leading-none tracking-[-0.01em] text-ink sm:text-[3.4rem]">
            {activeInd ? bi(activeInd, lang) : t("nav_jobs")}
          </h1>
          <p className="text-ink-soft"><span className="num font-display text-3xl font-semibold text-ink">{jobs.length}</span> {t("results")}</p>
        </div>
        {activeGoal && (
          <p className="mt-4 inline-flex items-center gap-2 border-l-[3px] border-sindoor-500 bg-paper-50 py-2 pl-3 pr-4 text-[0.95rem] text-ink">
            <GoalIcon id={activeGoal.id} size={18} className="text-sindoor-600" />
            <span>Showing what matters for: <b>{bi(activeGoal, lang)}</b></span>
          </p>
        )}
        <Ornament className="mt-7" />
      </header>

      <div className="grid gap-10 lg:grid-cols-[17.5rem_1fr]">
        <aside>
          <details className="group rounded-[4px] border border-line bg-paper-50 p-4 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">{t("filters")} <span className="text-sindoor-600 group-open:rotate-45 transition">+</span></summary>
            <div className="mt-4">{filters}</div>
          </details>
          <div className="sticky top-28 hidden lg:block">
            <p className="mb-4 flex items-baseline justify-between font-display text-2xl font-semibold text-ink">{t("filters")}<span className="deva-accent font-deva text-base font-normal text-sindoor-600">छाँटें</span></p>
            {filters}
          </div>
        </aside>

        <section>
          {jobs.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {jobs.map((j) => <JobCard key={j.id} job={j} lang={lang} t={t} saved={saved.has(j.id)} />)}
            </div>
          ) : (
            <Empty title={t("no_results")} sub={t("no_results_sub")} action={<Link className={btn("primary")} href="/jobs">{t("clear")}</Link>} />
          )}
          <p className="mt-10 border-t border-line pt-4 text-[0.88rem] leading-relaxed text-ink-soft">
            Listings are ranked by trust and clarity (verification, how fully pay, hours, stay and deductions are disclosed) — not by salary alone. Switch the sort to compare by pay.
          </p>
        </section>
      </div>
    </div>
  );
}
