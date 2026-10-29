import Link from "next/link";
import { LinkButton, SectionTitle, ShieldIcon } from "@/components/ui";

export const metadata = { title: "Safety & trust" };

const verified = [
  ["Owner identity", "We check the owner’s government ID (Aadhaar / PAN) against their name and photo."],
  ["Business registration", "GST or shop-licence details are matched to the business name and address."],
  ["Shop address", "We confirm the premises through photos or a visit/video call."],
  ["Phone number", "We call the listed number to confirm the owner picks up and matches the profile."],
];

export default function Safety() {
  return (
    <div>
      <section className="relative overflow-hidden bg-indigo-900 py-20 text-white">
        <div className="pattern-jali absolute inset-0 opacity-70" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-leaf-500/25 text-leaf-100"><ShieldIcon className="h-7 w-7" /></span>
          <h1 className="mt-5 font-display text-4xl font-semibold sm:text-5xl">Your safety comes first</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100/85">Moving to a new city for work is a big decision. Here’s what we do — and what you and your family should do too.</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-16 px-4 py-16 sm:px-6">
        <section>
          <SectionTitle kicker="Verification" title="What “Verified” means" sub="A green Verified badge only appears after our team completes at least two of these checks. Each business page shows exactly which were done." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {verified.map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-line bg-white p-5 shadow-card">
                <p className="font-semibold text-indigo-900">✓ {t}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-2xl bg-marigold-300/30 p-4 text-sm leading-relaxed text-marigold-700"><b>Important:</b> verification is not a guarantee of a safe workplace. Treat it as one signal, and still confirm everything yourself.</p>
        </section>

        <section>
          <SectionTitle kicker="For candidates & families" title="Before you travel" />
          <ol className="mt-8 space-y-3">
            {[
              "Read the whole listing. Salary, hours, weekly holiday, stay and deductions must all be stated.",
              "Talk to the owner by phone or video. Ask what you will actually do and learn in the first 3 months.",
              "Get the terms in writing — a WhatsApp message with salary, hours, stay and joining date is enough.",
              "Share the job with your family. Use the “Share with family” button on any listing.",
              "Never pay to get a job. We never charge candidates and no employer may charge a ‘registration’ fee.",
              "Keep your original documents with you. No one has the right to hold them.",
              "On arrival, check that the stay matches the listing. If not, report it right away.",
            ].map((x, i) => (
              <li key={x} className="flex gap-4 rounded-2xl border border-line bg-white p-4 shadow-card">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-marigold-400 font-bold text-indigo-950">{i + 1}</span>
                <p className="leading-relaxed">{x}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <SectionTitle kicker="Report" title="Something wrong? Tell us." sub="You can report unpaid wages, misleading listings, unsafe conditions, harassment or fake businesses from any listing page." />
          <div className="mt-6 grid gap-4 sm:grid-cols-3 text-sm">
            {[["1. Report", "Use “Report this listing”. Your identity is never shared with the employer."], ["2. Review", "Our team reviews it, contacts the employer and may suspend the listing during review."], ["3. Action", "Fraudulent or abusive employers are removed. You’re told the outcome."]].map(([t, d]) => (
              <div key={t} className="rounded-2xl bg-cream-100 p-5"><p className="font-semibold text-indigo-900">{t}</p><p className="mt-1 text-ink-soft">{d}</p></div>
            ))}
          </div>
          <p className="mt-6 text-sm text-ink-soft">Emergency? Call <b>112</b> (police), <b>181</b> (women helpline) or <b>1098</b> (child helpline).</p>
        </section>

        <section id="employers">
          <SectionTitle kicker="For employers" title="Listing rules" sub="We keep listings honest so good employers stand out." />
          <ul className="mt-6 space-y-2 text-ink-soft">
            {[
              "State salary, hours, weekly holiday, accommodation and all deductions or deposits.",
              "Only claim accommodation or training you actually provide — you must confirm both on the listing.",
              "No registration fees, hidden charges or document holding.",
              "Update or mark the listing as filled once you’ve hired.",
              "Misleading or abusive listings are removed and repeat offenders are banned.",
            ].map((x) => <li key={x} className="flex gap-2"><span className="text-leaf-600">✓</span>{x}</li>)}
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <LinkButton href="/jobs" variant="primary" size="lg">Browse verified jobs</LinkButton>
          <Link href="/employer/verification" className="inline-flex items-center rounded-full px-6 py-3 font-semibold text-indigo-800 hover:bg-indigo-50">Get my business verified →</Link>
        </div>
      </div>
    </div>
  );
}
