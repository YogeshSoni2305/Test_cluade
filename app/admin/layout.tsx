import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireUser("admin");
  const tabs = [["/admin", "Overview"], ["/admin/employers", "Verification"], ["/admin/reports", "Reports"], ["/admin/jobs", "Listings"]];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center gap-2 border-b-2 border-ink pb-3">
        <span className="mr-3 font-deva text-xl text-sindoor-600">प्रबंधन</span>
        {tabs.map(([href, label]) => (
          <Link key={href} href={href} className="px-3 py-1.5 text-[0.98rem] font-semibold text-ink-soft hover:text-sindoor-700">{label}</Link>
        ))}
      </div>
      {children}
    </div>
  );
}
