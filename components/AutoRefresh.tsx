"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetch server data on an interval while the tab is visible (cheap live updates for chat). */
export function AutoRefresh({ ms = 8000 }: { ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") router.refresh(); };
    const id = window.setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [router, ms]);
  return null;
}
