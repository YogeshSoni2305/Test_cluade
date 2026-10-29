import Link from "next/link";
import { getI18n, bi } from "@/lib/i18n";
import { CITIES, GOALS, INDUSTRIES, byId, EXPERIENCE_REQ } from "@/lib/constants";
import { searchJobs } from "@/lib/queries";
import { JobCard } from "@/components/JobCard";
import { btn, Empty } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Find work" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

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
  const hasFilters = Boolean(f.q || f.industry || f.city || f.minSalary || f.stay || f.exp || f.verified || f.learn);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-indigo-900 sm:text-4xl">{t("nav_jobs")}</h1>
        <p className="mt-2 text-ink-soft">
          <strong className="text-ink">{jobs.length}</strong> {t("results")}
          {activeGoal && <> · <span className="font-semibold text-rani-600">{activeGoal.icon} {bi(activeGoal, lang)}</span></>}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
        <aside>
          <form className="sticky top-24 space-y-4 rounded-3xl border border-line bg-white p-5 shadow-card">
            {goal && <input type="hidden" name="goal" value={goal} />}
            <h2 className="font-display text-lg font-semibold text-indigo-900">{t("filters")}</h2>
            <input className="field" name="q" defaultValue={f.q} placeholder={t("filter_search")} />
            <label className="block text-sm font-semibold">{t("filter_industry")}
              <select className="field mt-1.5 font-normal" name="industry" defaultValue={f.industry}>
                <option value="">{t("all")}</option>
                {INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{i.icon} {bi(i, lang)}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">{t("filter_city")}
              <select className="field mt-1.5 font-normal" name="city" defaultValue={f.city}>
                <option value="">{t("all")}</option>
                {CITIES.filter((c) => c !== "Other").map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">{t("filter_salary")}
              <input className="field mt-1.5 font-normal" type="number" step="1000" min="0" name="minSalary" defaultValue={f.minSalary || ""} placeholder="e.g. 12000" />
            </label>
            <label className="block text-sm font-semibold">{t("filter_stay")}
              <select className="field mt-1.5 font-normal" name="stay" defaultValue={f.stay}>
                <option value="">{t("filter_stay_any")}</option>
                <option value="yes">{t("filter_stay_yes")}</option>
                <option value="free">{t("filter_stay_free")}</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">{t("filter_exp")}
              <select className="field mt-1.5 font-normal" name="exp" defaultValue={f.exp}>
                <option value="">{t("all")}</option>
                <option value="fresher">{bi(EXPERIENCE_REQ[0], lang)}</option>
              </select>
            </label>
            <div className="space-y-2.5 text-sm font-medium">
              <label className="flex cursor-pointer items-center gap-2.5"><input type="checkbox" name="verified" value="1" defaultChecked={f.verified} className="h-4 w-4 accent-indigo-800" />{t("filter_verified")}</label>
              <label className="flex cursor-pointer items-center gap-2.5"><input type="checkbox" name="learn" value="1" defaultChecked={f.learn} className="h-4 w-4 accent-indigo-800" />{t("filter_learn")}</label>
            </div>
            <label className="block text-sm font-semibold">{t("filter_sort")}
              <select className="field mt-1.5 font-normal" name="sort" defaultValue={f.sort}>
                <option value="best">{t("sort_best")}</option>
                <option value="new">{t("sort_new")}</option>
                <option value="learn">{t("sort_learn")}</option>
                <option value="salary">{t("sort_salary")}</option>
              </select>
            </label>
            <div className="flex gap-2 pt-1">
              <button className={btn("primary", "md", "flex-1")}>{t("apply_filters")}</button>
              {hasFilters && <Link href="/jobs" className={btn("outline", "md")}>{t("clear")}</Link>}
            </div>
          </form>
        </aside>

        <section>
          {jobs.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {jobs.map((j) => <JobCard key={j.id} job={j} lang={lang} t={t} saved={saved.has(j.id)} />)}
            </div>
          ) : (
            <Empty title={t("no_results")} sub={t("no_results_sub")} action={<Link className={btn("primary")} href="/jobs">{t("clear")}</Link>} />
          )}
          <p className="mt-8 text-xs leading-relaxed text-ink-soft">
            Listings are ranked by trust and clarity (verification, how fully pay, hours, stay and deductions are disclosed) — not by salary alone. Switch the sort to compare by pay.
          </p>
        </section>
      </div>
    </div>
  );
}
