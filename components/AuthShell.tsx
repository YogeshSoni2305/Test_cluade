import type { ReactNode } from "react";
import { Jharokha, Seal } from "./ornaments";
import { ICheck } from "./icons";

export function AuthShell({ children, title, sub }: { children: ReactNode; title: string; sub: string }) {
  return (
    <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden overflow-hidden border-r border-line lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div className="leheriya-soft absolute inset-0" />
        <div className="relative max-w-md">
          <Seal size={56} />
          <h1 className="mt-8 font-display text-[3.6rem] font-medium leading-[1] text-ink">{title}</h1>
          <p className="mt-5 text-[1.15rem] text-ink-soft">{sub}</p>
          <ul className="mt-8 space-y-3 text-ink">
            {["Free for candidates — always", "Verified employers across India", "Pay, stay & deductions shown upfront"].map((x) => (
              <li key={x} className="flex items-center gap-2.5"><ICheck size={18} className="text-peacock-500" />{x}</li>
            ))}
          </ul>
        </div>
        <Jharokha className="absolute -bottom-24 -right-16 h-80 w-60 opacity-90" />
      </div>
      <div className="flex items-center justify-center px-4 py-12">{children}</div>
    </div>
  );
}
