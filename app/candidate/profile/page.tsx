import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getCandidateProfile } from "@/lib/queries";
import { getI18n, bi } from "@/lib/i18n";
import { CITIES, EDUCATION, GOALS, INDUSTRIES, LANGUAGES, RAJASTHAN_DISTRICTS } from "@/lib/constants";
import { saveCandidateProfile } from "@/app/actions";
import { btn, Chips, Field, FieldGroup, FormSection, Notice, PageHeader, SubmitBar, Tiles } from "@/components/ui";
import { GoalIcon, IndustryIcon } from "@/components/icons";
import { SimpleProfile } from "@/components/SimpleProfile";

export const dynamic = "force-dynamic";
export const metadata = { title: "My profile", robots: { index: false } };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("candidate");
  const sp = await searchParams;
  const { t, lang } = await getI18n();
  const p = getCandidateProfile(user.id);
  const isNew = !p?.completed;
  // new candidates start with the one-question-at-a-time flow; anyone can switch
  const simple = sp.mode === "simple" || (isNew && sp.mode !== "full");
  const modeLink = (m: string) => `/candidate/profile?${new URLSearchParams({ mode: m, ...(sp.next ? { next: sp.next } : {}) })}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHeader
        deva={isNew ? "अपने बारे में बताइए" : "मेरी प्रोफ़ाइल"}
        title={isNew ? t("cp_title_new") : t("cp_title")}
        sub={t("cp_sub")}
        actions={<Link href={modeLink(simple ? "full" : "simple")} className={btn("outline", "sm")}>{simple ? t("cp_switch_full") : t("cp_switch_simple")}</Link>}
      />
      <div className="mb-6 space-y-3">
        {sp.error && <Notice tone="bad">{sp.error}</Notice>}
        {sp.saved && <Notice tone="ok">{t("cd_saved")}</Notice>}
      </div>

      {simple ? (
        <SimpleProfile
          action={saveCandidateProfile}
          lang={lang}
          next={sp.next}
          text={{
            step: t("sp_step"), of: t("sp_of"), next: t("sp_next"), back: t("sp_back"), save: t("sp_save"), listen: t("jd_listen"), stop: t("jd_listen_stop"),
            yes: t("sp_yes"), no: t("sp_no"), q_name: t("sp_q_name"), q_phone: t("sp_q_phone"), q_district: t("sp_q_district"), q_education: t("sp_q_education"),
            q_goals: t("sp_q_goals"), q_industries: t("sp_q_industries"), q_cities: t("sp_q_cities"), q_relocate: t("sp_q_relocate"), q_stay: t("sp_q_stay"),
            q_searchable: t("sp_q_searchable"), q_family: t("sp_q_family"), hint_multi: t("sp_hint_multi"), choose: t("sp_choose"),
            family_name: t("cp_family_name"), family_phone: t("cp_family_phone"), optional: t("sp_optional"), name_needed: t("sp_name_needed"), district_needed: t("sp_district_needed"),
          }}
          defaults={{
            name: user.name, phone: user.phone_norm ?? "", district: p?.district ?? "", education: p?.education ?? "10", goals: p?.goals ?? [],
            industries: p?.industries ?? [], cities: p?.cities ?? [], relocate: p ? !!p.relocate : true, stay: p ? !!p.needs_accommodation : true,
            searchable: !!p?.searchable, languages: p?.languages.length ? p.languages : ["Hindi"], family_name: p?.family_name ?? "", family_phone: p?.family_phone ?? "",
            experience: p?.experience ?? "", learn_notes: p?.learn_notes ?? "", age: p?.age ? String(p.age) : "",
          }}
          districts={RAJASTHAN_DISTRICTS}
          education={EDUCATION.map((e) => ({ value: e.id, label: bi(e, lang) }))}
          goals={GOALS.map((g) => ({ value: g.id, label: bi(g, lang), icon: <GoalIcon id={g.id} size={24} /> }))}
          industries={INDUSTRIES.map((i) => ({ value: i.id, label: bi(i, lang), icon: <IndustryIcon id={i.id} size={24} /> }))}
          cities={CITIES.filter((c) => c !== "Other")}
        />
      ) : (
        <form action={saveCandidateProfile} className="space-y-10">
          <input type="hidden" name="next" value={sp.next ?? ""} />
          <input type="hidden" name="mode" value="full" />

          <FormSection n="१" title={t("cp_s1")} sub={t("cp_s1_sub")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("cp_name")} required><input name="name" className="field" defaultValue={user.name} required autoComplete="name" /></Field>
              <Field label={t("cp_phone")}><input name="phone" className="field" inputMode="tel" defaultValue={user.phone_norm ?? ""} autoComplete="tel" /></Field>
              <Field label={t("cp_age")}><input name="age" type="number" min="16" max="60" className="field" defaultValue={p?.age ?? ""} /></Field>
              <Field label={t("cp_district")} required>
                <select name="district" className="field" defaultValue={p?.district ?? ""} required>
                  <option value="" disabled>{t("sp_choose")}</option>
                  {RAJASTHAN_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label={t("jd_education")} className="sm:col-span-2">
                <select name="education" className="field" defaultValue={p?.education ?? "12"}>
                  {EDUCATION.map((e) => <option key={e.id} value={e.id}>{bi(e, lang)}</option>)}
                </select>
              </Field>
            </div>
            <FieldGroup label={t("cp_languages")}>
              <Chips name="languages" selected={p?.languages ?? ["Hindi"]} options={LANGUAGES.map((l) => ({ value: l, label: l }))} />
            </FieldGroup>
            <Field label={t("cp_experience")} hint={t("cp_experience_hint")}>
              <textarea name="experience" className="field" defaultValue={p?.experience ?? ""} />
            </Field>
          </FormSection>

          <FormSection n="२" title={t("cp_s2")} sub={t("cp_s2_sub")}>
            <FieldGroup label={t("cd_goals")}>
              <Tiles name="goals" selected={p?.goals ?? []} options={GOALS.map((g) => ({ value: g.id, icon: <GoalIcon id={g.id} size={22} />, title: bi(g, lang), sub: bi(g.blurb, lang) }))} />
            </FieldGroup>
            <FieldGroup label={t("cp_industries")}>
              <Chips name="industries" selected={p?.industries ?? []} options={INDUSTRIES.map((i) => ({ value: i.id, label: bi(i, lang) }))} />
            </FieldGroup>
            <Field label={t("cp_learn")} hint={t("cp_learn_hint")}>
              <textarea name="learn_notes" className="field" defaultValue={p?.learn_notes ?? ""} />
            </Field>
          </FormSection>

          <FormSection n="३" title={t("cp_s3")} sub={t("cp_s3_sub")}>
            <FieldGroup label={t("cp_cities")}>
              <Chips name="cities" selected={p?.cities ?? []} options={CITIES.filter((c) => c !== "Other").map((c) => ({ value: c, label: c }))} />
            </FieldGroup>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-[3px] border border-line bg-paper-50 p-4">
                <input type="checkbox" name="relocate" defaultChecked={p ? !!p.relocate : true} className="mt-1 h-4 w-4 accent-sindoor-600" />
                <span><b>{t("cp_relocate")}</b><br /><span className="text-[0.92rem] text-ink-soft">{t("cp_relocate_sub")}</span></span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-[3px] border border-line bg-paper-50 p-4">
                <input type="checkbox" name="needs_accommodation" defaultChecked={p ? !!p.needs_accommodation : true} className="mt-1 h-4 w-4 accent-sindoor-600" />
                <span><b>{t("cp_stay")}</b><br /><span className="text-[0.92rem] text-ink-soft">{t("cp_stay_sub")}</span></span>
              </label>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-[3px] border border-line bg-paper-50 p-4">
              <input type="checkbox" name="searchable" defaultChecked={!!p?.searchable} className="mt-1 h-4 w-4 accent-sindoor-600" />
              <span><b>{t("acct_searchable")}</b><br /><span className="text-[0.92rem] text-ink-soft">{t("acct_searchable_sub")}</span></span>
            </label>
          </FormSection>

          <FormSection n="४" title={t("cp_s4")} sub={t("cp_s4_sub")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("cp_family_name")}><input name="family_name" className="field" placeholder={t("cp_family_name_ph")} defaultValue={p?.family_name ?? ""} /></Field>
              <Field label={t("cp_family_phone")}><input name="family_phone" className="field" inputMode="tel" placeholder="+91 …" defaultValue={p?.family_phone ?? ""} /></Field>
            </div>
          </FormSection>

          <SubmitBar>
            <button className={btn("primary", "lg")}>{isNew ? t("sp_save") : t("cp_save")}</button>
          </SubmitBar>
        </form>
      )}
    </div>
  );
}
