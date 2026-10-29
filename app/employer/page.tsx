import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { employerJobs, getEmployerByUser, employerRating } from "@/lib/queries";
import { getDb } from "@/lib/db";
import { getI18n } from "@/lib/i18n";
import { setJobStatus } from "@/app/actions";
import { Badge, btn, Card, Empty, LinkButton, Notice, PageHeader, SectionTitle, ShieldIcon, Stat, VerifiedBadge } from "@/components/ui";
import { salaryRange, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "For employers" };

export default async function EmployerHome() {
  const user = await getCurrentUser();
  const { t, lang } = await getI18n();

  if (!user || user.role !== "employer") return <EmployerLanding signedIn={!!user} role={user?.role ?? null} t={t} />;

  const emp = getEmployerByUser(user.id);
  if (!emp) redirect("/employer/profile");
  const jobs = employerJobs(emp.id);
  const db = getDb();
  const counts = db.prepare(`SELECT
      SUM(CASE WHEN a.status='applied' THEN 1 ELSE 0 END) AS new_apps,
      COUNT(*) AS total,
      SUM(CASE WHEN a.status IN ('selected','joined') THEN 1 ELSE 0 END) AS hires
    FROM applications a JOIN jobs j ON j.id=a.job_id WHERE j.employer_id=?`).get(emp.id) as { new_apps: number | null; total: number; hires: number | null };
  const rating = employerRating(emp.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        title={emp.business_name}
        sub={`${emp.city} · hiring dashboard`}
        actions={<div className="flex gap-2"><Link href="/employer/profile" className={btn("outline", "sm")}>Edit business</Link><Link href="/employer/jobs/new" className={btn("gold", "sm")}>+ Post a job</Link></div>}
      />

      {emp.verification_status !== "verified" && (
        <div className="mb-8">
          <Notice tone={emp.verification_status === "rejected" ? "bad" : "warn"}>
            {emp.verification_status === "pending" ? "Your verification is under review. " : emp.verification_status === "rejected" ? `Verification was declined: ${emp.verification_note ?? ""} ` : "Your business isn’t verified yet — listings show “Not yet verified” and rank lower. "}
            <Link href="/employer/verification" className="font-semibold underline">{emp.verification_status === "pending" ? "View status" : "Get verified"}</Link>
          </Notice>
        </div>
      )}

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat value={jobs.filter((j) => j.status === "open").length} label="Open positions" />
        <Stat value={counts.new_apps ?? 0} label="New applicants" tone="gold" />
        <Stat value={counts.hires ?? 0} label="Hired / selected" tone="green" />
        <Stat value={rating.count ? `★ ${rating.avg.toFixed(1)}` : "—"} label={`Worker rating (${rating.count})`} tone="rose" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-indigo-900">Your listings</h2>
        <VerifiedBadge status={emp.verification_status} label={t("verified")} pendingLabel={t("not_verified")} />
      </div>
      <div className="mt-5 space-y-3">
        {jobs.length === 0 && <Empty title="No listings yet" sub="Post your first job — it takes about 5 minutes." action={<Link href="/employer/jobs/new" className={btn("gold")}>Post a job</Link>} />}
        {jobs.map((j) => (
          <Card key={j.id} className="flex flex-wrap items-center gap-4 p-5">
            <div className="min-w-0 flex-1">
              <Link href={`/employer/jobs/${j.id}`} className="font-display text-lg font-semibold text-indigo-900 hover:underline">{j.title}</Link>
              <p className="text-sm text-ink-soft">{j.city} · {salaryRange(j.salary_min, j.salary_max)} · posted {timeAgo(j.created_at, lang)} · clarity {j.clarity}/10</p>
            </div>
            <Badge tone={j.status === "open" ? "green" : "slate"}>{j.status}</Badge>
            <Link href={`/employer/jobs/${j.id}`} className={btn("outline", "sm")}>{j.applicants ?? 0} applicants</Link>
            {j.status === "open" ? (
              <form action={setJobStatus}><input type="hidden" name="job_id" value={j.id} /><input type="hidden" name="status" value="filled" /><input type="hidden" name="next" value="/employer" /><button className={btn("ghost", "sm")}>Mark filled</button></form>
            ) : (
              <form action={setJobStatus}><input type="hidden" name="job_id" value={j.id} /><input type="hidden" name="status" value="open" /><input type="hidden" name="next" value="/employer" /><button className={btn("ghost", "sm")}>Reopen</button></form>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmployerLanding({ signedIn, role, t }: { signedIn: boolean; role: string | null; t: (k: "brand") => string }) {
  return (
    <div>
      <section className="relative overflow-hidden bg-indigo-900 py-24 text-white">
        <div className="pattern-jali absolute inset-0 opacity-70" />
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <p className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-marigold-300 ring-1 ring-white/15">For shop, showroom, workshop & wholesale owners</p>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight sm:text-6xl">Find motivated workers from Rajasthan — beyond your own network.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-indigo-100/85">Post a clear listing, review honest applicants and hire people who want to learn your trade. Free to start.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {signedIn && role !== "employer" ? (
              <Notice tone="warn">You’re signed in as a {role ?? "user without a role"}. Use an employer account to post jobs.</Notice>
            ) : (
              <>
                <LinkButton href="/sign-up" variant="gold" size="lg">Register your business →</LinkButton>
                <LinkButton href="/sign-in" variant="outline" size="lg" className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10">Employer sign in</LinkButton>
              </>
            )}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionTitle center title="Why owners use us" />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            ["🎯", "Reach new people", "Candidates from every district of Rajasthan who actively want to work and learn in your business."],
            ["🛡️", "Stand out as trusted", "Earn the Verified badge. Families trust listings with clear pay, stay and conditions."],
            ["⚡", "Simple hiring", "Post in 5 minutes, review applicants, call, interview and mark the role filled."],
            ["📚", "Hire for attitude", "Describe what you can teach. People who want to learn tend to stay longer."],
            ["🤝", "Fair by design", "Clear terms upfront mean fewer misunderstandings and quits in the first month."],
            ["💸", "Free to start", "No fee to post while we’re in pilot. Success-based pricing will be tested with early partners."],
          ].map(([i, ti, d]) => (
            <div key={ti} className="rounded-3xl border border-line bg-white p-6 shadow-card">
              <div className="arch mb-4 flex h-14 w-12 items-center justify-center bg-cream-200 text-2xl">{i}</div>
              <h3 className="font-display text-lg font-semibold text-indigo-900">{ti}</h3>
              <p className="mt-2 text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex items-center gap-3 rounded-2xl bg-leaf-50 p-5 text-leaf-700"><ShieldIcon className="h-6 w-6 shrink-0" /><p>{t("brand")} requires every listing to state salary, hours, holiday, stay and deductions. Candidates are never charged.</p></div>
      </section>
    </div>
  );
}
