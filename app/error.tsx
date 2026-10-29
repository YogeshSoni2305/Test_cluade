"use client";

import { useEffect, useState } from "react";

const TEXT = {
  en: { title: "Something went wrong", body: "Please try again. If it keeps happening, tell us from the Safety page.", retry: "Try again" },
  hi: { title: "कुछ गड़बड़ हो गई", body: "कृपया फिर से कोशिश करें। बार-बार हो तो सुरक्षा पेज से हमें बताएँ।", retry: "फिर कोशिश करें" },
};

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const [lang, setLang] = useState<"en" | "hi">("en");
  useEffect(() => setLang(document.documentElement.lang === "hi" ? "hi" : "en"), []);
  const t = TEXT[lang];
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center" role="alert">
      <h1 className="font-display text-4xl font-semibold text-ink">{t.title}</h1>
      <p className="mt-3 text-ink-soft">{t.body}</p>
      <button onClick={reset} className="mt-8 rounded-[3px] bg-sindoor-600 px-6 py-2.5 font-semibold text-paper-50 hover:bg-sindoor-700">{t.retry}</button>
    </div>
  );
}
