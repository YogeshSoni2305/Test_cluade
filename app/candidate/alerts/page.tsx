import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getI18n } from "@/lib/i18n";
import { describeAlert, jobMatchesAlert, type Alert } from "@/lib/alerts";
import { searchJobs } from "@/lib/queries";
import { updateAlert } from "@/app/_actions/alerts";
import { timeAgo } from "@/lib/format";
import { Badge, btn, Empty, PageHeader } from "@/components/ui";
import { IBell } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Job alerts", robots: { index: false } };

function searchHref(a: Alert) {
  const p = new URLSearchParams();
  if (a.q) p.set("q", a.q);
  if (a.industry) p.set("industry", a.industry);
  if (a.city) p.set("city", a.city);
  if (a.min_salary) p.set("minSalary", String(a.min_salary));
  if (a.stay) p.set("stay", a.stay);
  if (a.verified_only) p.set("verified", "1");
  return `/jobs?${p}`;
}

export default async function AlertsPage() {
  const user = await requireUser("candidate");
  const { t, lang } = await getI18n();
  const alerts = getDb().prepare("SELECT * FROM job_alerts WHERE user_id=? ORDER BY active DESC, id DESC").all(user.id) as Alert[];
  const open = searchJobs({ sort: "new" });
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader deva="काम की सूचना" title={t("alerts_title")} sub={t("alerts_sub")} actions={<Link href="/jobs" className={btn("primary", "sm")}>{t("alerts_new")}</Link>} />
      {alerts.length === 0 ? (
        <Empty title={t("alerts_empty")} sub={t("alerts_empty_sub")} action={<Link href="/jobs" className={btn("primary")}>{t("hero_cta_primary")}</Link>} />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {alerts.map((a) => {
            const matches = open.filter((j) => jobMatchesAlert(j, a)).length;
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-4 py-4">
                <IBell size={20} className={a.active ? "text-sindoor-600" : "text-ink-faint"} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{describeAlert(a, lang)}</p>
                  <p className="text-[0.88rem] text-ink-soft">
                    <Link href={searchHref(a)} className="text-sindoor-700 hover:underline">{matches} {t("alerts_open_now")}</Link>
                    {a.last_matched_at && <> · {t("alerts_last_match")} {timeAgo(a.last_matched_at, lang)}</>}
                  </p>
                </div>
                {!a.active && <Badge tone="slate">{t("alerts_paused")}</Badge>}
                <form action={updateAlert} className="flex gap-1">
                  <input type="hidden" name="alert_id" value={a.id} />
                  <button name="op" value={a.active ? "pause" : "resume"} className={btn("ghost", "sm")}>{a.active ? t("alerts_pause") : t("alerts_resume")}</button>
                  <button name="op" value="delete" className={btn("ghost", "sm", "!text-sindoor-700")}>{t("alerts_delete")}</button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-6 text-[0.9rem] text-ink-soft">{t("alerts_delivery")}</p>
    </div>
  );
}
