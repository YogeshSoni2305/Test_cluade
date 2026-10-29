import { getI18n } from "@/lib/i18n";
import { Jharokha } from "@/components/ornaments";
import { OfflineList } from "@/components/OfflineList";

export const metadata = { title: "Offline", robots: { index: false } };

export default async function Offline() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <Jharokha className="mx-auto h-36 w-28" />
      <h1 className="mt-8 font-display text-[2.6rem] font-medium leading-tight text-ink">{t("offline_title")}</h1>
      <p className="mt-3 text-ink-soft">{t("offline_body")}</p>
      <OfflineList heading={t("offline_saved")} empty={t("offline_none")} />
    </div>
  );
}
