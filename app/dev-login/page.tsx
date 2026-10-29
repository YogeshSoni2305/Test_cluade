import { notFound } from "next/navigation";
import { BYPASS, getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { devCreate, devLogin } from "@/app/actions";
import { btn, Card, Chips, Field, Notice } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Demo login" };

type U = { id: number; name: string; role: string | null; phone: string | null; extra: string | null };

export default async function DevLogin({ searchParams }: { searchParams: Promise<{ signup?: string; next?: string }> }) {
  if (!BYPASS) notFound();
  const sp = await searchParams;
  const me = await getCurrentUser();
  const users = getDb().prepare(`
    SELECT u.id, u.name, u.role, u.phone,
      COALESCE(e.business_name || ' · ' || e.city, cp.district) AS extra
    FROM users u LEFT JOIN employers e ON e.user_id = u.id LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
    ORDER BY u.role, u.id`).all() as U[];
  const groups: [string, string, U[]][] = [
    ["candidate", "🧑‍🎓 Candidates", users.filter((u) => u.role === "candidate")],
    ["employer", "🏪 Employers", users.filter((u) => u.role === "employer")],
    ["admin", "🛡️ Admin", users.filter((u) => u.role === "admin")],
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Notice tone="warn">
        <b>Auth bypass is enabled.</b> Clerk is not active, so this page lets you sign in as any demo user. Add your Clerk keys to <code>.env.local</code> and set <code>AUTH_BYPASS=false</code> to switch to real phone sign-in.
      </Notice>
      <h1 className="mt-8 font-display text-4xl font-semibold text-indigo-900">{sp.signup ? "Create a test account" : "Choose a demo user"}</h1>
      {me && <p className="mt-2 text-ink-soft">Currently signed in as <b>{me.name}</b> ({me.role ?? "no role"}).</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {groups.map(([key, title, list]) => (
            <Card key={key} className="p-5">
              <h2 className="font-display text-lg font-semibold text-indigo-900">{title}</h2>
              <ul className="mt-3 divide-y divide-line">
                {list.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{u.name}</p>
                      <p className="truncate text-xs text-ink-soft">{u.extra ?? u.phone ?? "—"}</p>
                    </div>
                    <form action={devLogin}>
                      <input type="hidden" name="uid" value={u.id} />
                      {sp.next && <input type="hidden" name="next" value={sp.next} />}
                      <button className={btn(me?.id === u.id ? "success" : "outline", "sm")}>{me?.id === u.id ? "Current" : "Continue"}</button>
                    </form>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <Card className="h-fit p-6">
          <h2 className="font-display text-lg font-semibold text-indigo-900">New test account</h2>
          <p className="mt-1 text-sm text-ink-soft">Try the full onboarding flow from scratch.</p>
          <form action={devCreate} className="mt-5 space-y-4">
            <Field label="Name"><input name="name" className="field" required placeholder="e.g. Suresh Kumar" /></Field>
            <Field label="Mobile number"><input name="phone" className="field" inputMode="tel" placeholder="+91 …" /></Field>
            <div>
              <p className="mb-2 text-sm font-semibold">I am a…</p>
              <Chips type="radio" name="role" selected={["candidate"]} options={[
                { value: "candidate", label: "Candidate" }, { value: "employer", label: "Employer" }, { value: "admin", label: "Admin" },
              ]} />
            </div>
            <button className={btn("primary", "md", "w-full")}>Create & continue</button>
          </form>
        </Card>
      </div>
    </div>
  );
}
