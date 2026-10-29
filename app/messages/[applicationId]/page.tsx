import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getThread } from "@/lib/threads";
import { getI18n, bi } from "@/lib/i18n";
import { APPLICATION_STATUSES, byId } from "@/lib/constants";
import { maskPhone, telephonyConfigured } from "@/lib/telephony";
import { systemText } from "@/lib/sysmsg";
import { sendMessage, setPhoneSharing, setBlocked, requestCall } from "@/app/_actions/messages";
import { Badge, btn, cx, Notice } from "@/components/ui";
import { AutoRefresh } from "@/components/AutoRefresh";
import { VoiceTextarea } from "@/components/VoiceInput";
import { IArrowLeft, ILock, IPhone, IShield } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conversation", robots: { index: false } };

type Msg = { id: number; sender_id: number | null; body: string; kind: string; flagged: string | null; created_at: string; read_at: string | null };

function clock(iso: string, lang: string) {
  const d = new Date(iso.replace(" ", "T") + "Z");
  return d.toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

export default async function ThreadPage({ params, searchParams }: { params: Promise<{ applicationId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const appId = Number((await params).applicationId);
  const sp = await searchParams;
  const th = getThread(appId, user.id);
  if (!th) notFound();
  const { t, lang } = await getI18n();
  const db = getDb();
  db.prepare("UPDATE messages SET read_at = datetime('now') WHERE application_id = ? AND read_at IS NULL AND (sender_id IS NULL OR sender_id != ?)").run(appId, user.id);
  db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND link = ? AND read_at IS NULL").run(user.id, `/messages/${appId}`);
  const msgs = db.prepare("SELECT * FROM messages WHERE application_id = ? ORDER BY id").all(appId) as Msg[];
  const other = th.me === "candidate" ? th.business_name : th.candidate_name;
  const st = byId([...APPLICATION_STATUSES], th.status);
  const names = { candidate: th.candidate_name, employer: th.business_name };
  const blocked = Boolean(th.blocked_by);
  const iBlocked = th.blocked_by === user.id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <AutoRefresh ms={8000} />
      <Link href="/messages" className="inline-flex items-center gap-1.5 text-[0.95rem] font-semibold text-ink-soft hover:text-sindoor-700"><IArrowLeft size={16} />{t("msg_title")}</Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <section aria-label={t("msg_title")} className="flex min-h-[32rem] flex-col rounded-[4px] border border-line bg-paper-50 shadow-card">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <h1 className="truncate font-display text-[1.7rem] font-semibold leading-tight text-ink">{other}</h1>
              <Link href={th.me === "employer" ? `/employer/jobs/${th.job_id}#app-${appId}` : `/jobs/${th.job_id}`} className="text-[0.92rem] text-sindoor-700 hover:underline">{th.job_title}</Link>
            </div>
            {st && <Badge tone={st.tone}>{bi(st, lang)}</Badge>}
          </header>

          <ol className="ledger-lines flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
            {msgs.length === 0 && <li className="py-10 text-center text-ink-soft">{t("msg_start")}</li>}
            {msgs.map((m) => {
              if (m.kind === "system")
                return <li key={m.id} className="text-center text-[0.85rem] italic text-ink-faint">{systemText(m.body, lang, names)} · {clock(m.created_at, lang)}</li>;
              const mine = m.sender_id === user.id;
              return (
                <li key={m.id} className={cx("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cx("max-w-[85%] rounded-[4px] px-4 py-2.5 shadow-card", mine ? "bg-ink text-paper-50" : "border border-line bg-white text-ink")}>
                    {m.flagged && !mine && (
                      <p className="mb-2 flex items-start gap-1.5 border-l-2 border-haldi-500 bg-haldi-100 px-2 py-1 text-[0.82rem] font-semibold text-haldi-700">
                        <IShield size={14} className="mt-0.5 shrink-0" />{t("msg_flag_warning")}
                      </p>
                    )}
                    <p className="whitespace-pre-line break-words leading-relaxed">{m.body}</p>
                    <p className={cx("mt-1 text-right text-[0.75rem]", mine ? "text-paper-300" : "text-ink-faint")}>
                      {clock(m.created_at, lang)}{mine && m.read_at ? ` · ${t("msg_seen")}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="border-t border-line p-4">
            {sp.error && <div className="mb-3"><Notice tone="bad">{sp.error}</Notice></div>}
            {blocked ? (
              <p className="text-center text-ink-soft">{t("msg_blocked")}</p>
            ) : (
              <form action={sendMessage} className="flex items-end gap-2">
                <input type="hidden" name="application_id" value={appId} />
                <VoiceTextarea name="body" label={t("msg_write")} placeholder={t("msg_write")} lang={lang} required maxLength={2000} rows={2} />
                <button className={btn("primary", "md")}>{t("msg_send")}</button>
              </form>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[4px] border border-line bg-paper-50 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-ink"><ILock size={18} className="text-peacock-600" />{t("msg_privacy")}</h2>
            {th.me === "candidate" ? (
              <>
                <p className="mt-2 text-[0.92rem] text-ink-soft">{th.share_phone ? t("msg_phone_shared") : t("msg_phone_hidden")}</p>
                <form action={setPhoneSharing} className="mt-3">
                  <input type="hidden" name="application_id" value={appId} />
                  <input type="hidden" name="share" value={th.share_phone ? "0" : "1"} />
                  <button className={btn("outline", "sm", "w-full")}>{th.share_phone ? t("msg_hide_phone") : t("msg_share_phone")}</button>
                </form>
              </>
            ) : (
              <p className="mt-2 text-[0.92rem] text-ink-soft">
                {t("msg_their_phone")}: <span className="num font-semibold text-ink">{th.share_phone && th.candidate_phone ? th.candidate_phone : maskPhone(th.candidate_phone)}</span>
                {!th.share_phone && <span className="block text-[0.82rem]">{t("msg_phone_masked_note")}</span>}
              </p>
            )}
          </div>

          {!blocked && (
            <div className="rounded-[4px] border border-line bg-paper-50 p-5">
              <h2 className="flex items-center gap-2 font-semibold text-ink"><IPhone size={18} className="text-sindoor-600" />{t("msg_call_title")}</h2>
              <p className="mt-2 text-[0.92rem] text-ink-soft">{t("msg_call_body")}</p>
              {th.me === "employer" && th.share_phone && th.candidate_phone ? (
                <a href={`tel:${th.candidate_phone}`} className={btn("ink", "sm", "mt-3 w-full")}>{t("msg_call_direct")}</a>
              ) : null}
              <form action={requestCall} className="mt-2">
                <input type="hidden" name="application_id" value={appId} />
                <button className={btn("primary", "sm", "w-full")}>{t("msg_call_masked")}</button>
              </form>
              {sp.call === "connecting" && <p className="mt-2 text-[0.85rem] font-semibold text-peacock-600">{t("msg_call_connecting")}</p>}
              {sp.call === "not_configured" && <p className="mt-2 text-[0.85rem] text-haldi-700">{t("msg_call_not_configured")}</p>}
              {sp.call === "failed" && <p className="mt-2 text-[0.85rem] text-sindoor-700">{t("msg_call_failed")}</p>}
              {!telephonyConfigured() && <p className="mt-2 text-[0.78rem] text-ink-faint">{t("msg_call_demo_note")}</p>}
            </div>
          )}

          <div className="rounded-[4px] border border-line bg-paper-50 p-5 text-[0.92rem]">
            <p className="text-ink-soft">{t("msg_safety")}</p>
            <form action={setBlocked} className="mt-3">
              <input type="hidden" name="application_id" value={appId} />
              <input type="hidden" name="block" value={iBlocked ? "0" : "1"} />
              {(!blocked || iBlocked) && <button className={btn("ghost", "sm", "w-full !text-sindoor-700")}>{iBlocked ? t("msg_unblock") : t("msg_block")}</button>}
            </form>
            {th.me === "candidate" && <Link href={`/jobs/${th.job_id}/report`} className="mt-1 block text-center text-[0.88rem] font-semibold text-sindoor-700 hover:underline">{t("report")}</Link>}
          </div>
        </aside>
      </div>
    </div>
  );
}
