import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { searchJobs } from "@/lib/queries";
import { siteUrl } from "@/lib/seo";
import { INDUSTRIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const jobs = searchJobs({ sort: "new" });
  const employers = getDb().prepare(`SELECT e.id, MAX(j.updated_at) updated FROM employers e JOIN jobs j ON j.employer_id=e.id
    WHERE e.verification_status != 'rejected' AND j.status='open' AND j.flagged_reason IS NULL GROUP BY e.id`).all() as { id: number; updated: string }[];
  const iso = (s: string) => new Date(s.replace(" ", "T") + "Z");
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/jobs`, changeFrequency: "hourly", priority: 0.9 },
    ...INDUSTRIES.map((i) => ({ url: `${base}/jobs?industry=${i.id}`, changeFrequency: "daily" as const, priority: 0.6 })),
    { url: `${base}/employer`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/safety`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/letters`, changeFrequency: "yearly", priority: 0.3 },
    ...jobs.map((j) => ({ url: `${base}/jobs/${j.id}`, lastModified: iso(j.updated_at), changeFrequency: "daily" as const, priority: 0.8 })),
    ...employers.map((e) => ({ url: `${base}/employers/${e.id}`, lastModified: iso(e.updated), changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
