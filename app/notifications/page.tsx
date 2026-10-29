import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getI18n } from "@/lib/i18n";
import { timeAgo } from "@/lib/format";
import { markAllNotificationsRead } from "@/app/_actions/alerts";
import { Empty, PageHeader, btn, cx } from "@/components/ui";
import { IBell, IBriefcase, IChat, IShield, IFlag, IDoc, ICalendar, IUser } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications", robots: { index: false } };

type N = { id: number; kind: string; title: string; body: string; link: string | null; created_at: string; read_at: string | null; channels: string };

const ICONS: Record<string, typeof IBell> = {
  alert_match: IBriefcase, application_new: IUser, application_status: IBriefcase, message: IChat, invite: IBriefcase,
  invite_reply: IUser, report_update: IFlag, verification: IShield, listing_expiring: ICalendar, listing_expired: ICalendar,
  checkin: IChat, letter_issued: IDoc, account: IUser,
};

export default async function Notifications() {
  const user = await requireUser();
  const { t, lang } = await getI18n();
  const rows = getDb().prepare("SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 100").all(user.id) as N[];
  const unread = rows.filter((r) => !r.read_at).length;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader
        deva="सूचनाएँ"
        title={t("nav_notifications")}
        sub={t("notif_sub")}
        actions={unread > 0 ? <form action={markAllNotificationsRead}><button className={btn("outline", "sm")}>{t("notif_mark_all")}</button></form> : undefined}
      />
      {rows.length === 0 ? (
        <Empty title={t("notif_empty")} sub={t("notif_empty_sub")} />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((n) => {
            const Icon = ICONS[n.kind] ?? IBell;
            return (
              <li key={n.id}>
                <a href={`/notifications/${n.id}`} className={cx("flex gap-4 px-2 py-4 transition hover:bg-paper-50", !n.read_at && "bg-paper-50/70")}>
                  <span className={cx("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", n.read_at ? "bg-paper-200 text-ink-faint" : "bg-sindoor-600 text-paper-50")}><Icon size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <span className={cx("block leading-snug text-ink", !n.read_at && "font-semibold")}>{n.title}</span>
                    {n.body && <span className="block text-[0.95rem] text-ink-soft">{n.body}</span>}
                    <span className="mt-1 block text-[0.8rem] text-ink-faint">
                      {timeAgo(n.created_at, lang)}
                      {n.channels.includes("whatsapp:sent") && ` · ${t("notif_via_whatsapp")}`}
                      {n.channels.includes("sms:sent") && ` · ${t("notif_via_sms")}`}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-6 text-[0.9rem] text-ink-soft">{t("notif_prefs_hint")} <Link href="/account#notifications" className="font-semibold text-sindoor-700 hover:underline">{t("nav_account")}</Link></p>
    </div>
  );
}
