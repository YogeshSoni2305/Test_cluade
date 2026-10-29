import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Account suspended", robots: { index: false } };

export default async function Suspended() {
  const user = await getCurrentUser();
  if (!user?.suspended) redirect("/");
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <PageHeader deva="खाता निलंबित" title={t("suspended_title")} sub={t("suspended_body")} />
      {user.suspended_reason && <p className="border-l-[3px] border-sindoor-500 bg-sindoor-50 px-4 py-3 text-sindoor-700">{user.suspended_reason}</p>}
      <p className="mt-6 text-ink-soft">{t("suspended_contact")}</p>
    </div>
  );
}
