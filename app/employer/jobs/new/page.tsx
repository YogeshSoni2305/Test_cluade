import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getEmployerByUser, getJob } from "@/lib/queries";
import { JobForm } from "@/components/JobForm";
import { getI18n } from "@/lib/i18n";
import { Notice, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Post a job" };

export default async function NewJob({ searchParams }: { searchParams: Promise<{ error?: string; from?: string }> }) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  if (!emp) redirect("/employer/profile");
  const sp = await searchParams;
  const { t } = await getI18n();
  const source = sp.from ? getJob(Number(sp.from)) : null;
  const copyOf = source && source.employer_id === emp!.id ? source : undefined;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader deva="नई नौकरी" title={t("cta_employer_btn")} sub={t("nj_sub")} />
      {emp!.verification_status !== "verified" && (
        <div className="mb-6"><Notice tone="warn">{t("ej_verif_none")} <a href="/employer/verification" className="font-semibold underline">{t("cs_get_verified")}</a> to build trust.</Notice></div>
      )}
      {copyOf && <div className="mb-6"><Notice tone="info">{t("nj_copied")} “{copyOf.title}”</Notice></div>}
      <JobForm employer={emp!} error={sp.error} job={copyOf} copy={Boolean(copyOf)} />
    </div>
  );
}
