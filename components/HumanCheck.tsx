import Script from "next/script";
import { formToken, HONEYPOT, TOKEN } from "@/lib/antibot";

/** Drop inside any public <form> that a bot might target. */
export function HumanCheck() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  return (
    <>
      <input type="hidden" name={TOKEN} value={formToken()} />
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>Leave this empty<input type="text" name={HONEYPOT} tabIndex={-1} autoComplete="off" defaultValue="" /></label>
      </div>
      {siteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
          <div className="cf-turnstile" data-sitekey={siteKey} data-theme="light" />
        </>
      )}
    </>
  );
}
