/** Heuristics that catch the most common job-scam and spam patterns. Flags go to moderators. */

const SCAM_PATTERNS: [RegExp, string][] = [
  [/\b(registration|joining|processing|training|form|interview|uniform)\s*(fee|charge|charges|amount|money)\b/i, "asks for a fee"],
  [/\b(security|advance)\s*(money|payment|deposit amount)\b/i, "asks for advance money"],
  [/\bpay\s*(rs\.?|₹|inr)?\s*\d[\d,]*\s*(to|for|before)\b/i, "asks the candidate to pay"],
  [/(रजिस्ट्रेशन|पंजीकरण|जॉइनिंग|ज्वाइनिंग)\s*(फीस|फ़ीस|शुल्क|चार्ज)/, "asks for a fee"],
  [/(पहले|एडवांस)\s*(पैसे|रुपये|पेमेंट)/, "asks for advance money"],
  // handing originals to the employer — but not advice like "keep your original documents with you"
  [/\b(submit|deposit|jama|hand\s*over|give|leave)\b.{0,25}\b(original|asli)\s*(aadhaar|aadhar|marksheet|documents?|passport|certificates?)\b/i, "asks to hold original documents"],
  [/\b(original|asli)\s*(aadhaar|aadhar|marksheet|documents?|passport|certificates?)\b.{0,25}\b(submit|deposit|jama|kept by|will be kept|retained|held by)\b/i, "asks to hold original documents"],
  [/(ओरिजिनल|असली)\s*(आधार|मार्कशीट|दस्तावेज़|कागज़)\s*(जमा|रख)/, "asks to hold original documents"],
  [/\b(google\s*pay|gpay|phonepe|paytm|upi)\b.{0,30}\b(send|transfer|pay|bhejo|bhej\w*)\b/i, "asks for a UPI transfer"],
  [/\b(send|transfer|pay|bhejo|bhej\w*)\b.{0,30}\b(google\s*pay|gpay|phonepe|paytm|upi)\b/i, "asks for a UPI transfer"],
];

export function scamSignals(text: string): string[] {
  const found = new Set<string>();
  for (const [re, label] of SCAM_PATTERNS) if (re.test(text)) found.add(label);
  return [...found];
}

export function spamSignals(text: string): string[] {
  const out: string[] = [];
  const urls = text.match(/https?:\/\/|www\./gi)?.length ?? 0;
  if (urls > 2) out.push("many links");
  if (/(.)\1{9,}/.test(text)) out.push("repeated characters");
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length > 30 && letters.replace(/[^A-Z]/g, "").length / letters.length > 0.7) out.push("shouting");
  if (/\b(t\.me|telegram|bit\.ly|tinyurl)\b/i.test(text)) out.push("off-platform link");
  return out;
}

/** Combined reason string for storing on a flagged record, or null when clean. */
export function flagReason(...texts: string[]): string | null {
  const joined = texts.filter(Boolean).join("\n");
  const reasons = [...scamSignals(joined), ...spamSignals(joined)];
  return reasons.length ? [...new Set(reasons)].join(", ") : null;
}

export function normalizeGst(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const g = raw.toUpperCase().replace(/[^0-9A-Z]/g, "");
  return /^\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(g) ? g : null;
}
