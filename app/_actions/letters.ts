"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getEmployerByUser } from "@/lib/queries";
import { s, int, list, bool, fail } from "@/lib/form";
import { newLetterCode, normalizeCode } from "@/lib/letters";
import { skillsFor } from "@/lib/constants";
import { notify } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { postSystemMessage } from "@/lib/threads";

const isoDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime());

export async function issueLetter(fd: FormData) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  const appId = int(fd, "application_id");
  const db = getDb();
  const row = db.prepare(`SELECT a.id, a.job_id, a.candidate_id, a.status, a.joined_at, j.title, j.industry, u.name, cp.district
      FROM applications a JOIN jobs j ON j.id=a.job_id JOIN users u ON u.id=a.candidate_id LEFT JOIN candidate_profiles cp ON cp.user_id=a.candidate_id
      WHERE a.id=? AND j.employer_id=?`).get(appId, emp?.id ?? 0) as
    | { id: number; job_id: number; candidate_id: number; status: string; joined_at: string | null; title: string; industry: string; name: string; district: string | null }
    | undefined;
  if (!emp || !row) redirect("/employer");
  const back = `/employer/jobs/${row!.job_id}#app-${appId}`;
  if (!["joined", "selected"].includes(row!.status)) fail(back, "A letter can only be issued to someone who joined.");
  if (db.prepare("SELECT 1 FROM experience_letters WHERE application_id=? AND revoked=0").get(appId)) fail(back, "A letter has already been issued for this job.");
  const from = s(fd, "from_date"), to = s(fd, "to_date");
  if (!isoDate(from) || !isoDate(to)) fail(back, "Enter valid start and end dates.");
  if (from > to) fail(back, "The end date must be after the start date.");
  if (to > new Date().toISOString().slice(0, 10)) fail(back, "The end date can’t be in the future.");
  if (!bool(fd, "confirm")) fail(back, "Please confirm the details are true.");
  const allowed = new Set(skillsFor(row!.industry).map((x) => x.id));
  const skills = list(fd, "skills").filter((x) => allowed.has(x));
  let code = newLetterCode();
  while (db.prepare("SELECT 1 FROM experience_letters WHERE code=?").get(code)) code = newLetterCode();
  db.prepare(`INSERT INTO experience_letters (application_id, candidate_id, candidate_name, candidate_district, business_name, business_city, owner_name,
      employer_verified, code, role_title, industry, from_date, to_date, skills, remarks, issued_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(appId, row!.candidate_id, row!.name, row!.district, emp!.business_name, emp!.city, emp!.owner_name || user.name,
      emp!.verification_status === "verified" ? 1 : 0, code, s(fd, "role_title") || row!.title, row!.industry, from, to,
      JSON.stringify(skills), s(fd, "remarks").slice(0, 800), user.id);
  db.prepare("UPDATE applications SET status='joined', joined_at=COALESCE(joined_at, ?), left_at=?, updated_at=datetime('now') WHERE id=?").run(from, to, appId);
  audit({ id: user.id, name: user.name }, "letter.issue", "application", appId, { code });
  notify(row!.candidate_id, {
    kind: "letter_issued",
    en: { title: `Experience letter from ${emp!.business_name}`, body: `Verification code ${code}` },
    hi: { title: `${emp!.business_name} से अनुभव पत्र`, body: `सत्यापन कोड ${code}` },
    link: `/letters/${code}`,
  });
  redirect(`/employer/jobs/${row!.job_id}?letter=${code}#app-${appId}`);
}

export async function revokeLetter(fd: FormData) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  const code = normalizeCode(s(fd, "code"));
  const db = getDb();
  const l = db.prepare(`SELECT l.id, l.application_id, l.candidate_id, j.id AS job_id FROM experience_letters l
      JOIN applications a ON a.id=l.application_id JOIN jobs j ON j.id=a.job_id WHERE l.code=? AND j.employer_id=?`).get(code, emp?.id ?? 0) as
    | { id: number; application_id: number; candidate_id: number; job_id: number } | undefined;
  if (!l) redirect("/employer");
  const reason = s(fd, "reason");
  if (reason.length < 5) fail(`/employer/jobs/${l!.job_id}#app-${l!.application_id}`, "Give a reason for revoking the letter.");
  db.prepare("UPDATE experience_letters SET revoked=1 WHERE id=?").run(l!.id);
  audit({ id: user.id, name: user.name }, "letter.revoke", "application", l!.application_id, { code, reason });
  notify(l!.candidate_id, {
    kind: "letter_issued",
    en: { title: "An experience letter was withdrawn", body: reason },
    hi: { title: "एक अनुभव पत्र वापस लिया गया", body: reason },
    link: "/candidate",
  });
  redirect(`/employer/jobs/${l!.job_id}#app-${l!.application_id}`);
}

export async function requestLetter(fd: FormData) {
  const user = await requireUser("candidate");
  const appId = int(fd, "application_id");
  const row = getDb().prepare(`SELECT a.id, j.title, e.user_id FROM applications a JOIN jobs j ON j.id=a.job_id JOIN employers e ON e.id=j.employer_id
      WHERE a.id=? AND a.candidate_id=? AND a.status IN ('joined','selected')`).get(appId, user.id) as { id: number; title: string; user_id: number } | undefined;
  if (!row) redirect("/candidate");
  postSystemMessage(appId, "letter_requested");
  notify(row!.user_id, {
    kind: "letter_issued",
    en: { title: `${user.name} asked for an experience letter`, body: row!.title },
    hi: { title: `${user.name} ने अनुभव पत्र माँगा`, body: row!.title },
    link: `/messages/${appId}`,
  });
  redirect("/candidate?letter_requested=1");
}

export async function findLetter(fd: FormData) {
  redirect(`/letters/${encodeURIComponent(normalizeCode(s(fd, "code")))}`);
}
