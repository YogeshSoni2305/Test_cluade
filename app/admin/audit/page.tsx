import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { btn, Empty, PageHeader } from "@/components/ui";
import { Pager } from "@/components/Pager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit log", robots: { index: false } };

const PER = 50;
type A = { id: number; actor_id: number | null; actor_name: string | null; action: string; entity: string; entity_id: number | null; details: string; created_at: string };

const entityHref = (e: string, id: number | null) =>
  id == null ? null : e === "job" ? `/jobs/${id}` : e === "employer" ? `/employers/${id}` : e === "user" ? `/admin/users?q=%23${id}` : null;

export default async function AuditLog({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin("view");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: string[] = [];
  const args: unknown[] = [];
  if (sp.action) { where.push("action LIKE ?"); args.push(`${sp.action}%`); }
  if (sp.entity) { where.push("entity = ?"); args.push(sp.entity); }
  if (sp.entity_id) { where.push("entity_id = ?"); args.push(Number(sp.entity_id)); }
  if (sp.actor) { where.push("actor_id = ?"); args.push(Number(sp.actor)); }
  const W = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const db = getDb();
  const total = (db.prepare(`SELECT COUNT(*) n FROM audit_log ${W}`).get(...args) as { n: number }).n;
  const rows = db.prepare(`SELECT * FROM audit_log ${W} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args, PER, (page - 1) * PER) as A[];
  const entities = (db.prepare("SELECT DISTINCT entity FROM audit_log ORDER BY entity").all() as { entity: string }[]).map((r) => r.entity);
  return (
    <>
      <PageHeader deva="बही" title="Audit log" sub="An append-only record of who changed what — verification, moderation, listings, letters, exports and account deletions." />
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <label className="text-[0.85rem] font-semibold">Action starts with<input name="action" defaultValue={sp.action} className="field mt-1 !w-48 !py-2" placeholder="e.g. job." /></label>
        <label className="text-[0.85rem] font-semibold">Entity
          <select name="entity" defaultValue={sp.entity ?? ""} className="field mt-1 !w-auto !py-2"><option value="">All</option>{entities.map((e) => <option key={e}>{e}</option>)}</select>
        </label>
        <label className="text-[0.85rem] font-semibold">Entity id<input name="entity_id" defaultValue={sp.entity_id} className="field mt-1 !w-28 !py-2" inputMode="numeric" /></label>
        <label className="text-[0.85rem] font-semibold">Actor id<input name="actor" defaultValue={sp.actor} className="field mt-1 !w-28 !py-2" inputMode="numeric" /></label>
        <button className={btn("ink", "md")}>Filter</button>
        <Link href="/admin/audit" className={btn("ghost", "md")}>Clear</Link>
      </form>
      {rows.length === 0 ? <Empty title="No entries" /> : (
        <div className="overflow-x-auto rounded-[3px] border border-line">
          <table className="w-full min-w-[44rem] text-left text-[0.92rem]">
            <caption className="sr-only">Audit entries</caption>
            <thead className="bg-paper-200/60 text-[0.78rem] uppercase tracking-[0.12em] text-ink-soft">
              <tr><th scope="col" className="px-3 py-2">When (UTC)</th><th scope="col" className="px-3 py-2">Who</th><th scope="col" className="px-3 py-2">Action</th><th scope="col" className="px-3 py-2">On</th><th scope="col" className="px-3 py-2">Details</th></tr>
            </thead>
            <tbody className="divide-y divide-line bg-paper-50">
              {rows.map((r) => {
                const href = entityHref(r.entity, r.entity_id);
                return (
                  <tr key={r.id} className="align-top">
                    <td className="num whitespace-nowrap px-3 py-2 text-ink-soft">{r.created_at}</td>
                    <td className="px-3 py-2">{r.actor_name ?? "system"}{r.actor_id ? <span className="text-ink-faint"> #{r.actor_id}</span> : null}</td>
                    <td className="px-3 py-2 font-semibold">{r.action}</td>
                    <td className="px-3 py-2">{href ? <Link href={href} className="text-sindoor-700 hover:underline">{r.entity} #{r.entity_id}</Link> : `${r.entity}${r.entity_id ? ` #${r.entity_id}` : ""}`}</td>
                    <td className="max-w-xs break-words px-3 py-2 font-mono text-[0.8rem] text-ink-soft">{r.details === "{}" ? "" : r.details}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} total={total} perPage={PER} base="/admin/audit" params={{ action: sp.action, entity: sp.entity, entity_id: sp.entity_id, actor: sp.actor }} />
    </>
  );
}
