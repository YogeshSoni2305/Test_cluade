import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireUser("admin");
  const tabs = [["/admin", "Overview"], ["/admin/employers", "Verification"], ["/admin/reports", "Reports"], ["/admin/jobs", "Listings"]];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-line pb-4">
        <span className="mr-3 rounded-full bg-rani-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">Admin</span>
        {tabs.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-full px-4 py-1.5 text-sm font-semibold text-indigo-800 hover:bg-indigo-50">{label}</Link>
        ))}
      </div>
      {children}
    </div>
  );
}
