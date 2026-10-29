import Link from "next/link";
import type { ReactNode } from "react";

export function cx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type Variant = "primary" | "gold" | "ghost" | "outline" | "danger" | "success";
export function btn(variant: Variant = "primary", size: "sm" | "md" | "lg" = "md", extra = "") {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-marigold-400 disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap";
  const sizes = { sm: "px-4 py-1.5 text-sm", md: "px-6 py-2.5 text-[0.95rem]", lg: "px-8 py-3.5 text-base" };
  const variants: Record<Variant, string> = {
    primary: "bg-indigo-800 text-white hover:bg-indigo-700 shadow-[0_10px_20px_-10px_rgba(30,35,102,.8)]",
    gold: "bg-marigold-400 text-indigo-950 hover:bg-marigold-300 shadow-[0_10px_24px_-10px_rgba(240,160,18,.9)]",
    ghost: "text-indigo-800 hover:bg-indigo-50",
    outline: "border-[1.5px] border-indigo-800/30 text-indigo-800 hover:border-indigo-800 hover:bg-indigo-50 bg-white",
    danger: "bg-rani-600 text-white hover:bg-rani-700",
    success: "bg-leaf-600 text-white hover:bg-leaf-700",
  };
  return cx(base, sizes[size], variants[variant], extra);
}

export function LinkButton({
  href, variant, size, className, children,
}: { href: string; variant?: Variant; size?: "sm" | "md" | "lg"; className?: string; children: ReactNode }) {
  return <Link href={href} className={btn(variant, size, className)}>{children}</Link>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-3xl border border-line bg-white shadow-card", className)}>{children}</div>;
}

const tones: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700",
  indigo: "bg-indigo-100 text-indigo-800",
  marigold: "bg-marigold-300/50 text-marigold-700",
  green: "bg-leaf-100 text-leaf-700",
  rose: "bg-rani-50 text-rani-700",
  cream: "bg-cream-200 text-ink-soft",
};
export function Badge({ tone = "cream", children, className = "" }: { tone?: string; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone] ?? tones.cream, className)}>
      {children}
    </span>
  );
}

export function ShieldIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.6-4.6 1.4 1.4-6 6Z" />
    </svg>
  );
}

export function VerifiedBadge({ status, label, pendingLabel }: { status: string; label: string; pendingLabel: string }) {
  if (status === "verified")
    return <Badge tone="green"><ShieldIcon className="h-3.5 w-3.5" />{label}</Badge>;
  return <Badge tone="slate">{pendingLabel}</Badge>;
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden>
        <path d="M6 38V19C6 9 12 3 20 3s14 6 14 16v19Z" fill={light ? "#f7bd3a" : "#1e2366"} />
        <path d="M12 38V20c0-6 3.5-10 8-10s8 4 8 10v18Z" fill={light ? "#14173f" : "#f7bd3a"} />
        <circle cx="20" cy="22" r="3.2" fill={light ? "#f7bd3a" : "#1e2366"} />
      </svg>
    </span>
  );
}

export function Field({
  label, hint, children, required, className = "",
}: { label: string; hint?: string; children: ReactNode; required?: boolean; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="text-rani-500"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-[0.82rem] leading-snug text-ink-soft">{hint}</span>}
    </label>
  );
}

export function FieldGroup({
  label, hint, children, className = "",
}: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cx("min-w-0", className)}>
      <legend className="mb-2 block text-sm font-semibold text-ink">{label}</legend>
      {children}
      {hint && <p className="mt-1.5 text-[0.82rem] leading-snug text-ink-soft">{hint}</p>}
    </fieldset>
  );
}

export function Chips({
  name, options, selected = [], type = "checkbox",
}: {
  name: string;
  options: { value: string; label: string; icon?: string }[];
  selected?: string[];
  type?: "checkbox" | "radio";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o.value} className="chip relative">
          <input type={type} name={name} value={o.value} defaultChecked={selected.includes(o.value)} />
          <span>{o.icon && <span aria-hidden>{o.icon}</span>}{o.label}</span>
        </label>
      ))}
    </div>
  );
}

export function Tiles({
  name, options, selected = [], type = "checkbox", cols = "sm:grid-cols-2",
}: {
  name: string;
  options: { value: string; title: string; sub?: string; icon?: string }[];
  selected?: string[];
  type?: "checkbox" | "radio";
  cols?: string;
}) {
  return (
    <div className={cx("grid gap-3", cols)}>
      {options.map((o) => (
        <label key={o.value} className="tile relative block">
          <input type={type} name={name} value={o.value} defaultChecked={selected.includes(o.value)} />
          <span className="flex items-start gap-3">
            {o.icon && <span className="text-2xl leading-none" aria-hidden>{o.icon}</span>}
            <span className="block">
              <span className="block font-semibold text-ink">{o.title}</span>
              {o.sub && <span className="mt-0.5 block text-sm text-ink-soft">{o.sub}</span>}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

export function SectionTitle({
  kicker, title, sub, center = false, light = false,
}: { kicker?: string; title: string; sub?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={cx("max-w-2xl", center && "mx-auto text-center")}>
      {kicker && (
        <p className={cx("mb-3 text-xs font-bold uppercase tracking-[0.18em]", light ? "text-marigold-400" : "text-rani-600")}>{kicker}</p>
      )}
      <h2 className={cx("font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl", light ? "text-white" : "text-indigo-900")}>{title}</h2>
      {sub && <p className={cx("mt-3 text-lg leading-relaxed", light ? "text-indigo-100/80" : "text-ink-soft")}>{sub}</p>}
    </div>
  );
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-indigo-900 sm:text-4xl">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-ink-soft">{sub}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Empty({ icon = "🪔", title, sub, action }: { icon?: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-line bg-cream-100/60 px-6 py-14 text-center">
      <div className="text-5xl" aria-hidden>{icon}</div>
      <h3 className="mt-4 font-display text-xl font-semibold text-indigo-900">{title}</h3>
      {sub && <p className="mx-auto mt-2 max-w-md text-ink-soft">{sub}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Stat({ value, label, tone = "indigo" }: { value: ReactNode; label: string; tone?: "indigo" | "gold" | "green" | "rose" }) {
  const colors = { indigo: "text-indigo-800", gold: "text-marigold-600", green: "text-leaf-600", rose: "text-rani-600" };
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className={cx("font-display text-3xl font-semibold", colors[tone])}>{value}</div>
      <div className="mt-1 text-sm text-ink-soft">{label}</div>
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "ok" | "bad"; children: ReactNode }) {
  const t = {
    info: "bg-indigo-50 border-indigo-100 text-indigo-900",
    warn: "bg-marigold-300/30 border-marigold-400/50 text-marigold-700",
    ok: "bg-leaf-50 border-leaf-100 text-leaf-700",
    bad: "bg-rani-50 border-rani-500/30 text-rani-700",
  }[tone];
  return <div className={cx("rounded-2xl border px-4 py-3 text-sm leading-relaxed", t)}>{children}</div>;
}

export function ClarityMeter({ score, label }: { score: number; label: string }) {
  const pct = Math.round((score / 10) * 100);
  const color = score >= 8 ? "bg-leaf-500" : score >= 6 ? "bg-marigold-500" : "bg-rani-500";
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft" title={`${label}: ${score}/10`}>
      <span>{label}</span>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-cream-200">
        <span className={cx("block h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </span>
      <span className="tabular-nums text-ink">{score}</span>
    </div>
  );
}

export function SubmitBar({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-3 z-10 mt-8 flex flex-wrap items-center justify-end gap-3 rounded-full border border-line bg-white/90 p-2.5 shadow-lift backdrop-blur">{children}</div>;
}
