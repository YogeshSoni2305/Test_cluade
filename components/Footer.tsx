import Link from "next/link";
import { getI18n } from "@/lib/i18n";
import { Logo } from "./ui";

export async function Footer() {
  const { t } = await getI18n();
  return (
    <footer className="mt-24 bg-indigo-950 text-indigo-100">
      <div className="pattern-jali h-3 w-full opacity-60" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo light />
            <span className="font-display text-xl font-semibold text-white">{t("brand")}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-indigo-100/70">{t("footer_note")}</p>
          <p className="mt-4 inline-block rounded-full bg-leaf-600/25 px-3 py-1 text-sm font-semibold text-leaf-100">✓ {t("footer_free")}</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-white">Candidates</p>
          <ul className="space-y-2 text-indigo-100/70">
            <li><Link className="hover:text-white" href="/jobs">{t("nav_jobs")}</Link></li>
            <li><Link className="hover:text-white" href="/sign-up">{t("nav_signup")}</Link></li>
            <li><Link className="hover:text-white" href="/safety">{t("nav_safety")}</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-white">Employers</p>
          <ul className="space-y-2 text-indigo-100/70">
            <li><Link className="hover:text-white" href="/employer">{t("cta_employer_btn")}</Link></li>
            <li><Link className="hover:text-white" href="/employer/verification">Get verified</Link></li>
            <li><Link className="hover:text-white" href="/safety#employers">Listing rules</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-indigo-100/50">
        © {new Date().getFullYear()} {t("brand")} · Made for Rajasthan
      </div>
    </footer>
  );
}
