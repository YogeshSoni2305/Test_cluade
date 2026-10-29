/**
 * Outbound delivery for notifications. Each channel is used only when its credentials are set;
 * otherwise it reports "skipped" and the notification stays in-app only.
 *
 * WhatsApp — Meta WhatsApp Cloud API with an approved template:
 *   WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE (3 body params: title, body, link)
 * SMS — MSG91 Flow API:
 *   MSG91_AUTH_KEY, MSG91_FLOW_ID (variables: title, body, link)
 */
export type Outbound = { phone: string; lang: "en" | "hi"; title: string; body: string; link: string };
export type ChannelResult = "sent" | "failed" | "skipped";

export async function sendWhatsApp(m: Outbound): Promise<ChannelResult> {
  const { WHATSAPP_TOKEN: token, WHATSAPP_PHONE_NUMBER_ID: phoneId, WHATSAPP_TEMPLATE: template } = process.env;
  if (!token || !phoneId || !template) return "skipped";
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: m.phone.replace(/\D/g, ""),
        type: "template",
        template: {
          name: template,
          language: { code: m.lang === "hi" ? "hi" : "en" },
          components: [{ type: "body", parameters: [m.title, m.body, m.link].map((text) => ({ type: "text", text: text.slice(0, 900) })) }],
        },
      }),
    });
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

export async function sendSms(m: Outbound): Promise<ChannelResult> {
  const { MSG91_AUTH_KEY: key, MSG91_FLOW_ID: flow } = process.env;
  if (!key || !flow) return "skipped";
  try {
    const res = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: { authkey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ template_id: flow, recipients: [{ mobiles: m.phone.replace(/\D/g, ""), title: m.title, body: m.body.slice(0, 120), link: m.link }] }),
    });
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
