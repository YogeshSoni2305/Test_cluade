import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEmployerByUser } from "@/lib/queries";
import { getI18n, bi } from "@/lib/i18n";
import { VERIFICATION_CHECKS } from "@/lib/constants";
import { submitVerification } from "@/app/actions";
import { btn, Card, Field, Notice, PageHeader, ShieldIcon, cx } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Get verified" };

export default async function Verification({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("employer");
  const sp = await searchParams;
  const { lang } = await getI18n();
  const e = getEmployerByUser(user.id);
  if (!e) redirect("/employer/profile");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader title="Get your business verified" sub="A Verified badge tells candidates and their families you’re real. It’s free and our team reviews within 2 working days." />
      {sp.welcome && <div className="mb-6"><Notice tone="ok">✓ Profile created. Next, submit verification so your listings show the green badge.</Notice></div>}
      {sp.submitted && <div className="mb-6"><Notice tone="ok">✓ Submitted. We’ll call your business number and update the status here.</Notice></div>}
      {sp.error && <div className="mb-6"><Notice tone="bad">{sp.error}</Notice></div>}

      <Card className={cx("mb-6 p-6", e!.verification_status === "verified" && "border-leaf-500")}>
        <div className="flex items-center gap-3">
          <span className={cx("flex h-11 w-11 items-center justify-center rounded-full", e!.verification_status === "verified" ? "bg-leaf-100 text-leaf-600" : "bg-cream-200 text-ink-soft")}><ShieldIcon className="h-6 w-6" /></span>
          <div>
            <p className="font-display text-xl font-semibold text-indigo-900">
              {{ unsubmitted: "Not submitted", pending: "Under review", verified: "Verified", rejected: "Could not be verified" }[e!.verification_status]}
            </p>
            {e!.verification_note && <p className="text-sm text-ink-soft">Note from our team: {e!.verification_note}</p>}
          </div>
        </div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {VERIFICATION_CHECKS.map((c) => {
            const ok = e!.verified_checks.includes(c.id) && e!.verification_status === "verified";
            return <li key={c.id} className={cx("flex gap-2 rounded-xl px-3 py-2 text-sm", ok ? "bg-leaf-50 text-leaf-700" : "bg-cream-100 text-ink-soft")}><b>{ok ? "✓" : "○"}</b>{bi(c, lang)}</li>;
          })}
        </ul>
      </Card>

      {e!.verification_status !== "verified" && (
        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold text-indigo-900">{e!.verification_status === "pending" ? "Update your submission" : "Submit for verification"}</h2>
          <form action={submitVerification} className="mt-5 space-y-4">
            <Field label="GST number (if you have one)"><input name="gst_number" className="field" defaultValue={e!.gst_number ?? ""} /></Field>
            <Field label="Which ID proof will you share?" required hint="Aadhaar or PAN of the owner. Never type the full number here — our team will ask you to send it securely on a call."><input name="id_proof_note" className="field" required defaultValue={e!.id_proof_note ?? ""} placeholder="e.g. Aadhaar + shop licence" /></Field>
            <button className={btn("primary", "lg")}>Submit for review</button>
          </form>
        </Card>
      )}
    </div>
  );
}
