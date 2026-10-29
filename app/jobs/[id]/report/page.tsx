import Link from "next/link";
import { HumanCheck } from "@/components/HumanCheck";
import { notFound } from "next/navigation";
import { getJob } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { getI18n, bi } from "@/lib/i18n";
import { REPORT_TYPES } from "@/lib/constants";
import { submitReport } from "@/app/actions";
import { btn, Card, Chips, Field, FieldGroup, Notice, PageHeader } from "@/components/ui";
import { IArrowLeft } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Report a problem", robots: { index: false } };

export default async function ReportPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const job = getJob(Number((await params).id));
  if (!job) notFound();
  const sp = await searchParams;
  const user = await getCurrentUser();
  const { t, lang } = await getI18n();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href={`/jobs/${job.id}`} className="mb-6 inline-flex items-center gap-1.5 text-[0.95rem] font-semibold text-ink-soft hover:text-sindoor-700"><IArrowLeft size={16} />{job.title}</Link>
      <PageHeader deva="शिकायत" title={t("rp_title")} sub={`${job.business_name} — ${job.title}. ${t("rp_sub")}`} />

      {sp.sent ? (
        <div className="mt-8 space-y-4">
          <Notice tone="ok">{t("rp_sent")}</Notice>
          <Link href="/jobs" className={btn("primary")}>{t("nav_jobs")}</Link>
        </div>
      ) : !user ? (
        <div className="mt-8"><Notice tone="info">{t("rp_signin")} <Link href="/sign-in" className="font-semibold underline">{t("nav_signin")}</Link></Notice></div>
      ) : (
        <Card className="p-6">
          {sp.error && <div className="mb-4"><Notice tone="bad">{sp.error}</Notice></div>}
          <form action={submitReport} className="space-y-6">
            <HumanCheck />
            <input type="hidden" name="job_id" value={job.id} />
            <FieldGroup label={t("rp_what")}>
              <Chips type="radio" name="type" selected={["misleading"]} options={REPORT_TYPES.map((r) => ({ value: r.id, label: bi(r, lang) }))} />
            </FieldGroup>
            <Field label={t("rp_details")} required hint={t("rp_details_hint")}>
              <textarea name="details" className="field" required minLength={10} maxLength={4000} />
            </Field>
            <p className="text-[0.88rem] text-ink-soft">{t("rp_emergency")}</p>
            <button className={btn("danger", "lg")}>{t("rp_submit")}</button>
          </form>
        </Card>
      )}
    </div>
  );
}
