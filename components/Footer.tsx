import Link from "next/link";
import { getI18n } from "@/lib/i18n";
import { ButaBand, Seal } from "./ornaments";

export async function Footer() {
  const { t } = await getI18n();
  const cols: [string, [string, string][]][] = [
    ["Candidates", [["/jobs", t("nav_jobs")], ["/sign-up", t("nav_signup")], ["/safety", t("nav_safety")]]],
    ["Employers", [["/employer", t("cta_employer_btn")], ["/employer/verification", "Get verified"], ["/safety#employers", "Listing rules"]]],
  ];
  return (
    <footer className="mt-28 bg-sindoor-800 text-paper-200">
      <ButaBand color="#e0a82b" className="bg-sindoor-900" id="buta-foot" />
      <div className="bandhani">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Seal size={44} tone="paper" />
              <div>
                <p className="font-display text-2xl font-semibold text-paper-50">{t("brand")}</p>
                <p className="font-deva text-sm text-haldi-300">शुभ लाभ · ईमानदार काम</p>
              </div>
            </div>
            <p className="mt-6 max-w-sm text-[0.95rem] leading-relaxed text-paper-200/80">{t("footer_note")}</p>
            <p className="mt-5 inline-flex items-center gap-2 border border-haldi-300/40 px-3 py-1.5 text-[0.9rem] font-semibold text-haldi-200">
              {t("footer_free")}
            </p>
          </div>
          {cols.map(([title, links]) => (
            <div key={title}>
              <p className="mb-4 text-[0.8rem] font-semibold uppercase tracking-[0.2em] text-haldi-300">{title}</p>
              <ul className="space-y-2.5">
                {links.map(([href, label]) => (
                  <li key={href}><Link className="text-paper-200/85 transition hover:text-paper-50" href={href}>{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-paper-50/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-[0.85rem] text-paper-200/60 sm:px-6">
            <span>© {new Date().getFullYear()} {t("brand")}</span>
            <span className="font-deva">राजस्थान के लिए, पूरे भारत में</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
