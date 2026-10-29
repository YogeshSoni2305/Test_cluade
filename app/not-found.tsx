import { LinkButton } from "@/components/ui";
import { Jharokha } from "@/components/ornaments";
import { ICompass } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <Jharokha className="mx-auto h-40 w-32"><div className="flex h-full items-end justify-center pb-8 text-haldi-300"><ICompass size={36} /></div></Jharokha>
      <p className="mt-8 font-deva text-xl text-sindoor-600">रास्ता भटक गए?</p>
      <h1 className="mt-1 font-display text-[2.8rem] font-medium leading-tight text-ink">We couldn’t find that page</h1>
      <p className="mt-3 text-ink-soft">The listing may have been removed, or the link may be wrong.</p>
      <div className="mt-8 flex justify-center gap-3">
        <LinkButton href="/jobs" variant="primary">Browse jobs</LinkButton>
        <LinkButton href="/" variant="outline">Home</LinkButton>
      </div>
    </div>
  );
}
