import { getDb, parseJson } from "./db";
import { EDU_RANK } from "./constants";

export type CandidateFilters = { industry?: string; district?: string; city?: string; minEdu?: string; language?: string; stay?: string; goal?: string; q?: string };

export type CandidateCard = {
  id: number; display_name: string; age: number | null; district: string | null; education: string | null;
  languages: string[]; industries: string[]; cities: string[]; goals: string[]; experience: string; learn_notes: string;
  needs_accommodation: number; relocate: number; letters: number; updated_at: string;
};

/** "Mahendra Singh Rathore" → "Mahendra R." — search results never show full names or phone numbers. */
export function displayName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/** Opt-in, completed, non-suspended candidates only. */
export function searchCandidates(f: CandidateFilters, limit = 60): CandidateCard[] {
  const rows = getDb().prepare(`
    SELECT u.id, u.name, cp.*, (SELECT COUNT(*) FROM experience_letters l WHERE l.candidate_id=u.id AND l.revoked=0) AS letters
    FROM candidate_profiles cp JOIN users u ON u.id = cp.user_id
    WHERE cp.searchable = 1 AND cp.completed = 1 AND u.suspended = 0 AND u.role = 'candidate'
    ORDER BY cp.updated_at DESC`).all() as Record<string, unknown>[];
  const out: CandidateCard[] = [];
  for (const r of rows) {
    const c: CandidateCard = {
      id: r.id as number, display_name: displayName(r.name as string), age: r.age as number | null, district: r.district as string | null,
      education: r.education as string | null, languages: parseJson(r.languages as string, []), industries: parseJson(r.industries as string, []),
      cities: parseJson(r.cities as string, []), goals: parseJson(r.goals as string, []), experience: (r.experience as string) ?? "",
      learn_notes: (r.learn_notes as string) ?? "", needs_accommodation: r.needs_accommodation as number, relocate: r.relocate as number,
      letters: r.letters as number, updated_at: r.updated_at as string,
    };
    if (f.industry && !c.industries.includes(f.industry)) continue;
    if (f.district && c.district !== f.district) continue;
    if (f.city && !c.cities.includes(f.city)) continue;
    if (f.language && !c.languages.includes(f.language)) continue;
    if (f.goal && !c.goals.includes(f.goal)) continue;
    if (f.stay === "own" && c.needs_accommodation) continue;
    if (f.minEdu && (EDU_RANK[c.education ?? "below10"] ?? 0) < (EDU_RANK[f.minEdu] ?? 0)) continue;
    if (f.q) {
      const hay = `${c.experience} ${c.learn_notes}`.toLowerCase();
      if (!hay.includes(f.q.toLowerCase())) continue;
    }
    out.push(c);
    if (out.length >= limit) break;
  }
  return out;
}
