import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="arch mx-auto flex h-24 w-20 items-center justify-center bg-marigold-300 text-4xl">🧭</div>
      <h1 className="mt-6 font-display text-4xl font-semibold text-indigo-900">We couldn’t find that page</h1>
      <p className="mt-3 text-ink-soft">The listing may have been removed or the link may be wrong.</p>
      <div className="mt-8 flex justify-center gap-3">
        <LinkButton href="/jobs" variant="primary">Browse jobs</LinkButton>
        <LinkButton href="/" variant="outline">Home</LinkButton>
      </div>
    </div>
  );
}
