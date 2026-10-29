import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { submitFeedback } from "@/app/actions";
import { btn, Card, Chips, Field, Notice, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Share feedback" };

export default async function FeedbackPage({ params, searchParams }: { params: Promise<{ applicationId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const id = Number((await params).applicationId);
  const sp = await searchParams;
  const row = getDb().prepare(`
    SELECT a.id, a.candidate_id, a.status, j.title, e.business_name, e.user_id AS employer_user, u.name AS candidate_name
    FROM applications a JOIN jobs j ON j.id=a.job_id JOIN employers e ON e.id=j.employer_id JOIN users u ON u.id=a.candidate_id WHERE a.id=?`).get(id) as
    | { id: number; candidate_id: number; status: string; title: string; business_name: string; employer_user: number; candidate_name: string } | undefined;
  if (!row) notFound();
  const role = row.candidate_id === user.id ? "candidate" : row.employer_user === user.id ? "employer" : null;
  if (!role) redirect("/");
  const back = role === "candidate" ? "/candidate" : "/employer";
  const existing = getDb().prepare("SELECT * FROM feedback WHERE application_id=? AND from_role=?").get(id, role) as { rating: number; comment: string } | undefined;
  const subject = role === "candidate" ? row.business_name : row.candidate_name;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href={back} className="text-sm font-semibold text-indigo-700 hover:underline">← Back</Link>
      <PageHeader title="How is it going?" sub={`${row.title} · ${role === "candidate" ? row.business_name : row.candidate_name}`} />
      {sp.thanks && <div className="mb-6"><Notice tone="ok">✓ Thank you — your feedback helps keep listings honest.</Notice></div>}
      {sp.error && <div className="mb-6"><Notice tone="bad">{sp.error}</Notice></div>}
      <Card className="p-6">
        <form action={submitFeedback} className="space-y-6">
          <input type="hidden" name="application_id" value={id} />
          <div>
            <p className="mb-2 text-sm font-semibold">Overall rating for {subject}</p>
            <Chips type="radio" name="rating" selected={existing ? [String(existing.rating)] : []} options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${"★".repeat(n)}` }))} />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">{role === "candidate" ? "Do the pay, hours and stay match the listing?" : "Did the candidate match what they described?"}</p>
            <Chips type="radio" name="terms_matched" options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Are they still working there?</p>
            <Chips type="radio" name="still_working" options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Check-in</p>
            <Chips type="radio" name="checkpoint" selected={["joined"]} options={[{ value: "joined", label: "Just joined" }, { value: "30d", label: "After 30 days" }, { value: "90d", label: "After 90 days" }]} />
          </div>
          <Field label="Comments (optional)" hint="Be factual and respectful. Reviews are moderated.">
            <textarea name="comment" className="field" defaultValue={existing?.comment} />
          </Field>
          {role === "candidate" && <p className="text-xs text-ink-soft">If you have a serious problem (unpaid wages, harassment), please use “Report this listing” on the job page so our team can act.</p>}
          <button className={btn("gold", "lg")}>Submit feedback</button>
        </form>
      </Card>
    </div>
  );
}
