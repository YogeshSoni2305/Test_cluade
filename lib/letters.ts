import crypto from "node:crypto";
import { getDb, parseJson } from "./db";

export type Letter = {
  id: number; application_id: number | null; candidate_id: number; candidate_name: string; candidate_district: string | null;
  business_name: string; business_city: string; owner_name: string; employer_verified: number; code: string;
  role_title: string; industry: string; from_date: string; to_date: string; skills: string[]; remarks: string;
  issued_at: string; revoked: number;
};

// no 0/O/1/I so codes can be read out over the phone
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function newLetterCode(): string {
  const bytes = crypto.randomBytes(8);
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
  return `RK-${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}

export function normalizeCode(raw: string): string {
  const c = raw.toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/^RK/, "");
  return c.length === 8 ? `RK-${c.slice(0, 4)}-${c.slice(4)}` : raw.toUpperCase().trim();
}

export function getLetter(code: string): Letter | null {
  const r = getDb().prepare("SELECT * FROM experience_letters WHERE code = ?").get(normalizeCode(code)) as Record<string, unknown> | undefined;
  return r ? ({ ...r, skills: parseJson<string[]>(r.skills as string, []) } as unknown as Letter) : null;
}

export function lettersFor(candidateId: number): Letter[] {
  return (getDb().prepare("SELECT * FROM experience_letters WHERE candidate_id = ? ORDER BY to_date DESC").all(candidateId) as Record<string, unknown>[])
    .map((r) => ({ ...r, skills: parseJson<string[]>(r.skills as string, []) }) as unknown as Letter);
}

/** Whole months between two ISO dates (at least 0). */
export function monthsBetween(from: string, to: string): number {
  const a = new Date(from), b = new Date(to);
  let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) m -= 1;
  return Math.max(0, m);
}

export function durationLabel(from: string, to: string, lang: "en" | "hi" = "en"): string {
  const m = monthsBetween(from, to);
  const y = Math.floor(m / 12), r = m % 12;
  if (lang === "hi") return [y && `${y} साल`, r && `${r} महीने`].filter(Boolean).join(" ") || "1 महीने से कम";
  return [y && `${y} year${y > 1 ? "s" : ""}`, r && `${r} month${r > 1 ? "s" : ""}`].filter(Boolean).join(" ") || "less than a month";
}
