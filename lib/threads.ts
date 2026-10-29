import { getDb } from "./db";

export type Thread = {
  application_id: number; job_id: number; job_title: string; status: string; share_phone: number; blocked_by: number | null;
  candidate_id: number; candidate_name: string; candidate_phone: string | null;
  employer_user_id: number; business_name: string; employer_phone: string | null; employer_id: number;
};

/** Load a thread only if `userId` is one of its two parties. */
export function getThread(applicationId: number, userId: number): (Thread & { me: "candidate" | "employer" }) | null {
  const t = getDb().prepare(`
    SELECT a.id AS application_id, a.job_id, j.title AS job_title, a.status, a.share_phone, a.blocked_by,
      a.candidate_id, cu.name AS candidate_name, cu.phone_norm AS candidate_phone,
      e.user_id AS employer_user_id, e.business_name, e.contact_phone AS employer_phone, e.id AS employer_id
    FROM applications a JOIN jobs j ON j.id = a.job_id JOIN employers e ON e.id = j.employer_id JOIN users cu ON cu.id = a.candidate_id
    WHERE a.id = ?`).get(applicationId) as Thread | undefined;
  if (!t) return null;
  if (t.candidate_id === userId) return { ...t, me: "candidate" };
  if (t.employer_user_id === userId) return { ...t, me: "employer" };
  return null;
}

export type InboxRow = Thread & { last_body: string | null; last_at: string | null; last_kind: string | null; unread: number };

export function inbox(userId: number): InboxRow[] {
  return getDb().prepare(`
    SELECT a.id AS application_id, a.job_id, j.title AS job_title, a.status, a.share_phone, a.blocked_by,
      a.candidate_id, cu.name AS candidate_name, NULL AS candidate_phone,
      e.user_id AS employer_user_id, e.business_name, NULL AS employer_phone, e.id AS employer_id,
      (SELECT body FROM messages m WHERE m.application_id = a.id ORDER BY m.id DESC LIMIT 1) AS last_body,
      (SELECT kind FROM messages m WHERE m.application_id = a.id ORDER BY m.id DESC LIMIT 1) AS last_kind,
      COALESCE((SELECT created_at FROM messages m WHERE m.application_id = a.id ORDER BY m.id DESC LIMIT 1), a.created_at) AS last_at,
      (SELECT COUNT(*) FROM messages m WHERE m.application_id = a.id AND m.read_at IS NULL AND (m.sender_id IS NULL OR m.sender_id != ?)) AS unread
    FROM applications a JOIN jobs j ON j.id = a.job_id JOIN employers e ON e.id = j.employer_id JOIN users cu ON cu.id = a.candidate_id
    WHERE (a.candidate_id = ? OR e.user_id = ?)
    ORDER BY last_at DESC`).all(userId, userId, userId) as InboxRow[];
}

export function postSystemMessage(applicationId: number, body: string) {
  getDb().prepare("INSERT INTO messages (application_id, sender_id, body, kind) VALUES (?, NULL, ?, 'system')").run(applicationId, body);
}
