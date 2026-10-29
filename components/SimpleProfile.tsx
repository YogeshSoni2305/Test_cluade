"use client";

import { useRef, useState, type ReactNode } from "react";
import { MicButton } from "./VoiceInput";
import { ListenButton } from "./ListenButton";

type Opt = { value: string; label: string; icon?: ReactNode };
export type SimpleProfileText = {
  step: string; of: string; next: string; back: string; save: string; listen: string; stop: string; yes: string; no: string;
  q_name: string; q_phone: string; q_district: string; q_education: string; q_goals: string; q_industries: string;
  q_cities: string; q_relocate: string; q_stay: string; q_searchable: string; q_family: string; hint_multi: string; choose: string;
  family_name: string; family_phone: string; optional: string; name_needed: string; district_needed: string;
};

/**
 * One question per screen, big tap targets, read-aloud and voice typing — for people who find long forms hard.
 * All steps live in a single <form> (hidden, not unmounted) so the normal server action receives every field.
 */
export function SimpleProfile({
  action, lang, text, defaults, districts, education, goals, industries, cities, next,
}: {
  action: (fd: FormData) => void | Promise<void>;
  lang: "en" | "hi";
  text: SimpleProfileText;
  defaults: { name: string; phone: string; district: string; education: string; goals: string[]; industries: string[]; cities: string[]; relocate: boolean; stay: boolean; searchable: boolean; languages: string[]; family_name: string; family_phone: string; experience: string; learn_notes: string; age: string };
  districts: string[]; education: Opt[]; goals: Opt[]; industries: Opt[]; cities: string[]; next?: string;
}) {
  const [step, setStep] = useState(0);
  // the Save button appears where Next was: ignore a double-tap that would submit before the last answer
  const arrivedAt = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const steps: { q: string; body: ReactNode; validate?: () => string | null }[] = [
    {
      q: text.q_name,
      body: (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input ref={nameRef} name="name" defaultValue={defaults.name} required className="field !py-4 !text-[1.25rem]" aria-label={text.q_name} autoComplete="name" />
            <MicButton target={nameRef} lang={lang} />
          </div>
          <label className="block text-[1rem] font-semibold">{text.q_phone}
            <input name="phone" defaultValue={defaults.phone} inputMode="tel" className="field mt-1.5 !py-3 !text-[1.15rem]" autoComplete="tel" />
          </label>
        </div>
      ),
      validate: () => (nameRef.current?.value.trim() ? null : text.name_needed),
    },
    {
      q: text.q_district,
      body: (
        <select name="district" defaultValue={defaults.district} className="field !py-4 !text-[1.2rem]" aria-label={text.q_district}>
          <option value="">{text.choose}</option>
          {districts.map((d) => <option key={d}>{d}</option>)}
        </select>
      ),
      validate: () => ((formRef.current?.elements.namedItem("district") as HTMLSelectElement | null)?.value ? null : text.district_needed),
    },
    { q: text.q_education, body: <BigChoices name="education" type="radio" options={education} selected={[defaults.education]} /> },
    { q: text.q_goals, body: <><p className="mb-3 text-ink-soft">{text.hint_multi}</p><BigChoices name="goals" options={goals} selected={defaults.goals} /></> },
    { q: text.q_industries, body: <><p className="mb-3 text-ink-soft">{text.hint_multi}</p><BigChoices name="industries" options={industries} selected={defaults.industries} cols="grid-cols-2" /></> },
    { q: text.q_cities, body: <><p className="mb-3 text-ink-soft">{text.hint_multi}</p><BigChoices name="cities" options={cities.map((c) => ({ value: c, label: c }))} selected={defaults.cities} cols="grid-cols-2 sm:grid-cols-3" /></> },
    { q: text.q_relocate, body: <YesNo name="relocate" yes={text.yes} no={text.no} value={defaults.relocate} /> },
    { q: text.q_stay, body: <YesNo name="needs_accommodation" yes={text.yes} no={text.no} value={defaults.stay} /> },
    {
      q: text.q_family,
      body: (
        <div className="space-y-4">
          <p className="text-ink-soft">{text.optional}</p>
          <label className="block text-[1rem] font-semibold">{text.family_name}<input name="family_name" defaultValue={defaults.family_name} className="field mt-1.5 !py-3" /></label>
          <label className="block text-[1rem] font-semibold">{text.family_phone}<input name="family_phone" defaultValue={defaults.family_phone} inputMode="tel" className="field mt-1.5 !py-3" /></label>
        </div>
      ),
    },
    { q: text.q_searchable, body: <YesNo name="searchable" yes={text.yes} no={text.no} value={defaults.searchable} /> },
  ];
  const last = step === steps.length - 1;
  const go = (d: number) => {
    if (d > 0) {
      const err = steps[step].validate?.() ?? null;
      setError(err);
      if (err) return;
    }
    setError(null);
    arrivedAt.current = Date.now();
    setStep((s) => Math.min(steps.length - 1, Math.max(0, s + d)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <form ref={formRef} action={action} className="mx-auto max-w-xl"
      onSubmit={(e) => { if (!last || Date.now() - arrivedAt.current < 400) e.preventDefault(); }}
      onKeyDown={(e) => { if (e.key === "Enter" && !last && (e.target as HTMLElement).tagName === "INPUT") { e.preventDefault(); go(1); } }}>
      <input type="hidden" name="mode" value="simple" />
      {next && <input type="hidden" name="next" value={next} />}
      {/* fields the simple flow doesn't ask about keep their current values */}
      {defaults.languages.map((l) => <input key={l} type="hidden" name="languages" value={l} />)}
      <input type="hidden" name="experience" value={defaults.experience} />
      <input type="hidden" name="learn_notes" value={defaults.learn_notes} />
      <input type="hidden" name="age" value={defaults.age} />

      <ol className="mb-6 flex items-center gap-1.5" aria-label={`${text.step} ${step + 1} ${text.of} ${steps.length}`}>
        {steps.map((_, i) => <li key={i} className={`h-2.5 w-2.5 rotate-45 ${i <= step ? "bg-sindoor-600" : "bg-paper-300"}`} />)}
        <li className="ml-3 text-[0.9rem] font-semibold text-ink-soft">{text.step} {step + 1} {text.of} {steps.length}</li>
      </ol>

      {steps.map((s, i) => (
        <fieldset key={i} hidden={i !== step} className="min-w-0">
          <legend className="font-display text-[2.2rem] font-semibold leading-tight text-ink sm:text-[2.6rem]">{s.q}</legend>
          <ListenButton text={s.q} lang={lang} label={text.listen} stopLabel={text.stop}
            className="mt-3 inline-flex items-center gap-1.5 rounded-[3px] border border-line px-3 py-1.5 text-[0.95rem] font-semibold text-ink hover:border-ink-soft" />
          <div className="mt-6">{s.body}</div>
        </fieldset>
      ))}

      {error && <p role="alert" className="mt-4 border-l-[3px] border-sindoor-500 bg-sindoor-50 px-4 py-3 font-semibold text-sindoor-700">{error}</p>}

      <div className="mt-10 flex items-center justify-between gap-3">
        <button type="button" onClick={() => go(-1)} disabled={step === 0} className="rounded-[3px] px-5 py-3.5 text-[1.05rem] font-semibold text-ink-soft hover:bg-paper-200 disabled:opacity-0">{text.back}</button>
        {last ? (
          <button key="save" type="submit" className="rounded-[3px] bg-sindoor-600 px-8 py-4 text-[1.15rem] font-semibold text-paper-50 hover:bg-sindoor-700">{text.save}</button>
        ) : (
          <button key="next" type="button" onClick={() => go(1)} className="rounded-[3px] bg-ink px-8 py-4 text-[1.15rem] font-semibold text-paper-50 hover:bg-neel-800">{text.next}</button>
        )}
      </div>
    </form>
  );
}

function BigChoices({ name, options, selected, type = "checkbox", cols = "grid-cols-1 sm:grid-cols-2" }: { name: string; options: Opt[]; selected: string[]; type?: "checkbox" | "radio"; cols?: string }) {
  return (
    <div className={`grid gap-3 ${cols}`}>
      {options.map((o) => (
        <label key={o.value} className="tile relative block">
          <input type={type} name={name} value={o.value} defaultChecked={selected.includes(o.value)} />
          <span className="flex min-h-16 items-center gap-3 !py-4 text-[1.1rem] font-semibold text-ink">
            {o.icon && <span className="text-sindoor-600">{o.icon}</span>}{o.label}
          </span>
        </label>
      ))}
    </div>
  );
}

function YesNo({ name, yes, no, value }: { name: string; yes: string; no: string; value: boolean }) {
  // a checkbox carries "on" when yes; the "no" radio clears it
  const [on, setOn] = useState(value);
  return (
    <div className="grid grid-cols-2 gap-3">
      {name && on && <input type="hidden" name={name} value="on" />}
      {[[true, yes], [false, no]].map(([v, label]) => (
        <label key={String(v)} className="tile relative block">
          <input type="radio" name={`${name}__choice`} checked={on === v} onChange={() => setOn(v as boolean)} />
          <span className="flex min-h-20 items-center justify-center text-[1.4rem] font-semibold text-ink">{label as string}</span>
        </label>
      ))}
    </div>
  );
}
