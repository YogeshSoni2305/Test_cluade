import Link from "next/link";
import { adminRole, can, requireUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("admin");
  const tabs: [string, string, boolean][] = [
    ["/admin", "Overview", can(user, "view")],
    ["/admin/analytics", "Analytics", can(user, "view")],
    ["/admin/employers", "Verification", can(user, "verify")],
    ["/admin/reports", "Moderation", can(user, "moderate")],
    ["/admin/jobs", "Listings", can(user, "moderate")],
    ["/admin/users", "Users", can(user, "moderate") || can(user, "manage_users")],
    ["/admin/audit", "Audit log", can(user, "view")],
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav aria-label="Admin" className="mb-8 flex flex-wrap items-center gap-x-1 gap-y-2 border-b-2 border-ink pb-3">
        <span className="mr-3 font-deva text-xl text-sindoor-600" lang="hi">प्रबंधन</span>
        {tabs.filter(([, , ok]) => ok).map(([href, label]) => (
          <Link key={href} href={href} className="px-3 py-1.5 text-[0.98rem] font-semibold text-ink-soft hover:text-sindoor-700">{label}</Link>
        ))}
        <span className="ml-auto rounded-[2px] bg-paper-200 px-2 py-0.5 text-[0.78rem] font-semibold uppercase tracking-wider text-ink-soft">{adminRole(user)}</span>
      </nav>
      {children}
    </div>
  );
}
