export function rupees(n: number): string {
  return "₹" + new Intl.NumberFormat("en-IN").format(n);
}

export function salaryRange(min: number, max: number): string {
  if (!max || max === min) return rupees(min);
  return `${rupees(min)} – ${new Intl.NumberFormat("en-IN").format(max)}`;
}

export function timeAgo(iso: string, lang: "en" | "hi" = "en"): string {
  const then = new Date(iso.replace(" ", "T") + "Z").getTime();
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return lang === "hi" ? "आज" : "today";
  if (days === 1) return lang === "hi" ? "कल" : "yesterday";
  if (days < 30) return lang === "hi" ? `${days} दिन पहले` : `${days}d ago`;
  const m = Math.floor(days / 30);
  return lang === "hi" ? `${m} माह पहले` : `${m}mo ago`;
}

export function monthlySalary(n: number, period: string): number {
  if (period === "day") return n * 26;
  if (period === "week") return n * 4;
  return n;
}
