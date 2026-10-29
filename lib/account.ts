import { getDb, parseJson } from "./db";

/** Everything we hold about a user, for the "Download my data" export (DPDP right to access). */
export function exportUserData(userId: number) {
  const db = getDb();
  const all = (sql: string, ...args: unknown[]) => db.prepare(sql).all(...args) as Record<string, unknown>[];
  const user = db.prepare("SELECT id, role, name, phone, email, lang, notify_whatsapp, notify_sms, created_at FROM users WHERE id=?").get(userId) as Record<string, unknown>;
  const profile = db.prepare("SELECT * FROM candidate_profiles WHERE user_id=?").get(userId) as Record<string, unknown> | undefined;
  const employer = db.prepare("SELECT * FROM employers WHERE user_id=?").get(userId) as Record<string, unknown> | undefined;
  const parseCols = (r: Record<string, unknown> | undefined, cols: string[]) => {
    if (!r) return r;
    for (const c of cols) r[c] = parseJson(r[c] as string, []);
    return r;
  };
  return {
    exported_at: new Date().toISOString(),
    note: "This file contains the personal data Rajasthan Kaam holds about you.",
    account: user,
    candidate_profile: parseCols(profile, ["languages", "industries", "cities", "goals"]) ?? null,
    business: parseCols(employer, ["verified_checks"]) ?? null,
    listings: employer ? all("SELECT * FROM jobs WHERE employer_id=?", employer.id) : [],
    applications: all(`SELECT a.id, a.job_id, j.title, e.business_name, a.status, a.message, a.share_phone, a.created_at, a.updated_at, a.joined_at, a.left_at
      FROM applications a JOIN jobs j ON j.id=a.job_id JOIN employers e ON e.id=j.employer_id WHERE a.candidate_id=?`, userId),
    messages: all(`SELECT m.application_id, CASE WHEN m.sender_id=? THEN 'you' WHEN m.sender_id IS NULL THEN 'system' ELSE 'them' END AS sender, m.body, m.created_at
      FROM messages m JOIN applications a ON a.id=m.application_id JOIN jobs j ON j.id=a.job_id JOIN employers e ON e.id=j.employer_id
      WHERE a.candidate_id=? OR e.user_id=? ORDER BY m.id`, userId, userId, userId),
    saved_jobs: all("SELECT job_id, created_at FROM saved_jobs WHERE user_id=?", userId),
    job_alerts: all("SELECT label, q, industry, city, min_salary, stay, verified_only, active, created_at FROM job_alerts WHERE user_id=?", userId),
    invitations: all("SELECT job_id, message, status, created_at FROM invitations WHERE candidate_id=?", userId),
    reports_filed: all("SELECT job_id, type, details, status, resolution, created_at FROM reports WHERE reporter_id=?", userId),
    feedback_given: all(`SELECT f.application_id, f.checkpoint, f.rating, f.comment, f.created_at FROM feedback f JOIN applications a ON a.id=f.application_id
      JOIN jobs j ON j.id=a.job_id JOIN employers e ON e.id=j.employer_id
      WHERE (f.from_role='candidate' AND a.candidate_id=?) OR (f.from_role='employer' AND e.user_id=?)`, userId, userId),
    experience_letters: all("SELECT code, business_name, role_title, from_date, to_date, skills, remarks, issued_at, revoked FROM experience_letters WHERE candidate_id=?", userId),
    notifications: all("SELECT kind, title, body, created_at, read_at FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 500", userId),
  };
}

/**
 * Permanently delete a user. Cascades remove their profile, applications, messages, alerts and notifications.
 * Reports they filed stay (reporter set to null) so moderation history is preserved; the audit log keeps only a name.
 */
export function deleteUserData(userId: number) {
  const db = getDb();
  db.transaction(() => {
    db.prepare("UPDATE audit_log SET actor_name = 'deleted user' WHERE actor_id = ?").run(userId);
    db.prepare("UPDATE events SET user_id = NULL WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  })();
}
