import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { employerJobs, getEmployerByUser, employerRating } from "@/lib/queries";
import { getDb } from "@/lib/db";
import { getI18n } from "@/lib/i18n";
import { setJobStatus } from "@/app/actions";
import { Badge, btn, Empty, LinkButton, Notice, PageHeader, SectionTitle, Stat, VerifiedBadge } from "@/components/ui";
import { ButaBand, Jharokha, Stamp, toDeva } from "@/components/ornaments";
import { IArrow, IBook, ICheck, IPlus, IShield, ISteps, IUser, IRupee, IndustryIcon } from "@/components/icons";
import { salaryRange, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "For employers" };

export default async function EmployerHome() {
  const user = await getCurrentUser();
  const { t, lang } = await getI18n();

  if (!user || user.role !== "employer") return <EmployerLanding signedIn={!!user} role={user?.role ?? null} brand={t("brand")} />;

  const emp = getEmployerByUser(user.id);
  if (!emp) redirect("/employer/profile");
  const jobs = employerJobs(emp.id);
  const counts = getDb().prepare(`SELECT
      SUM(CASE WHEN a.status='applied' THEN 1 ELSE 0 END) AS new_apps,
      SUM(CASE WHEN a.status IN ('selected','joined') THEN 1 ELSE 0 END) AS hires
    FROM applications a JOIN jobs j ON j.id=a.job_id WHERE j.employer_id=?`).get(emp.id) as { new_apps: number | null; hires: number | null };
  const rating = employerRating(emp.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        deva="भर्ती खाता"
        title={emp.business_name}
        sub={`${emp.city} · hiring dashboard`}
        actions={<div className="flex gap-2"><Link href="/employer/profile" className={btn("outline", "sm")}>Edit business</Link><Link href="/employer/jobs/new" className={btn("primary", "sm")}><IPlus size={16} />Post a job</Link></div>}
      />

      {emp.verification_status !== "verified" && (
        <div className="mb-10">
          <Notice tone={emp.verification_status === "rejected" ? "bad" : "warn"}>
            {emp.verification_status === "pending" ? "Your verification is under review. " : emp.verification_status === "rejected" ? `Verification was declined: ${emp.verification_note ?? ""} ` : "Your business isn’t verified yet — listings show “Not yet verified” and rank lower. "}
            <Link href="/employer/verification" className="font-semibold underline">{emp.verification_status === "pending" ? "View status" : "Get verified"}</Link>
          </Notice>
        </div>
      )}

      <div className="mb-14 grid grid-cols-2 gap-6 sm:gap-10 lg:grid-cols-4">
        <Stat value={jobs.filter((j) => j.status === "open").length} label="Open positions" />
        <Stat value={counts.new_apps ?? 0} label="New applicants" tone="gold" />
        <Stat value={counts.hires ?? 0} label="Selected / hired" tone="green" />
        <Stat value={rating.count ? rating.avg.toFixed(1) : "—"} label={`Worker rating (${rating.count})`} tone="rose" />
      </div>

      <div className="flex items-end justify-between gap-3 border-b-2 border-ink pb-3">
        <h2 className="font-display text-[2rem] font-semibold leading-none text-ink">Your listings <span className="font-deva text-lg font-normal text-sindoor-600">लिस्टिंग</span></h2>
        <VerifiedBadge status={emp.verification_status} label={t("verified")} pendingLabel={t("not_verified")} />
      </div>
      {jobs.length === 0 && <div className="mt-6"><Empty title="No listings yet" sub="Post your first job — it takes about five minutes." action={<Link href="/employer/jobs/new" className={btn("primary")}>Post a job</Link>} /></div>}
      <ul className="divide-y divide-line">
        {jobs.map((j) => (
          <li key={j.id} className="grid items-center gap-x-5 gap-y-3 py-5 sm:grid-cols-[1fr_auto_auto_auto]">
            <div className="min-w-0">
              <Link href={`/employer/jobs/${j.id}`} className="font-display text-[1.5rem] font-semibold leading-tight text-ink hover:text-sindoor-700">{j.title}</Link>
              <p className="text-[0.92rem] text-ink-soft">{j.city} · <span className="num">{salaryRange(j.salary_min, j.salary_max)}</span> · posted {timeAgo(j.created_at, lang)} · clarity {j.clarity}/10</p>
            </div>
            <Badge tone={j.status === "open" ? "green" : j.status === "removed" ? "rose" : "slate"}>{j.status}</Badge>
            <Link href={`/employer/jobs/${j.id}`} className="inline-flex items-center gap-1.5 font-semibold text-sindoor-700 hover:underline"><IUser size={16} />{j.applicants ?? 0} applicants</Link>
            <form action={setJobStatus}>
              <input type="hidden" name="job_id" value={j.id} /><input type="hidden" name="next" value="/employer" />
              {j.status === "open"
                ? <><input type="hidden" name="status" value="filled" /><button className={btn("outline", "sm")}>Mark filled</button></>
                : j.status !== "removed" && <><input type="hidden" name="status" value="open" /><button className={btn("ghost", "sm")}>Reopen</button></>}
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmployerLanding({ signedIn, role, brand }: { signedIn: boolean; role: string | null; brand: string }) {
  const reasons = [
    [IUser, "Reach new people", "Young people from every district of Rajasthan who actively want to work and learn in your trade."],
    [IShield, "Stand out as trusted", "Earn the verification stamp. Families trust listings that show pay, stay and conditions clearly."],
    [ISteps, "Simple hiring", "Post in five minutes, review applicants, call, interview and mark the role filled."],
    [IBook, "Hire for attitude", "Describe what you can teach. People who come to learn tend to stay longer."],
    [ICheck, "Fewer surprises", "Clear terms upfront mean fewer misunderstandings and fewer quits in the first month."],
    [IRupee, "Free to start", "No fee to post during the pilot. Success-based pricing will be tested with early partners."],
  ] as const;
  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="font-deva text-xl text-sindoor-600">दुकान, शोरूम, वर्कशॉप और थोक व्यापारियों के लिए</p>
            <h1 className="mt-4 font-display text-[3rem] font-medium leading-[1] tracking-[-0.015em] text-ink sm:text-[4.4rem]">
              Hire beyond your <span className="italic text-sindoor-600">own network.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[1.15rem] leading-relaxed text-ink-soft">Post a clear listing, review honest applicants and hire people from Rajasthan who want to learn your trade. Free to start.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              {signedIn && role !== "employer" ? (
                <Notice tone="warn">You’re signed in as a {role ?? "user without a role"}. Use an employer account to post jobs.</Notice>
              ) : (
                <>
                  <LinkButton href="/sign-up" variant="primary" size="lg">Register your business <IArrow size={18} /></LinkButton>
                  <LinkButton href="/sign-in" variant="outline" size="lg">Employer sign in</LinkButton>
                </>
              )}
            </div>
          </div>
          <div className="relative mx-auto hidden h-[26rem] w-[20rem] lg:block">
            <Jharokha className="h-full w-full">
              <div className="flex h-full flex-col items-center justify-end gap-4 pb-14 text-haldi-300">
                <div className="flex gap-4">{["menswear", "auto_parts", "jewellery"].map((i) => <IndustryIcon key={i} id={i} size={34} />)}</div>
                <div className="flex gap-4">{["hardware", "mobile_retail"].map((i) => <IndustryIcon key={i} id={i} size={34} />)}</div>
              </div>
            </Jharokha>
            <Stamp size={120} className="absolute -bottom-6 -left-10 -rotate-12" />
          </div>
        </div>
        <ButaBand id="buta-emp" />
      </section>
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <SectionTitle deva="क्यों" kicker="Why owners use us" title="Good people, honestly matched" />
        <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-3">
          {reasons.map(([Icon, ti, d], i) => (
            <div key={ti} className="border-t-2 border-ink pt-5">
              <div className="flex items-center justify-between"><Icon size={26} className="text-sindoor-600" /><span className="font-deva text-xl text-ink-faint">{toDeva(i + 1)}</span></div>
              <h3 className="mt-4 font-display text-[1.6rem] font-semibold leading-tight text-ink">{ti}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-16 flex items-start gap-3 border-l-[3px] border-peacock-500 bg-peacock-50 px-5 py-4 text-peacock-700"><IShield size={22} className="mt-0.5 shrink-0" />{brand} requires every listing to state salary, hours, holiday, stay and deductions. Candidates are never charged.</p>
      </section>
    </div>
  );
}
