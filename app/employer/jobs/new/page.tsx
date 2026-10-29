import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getEmployerByUser } from "@/lib/queries";
import { JobForm } from "@/components/JobForm";
import { Notice, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Post a job" };

export default async function NewJob({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  if (!emp) redirect("/employer/profile");
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader title="Post a job" sub="Clear, honest listings get more — and better — applicants." />
      {emp!.verification_status !== "verified" && (
        <div className="mb-6"><Notice tone="warn">Your business isn’t verified yet, so your listing will show “Not yet verified”. <a href="/employer/verification" className="font-semibold underline">Get verified</a> to build trust.</Notice></div>
      )}
      <JobForm employer={emp!} error={sp.error} />
    </div>
  );
}
