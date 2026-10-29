import Link from "next/link";
import { btn } from "./ui";

/** Prev/next pagination that preserves the current query string. */
export function Pager({ page, total, perPage, base, params }: { page: number; total: number; perPage: number; base: string; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams(Object.entries({ ...params, page: String(p) }).filter(([, v]) => v) as [string, string][]);
    return `${base}?${q}`;
  };
  return (
    <nav className="mt-6 flex items-center justify-between gap-3 text-[0.92rem]" aria-label="Pagination">
      {page > 1 ? <Link href={href(page - 1)} className={btn("outline", "sm")} rel="prev">← Previous</Link> : <span />}
      <span className="text-ink-soft">Page {page} of {pages} · {total} total</span>
      {page < pages ? <Link href={href(page + 1)} className={btn("outline", "sm")} rel="next">Next →</Link> : <span />}
    </nav>
  );
}
