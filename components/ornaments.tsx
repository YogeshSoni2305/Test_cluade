import type { ReactNode } from "react";

const DEVA = "०१२३४५६७८९";
export const toDeva = (n: number | string) => String(n).replace(/\d/g, (d) => DEVA[Number(d)]);

/** The brand seal — a red chop stamp reading "काम" (work). */
export function Seal({ size = 40, tone = "sindoor" }: { size?: number; tone?: "sindoor" | "paper" }) {
  const bg = tone === "sindoor" ? "#b0281f" : "#f6efe1";
  const fg = tone === "sindoor" ? "#fbf3e3" : "#7a1612";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path d="M4 5.5 6 3.8l36.5.6L44.5 6l-.4 36.6-2 1.8L5.6 44 3.5 42Z" fill={bg} />
      <rect x="7.5" y="7.5" width="33" height="33" fill="none" stroke={fg} strokeWidth="1.2" opacity=".75" />
      <text x="24" y="31.5" textAnchor="middle" fontFamily="'Tiro Devanagari Hindi', serif" fontSize="19" fill={fg}>काम</text>
    </svg>
  );
}

/** Circular rubber stamp, like the ones on every Indian office document. */
export function Stamp({ size = 92, label = "VERIFIED", sub = "सत्यापित", className = "" }: { size?: number; label?: string; sub?: string; className?: string }) {
  const text = `${label} · ${sub} · ${label} · ${sub} · `;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={`text-peacock-600 ${className}`} aria-label={label} role="img">
      <defs>
        <path id="stamp-arc" d="M50 50 m-35 0 a35 35 0 1 1 70 0 a35 35 0 1 1 -70 0" />
        <filter id="stamp-rough"><feTurbulence baseFrequency=".8" numOctaves="2" seed="4" /><feDisplacementMap in="SourceGraphic" scale="1.6" /></filter>
      </defs>
      <g filter="url(#stamp-rough)" fill="none" stroke="currentColor" opacity=".88">
        <circle cx="50" cy="50" r="46" strokeWidth="2.6" />
        <circle cx="50" cy="50" r="41" strokeWidth=".9" />
        <circle cx="50" cy="50" r="27" strokeWidth=".9" />
        <text fill="currentColor" stroke="none" fontSize="8.4" fontWeight="600" letterSpacing="1.3" fontFamily="'Tiro Devanagari Hindi', Mukta, sans-serif">
          <textPath href="#stamp-arc">{text}</textPath>
        </text>
        <path d="m39 51 7.5 7.5L62 42" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** Cusped Rajput arch (jharokha / mehrab) outline. */
export function archPath(w: number, h: number, spring: number, lobes = 9) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= lobes; i++) {
    const t = Math.PI - (Math.PI * i) / lobes;
    const lift = 1 + 0.12 * Math.pow(Math.sin(t), 6); // gentle point at the apex
    pts.push([w / 2 + (w / 2) * Math.cos(t), spring - spring * Math.sin(t) * lift + (lift - 1) * 0]);
  }
  let d = `M0 ${h} L${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x, y] = pts[i];
    const r = (Math.hypot(x - x0, y - y0) / 2) * 1.08;
    d += ` A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + ` L${w} ${h} Z`;
}

export function Jharokha({ className = "", children }: { className?: string; children?: ReactNode }) {
  const d = archPath(300, 400, 150);
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="-12 -24 324 436" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <pattern id="jh-bandhani" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="3.5" cy="3.5" r="1.3" fill="#f6e2b4" opacity=".55" />
            <circle cx="10.5" cy="10.5" r="1" fill="#f6e2b4" opacity=".35" />
          </pattern>
        </defs>
        <path d={d} transform="translate(-10 -12) scale(1.067 1.03)" fill="none" stroke="#b08a3e" strokeWidth="1" />
        <path d={d} fill="#7a1612" />
        <path d={d} fill="url(#jh-bandhani)" />
        <path d={d} fill="none" stroke="#e0a82b" strokeWidth="2" transform="translate(9 9) scale(.94 .955)" opacity=".75" />
      </svg>
      <div className="relative h-full">{children}</div>
    </div>
  );
}

/** Block-print border band (buta + dots) — used as a section edge. */
export function ButaBand({ color = "#b0281f", className = "", id = "buta" }: { color?: string; className?: string; id?: string }) {
  return (
    <svg className={`block h-6 w-full ${className}`} aria-hidden>
      <defs>
        <pattern id={id} width="44" height="24" patternUnits="userSpaceOnUse">
          <path d="M0 1.5h44M0 22.5h44" stroke={color} strokeWidth="1" opacity=".55" />
          <path d="M15 19c-4.2 0-6.6-2.7-6.6-6.1 0-3.9 3.1-6.6 7.4-7.6-1.6 1.9-1.3 3.7.4 4.8 2.5 1.7 2.4 5.3-1.2 8.9Z" fill={color} opacity=".85" />
          <circle cx="13.6" cy="13.4" r="1.3" fill="#f6efe1" />
          <path d="m33 8 3 4-3 4-3-4Z" fill={color} opacity=".7" />
          <circle cx="33" cy="4.8" r=".9" fill={color} opacity=".7" />
          <circle cx="33" cy="19.2" r=".9" fill={color} opacity=".7" />
        </pattern>
      </defs>
      <rect width="100%" height="24" fill={`url(#${id})`} />
    </svg>
  );
}

/** Small lotus-diamond ornament flanked by rules. */
export function Ornament({ className = "", color = "text-sindoor-500" }: { className?: string; color?: string }) {
  return (
    <div className={`flex items-center gap-3 ${color} ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-current opacity-40" />
      <svg width="34" height="14" viewBox="0 0 34 14">
        <path d="M17 1.5 21 7l-4 5.5L13 7Z" fill="currentColor" />
        <path d="M17 4.2 18.9 7 17 9.8 15.1 7Z" fill="#f6efe1" />
        <circle cx="7.5" cy="7" r="1.6" fill="currentColor" />
        <circle cx="26.5" cy="7" r="1.6" fill="currentColor" />
        <circle cx="2" cy="7" r=".9" fill="currentColor" />
        <circle cx="32" cy="7" r=".9" fill="currentColor" />
      </svg>
      <span className="h-px flex-1 bg-current opacity-40" />
    </div>
  );
}

/** A small hand-drawn mandana corner, used on notices. */
export function Corner({ className = "" }: { className?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2 26V2h24" />
      <path d="M6 22V6h16" opacity=".6" />
      <circle cx="10.5" cy="10.5" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
