import { headers } from "next/headers";
import { getDb } from "./db";

export type Limit = { limit: number; windowSec: number };

/** Limits per action. Keyed by user id where available and always by IP as well. */
export const LIMITS = {
  signup: { limit: 5, windowSec: 3600 },
  apply: { limit: 15, windowSec: 86400 },
  applyBurst: { limit: 5, windowSec: 600 },
  report: { limit: 5, windowSec: 86400 },
  message: { limit: 40, windowSec: 3600 },
  post: { limit: 10, windowSec: 86400 },
  invite: { limit: 30, windowSec: 86400 },
  alert: { limit: 10, windowSec: 86400 },
  call: { limit: 6, windowSec: 3600 },
  event: { limit: 300, windowSec: 3600 },
} satisfies Record<string, Limit>;

/**
 * Fixed-window counter stored in SQLite. Returns ok=false once `limit` hits within the window.
 * `now` is injectable for tests.
 */
export function hit(key: string, { limit, windowSec }: Limit, now = Date.now()): { ok: boolean; retryAfterSec: number; count: number } {
  const nowSec = Math.floor(now / 1000);
  const windowStart = nowSec - (nowSec % windowSec);
  const db = getDb();
  const row = db
    .prepare(`INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
              ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1 RETURNING count`)
    .get(key, windowStart) as { count: number };
  return { ok: row.count <= limit, retryAfterSec: windowStart + windowSec - nowSec, count: row.count };
}

export function pruneRateLimits(now = Date.now()) {
  // the longest window is a day; anything older is irrelevant
  getDb().prepare("DELETE FROM rate_limits WHERE window_start < ?").run(Math.floor(now / 1000) - 2 * 86400);
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

/** Check user- and IP-scoped limits together. Returns an error message, or null when allowed. */
export async function checkLimit(action: keyof typeof LIMITS, userId?: number | null): Promise<string | null> {
  const cfg = LIMITS[action];
  const ip = await clientIp();
  const results = [hit(`${action}:ip:${ip}`, { ...cfg, limit: cfg.limit * 4 })];
  if (userId) results.push(hit(`${action}:u:${userId}`, cfg));
  const blocked = results.find((r) => !r.ok);
  if (!blocked) return null;
  const mins = Math.max(1, Math.ceil(blocked.retryAfterSec / 60));
  return `Too many attempts. Please try again in ${mins >= 60 ? Math.ceil(mins / 60) + " hour(s)" : mins + " minute(s)"}.`;
}
