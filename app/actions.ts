"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { BYPASS, DEV_COOKIE, getCurrentUser, requireUser } from "@/lib/auth";
import { getEmployerByUser, getJob } from "@/lib/queries";
import { APPLICATION_STATUSES, VERIFICATION_CHECKS } from "@/lib/constants";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const list = (fd: FormData, k: string) => fd.getAll(k).map(String).filter(Boolean);
const int = (fd: FormData, k: string, d = 0) => {
  const n = parseInt(s(fd, k).replace(/[, ]/g, ""), 10);
  return Number.isFinite(n) ? n : d;
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "1";
const safeNext = (n: string, fallback = "/") => (n.startsWith("/") && !n.startsWith("//") ? n : fallback);
const fail = (path: string, msg: string): never => {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}error=${encodeURIComponent(msg)}`);
};

/* ---------------- language & dev auth ---------------- */

export async function setLang(fd: FormData) {
  const c = await cookies();
  c.set("lang", s(fd, "lang") === "hi" ? "hi" : "en", { path: "/", maxAge: 60 * 60 * 24 * 365 });
  redirect(safeNext(s(fd, "next")));
}

export async function devLogin(fd: FormData) {
  if (!BYPASS) redirect("/");
  const id = int(fd, "uid");
  const u = getDb().prepare("SELECT id, role FROM users WHERE id = ?").get(id) as { id: number; role: string | null } | undefined;
  if (!u) redirect("/dev-login");
  (await cookies()).set(DEV_COOKIE, String(id), { path: "/", httpOnly: true, sameSite: "lax" });
  const next = safeNext(s(fd, "next"), "");
  redirect(next || (u!.role === "employer" ? "/employer" : u!.role === "admin" ? "/admin" : "/candidate"));
}

export async function devCreate(fd: FormData) {
  if (!BYPASS) redirect("/");
  const name = s(fd, "name") || "Test user";
  const phone = s(fd, "phone");
  const role = s(fd, "role") === "employer" ? "employer" : s(fd, "role") === "admin" ? "admin" : "candidate";
  const info = getDb().prepare("INSERT INTO users (role,name,phone) VALUES (?,?,?)").run(role, name, phone || null);
  (await cookies()).set(DEV_COOKIE, String(info.lastInsertRowid), { path: "/", httpOnly: true, sameSite: "lax" });
  redirect(role === "employer" ? "/employer/profile" : role === "candidate" ? "/candidate/profile" : "/admin");
}

export async function devLogout() {
  (await cookies()).delete(DEV_COOKIE);
  redirect("/");
}

export async function chooseRole(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user!.role) redirect("/");
  const role = s(fd, "role") === "employer" ? "employer" : "candidate";
  const name = s(fd, "name");
  const phone = s(fd, "phone");
  getDb()
    .prepare("UPDATE users SET role = ?, name = COALESCE(NULLIF(?, ''), name), phone = COALESCE(NULLIF(?, ''), phone) WHERE id = ?")
    .run(role, name, phone, user!.id);
  redirect(role === "employer" ? "/employer/profile" : "/candidate/profile");
}

/* ---------------- candidate ---------------- */

export async function saveCandidateProfile(fd: FormData) {
  const user = await requireUser("candidate");
  const db = getDb();
  const name = s(fd, "name");
  if (!name) fail("/candidate/profile", "Please enter your name.");
  if (!s(fd, "district")) fail("/candidate/profile", "Please choose your district in Rajasthan.");
  const phone = s(fd, "phone");
  db.prepare("UPDATE users SET name = ?, phone = COALESCE(NULLIF(?, ''), phone) WHERE id = ?").run(name, phone, user.id);
  const vals = [
    s(fd, "district"), s(fd, "education"), JSON.stringify(list(fd, "languages")), s(fd, "experience"),
    JSON.stringify(list(fd, "industries")), JSON.stringify(list(fd, "cities")), bool(fd, "relocate") ? 1 : 0,
    bool(fd, "needs_accommodation") ? 1 : 0, JSON.stringify(list(fd, "goals")), s(fd, "learn_notes"),
    int(fd, "age") || null, s(fd, "family_name") || null, s(fd, "family_phone") || null,
  ];
  db.prepare(`INSERT INTO candidate_profiles
      (user_id,district,education,languages,experience,industries,cities,relocate,needs_accommodation,goals,learn_notes,age,family_name,family_phone,completed,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET district=excluded.district, education=excluded.education, languages=excluded.languages,
        experience=excluded.experience, industries=excluded.industries, cities=excluded.cities, relocate=excluded.relocate,
        needs_accommodation=excluded.needs_accommodation, goals=excluded.goals, learn_notes=excluded.learn_notes, age=excluded.age,
        family_name=excluded.family_name, family_phone=excluded.family_phone, completed=1, updated_at=datetime('now')`)
    .run(user.id, ...vals);
  revalidatePath("/candidate");
  redirect(safeNext(s(fd, "next"), "/candidate") + (s(fd, "next") ? "" : "?saved=1"));
}

export async function applyToJob(fd: FormData) {
  const user = await requireUser("candidate");
  const jobId = int(fd, "job_id");
  const job = getJob(jobId);
  const back = `/jobs/${jobId}`;
  if (!job || job.status !== "open") fail(back, "This position is no longer open.");
  const profile = getDb().prepare("SELECT completed FROM candidate_profiles WHERE user_id = ?").get(user.id) as { completed: number } | undefined;
  if (!profile?.completed) redirect(`/candidate/profile?next=${encodeURIComponent(back)}&error=${encodeURIComponent("Complete your profile first so the employer knows who you are.")}`);
  getDb()
    .prepare("INSERT OR IGNORE INTO applications (job_id, candidate_id, message) VALUES (?,?,?)")
    .run(jobId, user.id, s(fd, "message"));
  revalidatePath(back);
  redirect(`${back}?applied=1`);
}

export async function withdrawApplication(fd: FormData) {
  const user = await requireUser("candidate");
  getDb()
    .prepare("UPDATE applications SET status='withdrawn', updated_at=datetime('now') WHERE id=? AND candidate_id=? AND status IN ('applied','contacted','interview')")
    .run(int(fd, "application_id"), user.id);
  revalidatePath("/candidate");
  redirect("/candidate");
}

export async function toggleSave(fd: FormData) {
  const user = await requireUser("candidate");
  const jobId = int(fd, "job_id");
  const db = getDb();
  const del = db.prepare("DELETE FROM saved_jobs WHERE user_id=? AND job_id=?").run(user.id, jobId);
  if (!del.changes) db.prepare("INSERT OR IGNORE INTO saved_jobs (user_id, job_id) VALUES (?,?)").run(user.id, jobId);
  redirect(safeNext(s(fd, "next"), `/jobs/${jobId}`));
}

/* ---------------- employer ---------------- */

export async function saveEmployerProfile(fd: FormData) {
  const user = await requireUser("employer");
  const db = getDb();
  const back = "/employer/profile";
  const business = s(fd, "business_name");
  if (!business || !s(fd, "industry") || !s(fd, "city") || !s(fd, "contact_phone")) fail(back, "Business name, industry, city and phone are required.");
  const existing = getEmployerByUser(user.id);
  const common = [
    business, s(fd, "owner_name") || user.name, s(fd, "industry"), s(fd, "business_type") || "retail", s(fd, "city"),
    s(fd, "address"), s(fd, "contact_phone"), int(fd, "years_in_business") || null, int(fd, "staff_count") || null,
    s(fd, "about"), s(fd, "origin_district") || null,
  ];
  if (existing) {
    db.prepare(`UPDATE employers SET business_name=?, owner_name=?, industry=?, business_type=?, city=?, address=?, contact_phone=?,
      years_in_business=?, staff_count=?, about=?, origin_district=? WHERE id=?`).run(...common, existing.id);
  } else {
    db.prepare(`INSERT INTO employers (business_name,owner_name,industry,business_type,city,address,contact_phone,years_in_business,staff_count,about,origin_district,user_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(...common, user.id);
  }
  revalidatePath("/employer");
  redirect(existing ? "/employer/profile?saved=1" : "/employer/verification?welcome=1");
}

export async function submitVerification(fd: FormData) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  if (!emp) redirect("/employer/profile");
  if (!s(fd, "id_proof_note")) fail("/employer/verification", "Tell us which ID proof you will share (e.g. Aadhaar / PAN).");
  getDb()
    .prepare("UPDATE employers SET gst_number=?, id_proof_note=?, verification_status='pending' WHERE id=? AND verification_status != 'verified'")
    .run(s(fd, "gst_number") || null, s(fd, "id_proof_note"), emp!.id);
  redirect("/employer/verification?submitted=1");
}

export async function saveJob(fd: FormData) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  if (!emp) redirect("/employer/profile");
  const id = int(fd, "id");
  const back = id ? `/employer/jobs/${id}/edit` : "/employer/jobs/new";

  const title = s(fd, "title");
  const salary_min = int(fd, "salary_min");
  const salary_max = int(fd, "salary_max") || salary_min;
  const accommodation = ["none", "free", "paid"].includes(s(fd, "accommodation")) ? s(fd, "accommodation") : "none";
  const skills = list(fd, "skills_offered");
  const noDeductions = bool(fd, "no_deductions");
  const deductions = noDeductions ? "No deductions" : s(fd, "deductions");

  if (!title) fail(back, "Add a job title.");
  if (salary_min <= 0) fail(back, "Salary is required — candidates must see pay clearly.");
  if (salary_max < salary_min) fail(back, "Maximum salary cannot be lower than the minimum.");
  if (!s(fd, "hours")) fail(back, "Working hours are required.");
  if (!s(fd, "weekly_holiday")) fail(back, "Weekly holiday is required.");
  if (!deductions) fail(back, "State all deductions, or tick 'No deductions'.");
  if (accommodation !== "none" && !bool(fd, "accommodation_confirmed"))
    fail(back, "Please confirm the accommodation details are accurate, or choose 'Not provided'.");
  if (accommodation !== "none" && !s(fd, "accommodation_details")) fail(back, "Describe the accommodation (where, who shares, what's included).");
  if (skills.length && !bool(fd, "learning_confirmed"))
    fail(back, "Please confirm that you genuinely offer the skills you selected, or untick them.");

  const row = {
    title, industry: s(fd, "industry") || emp!.industry, city: s(fd, "city") || emp!.city, locality: s(fd, "locality"),
    description: s(fd, "description"), responsibilities: s(fd, "responsibilities"),
    salary_min, salary_max, salary_period: s(fd, "salary_period") || "month", hours: s(fd, "hours"),
    weekly_holiday: s(fd, "weekly_holiday"), accommodation,
    accommodation_cost: accommodation === "paid" ? int(fd, "accommodation_cost") : 0,
    accommodation_details: accommodation === "none" ? "" : s(fd, "accommodation_details"),
    accommodation_confirmed: accommodation === "none" ? 0 : 1,
    meals: s(fd, "meals"), benefits: s(fd, "benefits"), deductions, deposit_amount: int(fd, "deposit_amount"),
    education_req: s(fd, "education_req") || "any", experience_req: s(fd, "experience_req") || "fresher",
    languages: JSON.stringify(list(fd, "languages")), skills_offered: JSON.stringify(skills),
    learning_notes: s(fd, "learning_notes"), learning_confirmed: skills.length ? 1 : 0,
    joining_date: s(fd, "joining_date") || null, openings: Math.max(1, int(fd, "openings", 1)),
  };
  const db = getDb();
  let jobId = id;
  if (id) {
    const own = db.prepare("SELECT 1 FROM jobs WHERE id=? AND employer_id=?").get(id, emp!.id);
    if (!own) redirect("/employer");
    const sets = Object.keys(row).map((k) => `${k}=@${k}`).join(", ");
    db.prepare(`UPDATE jobs SET ${sets}, updated_at=datetime('now') WHERE id=@id`).run({ ...row, id });
  } else {
    const cols = Object.keys(row);
    const info = db
      .prepare(`INSERT INTO jobs (employer_id, ${cols.join(",")}) VALUES (@employer_id, ${cols.map((c) => "@" + c).join(",")})`)
      .run({ ...row, employer_id: emp!.id });
    jobId = Number(info.lastInsertRowid);
  }
  revalidatePath("/jobs");
  redirect(`/employer/jobs/${jobId}?${id ? "saved" : "posted"}=1`);
}

export async function setJobStatus(fd: FormData) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  const id = int(fd, "job_id");
  const status = s(fd, "status");
  if (!emp || !["open", "filled", "closed"].includes(status)) redirect("/employer");
  getDb()
    .prepare("UPDATE jobs SET status=?, updated_at=datetime('now') WHERE id=? AND employer_id=? AND status != 'removed'")
    .run(status, id, emp!.id);
  revalidatePath("/jobs");
  redirect(safeNext(s(fd, "next"), `/employer/jobs/${id}`));
}

export async function updateApplication(fd: FormData) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  const appId = int(fd, "application_id");
  const status = s(fd, "status");
  if (!emp || !APPLICATION_STATUSES.some((x) => x.id === status) || status === "withdrawn") redirect("/employer");
  const row = getDb()
    .prepare("SELECT a.id, a.job_id FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.id=? AND j.employer_id=?")
    .get(appId, emp!.id) as { id: number; job_id: number } | undefined;
  if (!row) redirect("/employer");
  getDb()
    .prepare("UPDATE applications SET status=?, employer_note=?, updated_at=datetime('now') WHERE id=?")
    .run(status, s(fd, "employer_note"), appId);
  revalidatePath(`/employer/jobs/${row!.job_id}`);
  redirect(`/employer/jobs/${row!.job_id}?updated=${appId}#app-${appId}`);
}

/* ---------------- reporting & feedback ---------------- */

export async function submitReport(fd: FormData) {
  const user = await getCurrentUser();
  const jobId = int(fd, "job_id");
  const job = getJob(jobId);
  const back = `/jobs/${jobId}/report`;
  if (!user) redirect(`/sign-in`);
  if (!job) redirect("/jobs");
  if (s(fd, "details").length < 10) fail(back, "Please describe what happened (at least a sentence).");
  getDb()
    .prepare("INSERT INTO reports (job_id, employer_id, reporter_id, type, details) VALUES (?,?,?,?,?)")
    .run(jobId, job!.employer_id, user!.id, s(fd, "type") || "other", s(fd, "details"));
  redirect(`/jobs/${jobId}/report?sent=1`);
}

export async function submitFeedback(fd: FormData) {
  const user = await requireUser();
  const appId = int(fd, "application_id");
  const db = getDb();
  const row = db
    .prepare(`SELECT a.id, a.candidate_id, j.employer_id, e.user_id AS employer_user
      FROM applications a JOIN jobs j ON j.id=a.job_id JOIN employers e ON e.id=j.employer_id WHERE a.id=?`)
    .get(appId) as { id: number; candidate_id: number; employer_user: number } | undefined;
  const back = `/feedback/${appId}`;
  if (!row) redirect("/");
  const fromRole = row!.candidate_id === user.id ? "candidate" : row!.employer_user === user.id ? "employer" : null;
  if (!fromRole) redirect("/");
  const rating = Math.min(5, Math.max(1, int(fd, "rating", 0)));
  if (!int(fd, "rating")) fail(back, "Please choose a rating.");
  db.prepare(`INSERT INTO feedback (application_id, from_role, checkpoint, rating, terms_matched, still_working, comment)
      VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(application_id, from_role, checkpoint) DO UPDATE SET rating=excluded.rating, terms_matched=excluded.terms_matched,
        still_working=excluded.still_working, comment=excluded.comment`)
    .run(appId, fromRole, s(fd, "checkpoint") || "joined", rating,
      s(fd, "terms_matched") === "" ? null : s(fd, "terms_matched") === "yes" ? 1 : 0,
      s(fd, "still_working") === "" ? null : s(fd, "still_working") === "yes" ? 1 : 0, s(fd, "comment"));
  redirect(`${back}?thanks=1`);
}

/* ---------------- admin ---------------- */

export async function adminSetVerification(fd: FormData) {
  await requireUser("admin");
  const id = int(fd, "employer_id");
  const decision = s(fd, "decision");
  const validChecks = new Set(VERIFICATION_CHECKS.map((c) => c.id));
  const checks = list(fd, "checks").filter((c) => validChecks.has(c));
  const db = getDb();
  if (decision === "verify") {
    if (checks.length < 2) fail("/admin/employers", "Tick at least two completed checks before verifying.");
    db.prepare("UPDATE employers SET verification_status='verified', verified_checks=?, verification_note=?, verified_at=datetime('now') WHERE id=?")
      .run(JSON.stringify(checks), s(fd, "note") || null, id);
  } else if (decision === "reject") {
    db.prepare("UPDATE employers SET verification_status='rejected', verified_checks='[]', verification_note=?, verified_at=NULL WHERE id=?")
      .run(s(fd, "note") || "Could not verify business.", id);
    db.prepare("UPDATE jobs SET status='removed', removed_reason='Employer failed verification', updated_at=datetime('now') WHERE employer_id=? AND status='open'").run(id);
  } else if (decision === "revoke") {
    db.prepare("UPDATE employers SET verification_status='pending', verified_checks='[]', verified_at=NULL, verification_note=? WHERE id=?")
      .run(s(fd, "note") || null, id);
  }
  revalidatePath("/admin/employers");
  revalidatePath("/jobs");
  redirect("/admin/employers?done=1");
}

export async function adminUpdateReport(fd: FormData) {
  await requireUser("admin");
  const status = ["open", "investigating", "resolved", "dismissed"].includes(s(fd, "status")) ? s(fd, "status") : "open";
  getDb()
    .prepare("UPDATE reports SET status=?, resolution=?, updated_at=datetime('now') WHERE id=?")
    .run(status, s(fd, "resolution") || null, int(fd, "report_id"));
  revalidatePath("/admin/reports");
  redirect("/admin/reports?done=1");
}

export async function adminRemoveJob(fd: FormData) {
  await requireUser("admin");
  const id = int(fd, "job_id");
  const restore = s(fd, "restore") === "1";
  getDb()
    .prepare("UPDATE jobs SET status=?, removed_reason=?, updated_at=datetime('now') WHERE id=?")
    .run(restore ? "open" : "removed", restore ? null : s(fd, "reason") || "Removed by moderator", id);
  revalidatePath("/jobs");
  redirect(safeNext(s(fd, "next"), "/admin/reports"));
}

export async function adminHideFeedback(fd: FormData) {
  await requireUser("admin");
  getDb().prepare("UPDATE feedback SET hidden = 1 - hidden WHERE id=?").run(int(fd, "feedback_id"));
  redirect("/admin/reports");
}
