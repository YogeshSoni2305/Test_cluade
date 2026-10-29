import { getDb } from "./db";

/** First-party, cookie-less product analytics. Never stores IPs, phone numbers or free text. */
export const EVENT_NAMES = [
  "page_view", "job_view", "search", "apply_click", "applied", "share_family", "save_job",
  "alert_created", "signup", "profile_completed", "job_posted", "message_sent", "invite_sent",
  "listen_used", "voice_used", "offline_saved", "web_vital",
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export function track(name: EventName, props: Record<string, string | number | boolean | null> = {}, opts: { userId?: number | null; session?: string | null; path?: string | null; referrer?: string | null; utm?: string | null } = {}) {
  getDb()
    .prepare("INSERT INTO events (name, props, user_id, session, path, referrer, utm_source) VALUES (?,?,?,?,?,?,?)")
    .run(name, JSON.stringify(props), opts.userId ?? null, opts.session ?? null, opts.path ?? null, opts.referrer ?? null, opts.utm ?? null);
}
