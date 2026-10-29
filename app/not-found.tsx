import { LinkButton } from "@/components/ui";
import { Jharokha } from "@/components/ornaments";
import { ICompass } from "@/components/icons";
import { getI18n } from "@/lib/i18n";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <Jharokha className="mx-auto h-40 w-32"><div className="flex h-full items-end justify-center pb-8 text-haldi-300"><ICompass size={36} /></div></Jharokha>
      <p className="deva-accent mt-8 font-deva text-xl text-sindoor-600" lang="hi">रास्ता भटक गए?</p>
      <h1 className="mt-1 font-display text-[2.8rem] font-medium leading-tight text-ink">{t("nf_title")}</h1>
      <p className="mt-3 text-ink-soft">{t("nf_sub")}</p>
      <div className="mt-8 flex justify-center gap-3">
        <LinkButton href="/jobs" variant="primary">{t("hero_cta_primary")}</LinkButton>
        <LinkButton href="/" variant="outline">{t("nf_home")}</LinkButton>
      </div>
    </div>
  );
}
