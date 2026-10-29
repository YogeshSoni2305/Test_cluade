import { getDb } from "./db";
import { kvGet, kvSet } from "./kv";
import { notify } from "./notify";
import { pruneRateLimits } from "./ratelimit";

const sqlTime = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");

export type HousekeepingReport = { reminded: number; expired: number; checkins: number };

/**
 * Periodic upkeep. Safe to run often — every step is idempotent.
 *  • remind employers 3 days before a listing expires, and tell them when it has expired
 *  • ask both sides for 30- and 90-day feedback after someone joins (retention tracking)
 *  • prune old rate-limit counters
 */
export function runHousekeeping(now = new Date()): HousekeepingReport {
  const db = getDb();
  const report: HousekeepingReport = { reminded: 0, expired: 0, checkins: 0 };
  const nowS = sqlTime(now);
  const soon = sqlTime(new Date(now.getTime() + 3 * 86400_000));

  const expiring = db.prepare(`SELECT j.id, j.title, j.expires_at, e.user_id FROM jobs j JOIN employers e ON e.id=j.employer_id
    WHERE j.status='open' AND j.expiry_reminded=0 AND j.expires_at > ? AND j.expires_at <= ?`).all(nowS, soon) as { id: number; title: string; user_id: number }[];
  for (const j of expiring) {
    db.prepare("UPDATE jobs SET expiry_reminded=1 WHERE id=?").run(j.id);
    notify(j.user_id, {
      kind: "listing_expiring",
      en: { title: `Your listing expires in 3 days: ${j.title}`, body: "Renew it if the position is still open, or mark it filled." },
      hi: { title: `आपकी लिस्टिंग 3 दिन में ख़त्म होगी: ${j.title}`, body: "जगह खाली हो तो रिन्यू करें, भर गई हो तो 'भर गई' करें।" },
      link: `/employer/jobs/${j.id}`,
    });
    report.reminded++;
  }

  const expired = db.prepare(`SELECT j.id, j.title, e.user_id FROM jobs j JOIN employers e ON e.id=j.employer_id
    WHERE j.status='open' AND j.expiry_reminded < 2 AND j.expires_at <= ?`).all(nowS) as { id: number; title: string; user_id: number }[];
  for (const j of expired) {
    db.prepare("UPDATE jobs SET expiry_reminded=2 WHERE id=?").run(j.id);
    notify(j.user_id, {
      kind: "listing_expired",
      en: { title: `Listing expired: ${j.title}`, body: "It’s hidden from candidates. Renew it in one click if you’re still hiring." },
      hi: { title: `लिस्टिंग ख़त्म: ${j.title}`, body: "यह उम्मीदवारों को नहीं दिख रही। अगर अब भी भर्ती है तो एक क्लिक में रिन्यू करें।" },
      link: `/employer/jobs/${j.id}`,
    });
    report.expired++;
  }

  for (const [days, cp] of [[30, "30d"], [90, "90d"]] as const) {
    const due = sqlTime(new Date(now.getTime() - days * 86400_000)).slice(0, 10);
    const rows = db.prepare(`SELECT a.id, a.candidate_id, e.user_id AS employer_user, j.title, e.business_name, u.name
      FROM applications a JOIN jobs j ON j.id=a.job_id JOIN employers e ON e.id=j.employer_id JOIN users u ON u.id=a.candidate_id
      WHERE a.status='joined' AND a.joined_at IS NOT NULL AND date(a.joined_at) <= ?`).all(due) as { id: number; candidate_id: number; employer_user: number; title: string; business_name: string; name: string }[];
    for (const r of rows) {
      for (const [role, uid] of [["candidate", r.candidate_id], ["employer", r.employer_user]] as const) {
        const key = `checkin:${cp}:${r.id}:${role}`;
        if (kvGet(key)) continue;
        const done = db.prepare("SELECT 1 FROM feedback WHERE application_id=? AND from_role=? AND checkpoint=?").get(r.id, role, cp);
        kvSet(key, nowS);
        if (done) continue;
        const subject = role === "candidate" ? r.business_name : r.name;
        notify(uid, {
          kind: "checkin",
          en: { title: `${days}-day check-in: how is it going with ${subject}?`, body: "Two quick questions help us keep listings honest." },
          hi: { title: `${days} दिन बाद: ${subject} के साथ कैसा चल रहा है?`, body: "दो छोटे सवाल — इससे लिस्टिंग ईमानदार रहती हैं।" },
          link: `/feedback/${r.id}?checkpoint=${cp}`,
        });
        report.checkins++;
      }
    }
  }

  pruneRateLimits(now.getTime());
  kvSet("housekeeping_last", nowS);
  return report;
}

/** Run housekeeping at most every `minutes` minutes; cheap to call on every request. */
export function maybeRunHousekeeping(minutes = 10, now = new Date()) {
  const last = kvGet("housekeeping_last");
  if (last && now.getTime() - new Date(last.replace(" ", "T") + "Z").getTime() < minutes * 60_000) return null;
  return runHousekeeping(now);
}
