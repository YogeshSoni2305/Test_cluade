export type Bi = { en: string; hi: string };

export type Industry = Bi & { id: string };
export const INDUSTRIES: Industry[] = [
  { id: "menswear", en: "Men's clothing & apparel retail", hi: "पुरुष वस्त्र / रेडीमेड शोरूम" },
  { id: "garment_wholesale", en: "Garment & textile wholesale", hi: "कपड़ा / गारमेंट थोक" },
  { id: "mobile_retail", en: "Mobile phones & electronics retail", hi: "मोबाइल व इलेक्ट्रॉनिक्स दुकान" },
  { id: "mobile_repair", en: "Mobile repair & accessories", hi: "मोबाइल रिपेयर व एक्सेसरीज़" },
  { id: "auto_parts", en: "Automobile spare parts", hi: "ऑटो स्पेयर पार्ट्स" },
  { id: "garage", en: "Garage & vehicle servicing", hi: "गैराज / वाहन सर्विसिंग" },
  { id: "hardware", en: "Hardware & building materials", hi: "हार्डवेयर व निर्माण सामग्री" },
  { id: "furniture", en: "Furniture & interiors", hi: "फर्नीचर व इंटीरियर" },
  { id: "jewellery", en: "Jewellery retail", hi: "ज्वेलरी शोरूम" },
  { id: "restaurant", en: "Restaurant & food business", hi: "रेस्टोरेंट / खान-पान" },
  { id: "other", en: "Other retail, wholesale & trade", hi: "अन्य दुकान / व्यापार" },
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

export type Goal = Bi & { id: string; blurb: Bi };
export const GOALS: Goal[] = [
  { id: "job", en: "I want a job", hi: "मुझे नौकरी चाहिए",
    blurb: { en: "Steady work, clear pay, honest terms.", hi: "पक्का काम, साफ़ वेतन, ईमानदार शर्तें।" } },
  { id: "learn", en: "I want to learn a trade", hi: "मुझे काम सीखना है",
    blurb: { en: "Learn how a real business runs, by doing.", hi: "काम करते हुए असली कारोबार सीखें।" } },
  { id: "manager", en: "I want to grow into a manager", hi: "मुझे मैनेजर बनना है",
    blurb: { en: "Start on the floor, grow to supervise.", hi: "दुकान से शुरू करें, सुपरवाइज़र तक बढ़ें।" } },
  { id: "family", en: "Experience for my family business", hi: "परिवार के कारोबार के लिए अनुभव",
    blurb: { en: "Gain skills before you go back home.", hi: "घर लौटने से पहले हुनर सीखें।" } },
  { id: "explore", en: "Exploring my own business later", hi: "आगे अपना काम शुरू करना है",
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

export type Skill = { id: string; en: string; hi: string; stage: 1 | 2 | 3 };
export const STAGES: (Bi & { stage: 1 | 2 | 3 })[] = [
  { stage: 1, en: "Foundation", hi: "शुरुआत" },
  { stage: 2, en: "Operations", hi: "संचालन" },
  { stage: 3, en: "Business", hi: "कारोबार" },
];

const COMMON_SKILLS: Skill[] = [
  { id: "billing", en: "Billing & cash handling", hi: "बिलिंग और नकद संभालना", stage: 1 },
  { id: "customer", en: "Customer service & product knowledge", hi: "ग्राहक सेवा और सामान की जानकारी", stage: 1 },
  { id: "stock", en: "Stock organisation & inventory", hi: "स्टॉक जमाना और हिसाब", stage: 2 },
  { id: "returns", en: "Handling returns & complaints", hi: "वापसी और शिकायत संभालना", stage: 2 },
  { id: "pricing", en: "Product pricing & margins", hi: "सामान का भाव और मुनाफ़ा", stage: 3 },
  { id: "supplier", en: "Talking to suppliers", hi: "सप्लायर से बात करना", stage: 3 },
  { id: "purchasing", en: "Purchasing & restocking", hi: "ख़रीद और स्टॉक भरना", stage: 3 },
  { id: "staff", en: "Store operations & staff coordination", hi: "दुकान का संचालन और स्टाफ़ से तालमेल", stage: 3 },
];

export const SKILLS: Record<string, Skill[]> = {
  menswear: COMMON_SKILLS,
  garment_wholesale: [
    { id: "fabric", en: "Fabric & garment quality checks", hi: "कपड़े और गारमेंट की क्वालिटी जाँच", stage: 1 },
    { id: "packing", en: "Packing & dispatch", hi: "पैकिंग और माल भेजना", stage: 1 },
    { id: "stock", en: "Stock & godown management", hi: "स्टॉक और गोदाम संभालना", stage: 2 },
    { id: "ledger", en: "Party ledger & accounts", hi: "पार्टी खाता और हिसाब-किताब", stage: 2 },
    { id: "transport", en: "Transport & logistics", hi: "ट्रांसपोर्ट और माल ढुलाई", stage: 2 },
    { id: "pricing", en: "Wholesale pricing & margins", hi: "थोक भाव और मुनाफ़ा", stage: 3 },
    { id: "supplier", en: "Dealing with mills & manufacturers", hi: "मिल और निर्माताओं से लेन-देन", stage: 3 },
    { id: "purchasing", en: "Buying & seasonal planning", hi: "ख़रीद और सीज़न की योजना", stage: 3 },
  ],
  mobile_retail: [
    { id: "customer", en: "Product demo & customer advice", hi: "सामान दिखाना और ग्राहक को सलाह", stage: 1 },
    { id: "billing", en: "Billing, EMI & finance paperwork", hi: "बिलिंग, EMI और फ़ाइनेंस के कागज़", stage: 1 },
    { id: "stock", en: "Inventory & IMEI tracking", hi: "स्टॉक और IMEI रिकॉर्ड", stage: 2 },
    { id: "warranty", en: "Warranty & service claims", hi: "वारंटी और सर्विस क्लेम", stage: 2 },
    { id: "pricing", en: "Pricing, offers & margins", hi: "भाव, ऑफ़र और मुनाफ़ा", stage: 3 },
    { id: "supplier", en: "Distributor & brand dealing", hi: "डिस्ट्रीब्यूटर और ब्रांड से लेन-देन", stage: 3 },
    { id: "purchasing", en: "Purchasing & stock planning", hi: "ख़रीद और स्टॉक की योजना", stage: 3 },
    { id: "staff", en: "Store operations", hi: "दुकान का संचालन", stage: 3 },
  ],
  mobile_repair: [
    { id: "diagnose", en: "Fault finding & diagnosis", hi: "ख़राबी ढूँढना और पहचानना", stage: 1 },
    { id: "screen", en: "Screen, battery & charging repair", hi: "स्क्रीन, बैटरी और चार्जिंग रिपेयर", stage: 1 },
    { id: "software", en: "Software flashing & data transfer", hi: "सॉफ़्टवेयर डालना और डेटा ट्रांसफ़र", stage: 2 },
    { id: "chip", en: "Basic chip-level repair", hi: "बेसिक चिप-लेवल रिपेयर", stage: 2 },
    { id: "customer", en: "Customer handling & job cards", hi: "ग्राहक संभालना और जॉब कार्ड", stage: 2 },
    { id: "pricing", en: "Repair pricing & margins", hi: "रिपेयर का भाव और मुनाफ़ा", stage: 3 },
    { id: "supplier", en: "Sourcing spare parts", hi: "स्पेयर पार्ट मँगवाना", stage: 3 },
    { id: "staff", en: "Running a repair counter", hi: "रिपेयर काउंटर चलाना", stage: 3 },
  ],
  auto_parts: [
    { id: "parts", en: "Part numbers & vehicle compatibility", hi: "पार्ट नंबर और गाड़ी के हिसाब से पार्ट", stage: 1 },
    { id: "billing", en: "Billing & GST invoices", hi: "बिलिंग और GST बिल", stage: 1 },
    { id: "stock", en: "Stock & racking", hi: "स्टॉक और रैक लगाना", stage: 2 },
    { id: "customer", en: "Mechanic & customer dealing", hi: "मिस्त्री और ग्राहक से लेन-देन", stage: 2 },
    { id: "pricing", en: "Pricing, discounts & margins", hi: "भाव, छूट और मुनाफ़ा", stage: 3 },
    { id: "supplier", en: "Company & distributor orders", hi: "कंपनी और डिस्ट्रीब्यूटर ऑर्डर", stage: 3 },
    { id: "purchasing", en: "Purchasing & fast-moving stock", hi: "ख़रीद और जल्दी बिकने वाला स्टॉक", stage: 3 },
    { id: "credit", en: "Credit & collections", hi: "उधार और वसूली", stage: 3 },
  ],
  garage: [
    { id: "basic", en: "Tools, washing & basic servicing", hi: "औज़ार, धुलाई और बेसिक सर्विस", stage: 1 },
    { id: "service", en: "Routine service & oil change", hi: "नियमित सर्विस और ऑयल बदलना", stage: 1 },
    { id: "diagnose", en: "Fault diagnosis", hi: "ख़राबी पहचानना", stage: 2 },
    { id: "repair", en: "Brake, clutch & suspension work", hi: "ब्रेक, क्लच और सस्पेंशन का काम", stage: 2 },
    { id: "estimate", en: "Estimates & job cards", hi: "अनुमान (एस्टिमेट) और जॉब कार्ड", stage: 2 },
    { id: "customer", en: "Customer handling", hi: "ग्राहक संभालना", stage: 2 },
    { id: "parts", en: "Parts sourcing", hi: "पार्ट मँगवाना", stage: 3 },
    { id: "staff", en: "Running a workshop", hi: "वर्कशॉप चलाना", stage: 3 },
  ],
  hardware: [
    { id: "products", en: "Product range & uses (pipes, paint, tools…)", hi: "सामान और उनका उपयोग (पाइप, पेंट, औज़ार…)", stage: 1 },
    { id: "billing", en: "Billing & measurement", hi: "बिलिंग और नाप-तौल", stage: 1 },
    { id: "stock", en: "Godown & stock handling", hi: "गोदाम और स्टॉक संभालना", stage: 2 },
    { id: "customer", en: "Contractor & builder dealing", hi: "ठेकेदार और बिल्डर से लेन-देन", stage: 2 },
    { id: "pricing", en: "Rates & margins", hi: "भाव और मुनाफ़ा", stage: 3 },
    { id: "supplier", en: "Dealer & company orders", hi: "डीलर और कंपनी ऑर्डर", stage: 3 },
    { id: "credit", en: "Credit & collections", hi: "उधार और वसूली", stage: 3 },
    { id: "purchasing", en: "Purchasing", hi: "ख़रीद", stage: 3 },
  ],
  furniture: [
    { id: "products", en: "Product & material knowledge", hi: "सामान और मटेरियल की जानकारी", stage: 1 },
    { id: "customer", en: "Showroom sales", hi: "शोरूम बिक्री", stage: 1 },
    { id: "measure", en: "Site measurement & design basics", hi: "साइट का नाप और डिज़ाइन की बुनियादी बातें", stage: 2 },
    { id: "delivery", en: "Delivery & installation coordination", hi: "डिलीवरी और फ़िटिंग का तालमेल", stage: 2 },
    { id: "pricing", en: "Quotation & pricing", hi: "कोटेशन और भाव", stage: 3 },
    { id: "supplier", en: "Carpenter / factory coordination", hi: "कारपेंटर / फ़ैक्ट्री से तालमेल", stage: 3 },
    { id: "staff", en: "Showroom operations", hi: "शोरूम का संचालन", stage: 3 },
    { id: "purchasing", en: "Purchasing", hi: "ख़रीद", stage: 3 },
  ],
  jewellery: [
    { id: "customer", en: "Customer service & design knowledge", hi: "ग्राहक सेवा और डिज़ाइन की जानकारी", stage: 1 },
    { id: "weighing", en: "Weighing, purity & hallmarking basics", hi: "तौल, शुद्धता और हॉलमार्क की बुनियादी बातें", stage: 1 },
    { id: "billing", en: "Billing & rate calculation", hi: "बिलिंग और भाव का हिसाब", stage: 2 },
    { id: "stock", en: "Stock & security procedures", hi: "स्टॉक और सुरक्षा नियम", stage: 2 },
    { id: "oldgold", en: "Old-gold exchange", hi: "पुराना सोना बदलना", stage: 3 },
    { id: "pricing", en: "Making charges & margins", hi: "बनवाई (मेकिंग चार्ज) और मुनाफ़ा", stage: 3 },
    { id: "supplier", en: "Karigar & wholesaler dealing", hi: "कारीगर और थोक व्यापारी से लेन-देन", stage: 3 },
    { id: "staff", en: "Showroom operations", hi: "शोरूम का संचालन", stage: 3 },
  ],
  restaurant: [
    { id: "service", en: "Order taking & service", hi: "ऑर्डर लेना और परोसना", stage: 1 },
    { id: "kitchen", en: "Kitchen basics & hygiene", hi: "रसोई की बुनियादी बातें और सफ़ाई", stage: 1 },
    { id: "billing", en: "Billing / POS", hi: "बिलिंग / POS मशीन", stage: 1 },
    { id: "stock", en: "Kitchen stock & wastage control", hi: "रसोई का स्टॉक और बर्बादी पर नियंत्रण", stage: 2 },
    { id: "costing", en: "Menu costing & margins", hi: "मेन्यू की लागत और मुनाफ़ा", stage: 3 },
    { id: "supplier", en: "Vendor dealing", hi: "विक्रेताओं से लेन-देन", stage: 3 },
    { id: "purchasing", en: "Daily purchasing", hi: "रोज़ की ख़रीद", stage: 3 },
    { id: "staff", en: "Shift & staff management", hi: "शिफ़्ट और स्टाफ़ संभालना", stage: 3 },
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
