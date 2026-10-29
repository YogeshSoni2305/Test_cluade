import type { ReactNode } from "react";
import { Logo } from "./ui";

export function AuthShell({ children, title, sub }: { children: ReactNode; title: string; sub: string }) {
  return (
    <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-indigo-900 p-14 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="pattern-jali absolute inset-0 opacity-80" />
        <div className="arch absolute -bottom-10 -right-10 h-96 w-72 bg-marigold-400/90 bandhani" />
        <div className="relative max-w-md">
          <Logo light />
          <h1 className="mt-8 font-display text-5xl font-semibold leading-tight">{title}</h1>
          <p className="mt-5 text-lg text-indigo-100/85">{sub}</p>
          <ul className="mt-8 space-y-3 text-indigo-50">
            <li>✓ Free for candidates — always</li>
            <li>✓ Verified employers across India</li>
            <li>✓ Pay, stay & deductions shown upfront</li>
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12">{children}</div>
    </div>
  );
}
