import { ACCOMMODATION, CITIES, EDUCATION, EXPERIENCE_REQ, LANGUAGES, SALARY_PERIODS, STAGES, WEEKLY_HOLIDAYS, skillsFor } from "@/lib/constants";
import { saveJob } from "@/app/actions";
import { getI18n, bi } from "@/lib/i18n";
import type { Employer, Job } from "@/lib/queries";
import { btn, Chips, Field, FieldGroup, FormSection, Notice, SubmitBar, Tiles } from "./ui";

const HOLIDAY_HI: Record<string, string> = {
  Sunday: "रविवार", Monday: "सोमवार", Tuesday: "मंगलवार", Wednesday: "बुधवार", Thursday: "गुरुवार", Friday: "शुक्रवार",
  Saturday: "शनिवार", Rotating: "बारी-बारी से", "No fixed weekly holiday": "कोई तय साप्ताहिक छुट्टी नहीं",
};

export async function JobForm({ employer, job, error, copy = false }: { employer: Employer; job?: Job; error?: string; copy?: boolean }) {
  const { t, lang } = await getI18n();
  const industry = job?.industry ?? employer.industry;
  const skills = skillsFor(industry);
  const noDed = job ? /^no\s+deductions?$/i.test(job.deductions.trim()) : false;
  const hasHindi = Boolean(job?.description_hi || job?.responsibilities_hi || job?.learning_notes_hi);
  return (
    <form action={saveJob} className="space-y-10">
      {job && !copy && <input type="hidden" name="id" value={job.id} />}
      <input type="hidden" name="industry" value={industry} />
      {error && <Notice tone="bad">{error}</Notice>}

      <FormSection n="१" title={t("jf_s1")} sub={t("jf_s1_sub")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("jf_title")} required className="sm:col-span-2"><input name="title" className="field" required maxLength={80} defaultValue={job?.title} placeholder={t("jf_title_ph")} /></Field>
          <Field label={t("filter_city")} required>
            <select name="city" className="field" defaultValue={job?.city ?? employer.city}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label={t("jf_locality")}><input name="locality" className="field" defaultValue={job?.locality} placeholder={t("jf_locality_ph")} /></Field>
          <Field label={t("jf_about")} className="sm:col-span-2"><textarea name="description" className="field" defaultValue={job?.description} placeholder={t("jf_about_ph")} /></Field>
          <Field label={t("responsibilities")} className="sm:col-span-2" hint={t("jf_resp_hint")}><textarea name="responsibilities" className="field" defaultValue={job?.responsibilities} /></Field>
        </div>
        <details open={hasHindi} className="rounded-[3px] border border-dashed border-paper-300 p-4">
          <summary className="cursor-pointer font-semibold text-ink">{t("jf_hindi")} <span className="font-normal text-ink-soft">— {t("jf_hindi_sub")}</span></summary>
          <div className="mt-4 grid gap-4" lang="hi">
            <Field label={t("jf_about_hi")}><textarea name="description_hi" className="field font-deva" defaultValue={job?.description_hi} /></Field>
            <Field label={t("jf_resp_hi")}><textarea name="responsibilities_hi" className="field font-deva" defaultValue={job?.responsibilities_hi} /></Field>
            <Field label={t("jf_learn_hi")}><textarea name="learning_notes_hi" className="field font-deva" defaultValue={job?.learning_notes_hi} /></Field>
          </div>
        </details>
      </FormSection>

      <FormSection n="२" title={t("jf_s2")} sub={t("jf_s2_sub")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("jf_salary_from")} required><input name="salary_min" type="number" min="1" className="field num" required defaultValue={job?.salary_min || ""} /></Field>
          <Field label={t("jf_salary_to")}><input name="salary_max" type="number" min="1" className="field num" defaultValue={job?.salary_max || ""} /></Field>
          <Field label={t("jf_paid")}>
            <select name="salary_period" className="field" defaultValue={job?.salary_period ?? "month"}>{SALARY_PERIODS.map((p) => <option key={p.id} value={p.id}>{bi(p, lang)}</option>)}</select>
          </Field>
          <Field label={t("hours")} required className="sm:col-span-2"><input name="hours" className="field" required defaultValue={job?.hours} placeholder={t("jf_hours_ph")} /></Field>
          <Field label={t("holiday")} required>
            <select name="weekly_holiday" className="field" required defaultValue={job?.weekly_holiday ?? "Sunday"}>{WEEKLY_HOLIDAYS.map((d) => <option key={d} value={d}>{lang === "hi" ? HOLIDAY_HI[d] : d}</option>)}</select>
          </Field>
          <Field label={t("jf_meals")}><input name="meals" className="field" defaultValue={job?.meals} placeholder={t("jf_meals_ph")} /></Field>
          <Field label={t("jf_benefits")} className="sm:col-span-2"><input name="benefits" className="field" defaultValue={job?.benefits} placeholder={t("jf_benefits_ph")} /></Field>
        </div>

        <div className="rounded-[3px] border border-line bg-paper-50 p-4">
          <p className="font-semibold text-ink">{t("jf_ded_title")}</p>
          <p className="mb-3 text-[0.92rem] text-ink-soft">{t("jf_ded_sub")}</p>
          <label className="mb-3 flex cursor-pointer items-center gap-2.5 text-[0.95rem] font-semibold">
            <input type="checkbox" name="no_deductions" defaultChecked={noDed} className="h-4 w-4 accent-sindoor-600" /> {t("jf_no_ded")}
          </label>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label={t("jf_ded_list")}><input name="deductions" className="field" defaultValue={noDed ? "" : job?.deductions} placeholder={t("jf_ded_ph")} /></Field>
            <Field label={t("jf_deposit")} hint={t("jf_deposit_hint")}><input name="deposit_amount" type="number" min="0" className="field num" defaultValue={job?.deposit_amount ?? 0} /></Field>
          </div>
          <p className="mt-3 text-[0.85rem] text-ink-soft">{t("jf_no_fees")}</p>
        </div>
      </FormSection>

      <FormSection n="३" title={t("stay")} sub={t("jf_s3_sub")}>
        <Tiles type="radio" cols="sm:grid-cols-3" name="accommodation" selected={[job?.accommodation ?? "none"]} options={ACCOMMODATION.map((a) => ({ value: a.id, title: bi(a, lang) }))} />
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <Field label={t("jf_stay_cost")}><input name="accommodation_cost" type="number" min="0" className="field num" defaultValue={job?.accommodation_cost ?? 0} /></Field>
          <Field label={t("jf_stay_details")} hint={t("jf_stay_details_hint")}><input name="accommodation_details" className="field" defaultValue={job?.accommodation_details} /></Field>
        </div>
        <label className="flex cursor-pointer items-start gap-2.5 rounded-[3px] border-l-[3px] border-haldi-500 bg-haldi-100/50 p-3 text-[0.95rem]">
          <input type="checkbox" name="accommodation_confirmed" defaultChecked={!!job?.accommodation_confirmed} className="mt-0.5 h-4 w-4 accent-sindoor-600" />
          <span>{t("jf_stay_confirm")}</span>
        </label>
      </FormSection>

      <FormSection n="४" title={t("jf_s4")} sub={t("jf_s4_sub")}>
        <p className="text-[0.92rem] text-ink-soft">{t("jf_stages_note")}</p>
        {STAGES.map((st) => (
          <FieldGroup key={st.stage} label={`${t("jf_stage")} ${st.stage} · ${bi(st, lang)}`}>
            <Chips name="skills_offered" selected={job?.skills_offered ?? []} options={skills.filter((s) => s.stage === st.stage).map((s) => ({ value: s.id, label: bi(s, lang) }))} />
          </FieldGroup>
        ))}
        <Field label={t("jf_learn_notes")} hint={t("jf_learn_notes_hint")}><textarea name="learning_notes" className="field" defaultValue={job?.learning_notes} /></Field>
        <label className="flex cursor-pointer items-start gap-2.5 rounded-[3px] border-l-[3px] border-haldi-500 bg-haldi-100/50 p-3 text-[0.95rem]">
          <input type="checkbox" name="learning_confirmed" defaultChecked={!!job?.learning_confirmed} className="mt-0.5 h-4 w-4 accent-sindoor-600" />
          <span>{t("jf_learn_confirm")}</span>
        </label>
      </FormSection>

      <FormSection n="५" title={t("requirements")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("jf_min_edu")}>
            <select name="education_req" className="field" defaultValue={job?.education_req ?? "any"}>
              <option value="any">{t("jd_any")}</option>{EDUCATION.filter((e) => e.id !== "below10").map((e) => <option key={e.id} value={e.id}>{bi(e, lang)}</option>)}
            </select>
          </Field>
          <Field label={t("jd_experience")}>
            <select name="experience_req" className="field" defaultValue={job?.experience_req ?? "fresher"}>{EXPERIENCE_REQ.map((e) => <option key={e.id} value={e.id}>{bi(e, lang)}</option>)}</select>
          </Field>
          <Field label={t("jf_joining")}><input type="date" name="joining_date" className="field" defaultValue={job?.joining_date ?? ""} /></Field>
          <Field label={t("jf_openings")}><input type="number" min="1" name="openings" className="field num" defaultValue={job?.openings ?? 1} /></Field>
        </div>
        <FieldGroup label={t("jf_languages")}><Chips name="languages" selected={job?.languages ?? ["Hindi"]} options={LANGUAGES.map((l) => ({ value: l, label: l }))} /></FieldGroup>
      </FormSection>

      <SubmitBar>
        <p className="mr-auto pl-3 text-[0.85rem] text-ink-soft max-sm:hidden">{t("jf_review_note")}</p>
        <button className={btn("primary", "lg")}>{job && !copy ? t("jf_save") : t("jf_publish")}</button>
      </SubmitBar>
    </form>
  );
}
