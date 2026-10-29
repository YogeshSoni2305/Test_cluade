import Link from "next/link";
import { LinkButton, SectionTitle } from "@/components/ui";
import { ButaBand, Corner, Stamp, toDeva } from "@/components/ornaments";
import { ICheck, IFlag, IEye, IShield } from "@/components/icons";

export const metadata = { title: "Safety & trust" };

const checks = [
  ["Owner identity", "मालिक की पहचान", "We check the owner’s government ID (Aadhaar / PAN) against their name and photo."],
  ["Business registration", "पंजीकरण", "GST or shop-licence details are matched to the business name and address."],
  ["Shop address", "दुकान का पता", "We confirm the premises through photos, a visit or a video call."],
  ["Phone number", "फ़ोन", "We call the listed number to confirm the owner picks up and matches the profile."],
];

export default function Safety() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="font-deva text-xl text-sindoor-600">आपकी सुरक्षा पहले</p>
            <h1 className="mt-3 font-display text-[3.2rem] font-medium leading-[1] tracking-[-0.015em] text-ink sm:text-[4.4rem]">Your safety <span className="italic text-sindoor-600">comes first.</span></h1>
            <p className="mt-6 max-w-xl text-[1.15rem] leading-relaxed text-ink-soft">Moving to a new city for work is a big decision. Here’s what we check, what we can’t promise, and what you and your family should do too.</p>
          </div>
          <div className="flex justify-center"><Stamp size={220} className="-rotate-12" /></div>
        </div>
        <ButaBand />
      </section>

      <div className="mx-auto max-w-5xl space-y-24 px-4 py-20 sm:px-6">
        <section>
          <SectionTitle deva="सत्यापन" kicker="Verification" title="What “Verified” means" sub="The stamp appears only after our team completes at least two of these checks. Every business page shows exactly which ones were done." />
          <div className="mt-10 grid border-t border-ink sm:grid-cols-2">
            {checks.map(([t, hi, d], i) => (
              <div key={t} className="border-b border-line py-6 sm:odd:pr-8 sm:even:border-l sm:even:pl-8">
                <p className="flex items-baseline gap-3"><span className="font-deva text-2xl text-sindoor-500">{toDeva(i + 1)}</span><span className="font-display text-[1.5rem] font-semibold text-ink">{t}</span><span className="font-deva text-ink-faint">{hi}</span></p>
                <p className="mt-2 leading-relaxed text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 border-l-[3px] border-haldi-500 bg-haldi-100/50 px-5 py-4 leading-relaxed text-haldi-700"><b>Important:</b> verification is not a guarantee of a safe workplace. Treat it as one signal, and still confirm everything yourself.</p>
        </section>

        <section className="relative bg-paper-50 px-6 py-12 shadow-card sm:px-12">
          <Corner className="absolute left-3 top-3 text-sindoor-400" />
          <Corner className="absolute bottom-3 right-3 rotate-180 text-sindoor-400" />
          <SectionTitle deva="जाने से पहले" kicker="For candidates & families" title="Before you travel" />
          <ol className="mt-10 space-y-0 divide-y divide-line">
            {[
              "Read the whole listing. Salary, hours, weekly holiday, stay and deductions must all be stated.",
              "Talk to the owner by phone or video. Ask what you will actually do and learn in the first three months.",
              "Get the terms in writing — a WhatsApp message with salary, hours, stay and joining date is enough.",
              "Share the job with your family using the “Share with family” button on any listing.",
              "Never pay to get a job. We never charge candidates, and no employer may charge a ‘registration’ fee.",
              "Keep your original documents with you. No one has the right to hold them.",
              "On arrival, check that the stay matches the listing. If not, report it right away.",
            ].map((x, i) => (
              <li key={x} className="grid grid-cols-[2.5rem_1fr] gap-3 py-4">
                <span className="font-deva text-2xl leading-none text-sindoor-500">{toDeva(i + 1)}</span>
                <p className="text-[1.05rem] leading-relaxed text-ink">{x}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <SectionTitle deva="शिकायत" kicker="Report" title="Something wrong? Tell us." sub="Report unpaid wages, misleading listings, unsafe conditions, harassment or fake businesses from any listing page." />
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[[IFlag, "Report", "Use “Report this listing”. Your identity is never shared with the employer."], [IEye, "Review", "Our team reviews it, contacts the employer, and may pull the listing during review."], [IShield, "Action", "Fraudulent or abusive employers are removed, and you’re told the outcome."]].map(([I, t, d]) => {
              const Icon = I as typeof IFlag;
              return (
                <div key={t as string} className="border-t-2 border-ink pt-5">
                  <Icon size={26} className="text-sindoor-600" />
                  <p className="mt-3 font-display text-[1.5rem] font-semibold text-ink">{t as string}</p>
                  <p className="mt-1 leading-relaxed text-ink-soft">{d as string}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-10 text-ink-soft">Emergency? Call <b className="text-ink">112</b> (police), <b className="text-ink">181</b> (women helpline) or <b className="text-ink">1098</b> (child helpline).</p>
        </section>

        <section id="employers" className="bg-neel-800 px-6 py-12 text-paper-100 sm:px-12">
          <SectionTitle light deva="मालिकों के लिए" kicker="For employers" title="Listing rules" sub="We keep listings honest so good employers stand out." />
          <ul className="mt-8 space-y-3">
            {[
              "State salary, hours, weekly holiday, accommodation and all deductions or deposits.",
              "Only claim accommodation or training you actually provide — you must confirm both on the listing.",
              "No registration fees, hidden charges or document holding.",
              "Update or mark the listing as filled once you’ve hired.",
              "Misleading or abusive listings are removed and repeat offenders are banned.",
            ].map((x) => <li key={x} className="flex gap-3 text-[1.05rem] text-paper-100/90"><ICheck size={20} className="mt-0.5 shrink-0 text-haldi-300" />{x}</li>)}
          </ul>
        </section>

        <div className="flex flex-wrap items-center gap-5">
          <LinkButton href="/jobs" variant="primary" size="lg">Browse verified jobs</LinkButton>
          <Link href="/employer/verification" className="font-semibold text-sindoor-700 hover:underline">Get my business verified →</Link>
        </div>
      </div>
    </div>
  );
}
