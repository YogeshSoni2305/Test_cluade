"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-semibold text-ink">Something went wrong</h1>
      <p className="mt-3 text-ink-soft">Please try again. If it keeps happening, tell us from the Safety page.</p>
      <button onClick={reset} className="mt-8 rounded-[3px] bg-sindoor-600 px-6 py-2.5 font-semibold text-paper-50 hover:bg-sindoor-700">Try again</button>
    </div>
  );
}
