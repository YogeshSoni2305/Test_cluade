import Link from "next/link";
import { getI18n, bi } from "@/lib/i18n";
import type { Bi } from "@/lib/constants";
import { LinkButton, SectionTitle } from "@/components/ui";
import { ButaBand, Corner, Stamp, toDeva } from "@/components/ornaments";
import { ICheck, IFlag, IEye, IShield } from "@/components/icons";

export const metadata = {
  title: "Safety & trust",
  description: "What “Verified” means on Rajasthan Kaam, what to check before you travel for a job, and how to report unpaid wages, fake listings or harassment.",
  alternates: { canonical: "/safety" },
};

const b = (en: string, hi: string): Bi => ({ en, hi });

const C = {
  kicker: b("Your safety comes first", "आपकी सुरक्षा पहले"),
  title1: b("Your safety", "आपकी सुरक्षा"),
  title2: b("comes first.", "सबसे पहले।"),
  intro: b("Moving to a new city for work is a big decision. Here’s what we check, what we can’t promise, and what you and your family should do too.",
    "काम के लिए नए शहर जाना बड़ा फ़ैसला है। यहाँ बताया है कि हम क्या जाँचते हैं, क्या वादा नहीं कर सकते, और आपको व परिवार को क्या करना चाहिए।"),
  verTitle: b("What “Verified” means", "“सत्यापित” का मतलब"),
  verSub: b("The stamp appears only after our team completes at least two of these checks. Every business page shows exactly which ones were done.",
    "मुहर तभी लगती है जब हमारी टीम इनमें से कम से कम दो जाँच पूरी करे। हर कारोबार के पेज पर दिखता है कि कौन-सी जाँच हुई।"),
  checks: [
    [b("Owner identity", "मालिक की पहचान"), b("We check the owner’s government ID (Aadhaar / PAN) against their name and photo.", "हम मालिक का सरकारी पहचान पत्र (आधार / PAN) उनके नाम और फ़ोटो से मिलाते हैं।")],
    [b("Business registration", "कारोबार का पंजीकरण"), b("GST or shop-licence details are matched to the business name and address.", "GST या दुकान लाइसेंस को कारोबार के नाम और पते से मिलाया जाता है।")],
    [b("Shop address", "दुकान का पता"), b("We confirm the premises through photos, a visit or a video call.", "फ़ोटो, विज़िट या वीडियो कॉल से जगह की पुष्टि करते हैं।")],
    [b("Phone number", "फ़ोन नंबर"), b("We call the listed number to confirm the owner picks up and matches the profile.", "हम दिए गए नंबर पर कॉल करके देखते हैं कि मालिक ही फ़ोन उठाते हैं।")],
  ] as [Bi, Bi][],
  important: b("Important: verification is not a guarantee of a safe workplace. Treat it as one signal, and still confirm everything yourself.",
    "ज़रूरी: सत्यापन सुरक्षित कार्यस्थल की गारंटी नहीं है। इसे एक संकेत मानें और बाक़ी सब ख़ुद भी पक्का करें।"),
  beforeKicker: b("For candidates & families", "उम्मीदवारों और परिवारों के लिए"),
  beforeTitle: b("Before you travel", "सफ़र से पहले"),
  before: [
    b("Read the whole listing. Salary, hours, weekly holiday, stay and deductions must all be stated.", "पूरी लिस्टिंग पढ़ें। वेतन, समय, छुट्टी, रहना और कटौती — सब लिखा होना चाहिए।"),
    b("Talk to the owner in the app chat or a masked call. Ask what you will actually do and learn in the first three months.", "ऐप की चैट या छुपी कॉल से मालिक से बात करें। पूछें कि पहले तीन महीनों में असल में क्या करेंगे और सीखेंगे।"),
    b("Get the terms in writing — a WhatsApp message with salary, hours, stay and joining date is enough.", "शर्तें लिखित में लें — वेतन, समय, रहना और जॉइनिंग की तारीख वाला व्हाट्सऐप संदेश काफ़ी है।"),
    b("Share the job with your family using the “Share with family” button on any listing.", "किसी भी लिस्टिंग पर “परिवार को भेजें” से नौकरी परिवार को भेजें।"),
    b("Never pay to get a job. We never charge candidates, and no employer may charge a ‘registration’ fee.", "नौकरी के लिए कभी पैसे न दें। हम उम्मीदवारों से कुछ नहीं लेते, और कोई मालिक ‘रजिस्ट्रेशन’ फ़ीस नहीं ले सकता।"),
    b("Keep your original documents with you. No one has the right to hold them.", "अपने असली कागज़ अपने पास रखें। किसी को उन्हें रखने का हक़ नहीं।"),
    b("On arrival, check that the stay matches the listing. If not, report it right away.", "पहुँचकर देखें कि रहने की जगह लिस्टिंग जैसी है। नहीं तो तुरंत शिकायत करें।"),
  ],
  reportKicker: b("Report", "शिकायत"),
  reportTitle: b("Something wrong? Tell us.", "कुछ गलत है? हमें बताइए।"),
  reportSub: b("Report unpaid wages, misleading listings, unsafe conditions, harassment or fake businesses from any listing page.", "किसी भी लिस्टिंग पेज से वेतन न मिलना, भ्रामक लिस्टिंग, असुरक्षित हालात, दुर्व्यवहार या फ़र्ज़ी कारोबार की शिकायत करें।"),
  steps: [
    [b("Report", "शिकायत"), b("Use “Report this listing”. Your identity is never shared with the employer.", "“शिकायत करें” दबाएँ। आपकी पहचान मालिक को कभी नहीं बताई जाती।")],
    [b("Review", "जाँच"), b("Our team reviews it, contacts the employer, and may pull the listing during review.", "हमारी टीम जाँच करती है, मालिक से बात करती है, और ज़रूरत हो तो लिस्टिंग हटा देती है।")],
    [b("Action", "कार्रवाई"), b("Fraudulent or abusive employers are removed, and you’re told the outcome.", "धोखेबाज़ या दुर्व्यवहार करने वाले मालिक हटाए जाते हैं, और आपको नतीजा बताया जाता है।")],
  ] as [Bi, Bi][],
  emergency: b("Emergency? Call 112 (police), 181 (women helpline) or 1098 (child helpline).", "आपातकाल? 112 (पुलिस), 181 (महिला हेल्पलाइन) या 1098 (बाल हेल्पलाइन) पर कॉल करें।"),
  privacyKicker: b("Privacy", "गोपनीयता"),
  privacyTitle: b("Your data, your choice", "आपका डेटा, आपकी मर्ज़ी"),
  privacy: [
    b("Your phone number is hidden from employers unless you choose to share it. Chat and masked calls work without it.", "जब तक आप न चाहें, आपका नंबर मालिकों से छुपा रहता है। चैट और छुपी कॉल बिना नंबर के चलती हैं।"),
    b("Employers can only find your profile if you switch on visibility — and even then they never see your full name or number.", "मालिक आपकी प्रोफ़ाइल तभी देख सकते हैं जब आप अनुमति दें — तब भी पूरा नाम या नंबर नहीं दिखता।"),
    b("Download everything we hold about you, or delete your account, from the Account page at any time.", "खाता पेज से कभी भी अपना पूरा डेटा डाउनलोड करें या खाता हटाएँ।"),
    b("We don’t sell data and we don’t use advertising trackers. Our own analytics never stores your phone number or IP address.", "हम डेटा नहीं बेचते और विज्ञापन ट्रैकर नहीं लगाते। हमारे आँकड़ों में आपका नंबर या IP पता कभी सेव नहीं होता।"),
  ],
  empKicker: b("For employers", "मालिकों के लिए"),
  empTitle: b("Listing rules", "लिस्टिंग के नियम"),
  empSub: b("We keep listings honest so good employers stand out.", "हम लिस्टिंग ईमानदार रखते हैं ताकि अच्छे मालिक अलग दिखें।"),
  rules: [
    b("State salary, hours, weekly holiday, accommodation and all deductions or deposits.", "वेतन, समय, साप्ताहिक छुट्टी, रहना और हर कटौती या जमा राशि बताएँ।"),
    b("Only claim accommodation or training you actually provide — you must confirm both on the listing.", "सिर्फ़ वही रहना या ट्रेनिंग बताएँ जो आप सच में देते हैं — दोनों की पुष्टि लिस्टिंग में करनी होगी।"),
    b("No registration fees, hidden charges or document holding. Listings that mention fees are held for review.", "कोई रजिस्ट्रेशन फ़ीस, छुपा शुल्क या कागज़ रखना नहीं। फ़ीस वाली लिस्टिंग जाँच में रोकी जाती हैं।"),
    b("Listings expire after 30 days unless you renew them, and should be marked filled once you’ve hired.", "लिस्टिंग 30 दिन बाद ख़त्म होती है, जब तक आप रिन्यू न करें; भर्ती के बाद ‘भर गई’ करें।"),
    b("Misleading or abusive listings are removed and repeat offenders are suspended.", "भ्रामक या दुर्व्यवहार वाली लिस्टिंग हटाई जाती है और बार-बार ऐसा करने वाले निलंबित होते हैं।"),
  ],
  browse: b("Browse verified jobs", "सत्यापित काम देखें"),
  getVerified: b("Get my business verified", "मेरा कारोबार सत्यापित कराएँ"),
};

export default async function Safety() {
  const { lang } = await getI18n();
  const L = (x: Bi) => bi(x, lang);
  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="font-deva text-xl text-sindoor-600">{lang === "hi" ? "सुरक्षा" : "आपकी सुरक्षा पहले"}</p>
            <h1 className="mt-3 font-display text-[3.2rem] font-medium leading-[1] tracking-[-0.015em] text-ink sm:text-[4.4rem]">{L(C.title1)} <span className="italic text-sindoor-600">{L(C.title2)}</span></h1>
            <p className="mt-6 max-w-xl text-[1.15rem] leading-relaxed text-ink-soft">{L(C.intro)}</p>
          </div>
          <div className="flex justify-center" aria-hidden><Stamp size={220} className="-rotate-12" /></div>
        </div>
        <ButaBand />
      </section>

      <div className="mx-auto max-w-5xl space-y-24 px-4 py-20 sm:px-6">
        <section>
          <SectionTitle deva="सत्यापन" kicker="Verification" title={L(C.verTitle)} sub={L(C.verSub)} />
          <div className="mt-10 grid border-t border-ink sm:grid-cols-2">
            {C.checks.map(([title, d], i) => (
              <div key={title.en} className="border-b border-line py-6 sm:odd:pr-8 sm:even:border-l sm:even:pl-8">
                <p className="flex items-baseline gap-3"><span className="font-deva text-2xl text-sindoor-500" aria-hidden>{toDeva(i + 1)}</span><span className="font-display text-[1.5rem] font-semibold text-ink">{L(title)}</span></p>
                <p className="mt-2 leading-relaxed text-ink-soft">{L(d)}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 border-l-[3px] border-haldi-500 bg-haldi-100/50 px-5 py-4 leading-relaxed text-haldi-700">{L(C.important)}</p>
        </section>

        <section className="relative bg-paper-50 px-6 py-12 shadow-card sm:px-12">
          <Corner className="absolute left-3 top-3 text-sindoor-400" />
          <Corner className="absolute bottom-3 right-3 rotate-180 text-sindoor-400" />
          <SectionTitle deva="जाने से पहले" kicker={C.beforeKicker.en} title={L(C.beforeTitle)} />
          <ol className="mt-10 divide-y divide-line">
            {C.before.map((x, i) => (
              <li key={x.en} className="grid grid-cols-[2.5rem_1fr] gap-3 py-4">
                <span className="font-deva text-2xl leading-none text-sindoor-500" aria-hidden>{toDeva(i + 1)}</span>
                <p className="text-[1.05rem] leading-relaxed text-ink">{L(x)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <SectionTitle deva="शिकायत" kicker="Report" title={L(C.reportTitle)} sub={L(C.reportSub)} />
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {C.steps.map(([title, d], i) => {
              const Icon = [IFlag, IEye, IShield][i];
              return (
                <div key={title.en} className="border-t-2 border-ink pt-5">
                  <Icon size={26} className="text-sindoor-600" />
                  <p className="mt-3 font-display text-[1.5rem] font-semibold text-ink">{L(title)}</p>
                  <p className="mt-1 leading-relaxed text-ink-soft">{L(d)}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-10 font-semibold text-ink">{L(C.emergency)}</p>
        </section>

        <section id="privacy">
          <SectionTitle deva="गोपनीयता" kicker="Privacy" title={L(C.privacyTitle)} />
          <ul className="mt-8 space-y-3">
            {C.privacy.map((x) => <li key={x.en} className="flex gap-3 text-[1.05rem] text-ink"><ICheck size={20} className="mt-0.5 shrink-0 text-peacock-500" />{L(x)}</li>)}
          </ul>
        </section>

        <section id="employers" className="bg-neel-800 px-6 py-12 text-paper-100 sm:px-12">
          <SectionTitle light deva="मालिकों के लिए" kicker="For employers" title={L(C.empTitle)} sub={L(C.empSub)} />
          <ul className="mt-8 space-y-3">
            {C.rules.map((x) => <li key={x.en} className="flex gap-3 text-[1.05rem] text-paper-100/90"><ICheck size={20} className="mt-0.5 shrink-0 text-haldi-300" />{L(x)}</li>)}
          </ul>
        </section>

        <div className="flex flex-wrap items-center gap-5">
          <LinkButton href="/jobs" variant="primary" size="lg">{L(C.browse)}</LinkButton>
          <Link href="/employer/verification" className="font-semibold text-sindoor-700 hover:underline">{L(C.getVerified)} →</Link>
        </div>
      </div>
    </div>
  );
}
