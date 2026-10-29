import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { BYPASS } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";
import { getI18n } from "@/lib/i18n";

export const metadata = { title: "Get started" };

export default async function SignUpPage() {
  const { t } = await getI18n();
  if (BYPASS) redirect("/dev-login?signup=1");
  return (
    <AuthShell title={t("au_signup_title")} sub={t("au_signup_sub")} points={[t("au_p1"), t("au_p2"), t("au_p3")]}>
      <SignUp />
    </AuthShell>
  );
}
