import type { ReactNode, SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: P & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      {children}
    </svg>
  );
}

/* ── general ─────────────────────────────────────────────── */
export const IPin = (p: P) => <Svg {...p}><path d="M12 21s-6.5-6.2-6.5-11.2A6.5 6.5 0 0 1 18.5 9.8C18.5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.8" r="2.3" /></Svg>;
export const IRupee = (p: P) => <Svg {...p}><path d="M7 4.5h10M7 8.5h10M9.5 4.5c3.4 0 5 1.6 5 4s-1.9 4-5 4H7.5l7 7" /></Svg>;
export const IClock = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>;
export const ICalendar = (p: P) => <Svg {...p}><rect x="4" y="5.5" width="16" height="14.5" rx="1.5" /><path d="M4 9.5h16M8.5 3.5v4M15.5 3.5v4" /><path d="M8 13.5h2M14 13.5h2M8 16.5h2" /></Svg>;
export const IBed = (p: P) => <Svg {...p}><path d="M3 19V6M3 15h18v4M21 15v-3.5A2.5 2.5 0 0 0 18.5 9H11v6" /><circle cx="7" cy="11.5" r="1.8" /></Svg>;
export const IThali = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="9" cy="9.5" r="2" /><circle cx="15" cy="9.5" r="2" /><circle cx="12" cy="15" r="2.2" /></Svg>;
export const ICut = (p: P) => <Svg {...p}><circle cx="6.5" cy="17" r="2.5" /><circle cx="6.5" cy="7" r="2.5" /><path d="M8.6 8.4 20 17M8.6 15.6 20 7" /></Svg>;
export const IShield = (p: P) => <Svg {...p}><path d="M12 3.2 5 6v5.3c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-2.8Z" /><path d="m9 12 2.2 2.2L15.5 10" /></Svg>;
export const ICheck = (p: P) => <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>;
export const IArrow = (p: P) => <Svg {...p}><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" /></Svg>;
export const IArrowLeft = (p: P) => <Svg {...p}><path d="M20 12H5M10.5 6.5 5 12l5.5 5.5" /></Svg>;
export const IPhone = (p: P) => <Svg {...p}><path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 5.2 5.2l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" /></Svg>;
export const IShare = (p: P) => <Svg {...p}><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" /><path d="M5 12v7.5h14V12" /></Svg>;
export const IFlag = (p: P) => <Svg {...p}><path d="M5 21V4M5 4.5h11l-2 4 2 4H5" /></Svg>;
export const IHeart = ({ filled, ...p }: P & { filled?: boolean }) => <Svg {...p}><path fill={filled ? "currentColor" : "none"} d="M12 19.5S4 15 4 9.3A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.3C20 15 12 19.5 12 19.5Z" /></Svg>;
export const IStar = ({ filled, ...p }: P & { filled?: boolean }) => <Svg {...p}><path fill={filled ? "currentColor" : "none"} d="m12 3.8 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8Z" /></Svg>;
export const IUser = (p: P) => <Svg {...p}><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" /></Svg>;
export const ISearch = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></Svg>;
export const IPlus = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const ICompass = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5Z" /></Svg>;
export const ILock = (p: P) => <Svg {...p}><rect x="5" y="10.5" width="14" height="9.5" rx="1.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></Svg>;
export const IBook = (p: P) => <Svg {...p}><path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5ZM12 6.5v13" /></Svg>;
export const ILanguage = (p: P) => <Svg {...p}><path d="M4 5.5h9M8.5 4v1.5c0 4-2 7-4.5 8.5M6 9.5c1.2 2 3.5 3.7 6 4.5" /><path d="m12.5 20 3.8-9 3.7 9M13.8 17h5" /></Svg>;
export const IDoc = (p: P) => <Svg {...p}><path d="M6 3.5h8l4 4v13H6Z" /><path d="M14 3.5v4h4M9 12h6M9 15.5h6" /></Svg>;
export const IInbox = (p: P) => <Svg {...p}><path d="M4 13.5 6.5 5h11l2.5 8.5V19H4Z" /><path d="M4 13.5h4.5l1 2h5l1-2H20" /></Svg>;
export const IEye = (p: P) => <Svg {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></Svg>;

export const IBell = (p: P) => <Svg {...p}><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15Z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></Svg>;
export const IChat = (p: P) => <Svg {...p}><path d="M4 5.5h16v11H10l-4.5 3.5v-3.5H4Z" /><path d="M8 10h8M8 13h5" /></Svg>;
export const IDownload = (p: P) => <Svg {...p}><path d="M12 3.5v12M7 10.5l5 5 5-5M4.5 20h15" /></Svg>;
export const ITrash = (p: P) => <Svg {...p}><path d="M4.5 6.5h15M9.5 6.5V4h5v2.5M6.5 6.5l1 14h9l1-14M10 10.5v6M14 10.5v6" /></Svg>;
export const ISpeaker = (p: P) => <Svg {...p}><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></Svg>;
export const ICopy = (p: P) => <Svg {...p}><rect x="8.5" y="8.5" width="11" height="11" rx="1.5" /><path d="M15.5 8.5V5h-11v11h4" /></Svg>;
export const IRefresh = (p: P) => <Svg {...p}><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" /></Svg>;
export const IPrint = (p: P) => <Svg {...p}><path d="M7 9V3.5h10V9M7 17H4.5V9h15v8H17" /><rect x="7" y="14" width="10" height="6.5" /></Svg>;

/* ── goals ───────────────────────────────────────────────── */
export const IBriefcase = (p: P) => <Svg {...p}><rect x="3.5" y="7.5" width="17" height="12" rx="1.5" /><path d="M9 7.5V5.5h6v2M3.5 12.5h17M11 12.5v2h2v-2" /></Svg>;
/** tarazu — the shopkeeper's scale */
export const IScale = (p: P) => <Svg {...p}><path d="M12 4v15.5M8 19.5h8M5 7.5h14M12 4.5l-7 3M12 4.5l7 3" /><path d="M2.5 13.5 5 7.5l2.5 6a2.5 2.5 0 0 1-5 0ZM16.5 13.5 19 7.5l2.5 6a2.5 2.5 0 0 1-5 0Z" /></Svg>;
export const ISteps = (p: P) => <Svg {...p}><path d="M3.5 19.5h5v-4h4.5v-4.5h4.5V6.5h3" /><path d="m16.5 3.5 3.5 3-3.5 3" /></Svg>;
/** haveli with jharokha */
export const IHaveli = (p: P) => <Svg {...p}><path d="M4 20.5V10l8-5.5 8 5.5v10.5Z" /><path d="M9.5 20.5V16a2.5 2.5 0 0 1 5 0v4.5" /><path d="M7 12h2.5M14.5 12H17M2.5 20.5h19" /></Svg>;
export const ISprout = (p: P) => <Svg {...p}><path d="M12 20.5V11" /><path d="M12 12.5C12 8.5 9 6 4.5 6c0 4 2.5 6.5 7.5 6.5ZM12 11c0-3.5 2.5-6 7-6 0 4-2.5 6-7 6Z" /><path d="M7.5 20.5h9" /></Svg>;

/* ── industries ──────────────────────────────────────────── */
const IKurta = (p: P) => <Svg {...p}><path d="M9 3.5 12 6l3-2.5 4.5 2.5L18 11l-2-.8V20.5H8V10.2L6 11 4.5 6Z" /><path d="M12 6v5.5" /></Svg>;
const ISpool = (p: P) => <Svg {...p}><path d="M6.5 4h11M6.5 20h11M8 4v16M16 4v16" /><path d="M8 7.5c3 .8 5 1.7 8 .5M8 11c3 .8 5 1.7 8 .5M8 14.5c3 .8 5 1.7 8 .5" /></Svg>;
const IMobile = (p: P) => <Svg {...p}><rect x="6.5" y="2.5" width="11" height="19" rx="2" /><path d="M10.5 5h3M11 18.5h2" /></Svg>;
const IRepair = (p: P) => <Svg {...p}><rect x="3.5" y="5.5" width="8.5" height="15" rx="1.5" /><path d="M6.5 8h2.5" /><path d="m14 14 5-5M18.5 4.5l1.5 1.5-1.5 2.5-2.5-2.5Z" /><path d="m14 14-1.5 3 3-1.5" /></Svg>;
const IGear = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3 5.5 5.5" /><circle cx="12" cy="12" r="6.6" /></Svg>;
const ICar = (p: P) => <Svg {...p}><path d="M3.5 16.5v-3.5l2-4.5c.4-.9 1.2-1.5 2.2-1.5h8.6c1 0 1.8.6 2.2 1.5l2 4.5v3.5Z" /><path d="M3.5 13h17" /><circle cx="7.5" cy="16.5" r="1.8" /><circle cx="16.5" cy="16.5" r="1.8" /></Svg>;
const IBricks = (p: P) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="1" /><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19" /></Svg>;
const IChair = (p: P) => <Svg {...p}><path d="M7 3.5h10v8H7Z" /><path d="M5.5 11.5h13v3h-13ZM7 14.5v6M17 14.5v6M9.5 6.5h5" /></Svg>;
const IRing = (p: P) => <Svg {...p}><circle cx="12" cy="15" r="5.8" /><path d="m9.5 6.5 2.5-3 2.5 3-2.5 2.8Z" /></Svg>;
const IThaliFood = IThali;
/** dukaan — shop with scalloped awning */
const IShop = (p: P) => <Svg {...p}><path d="M4.5 10.5v10h15v-10" /><path d="M3 4.5h18l1 4.5c0 1.2-1 2-2 2s-2.2-.8-2.2-2c0 1.2-1 2-2.2 2s-2.2-.8-2.2-2c0 1.2-1 2-2.2 2s-2.2-.8-2.2-2c0 1.2-1 2-2.2 2s-2-.8-2-2Z" /><path d="M10 20.5v-5h4v5" /></Svg>;

const INDUSTRY_ICONS: Record<string, (p: P) => ReactNode> = {
  menswear: IKurta, garment_wholesale: ISpool, mobile_retail: IMobile, mobile_repair: IRepair,
  auto_parts: IGear, garage: ICar, hardware: IBricks, furniture: IChair, jewellery: IRing,
  restaurant: IThaliFood, other: IShop,
};
export function IndustryIcon({ id, ...p }: P & { id: string }) {
  const C = INDUSTRY_ICONS[id] ?? IShop;
  return <C {...p} />;
}

const GOAL_ICONS: Record<string, (p: P) => ReactNode> = {
  job: IBriefcase, learn: IScale, manager: ISteps, family: IHaveli, explore: ISprout,
};
export function GoalIcon({ id, ...p }: P & { id: string }) {
  const C = GOAL_ICONS[id] ?? IBriefcase;
  return <C {...p} />;
}
