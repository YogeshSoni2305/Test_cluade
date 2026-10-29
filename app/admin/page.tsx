import { getDb } from "@/lib/db";
import { can, requireAdmin } from "@/lib/auth";
import { pilotMetrics, METRIC_LABELS, type Metrics } from "@/lib/metrics";
import { Card, Notice, PageHeader, Stat, btn } from "@/components/ui";
import { IDownload } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

const fmt = (v: number | null, pct = false) => (v === null ? "—" : pct ? `${v}%` : Number.isInteger(v) ? v : v.toFixed(1));

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const admin = await requireAdmin("view");
  const sp = await searchParams;
  const db = getDb();
  const m = pilotMetrics();
  const top = (sql: string) => db.prepare(sql).all() as { d: string; n: number }[];
  const byDistrict = top("SELECT district d, COUNT(*) n FROM candidate_profiles WHERE district IS NOT NULL GROUP BY district ORDER BY n DESC LIMIT 8");
  const byCity = top("SELECT city d, COUNT(*) n FROM jobs WHERE status='open' GROUP BY city ORDER BY n DESC LIMIT 8");
  const byInd = top("SELECT industry d, COUNT(*) n FROM jobs WHERE status='open' GROUP BY industry ORDER BY n DESC LIMIT 8");
  const tiles: [keyof Metrics, "indigo" | "gold" | "green" | "rose", boolean][] = [
    ["qualified_candidates", "indigo", false], ["verified_employers", "green", false], ["open_vacancies", "gold", false], ["applications", "indigo", false],
    ["interview_rate_pct", "gold", true], ["hires", "green", false], ["retention_30d_pct", "green", true], ["retention_90d_pct", "green", true],
    ["listing_accuracy_pct", "rose", true], ["open_complaints", "rose", false], ["pending_verification", "rose", false], ["flagged_listings", "rose", false],
  ];
  return (
    <>
      <PageHeader
        deva="पायलट"
        title="Pilot overview"
        sub="The metrics the concept note says to track before building anything bigger."
        actions={can(admin, "export") ? (
          <div className="flex flex-wrap gap-2">
            {["metrics", "applications", "jobs", "employers", "reports"].map((k) => (
              <a key={k} href={`/admin/export/${k}`} className={btn("outline", "sm")}><IDownload size={15} />{k}.csv</a>
            ))}
          </div>
        ) : undefined}
      />
      {sp.denied && <div className="mb-6"><Notice tone="bad">Your admin role doesn’t include that section.</Notice></div>}
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {tiles.map(([k, tone, pct]) => <Stat key={k} value={fmt(m[k] as number | null, pct)} label={METRIC_LABELS[k]} tone={tone} />)}
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {([["Candidates by district", byDistrict], ["Open jobs by city", byCity], ["Open jobs by industry", byInd]] as const).map(([title, rows]) => (
          <Card key={title} className="p-5">
            <h3 className="font-display text-[1.4rem] font-semibold text-ink">{title}</h3>
            <ul className="mt-3 space-y-2 text-[0.95rem]">
              {rows.map((r) => (
                <li key={r.d} className="flex items-center justify-between gap-3"><span className="truncate capitalize">{r.d.replace("_", " ")}</span><b className="num text-sindoor-700">{r.n}</b></li>
              ))}
              {rows.length === 0 && <li className="text-ink-soft">No data yet</li>}
            </ul>
          </Card>
        ))}
      </div>
      <p className="mt-8 text-[0.9rem] text-ink-soft">
        Candidate satisfaction {fmt(m.candidate_satisfaction)} / 5 · employer satisfaction {fmt(m.employer_satisfaction)} / 5 · {m.invitations_sent} invitations, {m.hires_via_invite} hires via invitation · {m.experience_letters} experience letters.
      </p>
    </>
  );
}
