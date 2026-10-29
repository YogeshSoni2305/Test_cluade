import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { inbox } from "@/lib/threads";
import { getI18n } from "@/lib/i18n";
import { timeAgo } from "@/lib/format";
import { systemText } from "@/lib/sysmsg";
import { Empty, PageHeader, btn, cx } from "@/components/ui";
import { AutoRefresh } from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages", robots: { index: false } };

export default async function Inbox() {
  const user = await requireUser();
  const { t, lang } = await getI18n();
  const rows = inbox(user.id);
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <AutoRefresh ms={15000} />
      <PageHeader deva="संदेश" title={t("msg_title")} sub={t("msg_sub")} />
      {rows.length === 0 ? (
        <Empty title={t("msg_empty")} sub={t("msg_empty_sub")} action={<Link href={user.role === "employer" ? "/employer" : "/jobs"} className={btn("primary")}>{user.role === "employer" ? t("nav_dashboard") : t("hero_cta_primary")}</Link>} />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((r) => {
            const other = r.candidate_id === user.id ? r.business_name : r.candidate_name;
            const preview = r.last_kind === "system" && r.last_body ? systemText(r.last_body, lang, { candidate: r.candidate_name, employer: r.business_name }) : r.last_body;
            return (
              <li key={r.application_id}>
                <Link href={`/messages/${r.application_id}`} className="flex items-start gap-4 px-2 py-4 transition hover:bg-paper-50">
                  <span aria-hidden className={cx("mt-1.5 h-2.5 w-2.5 shrink-0 rotate-45", r.unread ? "bg-sindoor-500" : "bg-paper-300")} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={cx("truncate text-[1.05rem] text-ink", r.unread ? "font-bold" : "font-semibold")}>{other}</span>
                      <span className="shrink-0 text-[0.82rem] text-ink-faint">{r.last_at ? timeAgo(r.last_at, lang) : ""}</span>
                    </span>
                    <span className="block truncate text-[0.88rem] text-sindoor-700">{r.job_title}</span>
                    <span className={cx("block truncate text-[0.95rem]", r.unread ? "text-ink" : "text-ink-soft")}>{preview ?? t("msg_no_messages")}</span>
                  </span>
                  {r.unread > 0 && <span className="mt-1 rounded-[2px] bg-sindoor-600 px-1.5 text-[0.75rem] font-bold text-paper-50">{r.unread}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
