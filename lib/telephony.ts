/**
 * Masked calling: both parties dial through a virtual number, so neither sees the other's phone.
 * Uses Exotel's "connect two numbers" API when EXOTEL_SID, EXOTEL_API_KEY, EXOTEL_API_TOKEN and
 * EXOTEL_CALLER_ID (your ExoPhone) are set. Without them the request is recorded but no call is placed.
 */
export type CallResult = { status: "connecting" | "not_configured" | "failed"; detail?: string };

export function telephonyConfigured(): boolean {
  const e = process.env;
  return Boolean(e.EXOTEL_SID && e.EXOTEL_API_KEY && e.EXOTEL_API_TOKEN && e.EXOTEL_CALLER_ID);
}

export async function connectMaskedCall(fromPhone: string, toPhone: string): Promise<CallResult> {
  if (!telephonyConfigured()) return { status: "not_configured" };
  const { EXOTEL_SID: sid, EXOTEL_API_KEY: key, EXOTEL_API_TOKEN: token, EXOTEL_CALLER_ID: callerId, EXOTEL_SUBDOMAIN } = process.env;
  const host = EXOTEL_SUBDOMAIN ?? "api.exotel.com";
  try {
    const res = await fetch(`https://${host}/v1/Accounts/${sid}/Calls/connect.json`, {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(`${key}:${token}`).toString("base64") },
      body: new URLSearchParams({ From: fromPhone, To: toPhone, CallerId: callerId!, Record: "false", TimeLimit: "1800" }),
    });
    return res.ok ? { status: "connecting" } : { status: "failed", detail: `HTTP ${res.status}` };
  } catch (e) {
    return { status: "failed", detail: (e as Error).message };
  }
}

/** "+919876543210" → "+91 ••••• ••210" */
export function maskPhone(p: string | null | undefined): string {
  if (!p) return "—";
  const d = p.replace(/\D/g, "").slice(-10);
  return `+91 ••••• ••${d.slice(-3)}`;
}
