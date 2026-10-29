import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { analyticsReport } from "@/lib/funnel";
import { Card, PageHeader, cx } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics", robots: { index: false } };

const GOOD: Record<string, number> = { LCP: 2500, INP: 200, CLS: 0.1, TTFB: 800 };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdmin("view");
  const sp = await searchParams;
  const days = [7, 30, 90].includes(Number(sp.days)) ? Number(sp.days) : 30;
  const r = analyticsReport(days);
  const top = r.funnel[0].count || 1;
  const maxDaily = Math.max(1, ...r.daily.map((d) => d.n));
  const List = ({ title, rows }: { title: string; rows: { k: string | null; n: number }[] }) => (
    <Card className="p-5">
      <h3 className="font-display text-[1.3rem] font-semibold text-ink">{title}</h3>
      <ul className="mt-3 space-y-1.5 text-[0.93rem]">
        {rows.length === 0 && <li className="text-ink-soft">No data yet</li>}
        {rows.map((x) => <li key={x.k ?? "null"} className="flex justify-between gap-3"><span className="truncate">{x.k ?? "—"}</span><b className="num text-sindoor-700">{x.n}</b></li>)}
      </ul>
    </Card>
  );
  return (
    <>
      <PageHeader
        deva="आँकड़े"
        title="Product analytics"
        sub="First-party and cookie-less. No IP addresses, phone numbers or free text are stored, and visitors with Do Not Track / Global Privacy Control are not counted."
        actions={<div className="flex gap-1">{[7, 30, 90].map((d) => <Link key={d} href={`/admin/analytics?days=${d}`} className={cx("rounded-[3px] px-3 py-1.5 text-[0.9rem] font-semibold", d === days ? "bg-ink text-paper-50" : "text-ink-soft hover:bg-paper-200")}>{d} days</Link>)}</div>}
      />
      <section aria-labelledby="funnel-h">
        <h2 id="funnel-h" className="font-display text-[1.6rem] font-semibold text-ink">Hiring funnel</h2>
        <ol className="mt-4 space-y-2">
          {r.funnel.map((s, i) => {
            const prev = i ? r.funnel[i - 1].count : null;
            return (
              <li key={s.step} className="grid grid-cols-[10rem_1fr_7rem] items-center gap-3 text-[0.95rem]">
                <span className="font-semibold text-ink">{s.step}</span>
                <span className="h-6 bg-paper-200"><span className="block h-full bg-sindoor-600/80" style={{ width: `${Math.max(1, (s.count / top) * 100)}%` }} /></span>
                <span className="num text-right text-ink-soft"><b className="text-ink">{s.count}</b>{prev ? ` · ${Math.round((s.count / prev) * 100)}%` : ""}</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-[0.82rem] text-ink-faint">First three steps count unique browser sessions; the rest count applications created in the period.</p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-[1.6rem] font-semibold text-ink">Daily visitors</h2>
        <div className="mt-4 flex h-28 items-end gap-1" role="img" aria-label={`Daily visitors over ${days} days`}>
          {r.daily.length === 0 && <p className="text-ink-soft">No data yet</p>}
          {r.daily.map((d) => <span key={d.k} title={`${d.k}: ${d.n}`} className="flex-1 bg-neel-500/60" style={{ height: `${(d.n / maxDaily) * 100}%` }} />)}
        </div>
      </section>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <List title="Top pages" rows={r.topPages} />
        <List title="Traffic sources" rows={r.referrers} />
        <List title="Sign-ups by role" rows={r.signups} />
        <List title="Searched industries" rows={r.searchIndustry} />
        <List title="Searched cities" rows={r.searchCity} />
        <List title="Feature use" rows={r.features} />
      </div>

      <section className="mt-12">
        <h2 className="font-display text-[1.6rem] font-semibold text-ink">Real-user performance (p75)</h2>
        <dl className="mt-4 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {r.vitals.map((v) => (
            <div key={v.metric} className="border-t-2 border-ink pt-3">
              <dt className="text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">{v.metric} · {v.samples} samples</dt>
              <dd className={cx("num font-display text-[2.2rem] font-semibold", v.p75 === null ? "text-ink-faint" : v.p75 <= GOOD[v.metric] ? "text-peacock-600" : "text-sindoor-700")}>
                {v.p75 === null ? "—" : v.metric === "CLS" ? v.p75.toFixed(3) : `${Math.round(v.p75)} ms`}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
