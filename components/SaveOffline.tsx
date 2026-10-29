"use client";

import { useEffect, useState } from "react";
import { trackClient } from "./Analytics";

const CACHE = "rk-saved-pages-v1";

/** Stores a page in the Cache Storage so the service worker can show it without a connection. */
export function SaveOffline({ path, label, savedLabel, className }: { path: string; label: string; savedLabel: string; className?: string }) {
  const [state, setState] = useState<"unsupported" | "idle" | "saved">("unsupported");
  useEffect(() => {
    if (!("caches" in window) || !("serviceWorker" in navigator)) return;
    caches.open(CACHE).then((c) => c.match(path)).then((hit) => setState(hit ? "saved" : "idle")).catch(() => {});
  }, [path]);
  if (state === "unsupported") return null;
  const save = async () => {
    try {
      const c = await caches.open(CACHE);
      await c.add(new Request(path, { credentials: "include" }));
      setState("saved");
      trackClient("offline_saved", { path });
    } catch { /* offline or quota: leave as is */ }
  };
  return (
    <button type="button" onClick={save} disabled={state === "saved"} className={className}>
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-neel-500">
        {state === "saved" ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <><path d="M12 3.5v12M7 10.5l5 5 5-5" /><path d="M4.5 20h15" /></>}
      </svg>
      {state === "saved" ? savedLabel : label}
    </button>
  );
}
