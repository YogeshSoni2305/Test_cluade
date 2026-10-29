import { requireUser } from "@/lib/auth";
import { getCandidateProfile } from "@/lib/queries";
import { getI18n, bi } from "@/lib/i18n";
import { CITIES, EDUCATION, GOALS, INDUSTRIES, LANGUAGES, RAJASTHAN_DISTRICTS } from "@/lib/constants";
import { saveCandidateProfile } from "@/app/actions";
import { btn, Chips, Field, FieldGroup, FormSection, Notice, PageHeader, SubmitBar, Tiles } from "@/components/ui";
import { GoalIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "My profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("candidate");
  const sp = await searchParams;
  const { lang } = await getI18n();
  const p = getCandidateProfile(user.id);
  const isNew = !p?.completed;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHeader
        deva={isNew ? "अपने बारे में बताइए" : "मेरी प्रोफ़ाइल"}
        title={isNew ? "Tell us about you" : "My profile"}
        sub="No résumé needed. A few simple answers help us show you the right work — and help employers know who you are."
      />
      <div className="mb-6 space-y-3">
        {sp.error && <Notice tone="bad">{sp.error}</Notice>}
        {sp.saved && <Notice tone="ok">Profile saved.</Notice>}
      </div>

      <form action={saveCandidateProfile} className="space-y-10">
        <input type="hidden" name="next" value={sp.next ?? ""} />

        <FormSection n="१" title="About you" sub="Your basics. Your phone is only shared with employers you apply to.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required><input name="name" className="field" defaultValue={user.name} required /></Field>
            <Field label="Mobile number"><input name="phone" className="field" inputMode="tel" defaultValue={user.phone ?? ""} /></Field>
            <Field label="Age"><input name="age" type="number" min="16" max="60" className="field" defaultValue={p?.age ?? ""} /></Field>
            <Field label="Home district in Rajasthan" required>
              <select name="district" className="field" defaultValue={p?.district ?? ""} required>
                <option value="" disabled>Choose district</option>
                {RAJASTHAN_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Education" className="sm:col-span-2">
              <select name="education" className="field" defaultValue={p?.education ?? "12"}>
                {EDUCATION.map((e) => <option key={e.id} value={e.id}>{bi(e, lang)}</option>)}
              </select>
            </Field>
          </div>
          <FieldGroup label="Languages you speak">
            <Chips name="languages" selected={p?.languages ?? ["Hindi"]} options={LANGUAGES.map((l) => ({ value: l, label: l }))} />
          </FieldGroup>
          <Field label="Work experience (if any)" hint="Family shop, part-time jobs — anything counts. Leave empty if you’re a fresher.">
            <textarea name="experience" className="field" defaultValue={p?.experience ?? ""} />
          </Field>
        </FormSection>

        <FormSection n="२" title="What you want" sub="Pick everything that fits. You can change this any time.">
          <FieldGroup label="Your goals">
            <Tiles name="goals" selected={p?.goals ?? []} options={GOALS.map((g) => ({ value: g.id, icon: <GoalIcon id={g.id} size={22} />, title: bi(g, lang), sub: bi(g.blurb, lang) }))} />
          </FieldGroup>
          <FieldGroup label="Industries you’re interested in">
            <Chips name="industries" selected={p?.industries ?? []} options={INDUSTRIES.map((i) => ({ value: i.id, label: bi(i, lang) }))} />
          </FieldGroup>
          <Field label="What would you like to learn?" hint="e.g. billing, buying, talking to suppliers, repairing phones…">
            <textarea name="learn_notes" className="field" defaultValue={p?.learn_notes ?? ""} />
          </Field>
        </FormSection>

        <FormSection n="३" title="Where & how" sub="Cities you’d move to, and whether you need a place to stay.">
          <FieldGroup label="Cities you’d work in">
            <Chips name="cities" selected={p?.cities ?? []} options={CITIES.filter((c) => c !== "Other").map((c) => ({ value: c, label: c }))} />
          </FieldGroup>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-[3px] border border-line bg-paper-50 p-4">
              <input type="checkbox" name="relocate" defaultChecked={p ? !!p.relocate : true} className="mt-1 h-4 w-4 accent-sindoor-600" />
              <span><b>I can move to another city</b><br /><span className="text-[0.92rem] text-ink-soft">Outside my home district</span></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-[3px] border border-line bg-paper-50 p-4">
              <input type="checkbox" name="needs_accommodation" defaultChecked={p ? !!p.needs_accommodation : true} className="mt-1 h-4 w-4 accent-sindoor-600" />
              <span><b>I need a place to stay</b><br /><span className="text-[0.92rem] text-ink-soft">Show stay options first</span></span>
            </label>
          </div>
        </FormSection>

        <FormSection n="४" title="Family contact" sub="Optional. Saved only for you — it makes “Share with family” one tap. We never contact them.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name & relation"><input name="family_name" className="field" placeholder="e.g. Father – Bhanwar Singh" defaultValue={p?.family_name ?? ""} /></Field>
            <Field label="Phone (WhatsApp)"><input name="family_phone" className="field" inputMode="tel" placeholder="+91 …" defaultValue={p?.family_phone ?? ""} /></Field>
          </div>
        </FormSection>

        <SubmitBar>
          <button className={btn("primary", "lg")}>{isNew ? "Save & find work" : "Save profile"}</button>
        </SubmitBar>
      </form>
    </div>
  );
}
