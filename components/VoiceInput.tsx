"use client";

import { useEffect, useRef, useState, type TextareaHTMLAttributes } from "react";
import { trackClient } from "./Analytics";

type SR = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> ; resultIndex: number }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null; start: () => void; stop: () => void;
};

function getRecognizer(): (new () => SR) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Mic button that dictates into a field (Hindi or English). Renders nothing where unsupported. */
export function MicButton({ target, lang }: { target: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>; lang: "en" | "hi" }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const rec = useRef<SR | null>(null);
  useEffect(() => setSupported(Boolean(getRecognizer())), []);
  if (!supported) return null;

  const toggle = () => {
    if (listening) { rec.current?.stop(); return; }
    const R = getRecognizer();
    if (!R || !target.current) return;
    const r = new R();
    r.lang = lang === "hi" ? "hi-IN" : "en-IN";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const el = target.current;
      if (!el) return;
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript;
      el.value = (el.value ? el.value.trimEnd() + " " : "") + text.trim();
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    trackClient("voice_used", { lang });
    r.start();
  };

  const label = listening ? (lang === "hi" ? "बोलना बंद करें" : "Stop dictation") : (lang === "hi" ? "बोलकर लिखें" : "Speak to type");
  return (
    <button type="button" onClick={toggle} aria-pressed={listening} aria-label={label} title={label}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] border transition ${listening ? "animate-pulse border-sindoor-500 bg-sindoor-600 text-paper-50" : "border-line bg-paper-50 text-ink-soft hover:border-ink-soft hover:text-ink"}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
        <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
      </svg>
    </button>
  );
}

/** Textarea with an attached dictation button. */
export function VoiceTextarea({ label, lang, className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; lang: "en" | "hi" }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="flex w-full items-end gap-2">
      <label className="block min-w-0 flex-1">
        <span className="sr-only">{label}</span>
        <textarea ref={ref} className={`field !min-h-0 ${className}`} {...props} />
      </label>
      <MicButton target={ref} lang={lang} />
    </div>
  );
}
