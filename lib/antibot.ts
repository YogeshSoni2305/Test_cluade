import crypto from "node:crypto";
import { appSecret } from "./kv";

/**
 * Lightweight bot protection for public forms:
 *  1. a honeypot field humans never see,
 *  2. a signed render timestamp — forms submitted faster than a person could fill them are rejected,
 *  3. Cloudflare Turnstile, verified server-side, when TURNSTILE_SECRET_KEY is configured.
 */
export const HONEYPOT = "website";
export const TOKEN = "_ft";

const minFillMs = () => Number(process.env.BOT_MIN_FILL_MS ?? 1500);

function sign(v: string) {
  return crypto.createHmac("sha256", appSecret()).update(v).digest("base64url").slice(0, 22);
}

export function formToken(now = Date.now()): string {
  const ts = String(now);
  return `${ts}.${sign(ts)}`;
}

export function verifyToken(token: string, now = Date.now(), minMs = minFillMs()): string | null {
  const [ts, sig] = token.split(".");
  if (!ts || !sig) return "Form expired — please reload the page and try again.";
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(ts));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return "Form expired — please reload the page and try again.";
  const age = now - Number(ts);
  if (age < minMs) return "That was very fast — please take a moment and submit again.";
  if (age > 1000 * 60 * 60 * 12) return "Form expired — please reload the page and try again.";
  return null;
}

async function verifyTurnstile(response: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!response) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response }),
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

/** Returns an error message when the submission looks automated, otherwise null. */
export async function checkHuman(fd: FormData): Promise<string | null> {
  if (String(fd.get(HONEYPOT) ?? "") !== "") return "Submission blocked.";
  const tokenErr = verifyToken(String(fd.get(TOKEN) ?? ""));
  if (tokenErr) return tokenErr;
  if (!(await verifyTurnstile(String(fd.get("cf-turnstile-response") ?? "")))) return "Please complete the verification check.";
  return null;
}
