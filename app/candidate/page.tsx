import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getCandidateProfile, searchJobs, getJob, isPubliclyVisible, type Job } from "@/lib/queries";
import { getI18n, bi } from "@/lib/i18n";
import { APPLICATION_STATUSES, byId, GOALS } from "@/lib/constants";
import { withdrawApplication } from "@/app/actions";
import { respondInvite } from "@/app/_actions/invites";
import { requestLetter } from "@/app/_actions/letters";
import { lettersFor, durationLabel } from "@/lib/letters";
import { JobCard } from "@/components/JobCard";
import { Badge, btn, Empty, Notice, PageHeader, Stat } from "@/components/ui";
import { IBell, IChat, ICheck, IDoc, IPin } from "@/components/icons";
import { salaryRange, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "My dashboard", robots: { index: false } };

type AppRow = {
  id: number; job_id: number; status: string; created_at: string; updated_at: string; joined_at: string | null; left_at: string | null;
  title: string; business_name: string; city: string; salary_min: number; salary_max: number; job_status: string;
  has_feedback: number; unread: number; has_letter: number;
};
type Invite = { id: number; job_id: number; message: string; created_at: string; title: string; business_name: string; city: string; salary_min: number; salary_max: number; verification_status: string };

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
    SELECT a.id, a.job_id, a.status, a.created_at, a.updated_at, a.joined_at, a.left_at, j.title, e.business_name, j.city, j.salary_min, j.salary_max, j.status AS job_status,
      (SELECT COUNT(*) FROM feedback f WHERE f.application_id=a.id AND f.from_role='candidate') AS has_feedback,
      (SELECT COUNT(*) FROM messages m WHERE m.application_id=a.id AND m.read_at IS NULL AND (m.sender_id IS NULL OR m.sender_id != ?)) AS unread,
      (SELECT COUNT(*) FROM experience_letters l WHERE l.application_id=a.id AND l.revoked=0) AS has_letter
    FROM applications a JOIN jobs j ON j.id=a.job_id JOIN employers e ON e.id=j.employer_id
    WHERE a.candidate_id=? ORDER BY a.updated_at DESC`).all(user.id, user.id) as AppRow[];
  const invites = db.prepare(`
    SELECT i.id, i.job_id, i.message, i.created_at, j.title, e.business_name, j.city, j.salary_min, j.salary_max, e.verification_status
    FROM invitations i JOIN jobs j ON j.id=i.job_id JOIN employers e ON e.id=j.employer_id
    WHERE i.candidate_id=? AND i.status='pending' AND j.status='open' ORDER BY i.id DESC`).all(user.id) as Invite[];
  const savedIds = (db.prepare("SELECT job_id FROM saved_jobs WHERE user_id=? ORDER BY created_at DESC").all(user.id) as { job_id: number }[]).map((r) => r.job_id);
  const saved = savedIds.map((id) => getJob(id)).filter((j): j is Job => !!j && isPubliclyVisible(j));
  const alertCount = (db.prepare("SELECT COUNT(*) n FROM job_alerts WHERE user_id=? AND active=1").get(user.id) as { n: number }).n;
  const letters = lettersFor(user.id);
  const working = apps.filter((a) => a.status === "joined" && !a.left_at);
  const appliedIds = new Set(apps.map((a) => a.job_id));

  // Simple, explainable matching: industry + city + stay need + goals.
  const recs = searchJobs({ sort: "best" })
    .filter((j) => !appliedIds.has(j.id))
    .map((j) => {
      let score = j.clarity / 2;
      const why: string[] = [];
      if (profile.industries.includes(j.industry)) { score += 4; why.push(t("why_industry")); }
      if (profile.cities.includes(j.city)) { score += 3; why.push(t("why_city")); }
      if (profile.needs_accommodation && j.accommodation !== "none") { score += 2; why.push(t("why_stay")); }
      if (profile.goals.some((g) => ["learn", "family", "explore", "manager"].includes(g)) && j.skills_offered.length >= 4) { score += 1.5; why.push(t("why_learn")); }
      if (j.verification_status === "verified") score += 1;
      return { j, score, why };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const active = apps.filter((a) => !["rejected", "withdrawn"].includes(a.status)).length;
  const goalObjs = profile.goals.map((g) => byId(GOALS, g)).filter(Boolean);
  const H2 = ({ id, children, deva }: { id?: string; children: React.ReactNode; deva: string }) => (
    <h2 id={id} className="scroll-mt-28 font-display text-[2rem] font-semibold text-ink">{children} <span className="deva-accent font-deva text-lg font-normal text-sindoor-600">{deva}</span></h2>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        deva="नमस्ते"
        title={`${user.name.split(" ")[0]}${t("cd_title_suffix")}`}
        sub={goalObjs.length ? `${t("cd_goals")}: ${goalObjs.map((g) => bi(g, lang)).join(" · ")}` : t("cd_sub")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/candidate/profile" className={btn("outline", "sm")}>{t("cd_edit_profile")}</Link>
            <Link href="/candidate/alerts" className={btn("outline", "sm")}><IBell size={16} />{t("alerts_title")}{alertCount ? ` (${alertCount})` : ""}</Link>
            <Link href="/jobs" className={btn("primary", "sm")}>{t("hero_cta_primary")}</Link>
          </div>
        }
      />
      <div className="mb-6 space-y-3">
        {sp.saved && <Notice tone="ok">{t("cd_saved")}</Notice>}
        {sp.declined && <Notice tone="info">{t("cd_declined")}</Notice>}
        {sp.letter_requested && <Notice tone="ok">{t("letter_requested")}</Notice>}
        {!profile.searchable && <Notice tone="info">{t("cd_searchable_nudge")} <Link href="/account" className="font-semibold underline">{t("nav_account")}</Link></Notice>}
      </div>

      <div className="mb-14 grid grid-cols-3 gap-6 sm:gap-10">
        <Stat value={apps.length} label={t("cd_stat_apps")} />
        <Stat value={active} label={t("cd_stat_active")} tone="gold" />
        <Stat value={saved.length} label={t("cd_stat_saved")} tone="rose" />
      </div>

      {invites.length > 0 && (
        <section className="mb-16">
          <H2 id="invitations" deva="न्योते">{t("cd_invites")}</H2>
          <ul className="mt-5 space-y-3">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-4 rounded-[4px] border-l-[3px] border-haldi-500 bg-paper-50 p-5 shadow-card">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">{i.business_name}{i.verification_status === "verified" && <span className="ml-2 text-peacock-600">✓ {t("verified")}</span>}</p>
                  <Link href={`/jobs/${i.job_id}`} className="font-display text-[1.45rem] font-semibold leading-tight text-ink hover:text-sindoor-700">{i.title}</Link>
                  <p className="text-[0.92rem] text-ink-soft"><IPin size={14} className="inline text-sindoor-500" /> {i.city} · <span className="num">{salaryRange(i.salary_min, i.salary_max)}</span> · {timeAgo(i.created_at, lang)}</p>
                  {i.message && <p className="mt-2 font-display text-[1.15rem] italic text-ink">“{i.message}”</p>}
                </div>
                <form action={respondInvite} className="flex gap-2">
                  <input type="hidden" name="invitation_id" value={i.id} />
                  <button name="op" value="accept" className={btn("primary", "sm")}>{t("cd_invite_view")}</button>
                  <button name="op" value="decline" className={btn("ghost", "sm")}>{t("cd_invite_decline")}</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <H2 deva="आवेदन">{t("cd_apps")}</H2>
        <div className="mt-5">
          {apps.length === 0 && <Empty title={t("cd_apps_empty")} sub={t("cd_apps_empty_sub")} action={<Link href="/jobs" className={btn("primary")}>{t("hero_cta_primary")}</Link>} />}
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
                        <p className="text-[0.95rem] text-ink-soft">{a.business_name} · {a.city} · <span className="num">{salaryRange(a.salary_min, a.salary_max)}</span> · {t("cd_applied")} {timeAgo(a.created_at, lang)}</p>
                      </div>
                      <Badge tone={st.tone}>{bi(st, lang)}</Badge>
                    </div>
                    {!closed && (
                      <ol className="mt-4 flex items-center" aria-label={t("cd_progress")}>
                        {FLOW.map((s, i) => (
                          <li key={s} className="flex flex-1 items-center last:flex-none" aria-current={i === idx ? "step" : undefined}>
                            <span className="flex flex-col items-center gap-1">
                              <span className={`h-3 w-3 rotate-45 ${i <= idx ? "bg-peacock-500" : "border border-paper-300 bg-paper-50"}`} />
                              <span className={`hidden whitespace-nowrap text-[0.75rem] font-semibold sm:block ${i <= idx ? "text-peacock-700" : "text-ink-faint"}`}>{bi(byId([...APPLICATION_STATUSES], s), lang)}</span>
                            </span>
                            {i < FLOW.length - 1 && <span className={`mx-1 h-px flex-1 sm:mb-5 ${i < idx ? "bg-peacock-500" : "bg-paper-300"}`} />}
                          </li>
                        ))}
                      </ol>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Link href={`/messages/${a.id}`} className={btn("outline", "sm")}><IChat size={16} />{t("msg_open")}{a.unread > 0 && <span className="rounded-[2px] bg-sindoor-600 px-1.5 text-[0.72rem] text-paper-50">{a.unread}</span>}</Link>
                      {["selected", "joined"].includes(a.status) && !a.has_feedback && (
                        <Link href={`/feedback/${a.id}`} className={btn("gold", "sm")}>{t("cd_feedback")}</Link>
                      )}
                      {a.has_feedback > 0 && <Badge tone="green">{t("cd_feedback_done")}</Badge>}
                      {["applied", "contacted", "interview"].includes(a.status) && (
                        <form action={withdrawApplication}><input type="hidden" name="application_id" value={a.id} /><button className={btn("ghost", "sm")}>{t("cd_withdraw")}</button></form>
                      )}
                      {a.job_status !== "open" && !["joined", "selected"].includes(a.status) && <Badge tone="slate">{t("cd_position_closed")}</Badge>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-16">
        <H2 deva="काम का अनुभव">{t("work_history")}</H2>
        <p className="mt-1 text-ink-soft">{t("work_history_sub")}</p>
        <ul className="mt-5 divide-y divide-line border-y border-line">
          {working.map((a) => (
            <li key={`w${a.id}`} className="flex flex-wrap items-center gap-4 py-4">
              <span className="h-3 w-3 rotate-45 bg-peacock-500" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{a.title} · {a.business_name}</p>
                <p className="text-[0.9rem] text-ink-soft">{t("work_current")}{a.joined_at ? ` · ${durationLabel(a.joined_at.slice(0, 10), new Date().toISOString().slice(0, 10), lang)}` : ""}</p>
              </div>
              {!a.has_letter && (
                <form action={requestLetter}><input type="hidden" name="application_id" value={a.id} /><button className={btn("outline", "sm")}><IDoc size={16} />{t("letter_request")}</button></form>
              )}
            </li>
          ))}
          {letters.map((l) => (
            <li key={l.code} className="flex flex-wrap items-center gap-4 py-4">
              <IDoc size={20} className={l.revoked ? "text-ink-faint" : "text-sindoor-600"} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{l.role_title} · {l.business_name}, {l.business_city}</p>
                <p className="text-[0.9rem] text-ink-soft">{l.from_date} → {l.to_date} · {durationLabel(l.from_date, l.to_date, lang)} · <span className="num">{l.code}</span>{l.revoked ? ` · ${t("letter_revoked")}` : ""}</p>
              </div>
              <Link href={`/letters/${l.code}`} className={btn("outline", "sm")}>{t("letter_view")}</Link>
            </li>
          ))}
          {working.length === 0 && letters.length === 0 && <li className="py-6 text-ink-soft">{t("letter_none")}</li>}
        </ul>
      </section>

      {saved.length > 0 && (
        <section className="mt-16">
          <H2 deva="सेव किए">{t("cd_saved_title")}</H2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{saved.map((j) => <JobCard key={j.id} job={j} lang={lang} t={t} saved />)}</div>
        </section>
      )}

      <section className="mt-16">
        <H2 deva="आपके लिए">{t("cd_picked")}</H2>
        <p className="mt-1 text-ink-soft">{t("cd_picked_sub")}</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recs.map(({ j, why }) => (
            <div key={j.id} className="flex flex-col gap-2">
              <JobCard job={j} lang={lang} t={t} />
              {why.length > 0 && <p className="flex items-center gap-1.5 px-1 text-[0.85rem] font-semibold text-peacock-700"><ICheck size={15} />{t("cd_matches")} {why.join(", ")}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
