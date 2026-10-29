import { redirect } from "next/navigation";
import { HumanCheck } from "@/components/HumanCheck";
import { getCurrentUser } from "@/lib/auth";
import { chooseRole } from "@/app/actions";
import { getI18n } from "@/lib/i18n";
import { btn, Field, Notice, PageHeader, Tiles } from "@/components/ui";
import { IBriefcase, IHaveli } from "@/components/icons";

export const metadata = { title: "Welcome" };

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const { t } = await getI18n();
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.role) redirect("/");
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <PageHeader deva="स्वागत है" title={t("ob_title")} sub={t("ob_sub")} />
      {sp.error && <div className="mb-6"><Notice tone="bad">{sp.error}</Notice></div>}
      <form action={chooseRole} className="space-y-6">
              <HumanCheck />
        <Tiles type="radio" name="role" selected={["candidate"]} options={[
          { value: "candidate", icon: <IBriefcase size={22} />, title: t("ob_cand"), sub: t("ob_cand_sub") },
          { value: "employer", icon: <IHaveli size={22} />, title: t("ob_emp"), sub: t("ob_emp_sub") },
        ]} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("cp_name")} required><input name="name" className="field" required defaultValue={user.name} /></Field>
          <Field label={t("cp_phone")}><input name="phone" className="field" inputMode="tel" defaultValue={user.phone ?? ""} /></Field>
        </div>
        <button className={btn("primary", "lg", "w-full")}>{t("ob_continue")}</button>
      </form>
    </div>
  );
}
