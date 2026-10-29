import { requireUser } from "@/lib/auth";
import { getEmployerByUser } from "@/lib/queries";
import { getI18n, bi } from "@/lib/i18n";
import { BUSINESS_TYPES, CITIES, INDUSTRIES, RAJASTHAN_DISTRICTS } from "@/lib/constants";
import { saveEmployerProfile } from "@/app/actions";
import { btn, Card, Field, Notice, PageHeader, SubmitBar } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Business profile" };

export default async function EmployerProfile({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("employer");
  const sp = await searchParams;
  const { t, lang } = await getI18n();
  const e = getEmployerByUser(user.id);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader deva="कारोबार" title={e ? t("ep_title") : t("ep_title_new")} sub={t("ep_sub")} />
      {sp.error && <div className="mb-6"><Notice tone="bad">{sp.error}</Notice></div>}
      {sp.saved && <div className="mb-6"><Notice tone="ok">{t("ep_saved")}</Notice></div>}
      <form action={saveEmployerProfile} className="space-y-6">
        <Card className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("ep_business")} required className="sm:col-span-2"><input name="business_name" className="field" required defaultValue={e?.business_name} /></Field>
            <Field label={t("ep_owner")}><input name="owner_name" className="field" defaultValue={e?.owner_name || user.name} /></Field>
            <Field label={t("ep_phone")} required hint={t("ep_phone_hint")}><input name="contact_phone" className="field" required inputMode="tel" defaultValue={e?.contact_phone || user.phone || ""} /></Field>
            <Field label={t("filter_industry")} required>
              <select name="industry" className="field" defaultValue={e?.industry ?? "menswear"}>{INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{bi(i, lang)}</option>)}</select>
            </Field>
            <Field label={t("ep_type")}>
              <select name="business_type" className="field" defaultValue={e?.business_type ?? "retail"}>{BUSINESS_TYPES.map((b) => <option key={b.id} value={b.id}>{bi(b, lang)}</option>)}</select>
            </Field>
            <Field label={t("filter_city")} required>
              <select name="city" className="field" defaultValue={e?.city ?? "Surat"}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
            </Field>
            <Field label={t("ep_address")}><input name="address" className="field" defaultValue={e?.address} /></Field>
            <Field label={t("ep_years")}><input name="years_in_business" type="number" min="0" className="field" defaultValue={e?.years_in_business ?? ""} /></Field>
            <Field label={t("ep_staff")}><input name="staff_count" type="number" min="0" className="field" defaultValue={e?.staff_count ?? ""} /></Field>
            <Field label={t("ep_origin")} className="sm:col-span-2" hint={t("ep_origin_hint")}>
              <select name="origin_district" className="field" defaultValue={e?.origin_district ?? ""}>
                <option value="">—</option>{RAJASTHAN_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label={t("ep_about")} className="sm:col-span-2" hint={t("ep_about_hint")}><textarea name="about" className="field" defaultValue={e?.about} /></Field>
          </div>
        </Card>
        <SubmitBar><button className={btn("primary", "lg")}>{e ? t("jf_save") : t("ep_continue")}</button></SubmitBar>
      </form>
    </div>
  );
}
