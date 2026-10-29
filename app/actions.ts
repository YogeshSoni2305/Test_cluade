"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb, normalizePhone } from "@/lib/db";
import { BYPASS, DEV_COOKIE, getCurrentUser, requireAdmin, requireUser, type User } from "@/lib/auth";
import { getEmployerByUser, getJob, isPubliclyVisible } from "@/lib/queries";
import { APPLICATION_STATUSES, REPORT_TYPES, VERIFICATION_CHECKS, byId } from "@/lib/constants";
import { s, list, int, bool, safeNext, fail, withParam } from "@/lib/form";
import { checkHuman } from "@/lib/antibot";
import { checkLimit } from "@/lib/ratelimit";
import { flagReason, normalizeGst } from "@/lib/moderation";
import { notify, type Notice } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { notifyAlertMatches } from "@/lib/alerts";
import { track } from "@/lib/analytics";
import { postSystemMessage } from "@/lib/threads";

const actor = (u: User) => ({ id: u.id, name: u.name });

/** Another account already uses this phone number? */
function phoneTaken(phoneNorm: string | null, exceptUserId?: number): boolean {
  if (!phoneNorm) return false;
  return Boolean(getDb().prepare("SELECT 1 FROM users WHERE phone_norm = ? AND id != ?").get(phoneNorm, exceptUserId ?? 0));
}

function notifyStaff(perm: "verify" | "moderate", n: Notice) {
  const col = perm === "verify" ? "('super','verifier')" : "('super','moderator')";
  const admins = getDb().prepare(`SELECT id FROM users WHERE role='admin' AND suspended=0 AND COALESCE(admin_role,'super') IN ${col}`).all() as { id: number }[];
  for (const a of admins) notify(a.id, n);
}

/* ---------------- language & dev auth ---------------- */

export async function setLang(fd: FormData) {
  const lang = s(fd, "lang") === "hi" ? "hi" : "en";
  (await cookies()).set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  const user = await getCurrentUser();
  if (user) getDb().prepare("UPDATE users SET lang = ? WHERE id = ?").run(lang, user.id);
  // go back to the page the toggle was pressed on
  const ref = (await headers()).get("referer");
  let back = "/";
  try {
    if (ref) { const u = new URL(ref); back = u.pathname + u.search; }
  } catch { /* ignore malformed referer */ }
  redirect(safeNext(back));
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
  const back = "/dev-login?signup=1";
  const human = await checkHuman(fd);
  if (human) fail(back, human);
  const limited = await checkLimit("signup");
  if (limited) fail(back, limited);
  const name = s(fd, "name") || "Test user";
  const phone = s(fd, "phone");
  const phoneNorm = normalizePhone(phone);
  if (phone && !phoneNorm) fail(back, "Enter a valid 10-digit Indian mobile number.");
  if (phoneTaken(phoneNorm)) fail(back, "An account with this mobile number already exists. Sign in instead.");
  const role = s(fd, "role") === "employer" ? "employer" : s(fd, "role") === "admin" ? "admin" : "candidate";
  const info = getDb().prepare("INSERT INTO users (role,name,phone,phone_norm) VALUES (?,?,?,?)").run(role, name, phoneNorm ?? (phone || null), phoneNorm);
  (await cookies()).set(DEV_COOKIE, String(info.lastInsertRowid), { path: "/", httpOnly: true, sameSite: "lax" });
  track("signup", { role }, { userId: Number(info.lastInsertRowid) });
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
  const human = await checkHuman(fd);
  if (human) fail("/onboarding", human);
  const role = s(fd, "role") === "employer" ? "employer" : "candidate";
  const phoneNorm = normalizePhone(s(fd, "phone")) ?? user!.phone_norm;
  if (s(fd, "phone") && !normalizePhone(s(fd, "phone"))) fail("/onboarding", "Enter a valid 10-digit Indian mobile number.");
  if (phoneTaken(phoneNorm, user!.id)) fail("/onboarding", "Another account already uses this mobile number.");
  getDb()
    .prepare("UPDATE users SET role = ?, name = COALESCE(NULLIF(?, ''), name), phone = COALESCE(?, phone), phone_norm = COALESCE(?, phone_norm) WHERE id = ?")
    .run(role, s(fd, "name"), phoneNorm, phoneNorm, user!.id);
  track("signup", { role }, { userId: user!.id });
  redirect(role === "employer" ? "/employer/profile" : "/candidate/profile");
}

/* ---------------- candidate ---------------- */

export async function saveCandidateProfile(fd: FormData) {
  const user = await requireUser("candidate");
  const db = getDb();
  const back = `/candidate/profile?mode=${s(fd, "mode") === "simple" ? "simple" : "full"}`;
  const name = s(fd, "name");
  if (!name) fail(back, "Please enter your name.");
  if (!s(fd, "district")) fail(back, "Please choose your district in Rajasthan.");
  const phone = s(fd, "phone");
  const phoneNorm = normalizePhone(phone);
  if (phone && !phoneNorm) fail(back, "Enter a valid 10-digit Indian mobile number.");
  if (phoneTaken(phoneNorm, user.id)) fail(back, "Another account already uses this mobile number.");
  const familyPhone = s(fd, "family_phone");
  if (familyPhone && !normalizePhone(familyPhone)) fail(back, "Family phone must be a valid 10-digit Indian mobile number.");
  db.prepare("UPDATE users SET name = ?, phone = COALESCE(?, phone), phone_norm = COALESCE(?, phone_norm) WHERE id = ?").run(name, phoneNorm, phoneNorm, user.id);
  const wasComplete = Boolean((db.prepare("SELECT completed FROM candidate_profiles WHERE user_id=?").get(user.id) as { completed: number } | undefined)?.completed);
  const vals = [
    s(fd, "district"), s(fd, "education"), JSON.stringify(list(fd, "languages")), s(fd, "experience"),
    JSON.stringify(list(fd, "industries")), JSON.stringify(list(fd, "cities")), bool(fd, "relocate") ? 1 : 0,
    bool(fd, "needs_accommodation") ? 1 : 0, JSON.stringify(list(fd, "goals")), s(fd, "learn_notes"),
    int(fd, "age") || null, s(fd, "family_name") || null, normalizePhone(familyPhone), bool(fd, "searchable") ? 1 : 0,
  ];
  db.prepare(`INSERT INTO candidate_profiles
      (user_id,district,education,languages,experience,industries,cities,relocate,needs_accommodation,goals,learn_notes,age,family_name,family_phone,searchable,completed,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET district=excluded.district, education=excluded.education, languages=excluded.languages,
        experience=excluded.experience, industries=excluded.industries, cities=excluded.cities, relocate=excluded.relocate,
        needs_accommodation=excluded.needs_accommodation, goals=excluded.goals, learn_notes=excluded.learn_notes, age=excluded.age,
        family_name=excluded.family_name, family_phone=excluded.family_phone, searchable=excluded.searchable, completed=1, updated_at=datetime('now')`)
    .run(user.id, ...vals);
  if (!wasComplete) track("profile_completed", { mode: s(fd, "mode") || "full" }, { userId: user.id });
  revalidatePath("/candidate");
  const next = s(fd, "next");
  redirect(next ? safeNext(next, "/candidate") : "/candidate?saved=1");
}

export async function applyToJob(fd: FormData) {
  const user = await requireUser("candidate");
  const jobId = int(fd, "job_id");
  const job = getJob(jobId);
  const back = `/jobs/${jobId}`;
  if (!job || !isPubliclyVisible(job)) fail(back, "This position is no longer open.");
  const human = await checkHuman(fd);
  if (human) fail(back, human);
  const limited = (await checkLimit("applyBurst", user.id)) ?? (await checkLimit("apply", user.id));
  if (limited) fail(back, limited);
  const db = getDb();
  const profile = db.prepare("SELECT completed FROM candidate_profiles WHERE user_id = ?").get(user.id) as { completed: number } | undefined;
  if (!profile?.completed) redirect(`/candidate/profile?next=${encodeURIComponent(back)}&error=${encodeURIComponent("Complete your profile first so the employer knows who you are.")}`);
  const message = s(fd, "message").slice(0, 1000);
  const flag = flagReason(message);
  if (flag) fail(back, "Your note was blocked because it looks like spam or mentions payments. Please rewrite it.");
  const info = db
    .prepare("INSERT OR IGNORE INTO applications (job_id, candidate_id, message, share_phone, source) VALUES (?,?,?,?,?)")
    .run(jobId, user.id, message, bool(fd, "share_phone") ? 1 : 0, s(fd, "source") === "invite" ? "invite" : "direct");
  if (info.changes) {
    const appId = Number(info.lastInsertRowid);
    if (message) db.prepare("INSERT INTO messages (application_id, sender_id, body) VALUES (?,?,?)").run(appId, user.id, message);
    db.prepare("UPDATE invitations SET status='accepted', responded_at=datetime('now') WHERE job_id=? AND candidate_id=? AND status='pending'").run(jobId, user.id);
    const empUser = (db.prepare("SELECT e.user_id FROM employers e WHERE e.id = ?").get(job!.employer_id) as { user_id: number }).user_id;
    notify(empUser, {
      kind: "application_new",
      en: { title: `New applicant for ${job!.title}`, body: `${user.name} applied.` },
      hi: { title: `${job!.title} के लिए नया आवेदन`, body: `${user.name} ने आवेदन किया।` },
      link: `/employer/jobs/${jobId}#app-${appId}`,
    });
    track("applied", { job: jobId, share_phone: bool(fd, "share_phone") }, { userId: user.id });
  }
  revalidatePath(back);
  redirect(`${back}?applied=1`);
}

export async function withdrawApplication(fd: FormData) {
  const user = await requireUser("candidate");
  const appId = int(fd, "application_id");
  const db = getDb();
  const res = db
    .prepare("UPDATE applications SET status='withdrawn', updated_at=datetime('now') WHERE id=? AND candidate_id=? AND status IN ('applied','contacted','interview')")
    .run(appId, user.id);
  if (res.changes) {
    const row = db.prepare("SELECT j.title, e.user_id FROM applications a JOIN jobs j ON j.id=a.job_id JOIN employers e ON e.id=j.employer_id WHERE a.id=?").get(appId) as { title: string; user_id: number };
    notify(row.user_id, {
      kind: "application_status",
      en: { title: `${user.name} withdrew their application`, body: row.title },
      hi: { title: `${user.name} ने आवेदन वापस लिया`, body: row.title },
      link: "/employer",
    });
  }
  revalidatePath("/candidate");
  redirect("/candidate");
}

export async function toggleSave(fd: FormData) {
  const user = await requireUser("candidate");
  const jobId = int(fd, "job_id");
  const db = getDb();
  const del = db.prepare("DELETE FROM saved_jobs WHERE user_id=? AND job_id=?").run(user.id, jobId);
  if (!del.changes) {
    db.prepare("INSERT OR IGNORE INTO saved_jobs (user_id, job_id) VALUES (?,?)").run(user.id, jobId);
    track("save_job", { job: jobId }, { userId: user.id });
  }
  redirect(safeNext(s(fd, "next"), `/jobs/${jobId}`));
}

/* ---------------- employer ---------------- */

export async function saveEmployerProfile(fd: FormData) {
  const user = await requireUser("employer");
  const db = getDb();
  const back = "/employer/profile";
  const business = s(fd, "business_name");
  if (!business || !s(fd, "industry") || !s(fd, "city") || !s(fd, "contact_phone")) fail(back, "Business name, industry, city and phone are required.");
  const contact = normalizePhone(s(fd, "contact_phone"));
  if (!contact) fail(back, "Enter a valid 10-digit Indian mobile number for the business.");
  const existing = getEmployerByUser(user.id);
  const dupe = db.prepare("SELECT business_name FROM employers WHERE contact_phone = ? AND user_id != ?").get(contact, user.id) as { business_name: string } | undefined;
  const common = [
    business, s(fd, "owner_name") || user.name, s(fd, "industry"), s(fd, "business_type") || "retail", s(fd, "city"),
    s(fd, "address"), contact, int(fd, "years_in_business") || null, int(fd, "staff_count") || null,
    s(fd, "about"), s(fd, "origin_district") || null, dupe ? `Same phone as "${dupe.business_name}"` : null,
  ];
  let id = existing?.id;
  if (existing) {
    db.prepare(`UPDATE employers SET business_name=?, owner_name=?, industry=?, business_type=?, city=?, address=?, contact_phone=?,
      years_in_business=?, staff_count=?, about=?, origin_district=?, flagged_reason=COALESCE(?, flagged_reason) WHERE id=?`).run(...common, existing.id);
  } else {
    id = Number(db.prepare(`INSERT INTO employers (business_name,owner_name,industry,business_type,city,address,contact_phone,years_in_business,staff_count,about,origin_district,flagged_reason,user_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(...common, user.id).lastInsertRowid);
  }
  audit(actor(user), existing ? "employer.update" : "employer.create", "employer", id ?? null, dupe ? { duplicate_of: dupe.business_name } : {});
  revalidatePath("/employer");
  redirect(existing ? "/employer/profile?saved=1" : "/employer/verification?welcome=1");
}

export async function submitVerification(fd: FormData) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  if (!emp) redirect("/employer/profile");
  const back = "/employer/verification";
  if (!s(fd, "id_proof_note")) fail(back, "Tell us which ID proof you will share (e.g. Aadhaar / PAN).");
  const gstRaw = s(fd, "gst_number");
  const gst = normalizeGst(gstRaw);
  if (gstRaw && !gst) fail(back, "That GST number doesn’t look valid — it should be 15 characters, e.g. 08ABCDE1234F1Z5.");
  if (gst) {
    const other = getDb().prepare("SELECT business_name FROM employers WHERE gst_norm = ? AND id != ?").get(gst, emp!.id) as { business_name: string } | undefined;
    if (other) fail(back, "This GST number is already registered to another business on the platform. Contact support if this is a mistake.");
  }
  getDb()
    .prepare("UPDATE employers SET gst_number=?, gst_norm=?, id_proof_note=?, verification_status='pending' WHERE id=? AND verification_status != 'verified'")
    .run(gst, gst, s(fd, "id_proof_note"), emp!.id);
  audit(actor(user), "employer.verification_submitted", "employer", emp!.id, { gst });
  notifyStaff("verify", {
    kind: "verification",
    en: { title: `Verification request: ${emp!.business_name}`, body: emp!.city },
    hi: { title: `सत्यापन अनुरोध: ${emp!.business_name}`, body: emp!.city },
    link: "/admin/employers?status=pending",
  });
  redirect("/employer/verification?submitted=1");
}

export async function saveJob(fd: FormData) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  if (!emp) redirect("/employer/profile");
  const id = int(fd, "id");
  const back = id ? `/employer/jobs/${id}/edit` : "/employer/jobs/new";
  if (!id) {
    const limited = await checkLimit("post", user.id);
    if (limited) fail(back, limited);
  }

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
    description_hi: s(fd, "description_hi"), responsibilities_hi: s(fd, "responsibilities_hi"), learning_notes_hi: s(fd, "learning_notes_hi"),
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
    flagged_reason: flagReason(title, s(fd, "description"), s(fd, "responsibilities"), deductions, s(fd, "benefits"), s(fd, "description_hi"), s(fd, "responsibilities_hi")),
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
      .prepare(`INSERT INTO jobs (employer_id, expires_at, ${cols.join(",")}) VALUES (@employer_id, datetime('now','+30 days'), ${cols.map((c) => "@" + c).join(",")})`)
      .run({ ...row, employer_id: emp!.id });
    jobId = Number(info.lastInsertRowid);
    track("job_posted", { job: jobId, industry: row.industry, city: row.city }, { userId: user.id });
  }
  audit(actor(user), id ? "job.update" : "job.create", "job", jobId, row.flagged_reason ? { flagged: row.flagged_reason } : {});
  if (row.flagged_reason) {
    notifyStaff("moderate", {
      kind: "report_update",
      en: { title: `Listing held for review: ${title}`, body: row.flagged_reason },
      hi: { title: `लिस्टिंग समीक्षा में: ${title}`, body: row.flagged_reason },
      link: "/admin/reports?tab=flagged",
    });
  } else if (!id) {
    notifyAlertMatches(jobId);
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
  const res = getDb()
    .prepare("UPDATE jobs SET status=?, updated_at=datetime('now') WHERE id=? AND employer_id=? AND status != 'removed'")
    .run(status, id, emp!.id);
  if (res.changes) audit(actor(user), `job.${status}`, "job", id);
  revalidatePath("/jobs");
  redirect(safeNext(s(fd, "next"), `/employer/jobs/${id}`));
}

export async function updateApplication(fd: FormData) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  const appId = int(fd, "application_id");
  const status = s(fd, "status");
  if (!emp || !APPLICATION_STATUSES.some((x) => x.id === status) || status === "withdrawn") redirect("/employer");
  const db = getDb();
  const row = db
    .prepare("SELECT a.id, a.job_id, a.status, a.candidate_id, j.title FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.id=? AND j.employer_id=?")
    .get(appId, emp!.id) as { id: number; job_id: number; status: string; candidate_id: number; title: string } | undefined;
  if (!row) redirect("/employer");
  db.prepare(`UPDATE applications SET status=?, employer_note=?, updated_at=datetime('now'),
      joined_at = CASE WHEN ? = 'joined' AND joined_at IS NULL THEN COALESCE(NULLIF(?, ''), date('now')) ELSE joined_at END
      WHERE id=?`)
    .run(status, s(fd, "employer_note"), status, s(fd, "joined_at"), appId);
  if (row!.status !== status) {
    const st = byId([...APPLICATION_STATUSES], status)!;
    notify(row!.candidate_id, {
      kind: "application_status",
      en: { title: `${emp!.business_name}: ${st.en}`, body: row!.title },
      hi: { title: `${emp!.business_name}: ${st.hi}`, body: row!.title },
      link: "/candidate",
    });
    audit(actor(user), "application.status", "application", appId, { from: row!.status, to: status });
    postSystemMessage(appId, `status:${status}`);
  }
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
  if (user!.suspended) redirect("/suspended");
  if (!job) redirect("/jobs");
  const human = await checkHuman(fd);
  if (human) fail(back, human);
  const limited = await checkLimit("report", user!.id);
  if (limited) fail(back, limited);
  const details = s(fd, "details").slice(0, 4000);
  if (details.length < 10) fail(back, "Please describe what happened (at least a sentence).");
  const dupe = getDb().prepare("SELECT 1 FROM reports WHERE job_id=? AND reporter_id=? AND status IN ('open','investigating')").get(jobId, user!.id);
  if (dupe) fail(back, "You already have an open report about this listing. Our team is looking into it.");
  const type = byId(REPORT_TYPES, s(fd, "type"))?.id ?? "other";
  const info = getDb()
    .prepare("INSERT INTO reports (job_id, employer_id, reporter_id, type, details) VALUES (?,?,?,?,?)")
    .run(jobId, job!.employer_id, user!.id, type, details);
  audit(actor(user!), "report.create", "report", Number(info.lastInsertRowid), { job: jobId, type });
  notifyStaff("moderate", {
    kind: "report_update",
    en: { title: `New report: ${byId(REPORT_TYPES, type)?.en}`, body: `${job!.business_name} — ${job!.title}` },
    hi: { title: `नई शिकायत: ${byId(REPORT_TYPES, type)?.hi}`, body: `${job!.business_name} — ${job!.title}` },
    link: "/admin/reports",
  });
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
  const checkpoint = ["joined", "30d", "90d"].includes(s(fd, "checkpoint")) ? s(fd, "checkpoint") : "joined";
  const comment = s(fd, "comment").slice(0, 2000);
  // reviews with scam/spam signals are hidden until a moderator looks at them
  const hidden = flagReason(comment) ? 1 : 0;
  db.prepare(`INSERT INTO feedback (application_id, from_role, checkpoint, rating, terms_matched, still_working, comment, hidden)
      VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(application_id, from_role, checkpoint) DO UPDATE SET rating=excluded.rating, terms_matched=excluded.terms_matched,
        still_working=excluded.still_working, comment=excluded.comment, hidden=excluded.hidden`)
    .run(appId, fromRole, checkpoint, rating,
      s(fd, "terms_matched") === "" ? null : s(fd, "terms_matched") === "yes" ? 1 : 0,
      s(fd, "still_working") === "" ? null : s(fd, "still_working") === "yes" ? 1 : 0, comment, hidden);
  redirect(`${back}?thanks=1`);
}

/* ---------------- admin ---------------- */

export async function adminSetVerification(fd: FormData) {
  const admin = await requireAdmin("verify");
  const id = int(fd, "employer_id");
  const decision = s(fd, "decision");
  const validChecks = new Set(VERIFICATION_CHECKS.map((c) => c.id));
  const checks = list(fd, "checks").filter((c) => validChecks.has(c));
  const db = getDb();
  const emp = db.prepare("SELECT user_id, business_name FROM employers WHERE id=?").get(id) as { user_id: number; business_name: string } | undefined;
  if (!emp) redirect("/admin/employers");
  const note = s(fd, "note");
  if (decision === "verify") {
    if (checks.length < 2) fail("/admin/employers", "Tick at least two completed checks before verifying.");
    db.prepare("UPDATE employers SET verification_status='verified', verified_checks=?, verification_note=?, verified_at=datetime('now'), flagged_reason=NULL WHERE id=?")
      .run(JSON.stringify(checks), note || null, id);
    notify(emp!.user_id, {
      kind: "verification",
      en: { title: "Your business is verified", body: "Your listings now carry the verification stamp." },
      hi: { title: "आपका कारोबार सत्यापित हो गया", body: "अब आपकी लिस्टिंग पर सत्यापन मुहर दिखेगी।" },
      link: "/employer/verification",
    });
  } else if (decision === "reject") {
    db.prepare("UPDATE employers SET verification_status='rejected', verified_checks='[]', verification_note=?, verified_at=NULL WHERE id=?")
      .run(note || "Could not verify business.", id);
    db.prepare("UPDATE jobs SET status='removed', removed_reason='Employer failed verification', updated_at=datetime('now') WHERE employer_id=? AND status='open'").run(id);
    notify(emp!.user_id, {
      kind: "verification",
      en: { title: "Verification was declined", body: note || "We could not verify your business." },
      hi: { title: "सत्यापन अस्वीकृत", body: note || "हम आपके कारोबार का सत्यापन नहीं कर सके।" },
      link: "/employer/verification",
    });
  } else if (decision === "revoke") {
    db.prepare("UPDATE employers SET verification_status='pending', verified_checks='[]', verified_at=NULL, verification_note=? WHERE id=?")
      .run(note || null, id);
  } else if (decision === "clear_flag") {
    db.prepare("UPDATE employers SET flagged_reason=NULL WHERE id=?").run(id);
  }
  audit(actor(admin), `employer.${decision}`, "employer", id, { checks, note });
  revalidatePath("/admin/employers");
  revalidatePath("/jobs");
  redirect(withParam(safeNext(s(fd, "next"), "/admin/employers"), "done", "1"));
}

function applyReportStatus(admin: User, reportId: number, status: string, resolution: string | null) {
  const db = getDb();
  const r = db.prepare("SELECT reporter_id, status, job_id FROM reports WHERE id=?").get(reportId) as { reporter_id: number | null; status: string; job_id: number | null } | undefined;
  if (!r) return;
  db.prepare("UPDATE reports SET status=?, resolution=COALESCE(?, resolution), updated_at=datetime('now') WHERE id=?").run(status, resolution, reportId);
  audit({ id: admin.id, name: admin.name }, "report.status", "report", reportId, { from: r.status, to: status, resolution });
  if (r.reporter_id && r.status !== status && ["investigating", "resolved", "dismissed"].includes(status)) {
    const en = { investigating: "We’re looking into your report", resolved: "Your report has been resolved", dismissed: "Your report was reviewed" }[status]!;
    const hi = { investigating: "हम आपकी शिकायत की जाँच कर रहे हैं", resolved: "आपकी शिकायत का समाधान हुआ", dismissed: "आपकी शिकायत की समीक्षा हुई" }[status]!;
    notify(r.reporter_id, { kind: "report_update", en: { title: en, body: resolution ?? "" }, hi: { title: hi, body: resolution ?? "" }, link: "/notifications" });
  }
}

export async function adminUpdateReport(fd: FormData) {
  const admin = await requireAdmin("moderate");
  const status = ["open", "investigating", "resolved", "dismissed"].includes(s(fd, "status")) ? s(fd, "status") : "open";
  applyReportStatus(admin, int(fd, "report_id"), status, s(fd, "resolution") || null);
  revalidatePath("/admin/reports");
  redirect(withParam(safeNext(s(fd, "next"), "/admin/reports"), "done", "1"));
}

export async function adminBulkReports(fd: FormData) {
  const admin = await requireAdmin("moderate");
  const status = ["investigating", "resolved", "dismissed"].includes(s(fd, "bulk_status")) ? s(fd, "bulk_status") : null;
  const ids = list(fd, "ids").map(Number).filter(Boolean);
  if (status) for (const id of ids) applyReportStatus(admin, id, status, s(fd, "bulk_resolution") || null);
  redirect(`/admin/reports?done=${ids.length}`);
}

function setJobRemoved(admin: User, jobId: number, restore: boolean, reason: string) {
  const db = getDb();
  const job = db.prepare("SELECT j.title, e.user_id FROM jobs j JOIN employers e ON e.id=j.employer_id WHERE j.id=?").get(jobId) as { title: string; user_id: number } | undefined;
  if (!job) return;
  db.prepare("UPDATE jobs SET status=?, removed_reason=?, flagged_reason=CASE WHEN ? THEN NULL ELSE flagged_reason END, updated_at=datetime('now') WHERE id=?")
    .run(restore ? "open" : "removed", restore ? null : reason, restore ? 1 : 0, jobId);
  audit({ id: admin.id, name: admin.name }, restore ? "job.restore" : "job.remove", "job", jobId, { reason });
  notify(job.user_id, restore
    ? { kind: "report_update", en: { title: `Listing restored: ${job.title}` }, hi: { title: `लिस्टिंग फिर से चालू: ${job.title}` }, link: `/employer/jobs/${jobId}` }
    : { kind: "report_update", en: { title: `Listing removed: ${job.title}`, body: reason }, hi: { title: `लिस्टिंग हटाई गई: ${job.title}`, body: reason }, link: `/employer/jobs/${jobId}` });
}

export async function adminRemoveJob(fd: FormData) {
  const admin = await requireAdmin("moderate");
  setJobRemoved(admin, int(fd, "job_id"), s(fd, "restore") === "1", s(fd, "reason") || "Removed by moderator");
  revalidatePath("/jobs");
  redirect(safeNext(s(fd, "next"), "/admin/reports"));
}

export async function adminBulkJobs(fd: FormData) {
  const admin = await requireAdmin("moderate");
  const op = s(fd, "bulk_op");
  const ids = list(fd, "ids").map(Number).filter(Boolean);
  for (const id of ids) {
    if (op === "remove") setJobRemoved(admin, id, false, s(fd, "bulk_reason") || "Removed by moderator");
    if (op === "restore") setJobRemoved(admin, id, true, "");
  }
  revalidatePath("/jobs");
  redirect(`/admin/jobs?done=${ids.length}`);
}

export async function adminClearJobFlag(fd: FormData) {
  const admin = await requireAdmin("moderate");
  const id = int(fd, "job_id");
  getDb().prepare("UPDATE jobs SET flagged_reason=NULL, updated_at=datetime('now') WHERE id=?").run(id);
  audit(actor(admin), "job.clear_flag", "job", id);
  notifyAlertMatches(id);
  revalidatePath("/jobs");
  redirect(safeNext(s(fd, "next"), "/admin/reports?tab=flagged"));
}

export async function adminHideFeedback(fd: FormData) {
  const admin = await requireAdmin("moderate");
  const id = int(fd, "feedback_id");
  getDb().prepare("UPDATE feedback SET hidden = 1 - hidden WHERE id=?").run(id);
  audit(actor(admin), "feedback.toggle_hidden", "feedback", id);
  redirect(safeNext(s(fd, "next"), "/admin/reports?tab=reviews"));
}
