import { getDb } from "@/lib/db";
import { Card, PageHeader, Stat } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default function AdminHome() {
  const db = getDb();
  const n = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  const apps = n("SELECT COUNT(*) n FROM applications");
  const interviews = n("SELECT COUNT(*) n FROM applications WHERE status IN ('interview','selected','joined')");
  const hires = n("SELECT COUNT(*) n FROM applications WHERE status IN ('selected','joined')");
  const retained = n("SELECT COUNT(*) n FROM feedback WHERE still_working=1 AND checkpoint IN ('30d','90d')");
  const retentionBase = n("SELECT COUNT(*) n FROM feedback WHERE still_working IS NOT NULL AND checkpoint IN ('30d','90d')");
  const termsOk = n("SELECT COUNT(*) n FROM feedback WHERE terms_matched=1");
  const termsAll = n("SELECT COUNT(*) n FROM feedback WHERE terms_matched IS NOT NULL");
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
  const byDistrict = db.prepare("SELECT district d, COUNT(*) n FROM candidate_profiles WHERE district IS NOT NULL GROUP BY district ORDER BY n DESC LIMIT 6").all() as { d: string; n: number }[];
  const byCity = db.prepare("SELECT city d, COUNT(*) n FROM jobs WHERE status='open' GROUP BY city ORDER BY n DESC LIMIT 6").all() as { d: string; n: number }[];
  const byInd = db.prepare("SELECT industry d, COUNT(*) n FROM jobs WHERE status='open' GROUP BY industry ORDER BY n DESC LIMIT 6").all() as { d: string; n: number }[];

  return (
    <>
      <PageHeader deva="पायलट" title="Pilot overview" sub="The metrics the concept note says to track before building anything bigger." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat value={n("SELECT COUNT(*) n FROM candidate_profiles WHERE completed=1")} label="Qualified candidates" />
        <Stat value={n("SELECT COUNT(*) n FROM employers WHERE verification_status='verified'")} label="Verified employers" tone="green" />
        <Stat value={n("SELECT COUNT(*) n FROM jobs WHERE status='open'")} label="Open vacancies" tone="gold" />
        <Stat value={apps} label="Applications" />
        <Stat value={pct(interviews, apps)} label="Interview rate" tone="gold" />
        <Stat value={hires} label="Selected / hired" tone="green" />
        <Stat value={pct(retained, retentionBase)} label="Retention (30/90d check-ins)" tone="green" />
        <Stat value={pct(termsOk, termsAll)} label="Listings matched reality" tone="rose" />
        <Stat value={n("SELECT COUNT(*) n FROM employers WHERE verification_status='pending'")} label="Awaiting verification" tone="rose" />
        <Stat value={n("SELECT COUNT(*) n FROM reports WHERE status IN ('open','investigating')")} label="Open complaints" tone="rose" />
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {([["Candidates by district", byDistrict], ["Open jobs by city", byCity], ["Open jobs by industry", byInd]] as const).map(([title, rows]) => (
          <Card key={title} className="p-5">
            <h3 className="font-display text-[1.4rem] font-semibold text-ink">{title}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {rows.map((r) => (
                <li key={r.d} className="flex items-center justify-between gap-3"><span className="truncate capitalize">{r.d.replace("_", " ")}</span><b className="tabular-nums text-sindoor-700">{r.n}</b></li>
              ))}
              {rows.length === 0 && <li className="text-ink-soft">No data yet</li>}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
