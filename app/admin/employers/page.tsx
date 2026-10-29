import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { hydrateEmployer } from "@/lib/queries";
import { VERIFICATION_CHECKS } from "@/lib/constants";
import { adminSetVerification } from "@/app/actions";
import { Badge, btn, Card, Empty, Notice, PageHeader } from "@/components/ui";
import { Pager } from "@/components/Pager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verification", robots: { index: false } };

const PER = 20;

export default async function AdminEmployers({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin("verify");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: string[] = [];
  const args: unknown[] = [];
  if (sp.q) { where.push("(e.business_name LIKE ? OR e.owner_name LIKE ? OR e.contact_phone LIKE ? OR e.gst_norm LIKE ?)"); const l = `%${sp.q}%`; args.push(l, l, l, l); }
  if (sp.status) { where.push("e.verification_status = ?"); args.push(sp.status); }
  if (sp.flagged) where.push("e.flagged_reason IS NOT NULL");
  const W = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const db = getDb();
  const total = (db.prepare(`SELECT COUNT(*) n FROM employers e ${W}`).get(...args) as { n: number }).n;
  const rows = db.prepare(`SELECT e.* FROM employers e ${W}
    ORDER BY CASE e.verification_status WHEN 'pending' THEN 0 WHEN 'unsubmitted' THEN 1 WHEN 'verified' THEN 2 ELSE 3 END, e.created_at DESC
    LIMIT ? OFFSET ?`).all(...args, PER, (page - 1) * PER) as Record<string, unknown>[];
  const employers = rows.map((r) => hydrateEmployer(r)!);
  const here = `/admin/employers?${new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && !["done", "error"].includes(k)) as [string, string][])}`;
  return (
    <>
      <PageHeader deva="सत्यापन" title="Employer verification" sub="Complete the checks off-platform (call, ID, visit), then record exactly what you verified. Candidates see these ticks." />
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <label className="min-w-56 flex-1 text-[0.85rem] font-semibold">Search<input name="q" defaultValue={sp.q} className="field mt-1 !py-2" placeholder="Business, owner, phone or GST" /></label>
        <label className="text-[0.85rem] font-semibold">Status
          <select name="status" defaultValue={sp.status ?? ""} className="field mt-1 !w-auto !py-2">
            <option value="">All</option>{["pending", "unsubmitted", "verified", "rejected"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-[0.92rem]"><input type="checkbox" name="flagged" value="1" defaultChecked={!!sp.flagged} className="h-4 w-4 accent-sindoor-600" />Flagged only</label>
        <button className={btn("ink", "md")}>Filter</button>
      </form>
      <div className="mb-4 space-y-3">
        {sp.done && <Notice tone="ok">Updated.</Notice>}
        {sp.error && <Notice tone="bad">{sp.error}</Notice>}
      </div>
      <div className="space-y-4">
        {employers.length === 0 && <Empty title="No employers match" />}
        {employers.map((e) => (
          <Card key={e.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/employers/${e.id}`} className="font-display text-[1.4rem] font-semibold text-ink hover:underline">{e.business_name}</Link>
                <p className="text-[0.92rem] text-ink-soft">{e.owner_name} · {e.city} · <span className="num">{e.contact_phone}</span> · {e.years_in_business ?? "?"} yrs</p>
                {(e.gst_number || e.id_proof_note) && <p className="mt-1 text-[0.82rem] text-ink-soft">GST: <span className="num">{e.gst_number ?? "—"}</span> · ID proof offered: {e.id_proof_note ?? "—"}</p>}
                {e.flagged_reason && <p className="mt-1 text-[0.85rem] font-semibold text-haldi-700">Flag: {e.flagged_reason}</p>}
              </div>
              <Badge tone={{ verified: "green", pending: "marigold", unsubmitted: "slate", rejected: "rose" }[e.verification_status]}>{e.verification_status}</Badge>
            </div>
            <form action={adminSetVerification} className="mt-4 space-y-3 border-t border-line pt-4">
              <input type="hidden" name="employer_id" value={e.id} />
              <input type="hidden" name="next" value={here} />
              <fieldset className="flex flex-wrap gap-x-5 gap-y-2 text-[0.92rem]">
                <legend className="sr-only">Completed checks</legend>
                {VERIFICATION_CHECKS.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2"><input type="checkbox" name="checks" value={c.id} defaultChecked={e.verified_checks.includes(c.id)} className="h-4 w-4 accent-peacock-600" />{c.en}</label>
                ))}
              </fieldset>
              <label className="block text-[0.85rem] font-semibold">Note (shown to the employer)
                <input name="note" className="field mt-1 !py-2 text-[0.95rem]" defaultValue={e.verification_note ?? ""} />
              </label>
              <div className="flex flex-wrap gap-2">
                <button name="decision" value="verify" className={btn("success", "sm")}>Verify</button>
                <button name="decision" value="reject" className={btn("danger", "sm")}>Reject & remove listings</button>
                {e.verification_status === "verified" && <button name="decision" value="revoke" className={btn("outline", "sm")}>Revoke stamp</button>}
                {e.flagged_reason && <button name="decision" value="clear_flag" className={btn("ghost", "sm")}>Clear flag</button>}
                <Link href={`/admin/audit?entity=employer&entity_id=${e.id}`} className={btn("ghost", "sm")}>History</Link>
              </div>
            </form>
          </Card>
        ))}
      </div>
      <Pager page={page} total={total} perPage={PER} base="/admin/employers" params={{ q: sp.q, status: sp.status, flagged: sp.flagged }} />
    </>
  );
}
