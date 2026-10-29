import type { Employer, Job } from "./queries";
import { INDUSTRIES, byId, skillsFor, EDUCATION } from "./constants";

export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export const CITY_STATE: Record<string, string> = {
  Surat: "Gujarat", Ahmedabad: "Gujarat", Vadodara: "Gujarat", Rajkot: "Gujarat", Mumbai: "Maharashtra", Pune: "Maharashtra",
  Nagpur: "Maharashtra", "Delhi NCR": "Delhi", Bengaluru: "Karnataka", Hyderabad: "Telangana", Chennai: "Tamil Nadu",
  Coimbatore: "Tamil Nadu", Kolkata: "West Bengal", Indore: "Madhya Pradesh", Jaipur: "Rajasthan", Jodhpur: "Rajasthan", Udaipur: "Rajasthan",
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** schema.org JobPosting so listings can appear in Google's job search. */
export function jobPostingJsonLd(job: Job, emp: Employer) {
  const unit = job.salary_period === "day" ? "DAY" : job.salary_period === "week" ? "WEEK" : "MONTH";
  const skills = skillsFor(job.industry).filter((s) => job.skills_offered.includes(s.id)).map((s) => s.en);
  const parts = [
    job.description && `<p>${esc(job.description)}</p>`,
    job.responsibilities && `<p><strong>Responsibilities:</strong> ${esc(job.responsibilities)}</p>`,
    `<p><strong>Hours:</strong> ${esc(job.hours)}. <strong>Weekly holiday:</strong> ${esc(job.weekly_holiday)}.</p>`,
    `<p><strong>Accommodation:</strong> ${job.accommodation === "none" ? "Not provided" : job.accommodation === "free" ? "Free" : `Provided, ₹${job.accommodation_cost}/month`}${job.accommodation_details ? ` — ${esc(job.accommodation_details)}` : ""}.</p>`,
    `<p><strong>Deductions:</strong> ${esc(job.deductions)}.</p>`,
    skills.length && `<p><strong>What you can learn:</strong> ${esc(skills.join(", "))}.</p>`,
  ].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: parts.join(""),
    identifier: { "@type": "PropertyValue", name: "Rajasthan Kaam", value: String(job.id) },
    datePosted: job.created_at.slice(0, 10),
    ...(job.expires_at ? { validThrough: job.expires_at.replace(" ", "T") + "+00:00" } : {}),
    employmentType: "FULL_TIME",
    industry: byId(INDUSTRIES, job.industry)?.en,
    hiringOrganization: { "@type": "Organization", name: emp.business_name, sameAs: `${siteUrl()}/employers/${emp.id}` },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(job.locality ? { streetAddress: job.locality } : {}),
        addressLocality: job.city === "Delhi NCR" ? "New Delhi" : job.city,
        addressRegion: CITY_STATE[job.city] ?? undefined,
        addressCountry: "IN",
      },
    },
    baseSalary: { "@type": "MonetaryAmount", currency: "INR", value: { "@type": "QuantitativeValue", minValue: job.salary_min, maxValue: job.salary_max, unitText: unit } },
    ...(job.experience_req === "fresher" ? { experienceRequirements: { "@type": "OccupationalExperienceRequirements", monthsOfExperience: 0 } } : {}),
    ...(job.education_req !== "any" ? { educationRequirements: { "@type": "EducationalOccupationalCredential", credentialCategory: byId(EDUCATION, job.education_req)?.en } } : {}),
    ...(job.accommodation === "free" || job.meals ? { jobBenefits: [job.accommodation === "free" && "Free accommodation", job.meals, job.benefits].filter(Boolean).join(", ") } : {}),
    directApply: true,
    url: `${siteUrl()}/jobs/${job.id}`,
  };
}

/** JSON for a <script type="application/ld+json">, with "<" escaped to avoid breaking out of the tag. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
