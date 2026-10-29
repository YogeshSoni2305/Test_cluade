import Link from "next/link";
import { getI18n, bi } from "@/lib/i18n";
import { GOALS, INDUSTRIES } from "@/lib/constants";
import { searchJobs, siteStats } from "@/lib/queries";
import { JobCard } from "@/components/JobCard";
import { LinkButton, SectionTitle } from "@/components/ui";
import { ButaBand, Jharokha, Ornament, Stamp, toDeva } from "@/components/ornaments";
import { GoalIcon, IArrow, IndustryIcon, IPin, IPhone, IDoc, IShield } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { t, lang } = await getI18n();
  const stats = siteStats();
  const featured = searchJobs({ limit: 6 });

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden">
        <div className="leheriya-soft absolute inset-y-0 right-0 hidden w-[38%] lg:block" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:pb-28 lg:pt-20">
          <div className="animate-rise">
            <p className="flex flex-wrap items-baseline gap-x-3 text-[0.82rem] font-semibold uppercase tracking-[0.22em] text-sindoor-600">
              <span className="font-deva text-[1.1rem] normal-case tracking-normal">राजस्थान के युवाओं के लिए</span>
              <span className="deva-accent text-ink-faint">/</span>
              <span className="deva-accent">{t("hero_kicker")}</span>
            </p>
            <h1 className="mt-6 font-display text-[3.2rem] font-medium leading-[0.98] tracking-[-0.02em] text-ink sm:text-[4.6rem] lg:text-[5.2rem]">
              {t("hero_title_1")}
              <span className="block italic text-sindoor-600">{t("hero_title_2")}</span>
            </h1>
            <p className="mt-7 max-w-xl text-[1.2rem] leading-relaxed text-ink-soft">{t("hero_sub")}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <LinkButton href="/jobs" variant="primary" size="lg">{t("hero_cta_primary")} <IArrow size={18} /></LinkButton>
              <LinkButton href="/employer" variant="outline" size="lg">{t("hero_cta_secondary")}</LinkButton>
            </div>

            <dl className="mt-14 grid max-w-xl grid-cols-4 divide-x divide-line border-y border-line">
              {[
                [stats.openJobs, t("stat_jobs")],
                [stats.verified, t("stat_verified")],
                [stats.cities, t("stat_cities")],
                ["₹0", t("stat_fees")],
              ].map(([v, l]) => (
                <div key={String(l)} className="px-3 py-4 first:pl-0">
                  <dt className="num font-display text-[2.2rem] font-semibold leading-none text-ink">{v}</dt>
                  <dd className="mt-1.5 text-[0.78rem] leading-tight text-ink-soft">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Jharokha window holding a ledger slip */}
          <div className="relative mx-auto hidden w-full max-w-[25rem] lg:block">
            <Jharokha className="aspect-[3/4] w-full">
              <div className="absolute inset-x-8 bottom-10 top-[38%] -rotate-[2.5deg]">
                <div className="ledger h-full rounded-[2px] border border-paper-300 py-5 pl-14 pr-5 shadow-[6px_10px_0_rgba(0,0,0,.18)]">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">Shree Ram Menswear</p>
                  <p className="mt-1 font-display text-[1.65rem] font-semibold leading-tight text-ink">Showroom Sales Trainee</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-ink-soft"><IPin size={14} className="text-sindoor-500" />Surat, Ring Road</p>
                  <dl className="mt-3 text-[0.92rem]">
                    {[["Salary", "₹12,000 – 15,000"], ["Hours", "10 am – 9:30 pm"], ["Stay", "Free, shared flat"], ["Deductions", "None"]].map(([k, v]) => (
                      <div key={k} className="flex h-8 items-end gap-2"><dt className="text-ink-soft">{k}</dt><span className="leader" /><dd className="font-semibold">{v}</dd></div>
                    ))}
                  </dl>
                </div>
                <Stamp size={108} className="absolute -bottom-9 -right-9 rotate-[14deg]" />
              </div>
              <p className="absolute inset-x-0 top-[17%] text-center font-deva text-[2.6rem] leading-none text-haldi-300">काम</p>
              <p className="absolute inset-x-0 top-[28%] text-center text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-paper-200/80">earn · learn · grow</p>
            </Jharokha>
          </div>
        </div>
        <ButaBand />
      </section>

      {/* ───────────── GOALS ───────────── */}
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionTitle deva="आपका लक्ष्य" kicker="Your goal" title={t("hero_goal_title")} sub={t("hero_goal_sub")} />
        </div>
        <ol className="border-t border-ink">
          {GOALS.map((g, i) => (
            <li key={g.id}>
              <Link href={`/jobs?goal=${g.id}`} className="group grid grid-cols-[3.2rem_1fr_auto] items-center gap-4 border-b border-line py-6 transition hover:bg-paper-50/80 sm:grid-cols-[4rem_1fr_auto]">
                <span className="font-deva text-[2.6rem] leading-none text-sindoor-500 transition group-hover:text-sindoor-700">{toDeva(i + 1)}</span>
                <span>
                  <span className="flex items-center gap-2.5 font-display text-[1.75rem] font-semibold leading-tight text-ink">
                    {bi(g, lang)}
                    <GoalIcon id={g.id} size={20} className="hidden text-ink-faint sm:block" />
                  </span>
                  <span className="mt-1 block text-ink-soft">{bi(g.blurb, lang)}</span>
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-soft transition group-hover:border-sindoor-500 group-hover:bg-sindoor-600 group-hover:text-paper-50">
                  <IArrow size={18} />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────────── FEATURED ───────────── */}
      <section className="border-y border-line bg-paper-200/50 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle deva="ताज़ा अवसर" kicker="Fresh this week" title={t("featured_title")} />
            <Link href="/jobs" className="group inline-flex items-center gap-2 font-semibold text-sindoor-700">
              {t("view_all")} <IArrow size={18} className="transition group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((j) => <JobCard key={j.id} job={j} lang={lang} t={t} />)}
          </div>
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <SectionTitle center deva="कैसे काम करता है" kicker="Three steps" title={t("how_title")} />
        <ol className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
          <span className="absolute left-0 right-0 top-7 hidden border-t-2 border-dotted border-paper-300 md:block" aria-hidden />
          {[[IPhone, 1], [IDoc, 2], [IShield, 3]].map(([Icon, n]) => {
            const I = Icon as typeof IPhone;
            return (
              <li key={n as number} className="relative text-center">
                <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-sindoor-500 bg-paper-100 text-sindoor-600">
                  <I size={24} />
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-sindoor-600 font-deva text-[0.95rem] text-paper-50">{toDeva(n as number)}</span>
                </span>
                <h3 className="mt-6 font-display text-[1.7rem] font-semibold leading-tight text-ink">{t(`how_${n}_t` as "how_1_t")}</h3>
                <p className="mx-auto mt-2 max-w-xs leading-relaxed text-ink-soft">{t(`how_${n}_d` as "how_1_d")}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ───────────── PROMISE ───────────── */}
      <section className="relative bg-sindoor-800 text-paper-100">
        <div className="leheriya h-[6px]" />
        <div className="bandhani">
          <div className="mx-auto grid max-w-6xl gap-14 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <SectionTitle light deva="हमारा वचन" kicker="Our promise" title={t("trust_title")} sub={t("trust_sub")} />
              <Stamp size={150} className="mt-10 hidden -rotate-12 !text-haldi-300 lg:block" />
            </div>
            <ol className="divide-y divide-paper-50/15 border-y border-paper-50/15">
              {(["trust_1", "trust_2", "trust_3", "trust_4", "trust_5"] as const).map((k, i) => (
                <li key={k} className="grid grid-cols-[2.5rem_1fr] gap-4 py-5">
                  <span className="font-deva text-[1.8rem] leading-none text-haldi-300">{toDeva(i + 1)}</span>
                  <p className="text-[1.08rem] leading-relaxed text-paper-100/90">{t(k)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ───────────── INDUSTRIES (aala niches) ───────────── */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <SectionTitle center deva="कौन-सा कारोबार" kicker="Trades" title={t("industries_title")} />
        <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {INDUSTRIES.map((i) => (
            <Link key={i.id} href={`/jobs?industry=${i.id}`} className="group text-center">
              <span className="mx-auto flex h-28 w-24 items-end justify-center rounded-t-full border border-line bg-paper-50 p-1.5 shadow-card transition group-hover:-translate-y-1 group-hover:border-sindoor-400">
                <span className="flex h-full w-full items-center justify-center rounded-t-full bg-paper-200/70 text-sindoor-600 transition group-hover:bg-sindoor-600 group-hover:text-paper-50">
                  <IndustryIcon id={i.id} size={30} />
                </span>
              </span>
              <span className="mt-3 block text-[0.95rem] font-medium leading-snug text-ink">{bi(i, lang)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────────── EMPLOYER CTA ───────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[4px] bg-neel-800 text-paper-100">
          <div className="leheriya h-[6px]" />
          <div className="grid items-center gap-8 px-8 py-14 sm:px-14 md:grid-cols-[1.5fr_1fr]">
            <div>
              <p className="font-deva text-lg text-haldi-300">दुकान मालिकों के लिए</p>
              <h2 className="mt-2 font-display text-[2.4rem] font-medium leading-[1.05] sm:text-[3rem]">{t("cta_employer_title")}</h2>
              <p className="mt-4 max-w-xl text-[1.1rem] text-paper-200/80">{t("cta_employer_sub")}</p>
            </div>
            <div className="md:text-right">
              <LinkButton href="/employer" variant="gold" size="lg">{t("cta_employer_btn")} <IArrow size={18} /></LinkButton>
            </div>
          </div>
          <Ornament color="text-haldi-300" className="px-8 pb-6 opacity-50" />
        </div>
      </section>
    </>
  );
}
