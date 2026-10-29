"use client";

import { useEffect, useState } from "react";

/** Lists job pages stored on this device so they can be read without a connection. */
export function OfflineList({ heading, empty }: { heading: string; empty: string }) {
  const [paths, setPaths] = useState<string[] | null>(null);
  useEffect(() => {
    if (!("caches" in window)) { setPaths([]); return; }
    Promise.all(["rk-saved-pages-v1", "rk-pages-v1"].map((n) => caches.open(n).then((c) => c.keys())))
      .then((lists) => setPaths([...new Set(lists.flat().map((r) => new URL(r.url).pathname).filter((p) => /^\/jobs\/\d+$/.test(p)))]))
      .catch(() => setPaths([]));
  }, []);
  if (paths === null) return null;
  return (
    <div className="mt-10 text-left">
      <h2 className="font-semibold text-ink">{heading}</h2>
      {paths.length === 0 ? <p className="mt-2 text-ink-soft">{empty}</p> : (
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {paths.map((p) => <li key={p}><a href={p} className="block py-3 font-semibold text-sindoor-700 hover:underline">{p.replace("/jobs/", "Job #")}</a></li>)}
        </ul>
      )}
    </div>
  );
}
