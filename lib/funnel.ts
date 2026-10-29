import { getDb } from "./db";

export type Funnel = { step: string; count: number }[];

/** Product analytics over the last `days` days, from first-party events only. */
export function analyticsReport(days: number) {
  const db = getDb();
  const since = `-${days} days`;
  const sessions = (name: string) =>
    (db.prepare("SELECT COUNT(DISTINCT session) n FROM events WHERE name=? AND ts >= datetime('now', ?) AND session IS NOT NULL").get(name, since) as { n: number }).n;
  const count = (name: string) => (db.prepare("SELECT COUNT(*) n FROM events WHERE name=? AND ts >= datetime('now', ?)").get(name, since) as { n: number }).n;
  const apps = (db.prepare("SELECT COUNT(*) n FROM applications WHERE created_at >= datetime('now', ?)").get(since) as { n: number }).n;
  const interviews = (db.prepare("SELECT COUNT(*) n FROM applications WHERE created_at >= datetime('now', ?) AND status IN ('interview','selected','joined')").get(since) as { n: number }).n;
  const hires = (db.prepare("SELECT COUNT(*) n FROM applications WHERE created_at >= datetime('now', ?) AND status IN ('selected','joined')").get(since) as { n: number }).n;

  const funnel: Funnel = [
    { step: "Visited", count: sessions("page_view") },
    { step: "Viewed a job", count: sessions("job_view") },
    { step: "Clicked apply", count: sessions("apply_click") },
    { step: "Applied", count: apps },
    { step: "Interviewed", count: interviews },
    { step: "Selected / joined", count: hires },
  ];

  const top = (sql: string, ...a: unknown[]) => db.prepare(sql).all(...a) as { k: string | null; n: number }[];
  return {
    funnel,
    daily: top("SELECT date(ts) k, COUNT(DISTINCT session) n FROM events WHERE name='page_view' AND ts >= datetime('now', ?) GROUP BY 1 ORDER BY 1", since),
    topPages: top("SELECT path k, COUNT(*) n FROM events WHERE name='page_view' AND ts >= datetime('now', ?) GROUP BY 1 ORDER BY n DESC LIMIT 10", since),
    searchIndustry: top("SELECT json_extract(props,'$.industry') k, COUNT(*) n FROM events WHERE name='search' AND ts >= datetime('now', ?) AND k IS NOT NULL GROUP BY 1 ORDER BY n DESC LIMIT 8", since),
    searchCity: top("SELECT json_extract(props,'$.city') k, COUNT(*) n FROM events WHERE name='search' AND ts >= datetime('now', ?) AND k IS NOT NULL GROUP BY 1 ORDER BY n DESC LIMIT 8", since),
    referrers: top("SELECT COALESCE(utm_source, referrer, '(direct)') k, COUNT(DISTINCT session) n FROM events WHERE name='page_view' AND ts >= datetime('now', ?) GROUP BY 1 ORDER BY n DESC LIMIT 8", since),
    signups: top("SELECT json_extract(props,'$.role') k, COUNT(*) n FROM events WHERE name='signup' AND ts >= datetime('now', ?) GROUP BY 1", since),
    features: [
      { k: "Shared with family", n: count("share_family") },
      { k: "Job alerts created", n: count("alert_created") },
      { k: "Listened (text-to-speech)", n: count("listen_used") },
      { k: "Voice typing used", n: count("voice_used") },
      { k: "Saved for offline", n: count("offline_saved") },
      { k: "Messages sent", n: count("message_sent") },
      { k: "Invitations sent", n: count("invite_sent") },
    ],
    vitals: (["LCP", "INP", "CLS", "TTFB"] as const).map((m) => {
      const vals = (db.prepare("SELECT CAST(json_extract(props,'$.value') AS REAL) v FROM events WHERE name='web_vital' AND json_extract(props,'$.metric')=? AND ts >= datetime('now', ?) ORDER BY v").all(m, since) as { v: number }[]).map((r) => r.v);
      const p75 = vals.length ? vals[Math.min(vals.length - 1, Math.floor(vals.length * 0.75))] : null;
      return { metric: m, p75: p75 === null ? null : m === "CLS" ? p75 / 1000 : p75, samples: vals.length };
    }),
  };
}
