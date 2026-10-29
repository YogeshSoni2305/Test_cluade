import { requireUser } from "@/lib/auth";
import { getCandidateProfile } from "@/lib/queries";
import { getI18n, bi } from "@/lib/i18n";
import { CITIES, EDUCATION, GOALS, INDUSTRIES, LANGUAGES, RAJASTHAN_DISTRICTS } from "@/lib/constants";
import { saveCandidateProfile } from "@/app/actions";
import { btn, Card, Chips, Field, FieldGroup, Notice, PageHeader, SubmitBar, Tiles } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "My profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("candidate");
  const sp = await searchParams;
  const { lang } = await getI18n();
  const p = getCandidateProfile(user.id);
  const isNew = !p?.completed;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader
        title={isNew ? "Tell us about you" : "My profile"}
        sub="No résumé needed. A few simple answers help us show you the right opportunities and help employers know who you are."
      />
      {sp.error && <div className="mb-6"><Notice tone="bad">{sp.error}</Notice></div>}
      {sp.saved && <div className="mb-6"><Notice tone="ok">✓ Profile saved.</Notice></div>}

      <form action={saveCandidateProfile} className="space-y-6">
        <input type="hidden" name="next" value={sp.next ?? ""} />

        <Card className="space-y-5 p-6">
          <h2 className="font-display text-xl font-semibold text-indigo-900">1 · About you</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required><input name="name" className="field" defaultValue={user.name} required /></Field>
            <Field label="Mobile number" hint="Only employers you apply to can see this."><input name="phone" className="field" inputMode="tel" defaultValue={user.phone ?? ""} /></Field>
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
          <Field label="Work experience (if any)" hint="Family shop, part-time jobs, anything counts. Leave empty if you’re a fresher.">
            <textarea name="experience" className="field" defaultValue={p?.experience ?? ""} />
          </Field>
        </Card>

        <Card className="space-y-5 p-6">
          <h2 className="font-display text-xl font-semibold text-indigo-900">2 · What do you want?</h2>
          <FieldGroup label="Your goals (pick any)">
            <Tiles name="goals" selected={p?.goals ?? []} options={GOALS.map((g) => ({ value: g.id, icon: g.icon, title: bi(g, lang), sub: bi(g.blurb, lang) }))} />
          </FieldGroup>
          <FieldGroup label="Industries you’re interested in">
            <Chips name="industries" selected={p?.industries ?? []} options={INDUSTRIES.map((i) => ({ value: i.id, icon: i.icon, label: bi(i, lang) }))} />
          </FieldGroup>
          <Field label="What would you like to learn?" hint="e.g. billing, buying, talking to suppliers, repairing phones…">
            <textarea name="learn_notes" className="field" defaultValue={p?.learn_notes ?? ""} />
          </Field>
        </Card>

        <Card className="space-y-5 p-6">
          <h2 className="font-display text-xl font-semibold text-indigo-900">3 · Where & how</h2>
          <FieldGroup label="Cities you’d work in">
            <Chips name="cities" selected={p?.cities ?? []} options={CITIES.filter((c) => c !== "Other").map((c) => ({ value: c, label: c }))} />
          </FieldGroup>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line p-4">
              <input type="checkbox" name="relocate" defaultChecked={p ? !!p.relocate : true} className="h-5 w-5 accent-indigo-800" />
              <span><b>I can move to another city</b><br /><span className="text-sm text-ink-soft">Outside my home district</span></span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line p-4">
              <input type="checkbox" name="needs_accommodation" defaultChecked={p ? !!p.needs_accommodation : true} className="h-5 w-5 accent-indigo-800" />
              <span><b>I need a place to stay</b><br /><span className="text-sm text-ink-soft">Show stay options first</span></span>
            </label>
          </div>
        </Card>

        <Card className="space-y-5 p-6">
          <h2 className="font-display text-xl font-semibold text-indigo-900">4 · Family contact <span className="text-sm font-normal text-ink-soft">(optional)</span></h2>
          <p className="-mt-2 text-sm text-ink-soft">Saved only for you — it makes “Share with family” one tap. We never contact them.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name & relation"><input name="family_name" className="field" placeholder="e.g. Father – Bhanwar Singh" defaultValue={p?.family_name ?? ""} /></Field>
            <Field label="Phone (WhatsApp)"><input name="family_phone" className="field" inputMode="tel" placeholder="+91 …" defaultValue={p?.family_phone ?? ""} /></Field>
          </div>
        </Card>

        <SubmitBar>
          <button className={btn("gold", "lg")}>{isNew ? "Save & find work →" : "Save profile"}</button>
        </SubmitBar>
      </form>
    </div>
  );
}
