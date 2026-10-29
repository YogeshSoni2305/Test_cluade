"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { s, int, fail } from "@/lib/form";
import { checkLimit } from "@/lib/ratelimit";
import { flagReason } from "@/lib/moderation";
import { notify } from "@/lib/notify";
import { getThread, postSystemMessage } from "@/lib/threads";
import { connectMaskedCall } from "@/lib/telephony";
import { audit } from "@/lib/audit";
import { track } from "@/lib/analytics";

export async function sendMessage(fd: FormData) {
  const user = await requireUser();
  const appId = int(fd, "application_id");
  const back = `/messages/${appId}`;
  const t = getThread(appId, user.id);
  if (!t) redirect("/messages");
  if (t!.blocked_by) fail(back, "This conversation is blocked.");
  const body = s(fd, "body").slice(0, 2000);
  if (!body) redirect(back);
  const limited = await checkLimit("message", user.id);
  if (limited) fail(back, limited);
  const db = getDb();
  // the same text sent repeatedly in a short time is spam
  const repeats = (db.prepare("SELECT COUNT(*) n FROM messages WHERE sender_id=? AND body=? AND created_at > datetime('now','-10 minutes')").get(user.id, body) as { n: number }).n;
  if (repeats >= 1) fail(back, "You’ve already sent this message. Please wait for a reply.");
  const flag = flagReason(body);
  db.prepare("INSERT INTO messages (application_id, sender_id, body, flagged) VALUES (?,?,?,?)").run(appId, user.id, body, flag);
  const to = t!.me === "candidate" ? t!.employer_user_id : t!.candidate_id;
  const link = `/messages/${appId}`;
  const pending = db.prepare("SELECT 1 FROM notifications WHERE user_id=? AND link=? AND read_at IS NULL").get(to, link);
  if (!pending) {
    const from = t!.me === "candidate" ? t!.candidate_name : t!.business_name;
    notify(to, { kind: "message", en: { title: `New message from ${from}`, body: t!.job_title }, hi: { title: `${from} का नया संदेश`, body: t!.job_title }, link });
  }
  track("message_sent", { role: t!.me }, { userId: user.id });
  revalidatePath(back);
  redirect(back);
}

export async function setPhoneSharing(fd: FormData) {
  const user = await requireUser("candidate");
  const appId = int(fd, "application_id");
  const t = getThread(appId, user.id);
  if (!t || t.me !== "candidate") redirect("/messages");
  const share = s(fd, "share") === "1" ? 1 : 0;
  getDb().prepare("UPDATE applications SET share_phone=? WHERE id=?").run(share, appId);
  postSystemMessage(appId, share ? "candidate_shared_phone" : "candidate_hid_phone");
  redirect(`/messages/${appId}`);
}

export async function setBlocked(fd: FormData) {
  const user = await requireUser();
  const appId = int(fd, "application_id");
  const t = getThread(appId, user.id);
  if (!t) redirect("/messages");
  const block = s(fd, "block") === "1";
  if (!block && t!.blocked_by && t!.blocked_by !== user.id) fail(`/messages/${appId}`, "Only the person who blocked this conversation can unblock it.");
  getDb().prepare("UPDATE applications SET blocked_by=? WHERE id=?").run(block ? user.id : null, appId);
  postSystemMessage(appId, block ? "conversation_blocked" : "conversation_unblocked");
  audit({ id: user.id, name: user.name }, block ? "thread.block" : "thread.unblock", "application", appId);
  redirect(`/messages/${appId}`);
}

export async function requestCall(fd: FormData) {
  const user = await requireUser();
  const appId = int(fd, "application_id");
  const back = `/messages/${appId}`;
  const t = getThread(appId, user.id);
  if (!t) redirect("/messages");
  if (t!.blocked_by) fail(back, "This conversation is blocked.");
  const limited = await checkLimit("call", user.id);
  if (limited) fail(back, limited);
  const mine = t!.me === "candidate" ? t!.candidate_phone : t!.employer_phone;
  const theirs = t!.me === "candidate" ? t!.employer_phone : t!.candidate_phone;
  if (!mine || !theirs) fail(back, "A call needs both phone numbers on file.");
  const res = await connectMaskedCall(mine!, theirs!);
  postSystemMessage(appId, res.status === "connecting" ? `call_connecting:${t!.me}` : `call_requested:${t!.me}`);
  const to = t!.me === "candidate" ? t!.employer_user_id : t!.candidate_id;
  const from = t!.me === "candidate" ? t!.candidate_name : t!.business_name;
  notify(to, {
    kind: "message",
    en: { title: res.status === "connecting" ? `${from} is calling you` : `${from} wants to talk on the phone`, body: res.status === "connecting" ? "You’ll get a call from our number. Your number stays private." : "Reply in the chat to agree a time." },
    hi: { title: res.status === "connecting" ? `${from} आपको कॉल कर रहे हैं` : `${from} फ़ोन पर बात करना चाहते हैं`, body: res.status === "connecting" ? "हमारे नंबर से कॉल आएगी। आपका नंबर छुपा रहेगा।" : "समय तय करने के लिए चैट में जवाब दें।" },
    link: back,
  });
  redirect(`${back}?call=${res.status}`);
}
