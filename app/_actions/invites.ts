"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getEmployerByUser, getJob, isPubliclyVisible } from "@/lib/queries";
import { s, int, fail, safeNext, withParam } from "@/lib/form";
import { checkLimit } from "@/lib/ratelimit";
import { flagReason } from "@/lib/moderation";
import { notify } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { track } from "@/lib/analytics";

export async function sendInvite(fd: FormData) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  const back = safeNext(s(fd, "next"), "/employer/candidates");
  if (!emp) redirect("/employer/profile");
  if (emp!.verification_status !== "verified") fail(back, "Only verified businesses can invite candidates.");
  const limited = await checkLimit("invite", user.id);
  if (limited) fail(back, limited);
  const job = getJob(int(fd, "job_id"));
  const candidateId = int(fd, "candidate_id");
  if (!job || job.employer_id !== emp!.id || !isPubliclyVisible(job)) fail(back, "Choose one of your open listings.");
  const db = getDb();
  const ok = db.prepare("SELECT 1 FROM candidate_profiles cp JOIN users u ON u.id=cp.user_id WHERE cp.user_id=? AND cp.searchable=1 AND cp.completed=1 AND u.suspended=0").get(candidateId);
  if (!ok) fail(back, "This candidate isn’t available for invitations.");
  if (db.prepare("SELECT 1 FROM applications WHERE job_id=? AND candidate_id=?").get(job!.id, candidateId)) fail(back, "This candidate has already applied to that job.");
  const message = s(fd, "message").slice(0, 600);
  if (flagReason(message)) fail(back, "Your message was blocked because it mentions payments or links. Please rewrite it.");
  const info = db.prepare("INSERT OR IGNORE INTO invitations (job_id, candidate_id, message) VALUES (?,?,?)").run(job!.id, candidateId, message);
  if (!info.changes) fail(back, "You have already invited this candidate to that job.");
  audit({ id: user.id, name: user.name }, "invite.send", "invitation", Number(info.lastInsertRowid), { job: job!.id, candidate: candidateId });
  notify(candidateId, {
    kind: "invite",
    en: { title: `${emp!.business_name} invited you to apply`, body: `${job!.title}, ${job!.city}` },
    hi: { title: `${emp!.business_name} ने आपको आवेदन के लिए बुलाया`, body: `${job!.title}, ${job!.city}` },
    link: "/candidate#invitations",
  });
  track("invite_sent", { job: job!.id }, { userId: user.id });
  redirect(withParam(back, "invited", "1"));
}

export async function respondInvite(fd: FormData) {
  const user = await requireUser("candidate");
  const id = int(fd, "invitation_id");
  const db = getDb();
  const inv = db.prepare(`SELECT i.id, i.job_id, j.title, e.user_id AS employer_user FROM invitations i JOIN jobs j ON j.id=i.job_id JOIN employers e ON e.id=j.employer_id
      WHERE i.id=? AND i.candidate_id=? AND i.status='pending'`).get(id, user.id) as { id: number; job_id: number; title: string; employer_user: number } | undefined;
  if (!inv) redirect("/candidate");
  if (s(fd, "op") === "accept") redirect(`/jobs/${inv!.job_id}?invite=1#apply`);
  db.prepare("UPDATE invitations SET status='declined', responded_at=datetime('now') WHERE id=?").run(id);
  notify(inv!.employer_user, {
    kind: "invite_reply",
    en: { title: `A candidate declined your invitation`, body: inv!.title },
    hi: { title: `एक उम्मीदवार ने आपका न्योता अस्वीकार किया`, body: inv!.title },
    link: "/employer/candidates",
  });
  redirect("/candidate?declined=1");
}
