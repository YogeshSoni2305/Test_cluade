import { getDb } from "@/lib/db";
import { ADMIN_ROLES, can, requireAdmin } from "@/lib/auth";
import { adminSetRole, adminSuspendUser } from "@/app/_actions/admin";
import { Badge, btn, Empty, Notice, PageHeader } from "@/components/ui";
import { Pager } from "@/components/Pager";
import { timeAgo } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users", robots: { index: false } };

const PER = 30;
type U = { id: number; name: string; role: string | null; admin_role: string | null; phone_norm: string | null; suspended: number; suspended_reason: string | null; created_at: string; apps: number; reports_against: number; business_name: string | null };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const admin = await requireAdmin("view");
  const canModerate = can(admin, "moderate");
  const canRoles = can(admin, "manage_users");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: string[] = [];
  const args: unknown[] = [];
  if (sp.q?.startsWith("#")) { where.push("u.id = ?"); args.push(Number(sp.q.slice(1))); }
  else if (sp.q) { where.push("(u.name LIKE ? OR u.phone_norm LIKE ? OR e.business_name LIKE ?)"); const l = `%${sp.q}%`; args.push(l, l, l); }
  if (sp.role) { where.push("u.role = ?"); args.push(sp.role); }
  if (sp.suspended) where.push("u.suspended = 1");
  const W = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const db = getDb();
  const total = (db.prepare(`SELECT COUNT(*) n FROM users u LEFT JOIN employers e ON e.user_id=u.id ${W}`).get(...args) as { n: number }).n;
  const users = db.prepare(`SELECT u.id, u.name, u.role, u.admin_role, u.phone_norm, u.suspended, u.suspended_reason, u.created_at, e.business_name,
      (SELECT COUNT(*) FROM applications a WHERE a.candidate_id=u.id) AS apps,
      (SELECT COUNT(*) FROM reports r WHERE r.employer_id=e.id) AS reports_against
    FROM users u LEFT JOIN employers e ON e.user_id=u.id ${W} ORDER BY u.id DESC LIMIT ? OFFSET ?`).all(...args, PER, (page - 1) * PER) as U[];
  const here = `/admin/users?${new URLSearchParams(Object.entries({ q: sp.q, role: sp.role, suspended: sp.suspended, page: sp.page }).filter(([, v]) => v) as [string, string][])}`;
  const mask = (p: string | null) => (p ? `${p.slice(0, 5)}•••••${p.slice(-3)}` : "—");

  return (
    <>
      <PageHeader deva="उपयोगकर्ता" title="Users" sub="Search accounts, suspend abusers, and manage staff roles. Phone numbers are masked." />
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <label className="min-w-56 flex-1 text-[0.85rem] font-semibold">Search<input name="q" defaultValue={sp.q} className="field mt-1 !py-2" placeholder="Name, business or phone" /></label>
        <label className="text-[0.85rem] font-semibold">Role
          <select name="role" defaultValue={sp.role ?? ""} className="field mt-1 !w-auto !py-2"><option value="">All</option>{["candidate", "employer", "admin"].map((r) => <option key={r}>{r}</option>)}</select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-[0.92rem]"><input type="checkbox" name="suspended" value="1" defaultChecked={!!sp.suspended} className="h-4 w-4 accent-sindoor-600" />Suspended only</label>
        <button className={btn("ink", "md")}>Filter</button>
      </form>
      <div className="mb-4 space-y-3">
        {sp.done && <Notice tone="ok">Updated.</Notice>}
        {sp.error && <Notice tone="bad">{sp.error}</Notice>}
      </div>
      {users.length === 0 ? <Empty title="No users match" /> : (
        <ul className="divide-y divide-line border-y border-line">
          {users.map((u) => (
            <li key={u.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                  {u.name}<span className="text-[0.82rem] font-normal text-ink-faint">#{u.id}</span>
                  <Badge tone={u.role === "admin" ? "indigo" : u.role === "employer" ? "marigold" : "slate"}>{u.role ?? "no role"}{u.role === "admin" ? ` · ${u.admin_role ?? "super"}` : ""}</Badge>
                  {u.suspended ? <Badge tone="rose">suspended</Badge> : null}
                </p>
                <p className="text-[0.9rem] text-ink-soft">
                  <span className="num">{mask(u.phone_norm)}</span> · joined {timeAgo(u.created_at)}
                  {u.business_name && <> · {u.business_name} · {u.reports_against} report(s)</>}
                  {u.role === "candidate" && <> · {u.apps} application(s)</>}
                </p>
                {u.suspended_reason && <p className="text-[0.88rem] text-sindoor-700">Reason: {u.suspended_reason}</p>}
                <Link href={`/admin/audit?actor=${u.id}`} className="text-[0.85rem] text-ink-soft hover:underline">activity</Link>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                {canModerate && u.id !== admin.id && (
                  <form action={adminSuspendUser} className="flex gap-2">
                    <input type="hidden" name="user_id" value={u.id} /><input type="hidden" name="next" value={here} />
                    {u.suspended ? (
                      <button name="op" value="unsuspend" className={btn("outline", "sm")}>Restore</button>
                    ) : (
                      <><input name="reason" className="field !w-48 !py-1.5 text-[0.9rem]" placeholder="Reason (shown to user)" aria-label={`Suspension reason for ${u.name}`} /><button name="op" value="suspend" className={btn("danger", "sm")}>Suspend</button></>
                    )}
                  </form>
                )}
                {canRoles && (u.role === "admin" || u.role === null) && (
                  <form action={adminSetRole} className="flex gap-2">
                    <input type="hidden" name="user_id" value={u.id} /><input type="hidden" name="next" value={here} />
                    <select name="admin_role" defaultValue={u.role === "admin" ? (u.admin_role ?? "super") : "none"} className="field !w-auto !py-1.5 text-[0.9rem]" aria-label={`Admin role for ${u.name}`}>
                      {u.role === "admin" && <option value="none">remove admin</option>}
                      {ADMIN_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button className={btn("ink", "sm")}>Set role</button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pager page={page} total={total} perPage={PER} base="/admin/users" params={{ q: sp.q, role: sp.role, suspended: sp.suspended }} />
      {canRoles && <p className="mt-6 text-[0.88rem] text-ink-soft">Roles: <b>super</b> — everything; <b>verifier</b> — employer verification; <b>moderator</b> — reports, listings, reviews, suspensions; <b>analyst</b> — read-only dashboards and exports.</p>}
    </>
  );
}
