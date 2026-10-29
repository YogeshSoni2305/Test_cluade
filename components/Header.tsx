import Link from "next/link";
import { getCurrentUser, BYPASS } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { setLang, devLogout } from "@/app/actions";
import { btn, cx } from "./ui";
import { Seal } from "./ornaments";
import { UserMenuClerk } from "./UserMenuClerk";

export async function Header() {
  const { t, lang } = await getI18n();
  const user = await getCurrentUser();
  const dash = user?.role === "employer" ? "/employer" : user?.role === "admin" ? "/admin" : "/candidate";
  const nav = [["/jobs", t("nav_jobs")], ["/employer", t("nav_employers")], ["/safety", t("nav_safety")]];

  return (
    <>
      <div className="leheriya h-[5px]" />
      {BYPASS && (
        <div className="bg-ink px-4 py-1.5 text-center text-[0.8rem] text-paper-200">
          <span className="mr-2 inline-block rounded-[2px] bg-haldi-400 px-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink">Demo</span>
          Auth bypass is on.{" "}
          <Link href="/dev-login" className="font-semibold text-haldi-300 underline decoration-haldi-300/40 underline-offset-2 hover:decoration-haldi-300">Switch user</Link>
          {user && <span className="text-paper-300/70"> · {user.name} ({user.role ?? "no role"})</span>}
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-line bg-paper-100/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <span className="shrink-0 transition group-hover:-rotate-3"><Seal size={38} /></span>
            <span className="min-w-0 leading-none max-[380px]:hidden">
              <span className="block truncate font-display text-[1.3rem] sm:text-[1.55rem] font-semibold tracking-[-0.01em] text-ink">{t("brand")}</span>
              <span className="mt-1 hidden font-deva text-[0.82rem] text-sindoor-600 sm:block">काम · सीख · तरक्की</span>
            </span>
          </Link>

          <nav className="ml-8 hidden items-center gap-7 text-[1rem] font-medium text-ink-soft md:flex">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className="relative py-1 transition hover:text-ink after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-sindoor-500 after:transition hover:after:scale-x-100">{label}</Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <form action={setLang} className="flex overflow-hidden rounded-[3px] border border-line text-[0.85rem] font-semibold">
              <input type="hidden" name="next" value="/" />
              <button name="lang" value="en" aria-label="English" className={cx("px-2.5 py-1", lang === "en" ? "bg-ink text-paper-50" : "text-ink-soft hover:text-ink")}>EN</button>
              <button name="lang" value="hi" aria-label="हिन्दी" className={cx("px-2.5 py-1 font-deva", lang === "hi" ? "bg-ink text-paper-50" : "text-ink-soft hover:text-ink")}>हिं</button>
            </form>
            {user ? (
              <>
                <Link href={dash} className={btn("outline", "sm", "max-sm:hidden")}>{t("nav_dashboard")}</Link>
                {user.role === "admin" && <Link href="/admin" className={btn("ghost", "sm", "max-lg:hidden")}>{t("nav_admin")}</Link>}
                {BYPASS ? (
                  <form action={devLogout}><button className={btn("ghost", "sm")}>{t("nav_signout")}</button></form>
                ) : (
                  <UserMenuClerk />
                )}
              </>
            ) : (
              <>
                <Link href="/sign-in" className={btn("ghost", "sm", "max-sm:hidden")}>{t("nav_signin")}</Link>
                <Link href="/sign-up" className={btn("primary", "sm")}>{t("nav_signup")}</Link>
              </>
            )}
          </div>
        </div>
        <nav className="flex gap-5 overflow-x-auto border-t border-line px-4 py-2 text-[0.95rem] font-medium text-ink-soft md:hidden">
          {nav.map(([href, label]) => <Link key={href} href={href} className="shrink-0">{label}</Link>)}
          {user && <Link href={dash} className="shrink-0 text-sindoor-600">{t("nav_dashboard")}</Link>}
        </nav>
      </header>
    </>
  );
}
