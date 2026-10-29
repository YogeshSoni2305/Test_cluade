import Link from "next/link";
import { getDb } from "@/lib/db";
import { hydrateEmployer } from "@/lib/queries";
import { VERIFICATION_CHECKS } from "@/lib/constants";
import { adminSetVerification } from "@/app/actions";
import { Badge, btn, Card, Empty, Notice, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminEmployers({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const rows = getDb().prepare(`SELECT e.*, u.email, u.phone AS user_phone FROM employers e JOIN users u ON u.id=e.user_id
    ORDER BY CASE e.verification_status WHEN 'pending' THEN 0 WHEN 'unsubmitted' THEN 1 WHEN 'verified' THEN 2 ELSE 3 END, e.created_at DESC`).all() as Record<string, unknown>[];
  const employers = rows.map((r) => hydrateEmployer(r)!);
  return (
    <>
      <PageHeader title="Employer verification" sub="Complete the checks off-platform (call, ID, visit), then record exactly what you verified. Candidates see these ticks." />
      {sp.done && <div className="mb-6"><Notice tone="ok">✓ Updated.</Notice></div>}
      {sp.error && <div className="mb-6"><Notice tone="bad">{sp.error}</Notice></div>}
      <div className="space-y-4">
        {employers.length === 0 && <Empty title="No employers yet" />}
        {employers.map((e) => (
          <Card key={e.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/employers/${e.id}`} className="font-display text-lg font-semibold text-indigo-900 hover:underline">{e.business_name}</Link>
                <p className="text-sm text-ink-soft">{e.owner_name} · {e.city} · {e.contact_phone} · {e.years_in_business ?? "?"} yrs</p>
                {(e.gst_number || e.id_proof_note) && <p className="mt-1 text-xs text-ink-soft">GST: {e.gst_number ?? "—"} · ID proof offered: {e.id_proof_note ?? "—"}</p>}
              </div>
              <Badge tone={{ verified: "green", pending: "marigold", unsubmitted: "slate", rejected: "rose" }[e.verification_status]}>{e.verification_status}</Badge>
            </div>
            <form action={adminSetVerification} className="mt-4 space-y-3 border-t border-line pt-4">
              <input type="hidden" name="employer_id" value={e.id} />
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {VERIFICATION_CHECKS.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2"><input type="checkbox" name="checks" value={c.id} defaultChecked={e.verified_checks.includes(c.id)} className="h-4 w-4 accent-leaf-600" />{c.en}</label>
                ))}
              </div>
              <input name="note" className="field !py-2 text-sm" placeholder="Internal / public note (shown to employer)" defaultValue={e.verification_note ?? ""} />
              <div className="flex flex-wrap gap-2">
                <button name="decision" value="verify" className={btn("success", "sm")}>✓ Verify</button>
                <button name="decision" value="reject" className={btn("danger", "sm")}>Reject & remove listings</button>
                {e.verification_status === "verified" && <button name="decision" value="revoke" className={btn("outline", "sm")}>Revoke badge</button>}
              </div>
            </form>
          </Card>
        ))}
      </div>
    </>
  );
}
