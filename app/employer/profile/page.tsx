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
  const { lang } = await getI18n();
  const e = getEmployerByUser(user.id);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader deva="कारोबार" title={e ? "Business profile" : "Tell us about your business"} sub="This is shown on every listing you post. Accurate details build trust with candidates and their families." />
      {sp.error && <div className="mb-6"><Notice tone="bad">{sp.error}</Notice></div>}
      {sp.saved && <div className="mb-6"><Notice tone="ok">Saved.</Notice></div>}
      <form action={saveEmployerProfile} className="space-y-6">
        <Card className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name" required className="sm:col-span-2"><input name="business_name" className="field" required defaultValue={e?.business_name} /></Field>
            <Field label="Owner / contact person"><input name="owner_name" className="field" defaultValue={e?.owner_name || user.name} /></Field>
            <Field label="Business phone" required hint="Shared only with candidates who apply."><input name="contact_phone" className="field" required inputMode="tel" defaultValue={e?.contact_phone || user.phone || ""} /></Field>
            <Field label="Industry" required>
              <select name="industry" className="field" defaultValue={e?.industry ?? "menswear"}>{INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{bi(i, lang)}</option>)}</select>
            </Field>
            <Field label="Type of business">
              <select name="business_type" className="field" defaultValue={e?.business_type ?? "retail"}>{BUSINESS_TYPES.map((b) => <option key={b.id} value={b.id}>{bi(b, lang)}</option>)}</select>
            </Field>
            <Field label="City" required>
              <select name="city" className="field" defaultValue={e?.city ?? "Surat"}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
            </Field>
            <Field label="Full address"><input name="address" className="field" defaultValue={e?.address} /></Field>
            <Field label="Years in business"><input name="years_in_business" type="number" min="0" className="field" defaultValue={e?.years_in_business ?? ""} /></Field>
            <Field label="Number of staff"><input name="staff_count" type="number" min="0" className="field" defaultValue={e?.staff_count ?? ""} /></Field>
            <Field label="Family roots in Rajasthan (optional)" className="sm:col-span-2" hint="Candidates and families often trust owners from their own region.">
              <select name="origin_district" className="field" defaultValue={e?.origin_district ?? ""}>
                <option value="">—</option>{RAJASTHAN_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="About your business" className="sm:col-span-2" hint="What you sell, how long you’ve been running, what it’s like to work with you."><textarea name="about" className="field" defaultValue={e?.about} /></Field>
          </div>
        </Card>
        <SubmitBar><button className={btn("gold", "lg")}>{e ? "Save changes" : "Save & continue →"}</button></SubmitBar>
      </form>
    </div>
  );
}
