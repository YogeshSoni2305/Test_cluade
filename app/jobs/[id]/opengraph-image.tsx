import { ImageResponse } from "next/og";
import { getJob } from "@/lib/queries";
import { ACCOMMODATION, byId } from "@/lib/constants";
import { salaryRange } from "@/lib/format";
import { ogFonts } from "@/lib/ogfonts";

export const alt = "Job listing on Rajasthan Kaam";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The preview card WhatsApp and Facebook show when a family member opens a shared job link. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const job = getJob(Number((await params).id));
  const fonts = await ogFonts();
  const stripe = "repeating-linear-gradient(-45deg, #b0281f 0 12px, #e0a82b 12px 24px, #fdfaf3 24px 30px, #213058 30px 42px, #e0a82b 42px 54px, #fdfaf3 54px 60px)";
  if (!job || job.flagged_reason || job.status === "removed") {
    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#f6efe1", alignItems: "center", justifyContent: "center", fontFamily: "Cormorant", fontSize: 80, color: "#231912" }}>Rajasthan Kaam</div>,
      { ...size, fonts },
    );
  }
  const stay = byId(ACCOMMODATION, job.accommodation)?.en ?? "";
  const noDed = /^no\b/i.test(job.deductions.trim());
  const rows: [string, string][] = [
    ["Salary", salaryRange(job.salary_min, job.salary_max)],
    ["Stay", job.accommodation === "paid" ? `₹${job.accommodation_cost.toLocaleString("en-IN")}/mo` : stay],
    ["Hours", job.hours.length > 26 ? job.hours.slice(0, 25).trimEnd() + "…" : job.hours],
    ["Deductions", noDed ? "None" : "See listing"],
  ];
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#f6efe1", fontFamily: "Mukta", color: "#231912" }}>
        <div style={{ display: "flex", height: 16, backgroundImage: stripe }} />
        <div style={{ display: "flex", flex: 1, padding: "52px 64px", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", width: 64, height: 64, background: "#b0281f", alignItems: "center", justifyContent: "center", color: "#fbf3e3", fontFamily: "Tiro", fontSize: 26 }}>काम</div>
              <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#6a5848" }}>{job.business_name.slice(0, 40)}</div>
            </div>
            <div style={{ display: "flex", marginTop: 28, fontFamily: "Cormorant", fontSize: job.title.length > 28 ? 72 : 88, lineHeight: 1, color: "#231912" }}>{job.title}</div>
            <div style={{ display: "flex", marginTop: 18, fontSize: 32, color: "#6a5848" }}>{job.city}{job.locality ? `, ${job.locality}` : ""}</div>
            <div style={{ display: "flex", marginTop: "auto", alignItems: "center", gap: 10, fontSize: 26, color: "#971d17" }}>
              {job.verification_status === "verified" && (
                <svg width="28" height="28" viewBox="0 0 24 24"><path d="M12 3.2 5 6v5.3c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-2.8Z" fill="#0c5b55" /><path d="m9 12 2.2 2.2L15.5 10" stroke="#fdfaf3" strokeWidth="2" fill="none" /></svg>
              )}
              {job.verification_status === "verified" ? "Verified business · " : ""}Free for candidates
            </div>
          </div>
          <div style={{ display: "flex", width: 440, background: "#fdfaf3", border: "2px solid #dcc9a6" }}>
            <div style={{ display: "flex", width: 10, marginLeft: 14, borderLeft: "2px solid #c9483c", borderRight: "2px solid #c9483c" }} />
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "28px 28px 20px 22px" }}>
            {rows.map(([k, v]) => (
              <div key={k} style={{ display: "flex", flexDirection: "column", borderBottom: "1px solid #ece0c8", paddingBottom: 8, marginBottom: 12, lineHeight: 1.25 }}>
                <div style={{ display: "flex", fontSize: 20, letterSpacing: 2, textTransform: "uppercase", color: "#9a8a78" }}>{k === "Salary" ? `Salary / ${job.salary_period}` : k}</div>
                <div style={{ display: "flex", fontSize: k === "Salary" ? 38 : 28, color: k === "Salary" ? "#7a1612" : k === "Deductions" && noDed ? "#0c5b55" : "#231912" }}>{v}</div>
              </div>
            ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", height: 16, backgroundImage: stripe }} />
      </div>
    ),
    { ...size, fonts },
  );
}
