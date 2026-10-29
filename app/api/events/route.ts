import { NextResponse, type NextRequest } from "next/server";
import { EVENT_NAMES, track, type EventName } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";
import { checkLimit } from "@/lib/ratelimit";
import { getDb } from "@/lib/db";

/** Collector for client-side analytics beacons. Accepts only known event names and flat scalar props. */
export async function POST(req: NextRequest) {
  let data: { name?: string; props?: Record<string, unknown>; session?: string; path?: string; referrer?: string | null; utm?: string | null };
  try {
    data = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!data.name || !(EVENT_NAMES as readonly string[]).includes(data.name)) return new NextResponse(null, { status: 400 });
  if (await checkLimit("event")) return new NextResponse(null, { status: 429 });
  const props: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(data.props ?? {}).slice(0, 12)) {
    if (["string", "number", "boolean"].includes(typeof v)) props[k.slice(0, 32)] = typeof v === "string" ? v.slice(0, 80) : (v as number | boolean);
  }
  let referrer: string | null = null;
  try {
    // keep only the referring host, never the full URL
    if (data.referrer) referrer = new URL(data.referrer).host || null;
  } catch { /* ignore */ }
  const user = await getCurrentUser();
  if (data.name === "job_view" && typeof props.job === "number") {
    // owners viewing their own listing don't count
    const own = user && getDb().prepare("SELECT 1 FROM jobs j JOIN employers e ON e.id=j.employer_id WHERE j.id=? AND e.user_id=?").get(props.job, user.id);
    if (!own) getDb().prepare("INSERT INTO job_views (job_id, day, views) VALUES (?, date('now'), 1) ON CONFLICT(job_id, day) DO UPDATE SET views = views + 1").run(props.job);
  }
  track(data.name as EventName, props, {
    userId: user?.id ?? null,
    session: String(data.session ?? "").slice(0, 40) || null,
    path: String(data.path ?? "").slice(0, 200) || null,
    referrer,
    utm: data.utm ? String(data.utm).slice(0, 40) : null,
  });
  return new NextResponse(null, { status: 204 });
}
