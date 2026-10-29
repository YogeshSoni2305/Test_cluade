export type Bi = { en: string; hi: string };

export type Industry = Bi & { id: string; icon: string };
export const INDUSTRIES: Industry[] = [
  { id: "menswear", icon: "👔", en: "Men's clothing & apparel retail", hi: "पुरुष वस्त्र / रेडीमेड शोरूम" },
  { id: "garment_wholesale", icon: "🧵", en: "Garment & textile wholesale", hi: "कपड़ा / गारमेंट थोक" },
  { id: "mobile_retail", icon: "📱", en: "Mobile phones & electronics retail", hi: "मोबाइल व इलेक्ट्रॉनिक्स दुकान" },
  { id: "mobile_repair", icon: "🛠️", en: "Mobile repair & accessories", hi: "मोबाइल रिपेयर व एक्सेसरीज़" },
  { id: "auto_parts", icon: "⚙️", en: "Automobile spare parts", hi: "ऑटो स्पेयर पार्ट्स" },
  { id: "garage", icon: "🚗", en: "Garage & vehicle servicing", hi: "गैराज / वाहन सर्विसिंग" },
  { id: "hardware", icon: "🧱", en: "Hardware & building materials", hi: "हार्डवेयर व निर्माण सामग्री" },
  { id: "furniture", icon: "🪑", en: "Furniture & interiors", hi: "फर्नीचर व इंटीरियर" },
  { id: "jewellery", icon: "💍", en: "Jewellery retail", hi: "ज्वेलरी शोरूम" },
  { id: "restaurant", icon: "🍛", en: "Restaurant & food business", hi: "रेस्टोरेंट / खान-पान" },
  { id: "other", icon: "🏪", en: "Other retail, wholesale & trade", hi: "अन्य दुकान / व्यापार" },
];

export const CITIES = [
  "Surat", "Ahmedabad", "Mumbai", "Pune", "Delhi NCR", "Bengaluru", "Hyderabad",
  "Chennai", "Kolkata", "Indore", "Nagpur", "Coimbatore", "Vadodara", "Rajkot",
  "Jaipur", "Jodhpur", "Udaipur", "Other",
];

export const RAJASTHAN_DISTRICTS = [
  "Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner",
  "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh",
  "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli",
  "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar",
  "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur",
];

export const EDUCATION: (Bi & { id: string })[] = [
  { id: "below10", en: "Below 10th", hi: "10वीं से कम" },
  { id: "10", en: "10th pass", hi: "10वीं पास" },
  { id: "12", en: "12th pass", hi: "12वीं पास" },
  { id: "diploma", en: "ITI / Diploma", hi: "ITI / डिप्लोमा" },
  { id: "graduate", en: "Graduate", hi: "स्नातक" },
];
export const EDU_RANK: Record<string, number> = { any: 0, below10: 0, "10": 1, "12": 2, diploma: 3, graduate: 4 };

export const LANGUAGES = [
  "Hindi", "Marwari", "Mewari", "Shekhawati", "English", "Gujarati", "Marathi",
  "Punjabi", "Urdu", "Kannada", "Telugu", "Tamil", "Bengali",
];

export type Goal = Bi & { id: string; icon: string; blurb: Bi };
export const GOALS: Goal[] = [
  { id: "job", icon: "💼", en: "I want a job", hi: "मुझे नौकरी चाहिए",
    blurb: { en: "Steady work, clear pay, honest terms.", hi: "पक्का काम, साफ़ वेतन, ईमानदार शर्तें।" } },
  { id: "learn", icon: "🎓", en: "I want to learn a trade", hi: "मुझे काम सीखना है",
    blurb: { en: "Learn how a real business runs, by doing.", hi: "काम करते हुए असली कारोबार सीखें।" } },
  { id: "manager", icon: "📈", en: "I want to grow into a manager", hi: "मुझे मैनेजर बनना है",
    blurb: { en: "Start on the floor, grow to supervise.", hi: "दुकान से शुरू करें, सुपरवाइज़र तक बढ़ें।" } },
  { id: "family", icon: "🏠", en: "Experience for my family business", hi: "परिवार के कारोबार के लिए अनुभव",
    blurb: { en: "Gain skills before you go back home.", hi: "घर लौटने से पहले हुनर सीखें।" } },
  { id: "explore", icon: "🌱", en: "Exploring my own business later", hi: "आगे अपना काम शुरू करना है",
    blurb: { en: "Understand an industry before you invest.", hi: "पैसा लगाने से पहले कारोबार को समझें।" } },
];

export const BUSINESS_TYPES: (Bi & { id: string })[] = [
  { id: "retail", en: "Retail shop / showroom", hi: "रिटेल दुकान / शोरूम" },
  { id: "wholesale", en: "Wholesale / distribution", hi: "थोक / वितरण" },
  { id: "workshop", en: "Workshop / garage", hi: "वर्कशॉप / गैराज" },
  { id: "food", en: "Restaurant / food", hi: "रेस्टोरेंट / खान-पान" },
  { id: "manufacturing", en: "Manufacturing / production", hi: "निर्माण / उत्पादन" },
  { id: "other", en: "Other", hi: "अन्य" },
];

export const SALARY_PERIODS = [
  { id: "month", en: "per month", hi: "प्रति माह" },
  { id: "week", en: "per week", hi: "प्रति सप्ताह" },
  { id: "day", en: "per day", hi: "प्रति दिन" },
];

export const ACCOMMODATION: (Bi & { id: string })[] = [
  { id: "none", en: "Not provided", hi: "उपलब्ध नहीं" },
  { id: "free", en: "Free", hi: "मुफ़्त" },
  { id: "paid", en: "Provided, paid by worker", hi: "उपलब्ध, खर्च वर्कर का" },
];

export const WEEKLY_HOLIDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  "Rotating", "No fixed weekly holiday",
];

export const EXPERIENCE_REQ: (Bi & { id: string })[] = [
  { id: "fresher", en: "Fresher welcome", hi: "फ्रेशर चलेगा" },
  { id: "lt1", en: "Up to 1 year", hi: "1 साल तक अनुभव" },
  { id: "1to3", en: "1–3 years", hi: "1–3 साल अनुभव" },
  { id: "3plus", en: "3+ years", hi: "3+ साल अनुभव" },
];

export type Skill = { id: string; en: string; stage: 1 | 2 | 3 };
export const STAGES: (Bi & { stage: 1 | 2 | 3 })[] = [
  { stage: 1, en: "Foundation", hi: "शुरुआत" },
  { stage: 2, en: "Operations", hi: "संचालन" },
  { stage: 3, en: "Business", hi: "कारोबार" },
];

const COMMON_SKILLS: Skill[] = [
  { id: "billing", en: "Billing & cash handling", stage: 1 },
  { id: "customer", en: "Customer service & product knowledge", stage: 1 },
  { id: "stock", en: "Stock organisation & inventory", stage: 2 },
  { id: "returns", en: "Handling returns & complaints", stage: 2 },
  { id: "pricing", en: "Product pricing & margins", stage: 3 },
  { id: "supplier", en: "Talking to suppliers", stage: 3 },
  { id: "purchasing", en: "Purchasing & restocking", stage: 3 },
  { id: "staff", en: "Store operations & staff coordination", stage: 3 },
];

export const SKILLS: Record<string, Skill[]> = {
  menswear: COMMON_SKILLS,
  garment_wholesale: [
    { id: "fabric", en: "Fabric & garment quality checks", stage: 1 },
    { id: "packing", en: "Packing & dispatch", stage: 1 },
    { id: "stock", en: "Stock & godown management", stage: 2 },
    { id: "ledger", en: "Party ledger & accounts", stage: 2 },
    { id: "transport", en: "Transport & logistics", stage: 2 },
    { id: "pricing", en: "Wholesale pricing & margins", stage: 3 },
    { id: "supplier", en: "Dealing with mills & manufacturers", stage: 3 },
    { id: "purchasing", en: "Buying & seasonal planning", stage: 3 },
  ],
  mobile_retail: [
    { id: "customer", en: "Product demo & customer advice", stage: 1 },
    { id: "billing", en: "Billing, EMI & finance paperwork", stage: 1 },
    { id: "stock", en: "Inventory & IMEI tracking", stage: 2 },
    { id: "warranty", en: "Warranty & service claims", stage: 2 },
    { id: "pricing", en: "Pricing, offers & margins", stage: 3 },
    { id: "supplier", en: "Distributor & brand dealing", stage: 3 },
    { id: "purchasing", en: "Purchasing & stock planning", stage: 3 },
    { id: "staff", en: "Store operations", stage: 3 },
  ],
  mobile_repair: [
    { id: "diagnose", en: "Fault finding & diagnosis", stage: 1 },
    { id: "screen", en: "Screen, battery & charging repair", stage: 1 },
    { id: "software", en: "Software flashing & data transfer", stage: 2 },
    { id: "chip", en: "Basic chip-level repair", stage: 2 },
    { id: "customer", en: "Customer handling & job cards", stage: 2 },
    { id: "pricing", en: "Repair pricing & margins", stage: 3 },
    { id: "supplier", en: "Sourcing spare parts", stage: 3 },
    { id: "staff", en: "Running a repair counter", stage: 3 },
  ],
  auto_parts: [
    { id: "parts", en: "Part numbers & vehicle compatibility", stage: 1 },
    { id: "billing", en: "Billing & GST invoices", stage: 1 },
    { id: "stock", en: "Stock & racking", stage: 2 },
    { id: "customer", en: "Mechanic & customer dealing", stage: 2 },
    { id: "pricing", en: "Pricing, discounts & margins", stage: 3 },
    { id: "supplier", en: "Company & distributor orders", stage: 3 },
    { id: "purchasing", en: "Purchasing & fast-moving stock", stage: 3 },
    { id: "credit", en: "Credit & collections", stage: 3 },
  ],
  garage: [
    { id: "basic", en: "Tools, washing & basic servicing", stage: 1 },
    { id: "service", en: "Routine service & oil change", stage: 1 },
    { id: "diagnose", en: "Fault diagnosis", stage: 2 },
    { id: "repair", en: "Brake, clutch & suspension work", stage: 2 },
    { id: "estimate", en: "Estimates & job cards", stage: 2 },
    { id: "customer", en: "Customer handling", stage: 2 },
    { id: "parts", en: "Parts sourcing", stage: 3 },
    { id: "staff", en: "Running a workshop", stage: 3 },
  ],
  hardware: [
    { id: "products", en: "Product range & uses (pipes, paint, tools…)", stage: 1 },
    { id: "billing", en: "Billing & measurement", stage: 1 },
    { id: "stock", en: "Godown & stock handling", stage: 2 },
    { id: "customer", en: "Contractor & builder dealing", stage: 2 },
    { id: "pricing", en: "Rates & margins", stage: 3 },
    { id: "supplier", en: "Dealer & company orders", stage: 3 },
    { id: "credit", en: "Credit & collections", stage: 3 },
    { id: "purchasing", en: "Purchasing", stage: 3 },
  ],
  furniture: [
    { id: "products", en: "Product & material knowledge", stage: 1 },
    { id: "customer", en: "Showroom sales", stage: 1 },
    { id: "measure", en: "Site measurement & design basics", stage: 2 },
    { id: "delivery", en: "Delivery & installation coordination", stage: 2 },
    { id: "pricing", en: "Quotation & pricing", stage: 3 },
    { id: "supplier", en: "Carpenter / factory coordination", stage: 3 },
    { id: "staff", en: "Showroom operations", stage: 3 },
    { id: "purchasing", en: "Purchasing", stage: 3 },
  ],
  jewellery: [
    { id: "customer", en: "Customer service & design knowledge", stage: 1 },
    { id: "weighing", en: "Weighing, purity & hallmarking basics", stage: 1 },
    { id: "billing", en: "Billing & rate calculation", stage: 2 },
    { id: "stock", en: "Stock & security procedures", stage: 2 },
    { id: "oldgold", en: "Old-gold exchange", stage: 3 },
    { id: "pricing", en: "Making charges & margins", stage: 3 },
    { id: "supplier", en: "Karigar & wholesaler dealing", stage: 3 },
    { id: "staff", en: "Showroom operations", stage: 3 },
  ],
  restaurant: [
    { id: "service", en: "Order taking & service", stage: 1 },
    { id: "kitchen", en: "Kitchen basics & hygiene", stage: 1 },
    { id: "billing", en: "Billing / POS", stage: 1 },
    { id: "stock", en: "Kitchen stock & wastage control", stage: 2 },
    { id: "costing", en: "Menu costing & margins", stage: 3 },
    { id: "supplier", en: "Vendor dealing", stage: 3 },
    { id: "purchasing", en: "Daily purchasing", stage: 3 },
    { id: "staff", en: "Shift & staff management", stage: 3 },
  ],
  other: COMMON_SKILLS,
};

export function skillsFor(industry: string): Skill[] {
  return SKILLS[industry] ?? COMMON_SKILLS;
}
export function skillLabel(industry: string, id: string): Skill | undefined {
  return skillsFor(industry).find((s) => s.id === id);
}

export const REPORT_TYPES: (Bi & { id: string })[] = [
  { id: "unpaid", en: "Unpaid or late wages", hi: "वेतन नहीं मिला / देर से मिला" },
  { id: "misleading", en: "Misleading listing", hi: "भ्रामक विज्ञापन" },
  { id: "unsafe", en: "Unsafe conditions or housing", hi: "असुरक्षित काम या रहने की जगह" },
  { id: "harassment", en: "Harassment or abuse", hi: "उत्पीड़न / दुर्व्यवहार" },
  { id: "fees", en: "Asked for money / hidden fees", hi: "पैसे / छुपी फीस माँगी गई" },
  { id: "fraud", en: "Fake business / fraud", hi: "फ़र्ज़ी कारोबार / धोखाधड़ी" },
  { id: "other", en: "Something else", hi: "कुछ और" },
];

export const APPLICATION_STATUSES = [
  { id: "applied", en: "Applied", hi: "आवेदन भेजा", tone: "slate" },
  { id: "contacted", en: "Employer contacted", hi: "मालिक ने संपर्क किया", tone: "indigo" },
  { id: "interview", en: "Interview", hi: "इंटरव्यू", tone: "marigold" },
  { id: "selected", en: "Selected", hi: "चयनित", tone: "green" },
  { id: "joined", en: "Joined", hi: "जॉइन किया", tone: "green" },
  { id: "rejected", en: "Not selected", hi: "चयन नहीं हुआ", tone: "rose" },
  { id: "withdrawn", en: "Withdrawn", hi: "वापस लिया", tone: "slate" },
] as const;
export type AppStatus = (typeof APPLICATION_STATUSES)[number]["id"];

export const VERIFICATION_CHECKS: (Bi & { id: string })[] = [
  { id: "identity", en: "Owner identity (Aadhaar / PAN) checked", hi: "मालिक की पहचान जाँची गई" },
  { id: "business", en: "Business registration / GST checked", hi: "व्यवसाय पंजीकरण / GST जाँचा गया" },
  { id: "address", en: "Shop address confirmed (photo / visit)", hi: "दुकान का पता पुष्ट (फ़ोटो / विज़िट)" },
  { id: "phone", en: "Phone number verified by call", hi: "फ़ोन नंबर कॉल से सत्यापित" },
];

export function byId<T extends { id: string }>(list: T[], id: string | null | undefined): T | undefined {
  return list.find((x) => x.id === id);
}
