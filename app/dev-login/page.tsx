import { notFound } from "next/navigation";
import { HumanCheck } from "@/components/HumanCheck";
import { BYPASS, getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { devCreate, devLogin } from "@/app/actions";
import { btn, Chips, Field, Notice } from "@/components/ui";
import { Ornament } from "@/components/ornaments";
import { IBriefcase, IShield, IHaveli as IShop } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Demo login" };

type U = { id: number; name: string; role: string | null; phone: string | null; extra: string | null };

export default async function DevLogin({ searchParams }: { searchParams: Promise<{ signup?: string; next?: string; error?: string }> }) {
  if (!BYPASS) notFound();
  const sp = await searchParams;
  const me = await getCurrentUser();
  const users = getDb().prepare(`
    SELECT u.id, u.name, u.role, u.phone,
      COALESCE(e.business_name || ' · ' || e.city, cp.district) AS extra
    FROM users u LEFT JOIN employers e ON e.user_id = u.id LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
    ORDER BY u.role, u.id`).all() as U[];
  const groups: [string, string, string, typeof IBriefcase, U[]][] = [
    ["candidate", "Candidates", "उम्मीदवार", IBriefcase, users.filter((u) => u.role === "candidate")],
    ["employer", "Employers", "मालिक", IShop, users.filter((u) => u.role === "employer")],
    ["admin", "Admin", "एडमिन", IShield, users.filter((u) => u.role === "admin")],
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Notice tone="warn">
        <b>Auth bypass is on.</b> Clerk isn’t active, so you can sign in as any demo user here. Add the Clerk keys to <code>.env.local</code> and set <code>AUTH_BYPASS=false</code> for real phone sign-in.
      </Notice>
      <p className="mt-10 font-deva text-lg text-sindoor-600">डेमो लॉगिन</p>
      <h1 className="font-display text-[3rem] font-medium leading-none text-ink">{sp.signup ? "Create a test account" : "Choose a demo user"}</h1>
      {sp.error && <div className="mt-4"><Notice tone="bad">{sp.error}</Notice></div>}
      {me && <p className="mt-3 text-ink-soft">Signed in as <b className="text-ink">{me.name}</b> ({me.role ?? "no role"}).</p>}
      <Ornament className="mt-7" />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-10">
          {groups.map(([key, title, hi, Icon, list]) => (
            <section key={key}>
              <h2 className="flex items-center gap-2.5 border-b-2 border-ink pb-2 font-display text-[1.6rem] font-semibold text-ink">
                <Icon size={20} className="text-sindoor-600" />{title}<span className="font-deva text-base font-normal text-ink-faint">{hi}</span>
              </h2>
              <ul className="divide-y divide-line">
                {list.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{u.name}</p>
                      <p className="truncate text-[0.88rem] text-ink-soft">{u.extra ?? u.phone ?? "—"}</p>
                    </div>
                    <form action={devLogin}>
                      <input type="hidden" name="uid" value={u.id} />
                      {sp.next && <input type="hidden" name="next" value={sp.next} />}
                      <button className={btn(me?.id === u.id ? "success" : "outline", "sm")}>{me?.id === u.id ? "Current" : "Continue"}</button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="h-fit rounded-[4px] border border-line bg-paper-50 shadow-card">
          <div className="leheriya h-[5px] rounded-t-[4px]" />
          <div className="p-6">
            <h2 className="font-display text-[1.6rem] font-semibold text-ink">New test account</h2>
            <p className="mt-1 text-ink-soft">Try onboarding from scratch.</p>
            <form action={devCreate} className="mt-6 space-y-4">
              <HumanCheck />
              <Field label="Name"><input name="name" className="field" required placeholder="e.g. Suresh Kumar" /></Field>
              <Field label="Mobile number"><input name="phone" className="field" inputMode="tel" placeholder="+91 …" /></Field>
              <div>
                <p className="mb-2 text-[0.95rem] font-semibold">I am a…</p>
                <Chips type="radio" name="role" selected={["candidate"]} options={[
                  { value: "candidate", label: "Candidate" }, { value: "employer", label: "Employer" }, { value: "admin", label: "Admin" },
                ]} />
              </div>
              <button className={btn("primary", "md", "w-full")}>Create & continue</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
