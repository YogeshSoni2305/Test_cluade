"use client";

import { useEffect, useState } from "react";
import { trackClient } from "./Analytics";

/** Reads text aloud with the device's own text-to-speech (works offline on most Android phones). */
export function ListenButton({ text, lang, label, stopLabel, className = "" }: { text: string; lang: "en" | "hi"; label: string; stopLabel: string; className?: string }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); };
  }, []);
  if (!supported) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "hi" ? "hi-IN" : "en-IN";
    const voice = synth.getVoices().find((v) => v.lang.replace("_", "-").toLowerCase().startsWith(lang === "hi" ? "hi" : "en-in"));
    if (voice) u.voice = voice;
    u.rate = 0.92;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
    trackClient("listen_used", { lang });
  };

  return (
    <button type="button" onClick={toggle} aria-pressed={speaking} className={className}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" />{speaking ? <path d="M16 9.5v5M19 8v8" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />}
      </svg>
      {speaking ? stopLabel : label}
    </button>
  );
}
