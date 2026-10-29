import { getI18n } from "@/lib/i18n";
import { findLetter } from "@/app/_actions/letters";
import { btn, Field, PageHeader } from "@/components/ui";

export const metadata = { title: "Verify an experience letter", description: "Check that an experience letter issued on Rajasthan Kaam is genuine." };

export default async function VerifyLetter() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <PageHeader deva="पत्र सत्यापन" title={t("letter_verify_title")} sub={t("letter_verify_sub")} />
      <form action={findLetter} className="flex items-end gap-3">
        <Field label={t("letter_code")} className="flex-1"><input name="code" required className="field num uppercase tracking-wider" placeholder="RK-XXXX-XXXX" autoComplete="off" /></Field>
        <button className={btn("primary", "md")}>{t("letter_check")}</button>
      </form>
    </div>
  );
}
