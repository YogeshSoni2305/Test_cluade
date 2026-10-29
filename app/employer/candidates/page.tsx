import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { employerJobs, getEmployerByUser, isPubliclyVisible } from "@/lib/queries";
import { searchCandidates } from "@/lib/candidates";
import { getI18n, bi } from "@/lib/i18n";
import { CITIES, EDUCATION, GOALS, INDUSTRIES, LANGUAGES, RAJASTHAN_DISTRICTS, byId } from "@/lib/constants";
import { sendInvite } from "@/app/_actions/invites";
import { Badge, btn, Empty, Notice, PageHeader } from "@/components/ui";
import { IDoc } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Find candidates", robots: { index: false } };

type SP = Record<string, string | undefined>;

export default async function CandidateSearch({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  if (!emp) redirect("/employer/profile");
  const sp = await searchParams;
  const { t, lang } = await getI18n();
  const verified = emp.verification_status === "verified";
  const f = { industry: sp.industry ?? "", district: sp.district ?? "", city: sp.city ?? "", minEdu: sp.minEdu ?? "", language: sp.language ?? "", stay: sp.stay ?? "", goal: sp.goal ?? "", q: sp.q ?? "" };
  const results = verified ? searchCandidates(f) : [];
  const openJobs = employerJobs(emp.id).filter((j) => isPubliclyVisible(j));
  const invited = new Set((getDb().prepare("SELECT i.candidate_id || ':' || i.job_id k FROM invitations i JOIN jobs j ON j.id=i.job_id WHERE j.employer_id=?").all(emp.id) as { k: string }[]).map((r) => r.k));
  const here = `/employer/candidates?${new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString()}`;
  const sel = (name: string, label: string, opts: [string, string][]) => (
    <label className="block text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">{label}
      <select name={name} defaultValue={f[name as keyof typeof f]} className="field mt-1 font-normal normal-case tracking-normal">
        <option value="">{t("all")}</option>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader deva="उम्मीदवार खोजें" title={t("cs_title")} sub={t("cs_sub")} />
      <div className="mb-6 space-y-3">
        {!verified && <Notice tone="warn">{t("cs_verified_only")} <Link href="/employer/verification" className="font-semibold underline">{t("cs_get_verified")}</Link></Notice>}
        {sp.invited && <Notice tone="ok">{t("cs_invited_ok")}</Notice>}
        {sp.error && <Notice tone="bad">{sp.error}</Notice>}
        {verified && openJobs.length === 0 && <Notice tone="info">{t("cs_no_jobs")} <Link href="/employer/jobs/new" className="font-semibold underline">{t("cta_employer_btn")}</Link></Notice>}
      </div>

      <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
        <form className="h-fit space-y-4 lg:sticky lg:top-28">
          {sel("industry", t("filter_industry"), INDUSTRIES.map((i) => [i.id, bi(i, lang)]))}
          {sel("district", t("cs_district"), RAJASTHAN_DISTRICTS.map((d) => [d, d]))}
          {sel("city", t("cs_city"), CITIES.filter((c) => c !== "Other").map((c) => [c, c]))}
          {sel("minEdu", t("cs_min_edu"), EDUCATION.map((e) => [e.id, bi(e, lang)]))}
          {sel("language", t("cs_language"), LANGUAGES.map((l) => [l, l]))}
          {sel("goal", t("cs_goal"), GOALS.map((g) => [g.id, bi(g, lang)]))}
          {sel("stay", t("filter_stay"), [["own", t("cs_own_stay")]])}
          <label className="block text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">{t("cs_keyword")}
            <input name="q" defaultValue={f.q} className="field mt-1 font-normal normal-case tracking-normal" placeholder={t("cs_keyword_ph")} />
          </label>
          <div className="flex gap-2"><button className={btn("ink", "md", "flex-1")}>{t("apply_filters")}</button><Link href="/employer/candidates" className={btn("outline", "md")}>{t("clear")}</Link></div>
        </form>

        <section>
          <p className="mb-4 text-ink-soft"><span className="num font-display text-3xl font-semibold text-ink">{results.length}</span> {t("cs_results")}</p>
          {results.length === 0 ? (
            <Empty title={t("cs_empty")} sub={t("cs_empty_sub")} />
          ) : (
            <ul className="space-y-4">
              {results.map((c) => (
                <li key={c.id} className="rounded-[4px] border border-line bg-paper-50 p-5 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-[1.5rem] font-semibold leading-tight text-ink">{c.display_name}</p>
                      <p className="text-[0.95rem] text-ink-soft">{[c.district && `${c.district}, Rajasthan`, c.age && `${c.age} ${t("cs_yrs")}`, bi(byId(EDUCATION, c.education), lang)].filter(Boolean).join(" · ")}</p>
                    </div>
                    {c.letters > 0 && <Badge tone="green"><IDoc size={14} />{c.letters} {t("cs_letters")}</Badge>}
                  </div>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-[0.93rem] sm:grid-cols-2">
                    <div><dt className="inline font-semibold text-ink">{t("cs_interests")}: </dt><dd className="inline text-ink-soft">{c.industries.map((i) => bi(byId(INDUSTRIES, i), lang)).join(", ") || "—"}</dd></div>
                    <div><dt className="inline font-semibold text-ink">{t("cs_cities")}: </dt><dd className="inline text-ink-soft">{c.cities.join(", ") || "—"}</dd></div>
                    <div><dt className="inline font-semibold text-ink">{t("cs_languages")}: </dt><dd className="inline text-ink-soft">{c.languages.join(", ")}</dd></div>
                    <div><dt className="inline font-semibold text-ink">{t("cs_goals")}: </dt><dd className="inline text-ink-soft">{c.goals.map((g) => bi(byId(GOALS, g), lang)).join(", ") || "—"}</dd></div>
                    {c.experience && <div className="sm:col-span-2"><dt className="inline font-semibold text-ink">{t("cs_experience")}: </dt><dd className="inline text-ink-soft">{c.experience.slice(0, 160)}</dd></div>}
                  </dl>
                  {verified && openJobs.length > 0 && (
                    <form action={sendInvite} className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
                      <input type="hidden" name="candidate_id" value={c.id} />
                      <input type="hidden" name="next" value={here} />
                      <label className="text-[0.85rem] font-semibold">{t("cs_invite_to")}
                        <select name="job_id" className="field mt-1 !w-auto !py-2">
                          {openJobs.map((j) => <option key={j.id} value={j.id} disabled={invited.has(`${c.id}:${j.id}`)}>{j.title}{invited.has(`${c.id}:${j.id}`) ? ` (${t("cs_invited")})` : ""}</option>)}
                        </select>
                      </label>
                      <label className="min-w-48 flex-1 text-[0.85rem] font-semibold">{t("cs_invite_msg")}
                        <input name="message" maxLength={600} className="field mt-1 !py-2" placeholder={t("cs_invite_msg_ph")} />
                      </label>
                      <button className={btn("primary", "md")}>{t("cs_invite")}</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-8 text-[0.88rem] text-ink-soft">{t("cs_privacy")}</p>
        </section>
      </div>
    </div>
  );
}
