import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEmployerByUser } from "@/lib/queries";
import { getI18n, bi } from "@/lib/i18n";
import { VERIFICATION_CHECKS } from "@/lib/constants";
import { submitVerification } from "@/app/actions";
import { Stamp } from "@/components/ornaments";
import { ICheck } from "@/components/icons";
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
      <PageHeader deva="सत्यापन" title="Get your business verified" sub="A Verified badge tells candidates and their families you’re real. It’s free and our team reviews within 2 working days." />
      {sp.welcome && <div className="mb-6"><Notice tone="ok">Profile created. Next, submit verification so your listings carry the verification stamp.</Notice></div>}
      {sp.submitted && <div className="mb-6"><Notice tone="ok">Submitted. We’ll call your business number and update the status here.</Notice></div>}
      {sp.error && <div className="mb-6"><Notice tone="bad">{sp.error}</Notice></div>}

      <Card className={cx("mb-6 p-6", e!.verification_status === "verified" && "border-peacock-500")}>
        <div className="flex items-center gap-4">
          {e!.verification_status === "verified" ? <Stamp size={84} className="-rotate-12" /> : <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-ink-faint text-ink-faint"><ShieldIcon className="h-7 w-7" /></span>}
          <div>
            <p className="font-display text-[1.6rem] font-semibold text-ink">
              {{ unsubmitted: "Not submitted", pending: "Under review", verified: "Verified", rejected: "Could not be verified" }[e!.verification_status]}
            </p>
            {e!.verification_note && <p className="text-sm text-ink-soft">Note from our team: {e!.verification_note}</p>}
          </div>
        </div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {VERIFICATION_CHECKS.map((c) => {
            const ok = e!.verified_checks.includes(c.id) && e!.verification_status === "verified";
            return <li key={c.id} className={cx("flex items-start gap-2 text-[0.96rem]", ok ? "text-ink" : "text-ink-faint")}>{ok ? <ICheck size={18} className="mt-0.5 shrink-0 text-peacock-500" /> : <span className="mt-2.5 h-px w-3.5 shrink-0 bg-ink-faint" />}{bi(c, lang)}</li>;
          })}
        </ul>
      </Card>

      {e!.verification_status !== "verified" && (
        <Card className="p-6">
          <h2 className="font-display text-[1.6rem] font-semibold text-ink">{e!.verification_status === "pending" ? "Update your submission" : "Submit for verification"}</h2>
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
