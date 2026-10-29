import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getCandidateProfile, searchJobs, getJob, type Job } from "@/lib/queries";
import { getI18n, bi } from "@/lib/i18n";
import { APPLICATION_STATUSES, byId, GOALS } from "@/lib/constants";
import { withdrawApplication } from "@/app/actions";
import { JobCard } from "@/components/JobCard";
import { Badge, btn, Empty, Notice, PageHeader, Stat } from "@/components/ui";
import { ICheck } from "@/components/icons";
import { salaryRange, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "My dashboard" };

type AppRow = {
  id: number; job_id: number; status: string; message: string; created_at: string; updated_at: string;
  title: string; business_name: string; city: string; salary_min: number; salary_max: number; job_status: string;
  has_feedback: number;
};

const FLOW = ["applied", "contacted", "interview", "selected", "joined"];

export default async function CandidateDashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("candidate");
  if (user.role === "admin") redirect("/admin");
  const { t, lang } = await getI18n();
  const sp = await searchParams;
  const profile = getCandidateProfile(user.id);
  if (!profile?.completed) redirect("/candidate/profile");
  const db = getDb();

  const apps = db.prepare(`
    SELECT a.id, a.job_id, a.status, a.message, a.created_at, a.updated_at, j.title, e.business_name, j.city, j.salary_min, j.salary_max, j.status AS job_status,
      (SELECT COUNT(*) FROM feedback f WHERE f.application_id=a.id AND f.from_role='candidate') AS has_feedback
    FROM applications a JOIN jobs j ON j.id=a.job_id JOIN employers e ON e.id=j.employer_id
    WHERE a.candidate_id=? ORDER BY a.updated_at DESC`).all(user.id) as AppRow[];
  const savedIds = (db.prepare("SELECT job_id FROM saved_jobs WHERE user_id=? ORDER BY created_at DESC").all(user.id) as { job_id: number }[]).map((r) => r.job_id);
  const saved = savedIds.map((id) => getJob(id)).filter((j): j is Job => !!j && j.status === "open");
  const appliedIds = new Set(apps.map((a) => a.job_id));

  // Simple, explainable matching: industry + city + stay need + goals.
  const recs = searchJobs({ sort: "best" })
    .filter((j) => !appliedIds.has(j.id))
    .map((j) => {
      let score = j.clarity / 2;
      const why: string[] = [];
      if (profile.industries.includes(j.industry)) { score += 4; why.push("your industry"); }
      if (profile.cities.includes(j.city)) { score += 3; why.push("your city"); }
      if (profile.needs_accommodation && j.accommodation !== "none") { score += 2; why.push("stay provided"); }
      if (profile.goals.some((g) => ["learn", "family", "explore", "manager"].includes(g)) && j.skills_offered.length >= 4) { score += 1.5; why.push("lots to learn"); }
      if (j.verification_status === "verified") score += 1;
      return { j, score, why };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const active = apps.filter((a) => !["rejected", "withdrawn"].includes(a.status)).length;
  const goalObjs = profile.goals.map((g) => byId(GOALS, g)).filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        deva="नमस्ते"
        title={`${user.name.split(" ")[0]}, here’s your khata`}
        sub={goalObjs.length ? `Your goals: ${goalObjs.map((g) => bi(g, lang)).join(" · ")}` : "Where your journey stands."}
        actions={<div className="flex gap-2"><Link href="/candidate/profile" className={btn("outline", "sm")}>Edit profile</Link><Link href="/jobs" className={btn("primary", "sm")}>{t("hero_cta_primary")}</Link></div>}
      />
      {sp.saved && <div className="mb-6"><Notice tone="ok">Profile saved.</Notice></div>}

      <div className="mb-14 grid grid-cols-3 gap-6 sm:gap-10">
        <Stat value={apps.length} label="Applications" />
        <Stat value={active} label="Active" tone="gold" />
        <Stat value={saved.length} label="Saved" tone="rose" />
      </div>

      <section>
        <h2 className="font-display text-[2rem] font-semibold text-ink">My applications <span className="font-deva text-lg font-normal text-sindoor-600">आवेदन</span></h2>
        <div className="mt-5">
          {apps.length === 0 && <Empty title="No applications yet" sub="Browse verified opportunities and apply in one tap — your profile is ready." action={<Link href="/jobs" className={btn("primary")}>Browse jobs</Link>} />}
          {apps.length > 0 && (
            <ul className="ledger divide-y divide-line rounded-[3px] border border-line pl-12 shadow-card">
              {apps.map((a) => {
                const st = byId([...APPLICATION_STATUSES], a.status)!;
                const idx = FLOW.indexOf(a.status);
                const closed = ["rejected", "withdrawn"].includes(a.status);
                return (
                  <li key={a.id} className="py-5 pr-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/jobs/${a.job_id}`} className="font-display text-[1.5rem] font-semibold leading-tight text-ink hover:text-sindoor-700">{a.title}</Link>
                        <p className="text-[0.95rem] text-ink-soft">{a.business_name} · {a.city} · <span className="num">{salaryRange(a.salary_min, a.salary_max)}</span> · applied {timeAgo(a.created_at, lang)}</p>
                      </div>
                      <Badge tone={st.tone}>{bi(st, lang)}</Badge>
                    </div>
                    {!closed && (
                      <ol className="mt-4 flex items-center" aria-label="Progress">
                        {FLOW.map((s, i) => (
                          <li key={s} className="flex flex-1 items-center last:flex-none">
                            <span className="flex flex-col items-center gap-1">
                              <span className={`h-3 w-3 rotate-45 ${i <= idx ? "bg-peacock-500" : "border border-paper-300 bg-paper-50"}`} />
                              <span className={`hidden whitespace-nowrap text-[0.75rem] font-semibold sm:block ${i <= idx ? "text-peacock-700" : "text-ink-faint"}`}>{bi(byId([...APPLICATION_STATUSES], s), lang)}</span>
                            </span>
                            {i < FLOW.length - 1 && <span className={`mx-1 mb-0 h-px flex-1 sm:mb-5 ${i < idx ? "bg-peacock-500" : "bg-paper-300"}`} />}
                          </li>
                        ))}
                      </ol>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {["selected", "joined"].includes(a.status) && !a.has_feedback && (
                        <Link href={`/feedback/${a.id}`} className={btn("gold", "sm")}>Share feedback</Link>
                      )}
                      {a.has_feedback > 0 && <Badge tone="green">Feedback shared</Badge>}
                      {["applied", "contacted", "interview"].includes(a.status) && (
                        <form action={withdrawApplication}><input type="hidden" name="application_id" value={a.id} /><button className={btn("ghost", "sm")}>Withdraw</button></form>
                      )}
                      {a.job_status !== "open" && <Badge tone="slate">Position {a.job_status}</Badge>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {saved.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-[2rem] font-semibold text-ink">Saved <span className="font-deva text-lg font-normal text-sindoor-600">सेव किए</span></h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{saved.map((j) => <JobCard key={j.id} job={j} lang={lang} t={t} saved />)}</div>
        </section>
      )}

      <section className="mt-16">
        <h2 className="font-display text-[2rem] font-semibold text-ink">Picked for you <span className="font-deva text-lg font-normal text-sindoor-600">आपके लिए</span></h2>
        <p className="mt-1 text-ink-soft">Matched to your industries, cities and goals — ranked for trust, not just salary.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recs.map(({ j, why }) => (
            <div key={j.id} className="flex flex-col gap-2">
              <JobCard job={j} lang={lang} t={t} />
              {why.length > 0 && <p className="flex items-center gap-1.5 px-1 text-[0.85rem] font-semibold text-peacock-700"><ICheck size={15} />Matches {why.join(", ")}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
