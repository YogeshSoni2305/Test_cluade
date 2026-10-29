import Link from "next/link";
import { requireUser, BYPASS } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getI18n } from "@/lib/i18n";
import { saveAccountSettings, deleteAccount } from "@/app/_actions/account";
import { devLogout } from "@/app/actions";
import { btn, Field, FormSection, Notice, PageHeader } from "@/components/ui";
import { IDownload, ITrash } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account", robots: { index: false } };

function Toggle({ name, checked, title, sub }: { name: string; checked: boolean; title: string; sub: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[3px] border border-line bg-paper-50 p-4">
      <input type="checkbox" name={name} defaultChecked={checked} className="mt-1 h-4 w-4 accent-sindoor-600" />
      <span><b className="text-ink">{title}</b><span className="mt-0.5 block text-[0.92rem] text-ink-soft">{sub}</span></span>
    </label>
  );
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const { t } = await getI18n();
  const searchable = user.role === "candidate"
    ? Boolean((getDb().prepare("SELECT searchable FROM candidate_profiles WHERE user_id=?").get(user.id) as { searchable: number } | undefined)?.searchable)
    : false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHeader deva="मेरा खाता" title={t("acct_title")} sub={`${user.name}${user.phone_norm ? ` · ${user.phone_norm}` : ""}`} />
      <div className="mb-6 space-y-3">
        {sp.saved && <Notice tone="ok">{t("acct_saved")}</Notice>}
        {sp.error && <Notice tone="bad">{sp.error}</Notice>}
      </div>

      <form action={saveAccountSettings} className="space-y-10">
        <FormSection n="१" title={t("acct_lang")} sub={t("acct_lang_sub")}>
          <div className="flex gap-2">
            {(["en", "hi"] as const).map((l) => (
              <label key={l} className="chip relative">
                <input type="radio" name="lang" value={l} defaultChecked={user.lang === l} />
                <span className={l === "hi" ? "font-deva" : ""}>{l === "en" ? "English" : "हिन्दी"}</span>
              </label>
            ))}
          </div>
        </FormSection>

        <FormSection n="२" title={t("acct_notify")} sub={t("acct_notify_sub")}>
          <div id="notifications" className="grid gap-3 sm:grid-cols-2">
            <Toggle name="notify_whatsapp" checked={!!user.notify_whatsapp} title={t("acct_whatsapp")} sub={t("acct_whatsapp_sub")} />
            <Toggle name="notify_sms" checked={!!user.notify_sms} title={t("acct_sms")} sub={t("acct_sms_sub")} />
          </div>
          {!user.phone_norm && <Notice tone="warn">{t("acct_no_phone")}</Notice>}
        </FormSection>

        {user.role === "candidate" && (
          <FormSection n="३" title={t("acct_visibility")} sub={t("acct_visibility_sub")}>
            <Toggle name="searchable" checked={searchable} title={t("acct_searchable")} sub={t("acct_searchable_sub")} />
          </FormSection>
        )}

        <div className="flex justify-end"><button className={btn("primary", "lg")}>{t("acct_save")}</button></div>
      </form>

      <section className="mt-14 grid gap-5 border-t border-line pt-8 md:grid-cols-[13rem_1fr]">
        <div>
          <p className="font-deva text-4xl leading-none text-sindoor-500">{user.role === "candidate" ? "४" : "३"}</p>
          <h2 className="mt-2 font-display text-2xl font-medium text-ink">{t("acct_data")}</h2>
        </div>
        <div className="space-y-6">
          <div className="rounded-[3px] border border-line bg-paper-50 p-5">
            <p className="font-semibold text-ink">{t("acct_export")}</p>
            <p className="mt-1 text-[0.92rem] text-ink-soft">{t("acct_export_sub")}</p>
            <a href="/account/export" className={btn("outline", "sm", "mt-3")}><IDownload size={16} />{t("acct_export_btn")}</a>
          </div>

          <div id="delete" className="rounded-[3px] border border-sindoor-400/50 bg-sindoor-50/60 p-5">
            <p className="flex items-center gap-2 font-semibold text-sindoor-700"><ITrash size={18} />{t("acct_delete")}</p>
            <p className="mt-1 text-[0.92rem] text-ink-soft">{user.role === "employer" ? t("acct_delete_sub_employer") : t("acct_delete_sub")}</p>
            <form action={deleteAccount} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label={t("acct_delete_reason")}><input name="reason" className="field" maxLength={200} /></Field>
              <span />
              <Field label={t("acct_delete_confirm")}><input name="confirm" className="field" required autoComplete="off" placeholder="DELETE" /></Field>
              <button className={btn("danger", "md")}>{t("acct_delete_btn")}</button>
            </form>
          </div>

          {BYPASS && (
            <form action={devLogout}><button className={btn("ghost", "sm")}>{t("nav_signout")}</button></form>
          )}
          <p className="text-[0.88rem] text-ink-soft">{t("acct_privacy_note")} <Link href="/safety" className="font-semibold text-sindoor-700 hover:underline">{t("nav_safety")}</Link></p>
        </div>
      </section>
    </div>
  );
}
