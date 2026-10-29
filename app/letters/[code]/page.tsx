import Link from "next/link";
import { getLetter, durationLabel } from "@/lib/letters";
import { getI18n, bi } from "@/lib/i18n";
import { INDUSTRIES, byId, skillLabel } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { btn, Notice } from "@/components/ui";
import { ButaBand, Seal, Stamp } from "@/components/ornaments";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const l = getLetter(decodeURIComponent((await params).code));
  return { title: l ? `Experience letter ${l.code}` : "Letter not found", robots: { index: false, follow: false } };
}

const fmt = (d: string, lang: string) => new Date(d).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" });

export default async function LetterPage({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code);
  const l = getLetter(code);
  const { t, lang } = await getI18n();
  if (!l) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <Notice tone="bad">{t("letter_not_found")} <b className="num">{code}</b></Notice>
        <Link href="/letters" className={btn("outline", "md", "mt-6")}>{t("letter_verify_title")}</Link>
      </div>
    );
  }
  const user = await getCurrentUser();
  const mine = user?.id === l.candidate_id;
  const ind = byId(INDUSTRIES, l.industry);
  const skills = l.skills.map((id) => skillLabel(l.industry, id)?.en).filter(Boolean) as string[];
  const site = (process.env.SITE_URL ?? "").replace(/^https?:\/\//, "") || "rajasthankaam";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 print:max-w-none print:p-0">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className={l.revoked ? "font-semibold text-sindoor-700" : "flex items-center gap-2 font-semibold text-peacock-600"}>
          {l.revoked ? t("letter_revoked") : t("letter_genuine")}
        </p>
        <PrintButton label={t("letter_print")} className={btn("outline", "sm")} />
      </div>

      <article className="relative border border-line bg-paper-50 shadow-lift print:border-0 print:shadow-none">
        <ButaBand id="buta-letter-top" />
        {l.revoked ? <p className="absolute inset-0 z-10 flex items-center justify-center text-[5rem] font-bold uppercase tracking-widest text-sindoor-500/25 [transform:rotate(-20deg)]">Revoked</p> : null}
        <div className="px-8 py-10 sm:px-14">
          <header className="flex items-start justify-between gap-6 border-b border-ink pb-6">
            <div>
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-ink-soft">{l.business_city}</p>
              <h1 className="font-display text-[2.2rem] font-semibold leading-tight text-ink">{l.business_name}</h1>
              {l.employer_verified ? <p className="text-[0.85rem] font-semibold text-peacock-600">Verified business on Rajasthan Kaam</p> : null}
            </div>
            <Seal size={56} />
          </header>

          <h2 className="mt-8 text-center font-display text-[1.9rem] font-semibold text-ink">Experience Letter <span className="block font-deva text-[1.3rem] font-normal text-sindoor-600">अनुभव पत्र</span></h2>
          <p className="mt-2 text-center text-[0.85rem] text-ink-soft">Issued {fmt(l.issued_at.slice(0, 10), "en")} · Ref. <span className="num font-semibold">{l.code}</span></p>

          <div className="mt-8 space-y-4 text-[1.05rem] leading-relaxed text-ink">
            <p>To whom it may concern,</p>
            <p>
              This is to certify that <b>{l.candidate_name}</b>{l.candidate_district ? <>, from {l.candidate_district}, Rajasthan,</> : null} worked with <b>{l.business_name}</b>, {l.business_city},
              as <b>{l.role_title}</b> from <b>{fmt(l.from_date, "en")}</b> to <b>{fmt(l.to_date, "en")}</b> ({durationLabel(l.from_date, l.to_date)}).
            </p>
            {skills.length > 0 && (
              <div>
                <p>During this time they gained hands-on experience in {ind?.en.toLowerCase()}, including:</p>
                <ul className="mt-2 grid gap-1 pl-5 sm:grid-cols-2">{skills.map((x) => <li key={x} className="list-disc">{x}</li>)}</ul>
              </div>
            )}
            {l.remarks && <p className="border-l-2 border-haldi-400 pl-4 italic">“{l.remarks}”</p>}
            <p>We wish them the very best for the future.</p>
          </div>

          <div className="mt-8 border-t border-dashed border-paper-300 pt-5 font-deva text-[1rem] leading-relaxed text-ink-soft" lang="hi">
            प्रमाणित किया जाता है कि <b className="text-ink">{l.candidate_name}</b> ने <b className="text-ink">{l.business_name}</b>, {l.business_city} में <b className="text-ink">{l.role_title}</b> के रूप में
            {" "}{fmt(l.from_date, "hi")} से {fmt(l.to_date, "hi")} तक ({durationLabel(l.from_date, l.to_date, "hi")}) काम किया{skills.length ? ` और ${bi(ind, "hi")} का व्यावहारिक अनुभव प्राप्त किया` : ""}।
          </div>

          <footer className="mt-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-display text-[1.4rem] italic text-ink">{l.owner_name}</p>
              <p className="border-t border-ink pt-1 text-[0.85rem] text-ink-soft">For {l.business_name}</p>
            </div>
            {!l.revoked && <Stamp size={110} label="ISSUED" sub="जारी" className="-rotate-12" />}
          </footer>
          <p className="mt-10 text-center text-[0.8rem] text-ink-soft">
            Verify this letter at <span className="num font-semibold">{site}/letters/{l.code}</span> · Issued through Rajasthan Kaam. The employer is responsible for the accuracy of its contents.
          </p>
        </div>
        <ButaBand id="buta-letter-bottom" />
      </article>
      {mine && <p className="mt-6 text-center text-[0.9rem] text-ink-soft print:hidden">{t("letter_share_hint")}</p>}
    </div>
  );
}
