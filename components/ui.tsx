import Link from "next/link";
import type { ReactNode } from "react";
import { Seal, Ornament } from "./ornaments";
import { IInbox, IShield } from "./icons";

export function cx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type Variant = "primary" | "gold" | "ghost" | "outline" | "danger" | "success" | "ink";
export function btn(variant: Variant = "primary", size: "sm" | "md" | "lg" = "md", extra = "") {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[3px] font-semibold tracking-[0.01em] transition duration-150 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haldi-400 disabled:opacity-45 disabled:pointer-events-none cursor-pointer whitespace-nowrap";
  const sizes = { sm: "px-3.5 py-1.5 text-[0.9rem]", md: "px-5 py-2.5 text-[0.98rem]", lg: "px-7 py-3.5 text-[1.05rem]" };
  const variants: Record<Variant, string> = {
    primary: "bg-sindoor-600 text-paper-50 hover:bg-sindoor-700 shadow-[inset_0_-2px_0_rgba(0,0,0,.18)]",
    gold: "bg-haldi-400 text-ink hover:bg-haldi-300 shadow-[inset_0_-2px_0_rgba(0,0,0,.12)]",
    ink: "bg-ink text-paper-50 hover:bg-neel-800",
    ghost: "text-ink-soft hover:text-ink hover:bg-paper-200/70",
    outline: "border border-ink/25 text-ink hover:border-ink hover:bg-paper-50 bg-transparent",
    danger: "bg-sindoor-700 text-paper-50 hover:bg-sindoor-800",
    success: "bg-peacock-600 text-paper-50 hover:bg-peacock-700",
  };
  return cx(base, sizes[size], variants[variant], extra);
}

export function LinkButton({
  href, variant, size, className, children,
}: { href: string; variant?: Variant; size?: "sm" | "md" | "lg"; className?: string; children: ReactNode }) {
  return <Link href={href} className={btn(variant, size, className)}>{children}</Link>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-[4px] border border-line bg-paper-50 shadow-card", className)}>{children}</div>;
}

const tones: Record<string, string> = {
  slate: "bg-paper-200 text-ink-soft",
  indigo: "bg-neel-50 text-neel-700",
  marigold: "bg-haldi-100 text-haldi-700",
  green: "bg-peacock-50 text-peacock-700",
  rose: "bg-sindoor-50 text-sindoor-700",
  cream: "bg-paper-200/70 text-ink-soft",
};
export function Badge({ tone = "cream", children, className = "" }: { tone?: string; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-[2px] px-2 py-0.5 text-[0.8rem] font-semibold leading-5", tones[tone] ?? tones.cream, className)}>
      {children}
    </span>
  );
}

export function ShieldIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <IShield className={className} />;
}

export function VerifiedBadge({ status, label, pendingLabel }: { status: string; label: string; pendingLabel: string }) {
  if (status === "verified")
    return <Badge tone="green"><IShield size={14} />{label}</Badge>;
  return <Badge tone="slate" className="border border-dashed border-ink-faint/50 !bg-transparent">{pendingLabel}</Badge>;
}

export function Logo({ light = false, size = 38 }: { light?: boolean; size?: number }) {
  return <Seal size={size} tone={light ? "paper" : "sindoor"} />;
}

export function Field({
  label, hint, children, required, className = "",
}: { label: string; hint?: string; children: ReactNode; required?: boolean; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[0.95rem] font-semibold text-ink">
        {label}
        {required && <span className="text-sindoor-500"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-[0.85rem] leading-snug text-ink-soft">{hint}</span>}
    </label>
  );
}

export function FieldGroup({
  label, hint, children, className = "",
}: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cx("min-w-0", className)}>
      <legend className="mb-2 block text-[0.95rem] font-semibold text-ink">{label}</legend>
      {children}
      {hint && <p className="mt-1.5 text-[0.85rem] leading-snug text-ink-soft">{hint}</p>}
    </fieldset>
  );
}

export function Chips({
  name, options, selected = [], type = "checkbox",
}: {
  name: string;
  options: { value: string; label: string; icon?: ReactNode }[];
  selected?: string[];
  type?: "checkbox" | "radio";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o.value} className="chip relative">
          <input type={type} name={name} value={o.value} defaultChecked={selected.includes(o.value)} />
          <span>{o.icon}{o.label}</span>
        </label>
      ))}
    </div>
  );
}

export function Tiles({
  name, options, selected = [], type = "checkbox", cols = "sm:grid-cols-2",
}: {
  name: string;
  options: { value: string; title: string; sub?: string; icon?: ReactNode }[];
  selected?: string[];
  type?: "checkbox" | "radio";
  cols?: string;
}) {
  return (
    <div className={cx("grid gap-2.5", cols)}>
      {options.map((o) => (
        <label key={o.value} className="tile relative block">
          <input type={type} name={name} value={o.value} defaultChecked={selected.includes(o.value)} />
          <span className="flex items-start gap-3">
            {o.icon && <span className="mt-0.5 text-sindoor-600">{o.icon}</span>}
            <span className="block">
              <span className="block font-semibold leading-snug text-ink">{o.title}</span>
              {o.sub && <span className="mt-0.5 block text-[0.9rem] leading-snug text-ink-soft">{o.sub}</span>}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

/** Editorial section heading with a bilingual kicker. */
export function SectionTitle({
  kicker, deva, title, sub, center = false, light = false,
}: { kicker?: string; deva?: string; title: ReactNode; sub?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={cx("max-w-2xl", center && "mx-auto text-center")}>
      {(kicker || deva) && (
        <p className={cx("mb-4 flex items-baseline gap-3 text-[0.8rem] font-semibold uppercase tracking-[0.22em]", center && "justify-center", light ? "text-haldi-300" : "text-sindoor-600")}>
          {deva && <span lang="hi" className="font-deva text-[1.05rem] normal-case tracking-normal">{deva}</span>}
          {deva && kicker && <span className="deva-accent opacity-50">·</span>}
          {kicker && <span className="deva-accent">{kicker}</span>}
        </p>
      )}
      <h2 className={cx("font-display text-[2.4rem] font-medium leading-[1.05] tracking-[-0.01em] sm:text-[3.1rem]", light ? "text-paper-50" : "text-ink")}>{title}</h2>
      {sub && <p className={cx("mt-4 text-[1.1rem] leading-relaxed", light ? "text-paper-200/80" : "text-ink-soft")}>{sub}</p>}
    </div>
  );
}

export function PageHeader({ title, sub, actions, deva }: { title: string; sub?: string; actions?: ReactNode; deva?: string }) {
  return (
    <div className="mb-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {deva && <p lang="hi" className="mb-1 font-deva text-lg text-sindoor-600">{deva}</p>}
          <h1 className="font-display text-[2.4rem] font-medium leading-[1.05] tracking-[-0.01em] text-ink sm:text-[2.9rem]">{title}</h1>
          {sub && <p className="mt-2 max-w-2xl text-ink-soft">{sub}</p>}
        </div>
        {actions}
      </div>
      <Ornament className="mt-6" />
    </div>
  );
}

export function Empty({ title, sub, action }: { icon?: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="ledger-lines rounded-[4px] border border-dashed border-paper-300 bg-paper-50/70 px-6 py-14 text-center">
      <IInbox size={36} className="mx-auto text-ink-faint" />
      <h3 className="mt-4 font-display text-2xl font-medium text-ink">{title}</h3>
      {sub && <p className="mx-auto mt-2 max-w-md text-ink-soft">{sub}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Stat({ value, label, tone = "indigo" }: { value: ReactNode; label: string; tone?: "indigo" | "gold" | "green" | "rose" }) {
  const colors = { indigo: "text-ink", gold: "text-haldi-700", green: "text-peacock-600", rose: "text-sindoor-600" };
  return (
    <div className="border-t-2 border-ink pt-3">
      <div className={cx("num font-display text-[2.6rem] font-medium leading-none", colors[tone])}>{value}</div>
      <div className="mt-2 text-[0.85rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">{label}</div>
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "ok" | "bad"; children: ReactNode }) {
  const t = {
    info: "border-neel-500 bg-neel-50/70 text-neel-800",
    warn: "border-haldi-500 bg-haldi-100/60 text-haldi-700",
    ok: "border-peacock-500 bg-peacock-50 text-peacock-700",
    bad: "border-sindoor-500 bg-sindoor-50 text-sindoor-700",
  }[tone];
  return <div className={cx("rounded-[3px] border-l-[3px] px-4 py-3 text-[0.95rem] leading-relaxed", t)}>{children}</div>;
}

/** Ten small diamonds — how completely the listing is disclosed. */
export function ClarityMeter({ score, label }: { score: number; label: string }) {
  const filled = Math.round(score);
  return (
    <div className="flex items-center gap-2 text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-ink-soft" title={`${label}: ${score}/10`}>
      <span>{label}</span>
      <span className="flex gap-[3px]" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={cx("h-[7px] w-[7px] rotate-45", i < filled ? (score >= 8 ? "bg-peacock-500" : score >= 6 ? "bg-haldi-500" : "bg-sindoor-500") : "bg-paper-300")} />
        ))}
      </span>
      <span className="num text-ink">{score}</span>
    </div>
  );
}

export function SubmitBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-3 z-10 mt-8 flex flex-wrap items-center justify-end gap-3 rounded-[4px] border border-line bg-paper-50/95 p-2.5 shadow-lift backdrop-blur">
      {children}
    </div>
  );
}

/** A form section with a large numeral, like a ledger chapter. */
export function FormSection({ n, title, sub, children }: { n: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 border-t border-line pt-8 md:grid-cols-[13rem_1fr]">
      <div>
        <p className="font-deva text-4xl leading-none text-sindoor-500">{n}</p>
        <h2 className="mt-2 font-display text-2xl font-medium leading-tight text-ink">{title}</h2>
        {sub && <p className="mt-1.5 text-[0.9rem] leading-snug text-ink-soft">{sub}</p>}
      </div>
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  );
}
