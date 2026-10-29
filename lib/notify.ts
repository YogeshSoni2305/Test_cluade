import { after } from "next/server";
import { getDb } from "./db";
import { sendSms, sendWhatsApp } from "./channels";

export type NotifyKind =
  | "alert_match" | "application_new" | "application_status" | "message" | "invite" | "invite_reply"
  | "report_update" | "verification" | "listing_expiring" | "listing_expired" | "checkin" | "letter_issued" | "account";

type Text = { title: string; body?: string };
export type Notice = { kind: NotifyKind; en: Text; hi: Text; link?: string };

type Recipient = { id: number; phone_norm: string | null; lang: string; notify_whatsapp: number; notify_sms: number; suspended: number };

function siteUrl() {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Run after the response when inside a request; otherwise fire-and-forget (scripts, tests). */
function later(fn: () => Promise<void>) {
  try {
    after(fn);
  } catch {
    void fn();
  }
}

/** Store an in-app notification in the recipient's language and deliver to their opted-in channels. */
export function notify(userId: number, n: Notice): number | null {
  const db = getDb();
  const u = db.prepare("SELECT id, phone_norm, lang, notify_whatsapp, notify_sms, suspended FROM users WHERE id = ?").get(userId) as Recipient | undefined;
  if (!u || u.suspended) return null;
  const lang = u.lang === "hi" ? "hi" : "en";
  const text = n[lang];
  const info = db
    .prepare("INSERT INTO notifications (user_id, kind, title, body, link) VALUES (?,?,?,?,?)")
    .run(userId, n.kind, text.title, text.body ?? "", n.link ?? null);
  const id = Number(info.lastInsertRowid);

  if (u.phone_norm && (u.notify_whatsapp || u.notify_sms)) {
    const msg = { phone: u.phone_norm, lang, title: text.title, body: text.body ?? "", link: siteUrl() + (n.link ?? "/notifications") } as const;
    later(async () => {
      const results: string[] = ["in_app"];
      if (u.notify_whatsapp) results.push(`whatsapp:${await sendWhatsApp(msg)}`);
      if (u.notify_sms) results.push(`sms:${await sendSms(msg)}`);
      getDb().prepare("UPDATE notifications SET channels = ? WHERE id = ?").run(results.join(","), id);
    });
  }
  return id;
}

export function unreadCount(userId: number): number {
  return (getDb().prepare("SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND read_at IS NULL").get(userId) as { n: number }).n;
}

export function unreadMessages(userId: number): number {
  return (getDb()
    .prepare(`SELECT COUNT(*) n FROM messages m
      JOIN applications a ON a.id = m.application_id JOIN jobs j ON j.id = a.job_id JOIN employers e ON e.id = j.employer_id
      WHERE m.read_at IS NULL AND (m.sender_id IS NULL OR m.sender_id != ?) AND (a.candidate_id = ? OR e.user_id = ?)`)
    .get(userId, userId, userId) as { n: number }).n;
}
