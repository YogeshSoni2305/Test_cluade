"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

const KEY = "rk_sid";

function optedOut(): boolean {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean };
  return n.doNotTrack === "1" || n.globalPrivacyControl === true;
}

function session(): string {
  try {
    let s = sessionStorage.getItem(KEY);
    if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem(KEY, s); }
    return s;
  } catch {
    return "nostorage";
  }
}

/** Fire-and-forget event to the first-party collector. Respects Do Not Track / Global Privacy Control. */
export function trackClient(name: string, props: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined" || optedOut()) return;
  const body = JSON.stringify({ name, props, session: session(), path: location.pathname, referrer: document.referrer || null, utm: new URLSearchParams(location.search).get("utm_source") });
  if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
  else void fetch("/api/events", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
}

export function Analytics() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    trackClient("page_view");
    if (pathname === "/jobs" && [...search.keys()].some((k) => k !== "goal")) trackClient("search", Object.fromEntries([...search.entries()].filter(([k]) => ["industry", "city", "stay", "sort"].includes(k))));
  }, [pathname, search]);
  useReportWebVitals((m) => {
    if (["LCP", "INP", "CLS", "TTFB"].includes(m.name)) trackClient("web_vital", { metric: m.name, value: Math.round(m.name === "CLS" ? m.value * 1000 : m.value), rating: m.rating ?? "" });
  });
  return null;
}

/** Wrap any element to record a click event, e.g. share or apply buttons rendered on the server. */
export function TrackClick({ name, props, children }: { name: string; props?: Record<string, string | number | boolean>; children: React.ReactNode }) {
  return <span className="contents" onClickCapture={() => trackClient(name, props)}>{children}</span>;
}

/** Counts one view per listing per browser session (bots without JS never count). */
export function TrackJobView({ jobId }: { jobId: number }) {
  useEffect(() => {
    try {
      const k = `rk_jv_${jobId}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch { /* storage blocked: still count */ }
    trackClient("job_view", { job: jobId });
  }, [jobId]);
  return null;
}
