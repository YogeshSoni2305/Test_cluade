import Link from "next/link";
import { getCurrentUser, BYPASS } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { setLang, devLogout } from "@/app/actions";
import { btn, Logo } from "./ui";
import { UserMenuClerk } from "./UserMenuClerk";

export async function Header() {
  const { t, lang } = await getI18n();
  const user = await getCurrentUser();
  const dash = user?.role === "employer" ? "/employer" : user?.role === "admin" ? "/admin" : "/candidate";

  return (
    <>
      {BYPASS && (
        <div className="bg-marigold-400 px-4 py-1.5 text-center text-xs font-semibold text-indigo-950">
          Auth bypass is ON — demo mode.{" "}
          <Link href="/dev-login" className="underline underline-offset-2">Switch demo user</Link>
          {user && <span className="opacity-70"> · signed in as {user.name} ({user.role ?? "no role"})</span>}
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-line/80 bg-cream-50/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <Logo />
            <span className="leading-tight">
              <span className="block truncate font-display text-lg font-semibold text-indigo-900 sm:text-xl">{t("brand")}</span>
              <span className="hidden text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-rani-600 sm:block">{t("brand_tag")}</span>
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 text-[0.95rem] font-medium text-ink-soft md:flex">
            <Link href="/jobs" className="rounded-full px-3.5 py-2 hover:bg-cream-200 hover:text-indigo-900">{t("nav_jobs")}</Link>
            <Link href="/employer" className="rounded-full px-3.5 py-2 hover:bg-cream-200 hover:text-indigo-900">{t("nav_employers")}</Link>
            <Link href="/safety" className="rounded-full px-3.5 py-2 hover:bg-cream-200 hover:text-indigo-900">{t("nav_safety")}</Link>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <form action={setLang}>
              <input type="hidden" name="lang" value={lang === "hi" ? "en" : "hi"} />
              <input type="hidden" name="next" value="/" />
              <button className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold text-indigo-800 hover:border-indigo-500" aria-label="Switch language">
                {t("language_toggle")}
              </button>
            </form>
            {user ? (
              <>
                <Link href={dash} className={btn("outline", "sm", "hidden sm:inline-flex")}>{t("nav_dashboard")}</Link>
                {user.role === "admin" && <Link href="/admin" className={btn("ghost", "sm", "hidden lg:inline-flex")}>{t("nav_admin")}</Link>}
                {BYPASS ? (
                  <form action={devLogout}><button className={btn("ghost", "sm")}>{t("nav_signout")}</button></form>
                ) : (
                  <UserMenuClerk />
                )}
              </>
            ) : (
              <>
                <Link href="/sign-in" className={btn("ghost", "sm", "hidden sm:inline-flex")}>{t("nav_signin")}</Link>
                <Link href="/sign-up" className={btn("primary", "sm")}>{t("nav_signup")}</Link>
              </>
            )}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-line/60 px-3 py-1.5 text-sm font-medium text-ink-soft md:hidden">
          <Link href="/jobs" className="rounded-full px-3 py-1.5">{t("nav_jobs")}</Link>
          <Link href="/employer" className="rounded-full px-3 py-1.5">{t("nav_employers")}</Link>
          <Link href="/safety" className="rounded-full px-3 py-1.5">{t("nav_safety")}</Link>
          {user && <Link href={dash} className="rounded-full px-3 py-1.5">{t("nav_dashboard")}</Link>}
        </nav>
      </header>
    </>
  );
}
