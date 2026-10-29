import { APPLICATION_STATUSES, byId } from "./constants";
import type { Lang } from "./i18n";

/** System messages are stored as codes and rendered in the reader's language. */
export function systemText(code: string, lang: Lang, names: { candidate: string; employer: string }): string {
  const hi = lang === "hi";
  const [k, arg] = code.split(":");
  const who = arg === "candidate" ? names.candidate : names.employer;
  switch (k) {
    case "candidate_shared_phone": return hi ? `${names.candidate} ने अपना फ़ोन नंबर साझा किया।` : `${names.candidate} shared their phone number.`;
    case "candidate_hid_phone": return hi ? `${names.candidate} ने अपना फ़ोन नंबर छुपा दिया।` : `${names.candidate} hid their phone number.`;
    case "conversation_blocked": return hi ? "यह बातचीत ब्लॉक कर दी गई है।" : "This conversation was blocked.";
    case "conversation_unblocked": return hi ? "बातचीत फिर से चालू है।" : "This conversation was unblocked.";
    case "call_connecting": return hi ? `${who} ने कॉल शुरू की — दोनों को हमारे नंबर से कॉल आएगी।` : `${who} started a call — both phones will ring from our number.`;
    case "call_requested": return hi ? `${who} फ़ोन पर बात करना चाहते हैं। चैट में समय तय करें।` : `${who} asked for a phone call. Agree a time in the chat.`;
    case "status": {
      const st = byId([...APPLICATION_STATUSES], arg);
      return hi ? `स्थिति बदली: ${st?.hi ?? arg}` : `Status changed: ${st?.en ?? arg}`;
    }
    case "letter_requested": return hi ? `${names.candidate} ने अनुभव पत्र माँगा है।` : `${names.candidate} asked for an experience letter.`;
    case "invited": return hi ? `${names.employer} ने आपको इस काम के लिए बुलाया।` : `${names.employer} invited you to apply.`;
    default: return code;
  }
}
