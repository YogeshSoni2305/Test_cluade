import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getEmployerByUser, getJob } from "@/lib/queries";
import { JobForm } from "@/components/JobForm";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditJob({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  if (!emp) redirect("/employer/profile");
  const job = getJob(Number((await params).id));
  if (!job || job.employer_id !== emp!.id) notFound();
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader title="Edit listing" sub={job.title} />
      <JobForm employer={emp!} job={job} error={sp.error} />
    </div>
  );
}
