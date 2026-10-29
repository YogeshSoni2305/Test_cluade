import type { DayStat } from "@/lib/jobstats";

/** Bars for views, diamonds for applications. Accessible via a hidden data table. */
export function Sparkline({ data, labels }: { data: DayStat[]; labels: { views: string; applies: string; day: string } }) {
  const w = 280, h = 64, gap = 3;
  const bw = (w - gap * (data.length - 1)) / data.length;
  const max = Math.max(1, ...data.map((d) => d.views));
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h + 10}`} className="h-24 w-full" role="img" aria-label={`${labels.views}: ${data.reduce((a, d) => a + d.views, 0)}, ${labels.applies}: ${data.reduce((a, d) => a + d.applies, 0)}`}>
        <line x1="0" x2={w} y1={h} y2={h} stroke="#dccdb2" />
        {data.map((d, i) => {
          const bh = (d.views / max) * (h - 8);
          const x = i * (bw + gap);
          return (
            <g key={d.day}>
              <rect x={x} y={h - bh} width={bw} height={bh} fill="#3b4a78" opacity={0.55} rx="1" />
              {d.applies > 0 && <path d={`M${x + bw / 2} ${h - bh - 9} l4 4 -4 4 -4 -4Z`} fill="#b0281f" />}
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <thead><tr><th>{labels.day}</th><th>{labels.views}</th><th>{labels.applies}</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.day}><td>{d.day}</td><td>{d.views}</td><td>{d.applies}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
