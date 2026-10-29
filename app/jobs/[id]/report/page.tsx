import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { getI18n, bi } from "@/lib/i18n";
import { REPORT_TYPES } from "@/lib/constants";
import { submitReport } from "@/app/actions";
import { btn, Card, Chips, Field, Notice } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Report a problem" };

export default async function ReportPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const job = getJob(Number((await params).id));
  if (!job) notFound();
  const sp = await searchParams;
  const user = await getCurrentUser();
  const { lang } = await getI18n();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href={`/jobs/${job.id}`} className="text-sm font-semibold text-indigo-700 hover:underline">← {job.title}</Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-indigo-900">Report a problem</h1>
      <p className="mt-2 text-ink-soft">About <strong>{job.business_name}</strong> — {job.title}. Our team reviews every report. Your name is not shared with the employer.</p>

      {sp.sent ? (
        <div className="mt-8 space-y-4">
          <Notice tone="ok">✓ Thank you. Your report was received and moderators will look into it. If you are in immediate danger, call 112.</Notice>
          <Link href="/jobs" className={btn("primary")}>Back to jobs</Link>
        </div>
      ) : !user ? (
        <div className="mt-8"><Notice tone="info">Please <Link href="/sign-in" className="font-semibold underline">sign in</Link> to submit a report so we can follow up with you.</Notice></div>
      ) : (
        <Card className="mt-8 p-6">
          {sp.error && <div className="mb-4"><Notice tone="bad">{sp.error}</Notice></div>}
          <form action={submitReport} className="space-y-6">
            <input type="hidden" name="job_id" value={job.id} />
            <div>
              <p className="mb-2 text-sm font-semibold">What is the problem?</p>
              <Chips type="radio" name="type" selected={["misleading"]} options={REPORT_TYPES.map((r) => ({ value: r.id, label: bi(r, lang) }))} />
            </div>
            <Field label="What happened?" required hint="Include dates, amounts and names if you can. Don't include other people's private details.">
              <textarea name="details" className="field" required minLength={10} />
            </Field>
            <button className={btn("danger", "lg")}>Submit report</button>
          </form>
        </Card>
      )}
    </div>
  );
}
