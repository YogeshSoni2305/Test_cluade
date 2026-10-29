import { getDb } from "./db";

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : null);

/** The pilot metrics from the concept note, computed in one place for the dashboard and CSV export. */
export function pilotMetrics() {
  const db = getDb();
  const n = (sql: string, ...a: unknown[]) => (db.prepare(sql).get(...a) as { n: number }).n;
  const apps = n("SELECT COUNT(*) n FROM applications");
  const interviews = n("SELECT COUNT(*) n FROM applications WHERE status IN ('interview','selected','joined')");
  const hires = n("SELECT COUNT(*) n FROM applications WHERE status IN ('selected','joined')");
  const r30 = n("SELECT COUNT(*) n FROM feedback WHERE checkpoint='30d' AND still_working=1");
  const r30b = n("SELECT COUNT(*) n FROM feedback WHERE checkpoint='30d' AND still_working IS NOT NULL");
  const r90 = n("SELECT COUNT(*) n FROM feedback WHERE checkpoint='90d' AND still_working=1");
  const r90b = n("SELECT COUNT(*) n FROM feedback WHERE checkpoint='90d' AND still_working IS NOT NULL");
  const termsOk = n("SELECT COUNT(*) n FROM feedback WHERE terms_matched=1");
  const termsAll = n("SELECT COUNT(*) n FROM feedback WHERE terms_matched IS NOT NULL");
  const sat = db.prepare("SELECT from_role, AVG(rating) avg, COUNT(*) c FROM feedback GROUP BY from_role").all() as { from_role: string; avg: number; c: number }[];
  return {
    qualified_candidates: n("SELECT COUNT(*) n FROM candidate_profiles WHERE completed=1"),
    searchable_candidates: n("SELECT COUNT(*) n FROM candidate_profiles WHERE completed=1 AND searchable=1"),
    verified_employers: n("SELECT COUNT(*) n FROM employers WHERE verification_status='verified'"),
    pending_verification: n("SELECT COUNT(*) n FROM employers WHERE verification_status='pending'"),
    open_vacancies: n("SELECT COUNT(*) n FROM jobs WHERE status='open' AND flagged_reason IS NULL AND (expires_at IS NULL OR expires_at > datetime('now'))"),
    applications: apps,
    interview_rate_pct: pct(interviews, apps),
    hires,
    retention_30d_pct: pct(r30, r30b),
    retention_90d_pct: pct(r90, r90b),
    listing_accuracy_pct: pct(termsOk, termsAll),
    candidate_satisfaction: sat.find((s) => s.from_role === "candidate")?.avg ?? null,
    employer_satisfaction: sat.find((s) => s.from_role === "employer")?.avg ?? null,
    open_complaints: n("SELECT COUNT(*) n FROM reports WHERE status IN ('open','investigating')"),
    flagged_listings: n("SELECT COUNT(*) n FROM jobs WHERE flagged_reason IS NOT NULL AND status='open'"),
    invitations_sent: n("SELECT COUNT(*) n FROM invitations"),
    hires_via_invite: n("SELECT COUNT(*) n FROM applications WHERE source='invite' AND status IN ('selected','joined')"),
    experience_letters: n("SELECT COUNT(*) n FROM experience_letters WHERE revoked=0"),
  };
}

export type Metrics = ReturnType<typeof pilotMetrics>;

export const METRIC_LABELS: Record<keyof Metrics, string> = {
  qualified_candidates: "Qualified candidates", searchable_candidates: "Discoverable candidates", verified_employers: "Verified employers",
  pending_verification: "Awaiting verification", open_vacancies: "Open vacancies", applications: "Applications",
  interview_rate_pct: "Interview rate %", hires: "Selected / hired", retention_30d_pct: "Retention at 30 days %",
  retention_90d_pct: "Retention at 90 days %", listing_accuracy_pct: "Listings matched reality %",
  candidate_satisfaction: "Candidate satisfaction (1–5)", employer_satisfaction: "Employer satisfaction (1–5)",
  open_complaints: "Open complaints", flagged_listings: "Listings held for review", invitations_sent: "Invitations sent",
  hires_via_invite: "Hires via invitation", experience_letters: "Experience letters issued",
};

/** RFC 4180 CSV with a UTF-8 BOM so Excel opens Hindi text correctly. */
export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  const cols = columns ?? (rows[0] ? Object.keys(rows[0]) : []);
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    // neutralise spreadsheet formula injection
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return "﻿" + [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\r\n") + "\r\n";
}
