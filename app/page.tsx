import Link from "next/link";
import { getI18n, bi } from "@/lib/i18n";
import { GOALS, INDUSTRIES } from "@/lib/constants";
import { searchJobs, siteStats } from "@/lib/queries";
import { JobCard } from "@/components/JobCard";
import { LinkButton, SectionTitle, ShieldIcon } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { t, lang } = await getI18n();
  const stats = siteStats();
  const featured = searchJobs({ limit: 6 });

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-indigo-900 text-white">
        <div className="pattern-jali absolute inset-0 opacity-80" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-marigold-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-rani-500/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-24">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-marigold-300 ring-1 ring-white/15">
              <span aria-hidden>🏜️</span> {t("hero_kicker")}
            </p>
            <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              {t("hero_title_1")}
              <span className="mt-1 block text-marigold-400">{t("hero_title_2")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-indigo-100/85">{t("hero_sub")}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <LinkButton href="/jobs" variant="gold" size="lg">{t("hero_cta_primary")} →</LinkButton>
              <LinkButton href="/employer" variant="outline" size="lg" className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10">
                {t("hero_cta_secondary")}
              </LinkButton>
            </div>
            <dl className="mt-12 grid max-w-xl grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                [stats.openJobs, t("stat_jobs")],
                [stats.verified, t("stat_verified")],
                [stats.cities, t("stat_cities")],
                ["₹0", t("stat_fees")],
              ].map(([v, l]) => (
                <div key={String(l)}>
                  <dt className="font-display text-3xl font-semibold text-white">{v}</dt>
                  <dd className="mt-0.5 text-xs leading-tight text-indigo-100/70">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Floating preview of a transparent listing */}
          <div className="relative mx-auto hidden w-full max-w-md lg:block">
            <div className="arch absolute inset-x-8 -top-6 bottom-6 bg-marigold-400 bandhani" />
            <div className="animate-float relative rounded-3xl bg-white p-6 text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,.6)]">
              <div className="flex items-center gap-3">
                <div className="arch flex h-14 w-12 items-center justify-center bg-indigo-50 text-2xl">👔</div>
                <div>
                  <p className="font-display text-lg font-semibold text-indigo-900">Showroom Sales Trainee</p>
                  <p className="text-sm text-ink-soft">Shree Ram Menswear · Surat</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5 text-sm">
                {[
                  ["💰", "Salary", "₹12,000 – 15,000"],
                  ["🕙", "Hours", "10 am – 9:30 pm"],
                  ["🛏", "Stay", "Free · shared flat"],
                  ["✂️", "Deductions", "None"],
                ].map(([i, k, v]) => (
                  <div key={k} className="rounded-2xl bg-cream-100 px-3 py-2.5">
                    <p className="text-xs text-ink-soft">{i} {k}</p>
                    <p className="font-semibold">{v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-2xl bg-leaf-50 px-3 py-2.5 text-sm text-leaf-700">
                <p className="font-semibold">You can learn</p>
                <p>Billing · Stock · Pricing · Supplier dealing</p>
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-leaf-100 px-3 py-1 text-xs font-bold text-leaf-700">
                <ShieldIcon className="h-3.5 w-3.5" /> {t("verified")} · 4/4 checks
              </div>
            </div>
          </div>
        </div>
        <div className="border-scallop relative" style={{ ["--scallop" as string]: "#fffbf3" }} />
      </section>

      {/* GOALS */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionTitle center kicker="01" title={t("hero_goal_title")} sub={t("hero_goal_sub")} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {GOALS.map((g, i) => (
            <Link
              key={g.id}
              href={`/jobs?goal=${g.id}`}
              className="group relative overflow-hidden rounded-3xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-1.5 hover:border-marigold-500 hover:shadow-lift"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="arch mb-4 flex h-16 w-14 items-center justify-center bg-cream-200 text-3xl transition group-hover:bg-marigold-300">{g.icon}</div>
              <h3 className="font-display text-lg font-semibold leading-snug text-indigo-900">{bi(g, lang)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{bi(g.blurb, lang)}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-rani-600 opacity-0 transition group-hover:opacity-100">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED JOBS */}
      <section className="bg-cream-100 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle kicker="02" title={t("featured_title")} />
            <Link href="/jobs" className="text-sm font-semibold text-indigo-700 hover:underline">{t("view_all")} →</Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((j) => <JobCard key={j.id} job={j} lang={lang} t={t} />)}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <SectionTitle center kicker="03" title={t("how_title")} />
        <ol className="mt-14 grid gap-8 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <li key={n} className="relative rounded-3xl border border-line bg-white p-7 shadow-card">
              <span className="absolute -top-5 left-7 flex h-10 w-10 items-center justify-center rounded-full bg-marigold-400 font-display text-lg font-bold text-indigo-950 shadow-md">{n}</span>
              <h3 className="mt-3 font-display text-xl font-semibold text-indigo-900">{t(`how_${n}_t` as "how_1_t")}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{t(`how_${n}_d` as "how_1_d")}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* TRUST */}
      <section className="relative overflow-hidden bg-indigo-950 py-24 text-white">
        <div className="pattern-jali absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
          <SectionTitle light kicker="04" title={t("trust_title")} sub={t("trust_sub")} />
          <ul className="grid gap-4 sm:grid-cols-2">
            {(["trust_1", "trust_2", "trust_3", "trust_4", "trust_5"] as const).map((k, i) => (
              <li key={k} className={`rounded-2xl bg-white/[.07] p-5 ring-1 ring-white/10 backdrop-blur ${i === 4 ? "sm:col-span-2" : ""}`}>
                <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-leaf-500/25 text-leaf-100"><ShieldIcon /></span>
                <p className="leading-relaxed text-indigo-50">{t(k)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <SectionTitle center kicker="05" title={t("industries_title")} />
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {INDUSTRIES.map((i) => (
            <Link key={i.id} href={`/jobs?industry=${i.id}`}
              className="flex items-center gap-2.5 rounded-full border border-line bg-white px-5 py-3 font-medium text-indigo-900 shadow-card transition hover:-translate-y-0.5 hover:border-marigold-500">
              <span className="text-xl" aria-hidden>{i.icon}</span>{bi(i, lang)}
            </Link>
          ))}
        </div>
      </section>

      {/* EMPLOYER CTA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-marigold-400 px-8 py-14 text-indigo-950 sm:px-14">
          <div className="pattern-jali-light absolute inset-0" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{t("cta_employer_title")}</h2>
              <p className="mt-3 max-w-xl text-lg text-indigo-950/80">{t("cta_employer_sub")}</p>
            </div>
            <div className="md:text-right">
              <LinkButton href="/employer" variant="primary" size="lg">{t("cta_employer_btn")} →</LinkButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
