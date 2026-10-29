import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { BYPASS } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";
import { getI18n } from "@/lib/i18n";

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
  const { t } = await getI18n();
  if (BYPASS) redirect("/dev-login");
  return (
    <AuthShell title={t("au_signin_title")} sub={t("au_signin_sub")} points={[t("au_p1"), t("au_p2"), t("au_p3")]}>
      <SignIn />
    </AuthShell>
  );
}
