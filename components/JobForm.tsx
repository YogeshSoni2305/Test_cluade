import { ACCOMMODATION, CITIES, EDUCATION, EXPERIENCE_REQ, LANGUAGES, SALARY_PERIODS, STAGES, WEEKLY_HOLIDAYS, skillsFor } from "@/lib/constants";
import { saveJob } from "@/app/actions";
import type { Employer, Job } from "@/lib/queries";
import { btn, Chips, Field, FieldGroup, FormSection, Notice, SubmitBar, Tiles } from "./ui";

export function JobForm({ employer, job, error }: { employer: Employer; job?: Job; error?: string }) {
  const industry = job?.industry ?? employer.industry;
  const skills = skillsFor(industry);
  const noDed = job ? /^no\s+deductions?$/i.test(job.deductions.trim()) : false;
  return (
    <form action={saveJob} className="space-y-10">
      {job && <input type="hidden" name="id" value={job.id} />}
      <input type="hidden" name="industry" value={industry} />
      {error && <Notice tone="bad">{error}</Notice>}

      <FormSection n="१" title="The role" sub="What the job is, in plain words.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job title" required className="sm:col-span-2"><input name="title" className="field" required defaultValue={job?.title} placeholder="e.g. Showroom Sales Trainee" /></Field>
          <Field label="City" required>
            <select name="city" className="field" defaultValue={job?.city ?? employer.city}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="Area / locality"><input name="locality" className="field" defaultValue={job?.locality} placeholder="e.g. Ring Road" /></Field>
          <Field label="About the role" className="sm:col-span-2"><textarea name="description" className="field" defaultValue={job?.description} placeholder="A short, honest summary of the job." /></Field>
          <Field label="Day-to-day responsibilities" className="sm:col-span-2" hint="What will they actually do all day?"><textarea name="responsibilities" className="field" defaultValue={job?.responsibilities} /></Field>
        </div>
      </FormSection>

      <FormSection n="२" title="Pay & conditions" sub="Required. Shown to every candidate exactly as you write it.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Salary from (₹)" required><input name="salary_min" type="number" min="1" className="field" required defaultValue={job?.salary_min || ""} /></Field>
          <Field label="Salary up to (₹)"><input name="salary_max" type="number" min="1" className="field" defaultValue={job?.salary_max || ""} /></Field>
          <Field label="Paid">
            <select name="salary_period" className="field" defaultValue={job?.salary_period ?? "month"}>{SALARY_PERIODS.map((p) => <option key={p.id} value={p.id}>{p.en}</option>)}</select>
          </Field>
          <Field label="Working hours" required className="sm:col-span-2"><input name="hours" className="field" required defaultValue={job?.hours} placeholder="e.g. 10 am – 9 pm, 1 hr break" /></Field>
          <Field label="Weekly holiday" required>
            <select name="weekly_holiday" className="field" required defaultValue={job?.weekly_holiday ?? "Sunday"}>{WEEKLY_HOLIDAYS.map((d) => <option key={d}>{d}</option>)}</select>
          </Field>
          <Field label="Meals" className="sm:col-span-1"><input name="meals" className="field" defaultValue={job?.meals} placeholder="e.g. Lunch provided" /></Field>
          <Field label="Other benefits" className="sm:col-span-2"><input name="benefits" className="field" defaultValue={job?.benefits} placeholder="Bonus, incentives, travel…" /></Field>
        </div>

        <div className="rounded-[3px] border border-line bg-paper-50 p-4">
          <p className="font-semibold text-ink">Deductions, deposits & fees</p>
          <p className="mb-3 text-[0.92rem] text-ink-soft">Be upfront. Hidden deductions are the #1 reason listings get reported.</p>
          <label className="mb-3 flex cursor-pointer items-center gap-2.5 text-[0.95rem] font-semibold">
            <input type="checkbox" name="no_deductions" defaultChecked={noDed} className="h-4 w-4 accent-sindoor-600" /> No deductions from salary
          </label>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="Otherwise, list every deduction"><input name="deductions" className="field" defaultValue={noDed ? "" : job?.deductions} placeholder="e.g. ₹1,500/month for accommodation" /></Field>
            <Field label="Security deposit (₹)" hint="0 if none"><input name="deposit_amount" type="number" min="0" className="field" defaultValue={job?.deposit_amount ?? 0} /></Field>
          </div>
        </div>
      </FormSection>

      <FormSection n="३" title="Accommodation" sub="Only describe a stay you actually provide.">
        <Tiles type="radio" cols="sm:grid-cols-3" name="accommodation" selected={[job?.accommodation ?? "none"]} options={ACCOMMODATION.map((a) => ({ value: a.id, title: a.en }))} />
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <Field label="Monthly cost to worker (₹)"><input name="accommodation_cost" type="number" min="0" className="field" defaultValue={job?.accommodation_cost ?? 0} /></Field>
          <Field label="Details" hint="Where, who shares, what's included (water, electricity, bedding, food)."><input name="accommodation_details" className="field" defaultValue={job?.accommodation_details} /></Field>
        </div>
        <label className="flex cursor-pointer items-start gap-2.5 rounded-[3px] border-l-[3px] border-haldi-500 bg-haldi-100/50 p-3 text-[0.95rem]">
          <input type="checkbox" name="accommodation_confirmed" defaultChecked={!!job?.accommodation_confirmed} className="mt-0.5 h-4 w-4 accent-sindoor-600" />
          <span>I confirm the accommodation described here is real, available and accurately described. <span className="text-ink-soft">(Not needed if “Not provided”.)</span></span>
        </label>
      </FormSection>

      <FormSection n="४" title="What they can learn" sub="Tick only the skills you genuinely teach or let them practise.">
        <p className="text-[0.92rem] text-ink-soft">Grouped from basic to advanced — it’s fine to cover just stage 1.</p>
        {STAGES.map((st) => (
          <FieldGroup key={st.stage} label={`Stage ${st.stage} · ${st.en}`}>
            <Chips name="skills_offered" selected={job?.skills_offered ?? []} options={skills.filter((s) => s.stage === st.stage).map((s) => ({ value: s.id, label: s.en }))} />
          </FieldGroup>
        ))}
        <Field label="Learning path in your words" hint="e.g. “After 6 months you’ll help with stock; after a year you sit with the buyer.” Avoid guarantees."><textarea name="learning_notes" className="field" defaultValue={job?.learning_notes} /></Field>
        <label className="flex cursor-pointer items-start gap-2.5 rounded-[3px] border-l-[3px] border-haldi-500 bg-haldi-100/50 p-3 text-[0.95rem]">
          <input type="checkbox" name="learning_confirmed" defaultChecked={!!job?.learning_confirmed} className="mt-0.5 h-4 w-4 accent-sindoor-600" />
          <span>I confirm we genuinely offer exposure to the skills ticked above.</span>
        </label>
      </FormSection>

      <FormSection n="५" title="Who can apply">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minimum education">
            <select name="education_req" className="field" defaultValue={job?.education_req ?? "any"}>
              <option value="any">Any</option>{EDUCATION.filter((e) => e.id !== "below10").map((e) => <option key={e.id} value={e.id}>{e.en}</option>)}
            </select>
          </Field>
          <Field label="Experience">
            <select name="experience_req" className="field" defaultValue={job?.experience_req ?? "fresher"}>{EXPERIENCE_REQ.map((e) => <option key={e.id} value={e.id}>{e.en}</option>)}</select>
          </Field>
          <Field label="Expected joining date"><input type="date" name="joining_date" className="field" defaultValue={job?.joining_date ?? ""} /></Field>
          <Field label="Number of openings"><input type="number" min="1" name="openings" className="field" defaultValue={job?.openings ?? 1} /></Field>
        </div>
        <FieldGroup label="Useful languages"><Chips name="languages" selected={job?.languages ?? ["Hindi"]} options={LANGUAGES.map((l) => ({ value: l, label: l }))} /></FieldGroup>
      </FormSection>

      <SubmitBar>
        <button className={btn("gold", "lg")}>{job ? "Save changes" : "Publish listing"}</button>
      </SubmitBar>
    </form>
  );
}
