import { getDb, normalizePhone } from "./db";

type JobSeed = {
  emp: number; title: string; industry: string; locality: string; desc: string; resp: string;
  min: number; max: number; hours: string; holiday: string;
  stay: "none" | "free" | "paid"; stayCost?: number; stayDetails?: string;
  meals?: string; benefits?: string; deductions: string; deposit?: number;
  edu: string; exp: string; langs: string[]; skills: string[]; learn: string;
  join: string; openings?: number; daysAgo: number; learnConfirmed?: boolean; stayConfirmed?: boolean;
};

export function seedIfEmpty() {
  const db = getDb();
  const n = (db.prepare("SELECT COUNT(*) n FROM users").get() as { n: number }).n;
  if (n > 0) return;
  seed();
}

export function seed() {
  const db = getDb();
  const tx = db.transaction(() => {
    const user = db.prepare("INSERT INTO users (role,name,phone,email) VALUES (?,?,?,?)");
    const admin = user.run("admin", "Platform Admin", "+919000000001", "admin@example.com").lastInsertRowid as number;
    void admin;
    db.prepare("INSERT INTO users (role,name,phone,admin_role) VALUES ('admin','Verification Desk','+919000000002','verifier')").run();
    db.prepare("INSERT INTO users (role,name,phone,admin_role) VALUES ('admin','Pilot Analyst','+919000000003','analyst')").run();

    // ---- employers ---------------------------------------------------
    const emps = [
      { name: "Shree Ram Menswear", owner: "Ramesh Agarwal", industry: "menswear", type: "retail", city: "Surat", years: 24, staff: 14,
        about: "Family-run showroom on Ring Road with three floors of formals, ethnic wear and wedding collections. Third-generation business; several of our managers started as 12th-pass trainees from Rajasthan.",
        origin: "Jodhpur", status: "verified", checks: ["identity", "business", "address", "phone"], phone: "+919000000101" },
      { name: "Balaji Garment House", owner: "Sunil Maheshwari", industry: "garment_wholesale", type: "wholesale", city: "Ahmedabad", years: 31, staff: 22,
        about: "Wholesale garment distributor supplying 400+ retailers across Gujarat and Maharashtra. Large godown, dispatch team and in-house accounts.",
        origin: "Pali", status: "verified", checks: ["identity", "business", "address", "phone"], phone: "+919000000102" },
      { name: "Digital Point Mobiles", owner: "Imran Khan", industry: "mobile_retail", type: "retail", city: "Pune", years: 9, staff: 8,
        about: "Authorised multi-brand mobile retailer with a service counter. We hire freshers and train on product knowledge and billing.",
        origin: "Tonk", status: "verified", checks: ["identity", "business", "phone"], phone: "+919000000103" },
      { name: "Chauhan Auto Spares", owner: "Dinesh Chauhan", industry: "auto_parts", type: "retail", city: "Delhi NCR", years: 18, staff: 11,
        about: "Spare-parts counter in Karol Bagh serving garages and retail customers. Strong supplier network for two- and four-wheelers.",
        origin: "Alwar", status: "verified", checks: ["identity", "business", "address", "phone"], phone: "+919000000104" },
      { name: "Raj Hardware & Paints", owner: "Kishan Lal Soni", industry: "hardware", type: "retail", city: "Indore", years: 15, staff: 9,
        about: "Hardware, plumbing and paints store supplying contractors and builders. Learn rates, measurement and credit management.",
        origin: "Bhilwara", status: "verified", checks: ["identity", "business", "phone"], phone: "+919000000105" },
      { name: "Mewar Jewellers", owner: "Pankaj Jain", industry: "jewellery", type: "retail", city: "Bengaluru", years: 12, staff: 10,
        about: "Retail jewellery showroom in Chickpet with a Rajasthani design focus. BIS hallmarked gold and silver.",
        origin: "Udaipur", status: "pending", checks: ["identity", "phone"], phone: "+919000000106" },
      { name: "Gurukripa Auto Garage", owner: "Harpreet Singh", industry: "garage", type: "workshop", city: "Hyderabad", years: 7, staff: 6,
        about: "Multi-brand car service garage. Mentorship from a senior mechanic with hands-on training.",
        origin: "Sri Ganganagar", status: "verified", checks: ["identity", "address", "phone"], phone: "+919000000107" },
      { name: "Urban Nest Furniture", owner: "Vikas Purohit", industry: "furniture", type: "retail", city: "Mumbai", years: 6, staff: 12,
        about: "Modern furniture and interiors showroom in Andheri with in-house carpentry.",
        origin: "Jaipur", status: "verified", checks: ["identity", "business", "address", "phone"], phone: "+919000000108" },
    ];
    const empUser = user;
    const empIds: number[] = [];
    const insEmp = db.prepare(`INSERT INTO employers
      (user_id,business_name,owner_name,industry,business_type,city,address,contact_phone,years_in_business,staff_count,about,origin_district,verification_status,verified_checks,verified_at,gst_number)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    emps.forEach((e, i) => {
      const uid = empUser.run("employer", e.owner, e.phone, `employer${i + 1}@example.com`).lastInsertRowid as number;
      const id = insEmp.run(uid, e.name, e.owner, e.industry, e.type, e.city, `Main market, ${e.city}`, e.phone, e.years, e.staff,
        e.about, e.origin, e.status, JSON.stringify(e.checks), e.status === "verified" ? "2026-09-01 10:00:00" : null,
        e.status === "verified" ? `24ABCDE${1000 + i}F1Z5` : null).lastInsertRowid as number;
      empIds.push(id);
    });
    // an employer who has not submitted verification yet, and one who is pending (listing visible, flagged unverified)
    const uid = empUser.run("employer", "Naresh Prajapat", "+919000000109", "employer9@example.com").lastInsertRowid as number;
    insEmp.run(uid, "New Look Tailors", "Naresh Prajapat", "menswear", "retail", "Nagpur", "Itwari, Nagpur", "+919000000109", 3, 3,
      "Small tailoring and readymade shop. Just joined the platform.", "Barmer", "unsubmitted", "[]", null, null);

    // ---- jobs --------------------------------------------------------
    const jobs: JobSeed[] = [
      { emp: 0, title: "Showroom Sales Trainee", industry: "menswear", locality: "Ring Road",
        desc: "Join our sales floor as a trainee. You'll start by helping customers and learn the full showroom cycle over time.",
        resp: "Greet and assist customers, fold and arrange stock, help at billing counter, keep trial rooms tidy, learn product and size knowledge.",
        min: 12000, max: 15000, hours: "10:00 am – 9:30 pm, with 1.5 hr break", holiday: "Rotating", stay: "free",
        stayDetails: "Shared 4-bed flat 10 minutes walk from the shop, with cook. Bedding provided.", meals: "Lunch and dinner provided",
        benefits: "Festival bonus, yearly travel allowance for Diwali", deductions: "No deductions", edu: "10", exp: "fresher",
        langs: ["Hindi", "Marwari"], skills: ["customer", "billing", "stock", "returns", "pricing", "supplier"],
        learn: "After 6 months trainees help with stock counting; after 12 months they sit with the buying manager during supplier visits. Not everyone moves to buying — it depends on performance and openings.",
        join: "2026-11-15", openings: 3, daysAgo: 2, learnConfirmed: true, stayConfirmed: true },
      { emp: 0, title: "Billing & Inventory Assistant", industry: "menswear", locality: "Ring Road",
        desc: "For someone with 12th pass and basic computer comfort who wants to learn showroom accounts and stock.",
        resp: "GST billing on software, daily stock entry, reconcile cash at close, pack online-order parcels.",
        min: 15000, max: 18000, hours: "10:00 am – 9:00 pm", holiday: "Tuesday", stay: "free",
        stayDetails: "Shared flat with other staff.", meals: "Lunch", benefits: "Bonus after 1 year",
        deductions: "No deductions", edu: "12", exp: "lt1", langs: ["Hindi", "English"],
        skills: ["billing", "stock", "pricing", "purchasing"], learn: "You'll learn how margins and discounts are decided.",
        join: "2026-11-01", daysAgo: 5, learnConfirmed: true, stayConfirmed: true },
      { emp: 1, title: "Godown & Dispatch Helper", industry: "garment_wholesale", locality: "Relief Road",
        desc: "Work in the godown and dispatch team of a large garment wholesaler.",
        resp: "Receive and check bales, arrange stock, pack orders, coordinate with transporters.",
        min: 11000, max: 13000, hours: "9:30 am – 8:30 pm", holiday: "Sunday", stay: "paid", stayCost: 1500,
        stayDetails: "Staff dormitory above godown; ₹1,500/month for bed, electricity and water.", meals: "None",
        benefits: "Overtime paid after 9 hours", deductions: "₹1,500 accommodation only, shown above", edu: "10", exp: "fresher",
        langs: ["Hindi", "Gujarati"], skills: ["fabric", "packing", "stock", "transport"],
        learn: "You'll learn quality checking and how bulk orders move from mill to retailer.", join: "2026-11-10",
        openings: 4, daysAgo: 1, learnConfirmed: true, stayConfirmed: true },
      { emp: 1, title: "Accounts Trainee (Party Ledger)", industry: "garment_wholesale", locality: "Relief Road",
        desc: "A good start for 12th pass (commerce) candidates who want to understand wholesale credit and collections.",
        resp: "Enter bills and receipts in Tally, follow up on party payments with senior accountant, prepare daily statements.",
        min: 14000, max: 17000, hours: "10:00 am – 8:00 pm", holiday: "Sunday", stay: "paid", stayCost: 1500,
        stayDetails: "Staff dormitory, ₹1,500/month.", deductions: "₹1,500 accommodation only", edu: "12", exp: "lt1",
        langs: ["Hindi", "English", "Gujarati"], skills: ["ledger", "pricing", "supplier"],
        learn: "Tally and party-credit basics; senior accountant mentors you.", join: "2026-12-01", daysAgo: 9, learnConfirmed: true, stayConfirmed: true },
      { emp: 2, title: "Mobile Sales Executive (Fresher)", industry: "mobile_retail", locality: "Camp",
        desc: "Learn to sell smartphones, handle EMI paperwork and run a retail counter.",
        resp: "Demo phones to customers, explain offers and EMI, bill and register warranty, keep display fresh.",
        min: 13000, max: 16000, hours: "10:30 am – 9:30 pm", holiday: "Wednesday", stay: "none",
        meals: "Tea and lunch allowance ₹100/day", benefits: "Sales incentive up to ₹4,000/month", deductions: "No deductions", edu: "12", exp: "fresher",
        langs: ["Hindi", "English", "Marathi"], skills: ["customer", "billing", "stock", "warranty", "pricing"],
        learn: "Training from a senior salesperson on brands and finance schemes during first month.", join: "2026-11-05", openings: 2, daysAgo: 3, learnConfirmed: true },
      { emp: 3, title: "Spare Parts Counter Boy", industry: "auto_parts", locality: "Karol Bagh",
        desc: "Learn part numbers and vehicle compatibility from experienced staff in a busy spare-parts counter.",
        resp: "Fetch parts, assist mechanics, update stock sheet, deliver small orders to nearby garages.",
        min: 12000, max: 14000, hours: "9:30 am – 8:30 pm", holiday: "Sunday", stay: "free",
        stayDetails: "Shared room in owner's building, 5 minutes from shop.", meals: "Lunch", deductions: "No deductions", edu: "10", exp: "fresher",
        langs: ["Hindi"], skills: ["parts", "billing", "stock", "customer", "pricing", "supplier"],
        learn: "Within a year you'll know most common parts for Maruti, Hyundai and Bajaj. Later: dealing with company reps.", join: "2026-11-20",
        openings: 2, daysAgo: 4, learnConfirmed: true, stayConfirmed: true },
      { emp: 3, title: "Billing Executive — Auto Spares", industry: "auto_parts", locality: "Karol Bagh",
        desc: "Computer billing and GST invoices for a high-volume counter.",
        resp: "Make invoices, receive payments, handle credit customers' accounts, daily cash tally.",
        min: 16000, max: 20000, hours: "10:00 am – 8:30 pm", holiday: "Sunday", stay: "paid", stayCost: 2000,
        stayDetails: "Room in nearby PG arranged by owner, ₹2,000/month.", deductions: "₹2,000 PG rent only", edu: "12", exp: "1to3",
        langs: ["Hindi", "English"], skills: ["billing", "credit", "pricing"], learn: "", join: "2026-12-01", daysAgo: 12, stayConfirmed: true },
      { emp: 4, title: "Hardware Counter Assistant", industry: "hardware", locality: "Chhoti Gwaltoli",
        desc: "Help customers choose pipes, fittings, paints and tools; learn rates and measurement.",
        resp: "Serve customers, measure and cut materials, load deliveries, update stock register.",
        min: 11000, max: 14000, hours: "9:00 am – 8:00 pm", holiday: "Sunday", stay: "free",
        stayDetails: "Shared room near shop. Water & electricity included.", meals: "Lunch", deductions: "No deductions", edu: "10", exp: "fresher",
        langs: ["Hindi", "Marwari"], skills: ["products", "billing", "stock", "customer", "pricing"],
        learn: "Rates, GST and contractor credit explained by the owner's son during evening review.", join: "2026-11-12",
        openings: 2, daysAgo: 6, learnConfirmed: true, stayConfirmed: true },
      { emp: 5, title: "Jewellery Sales Associate", industry: "jewellery", locality: "Chickpet",
        desc: "Showroom sales role in a hallmarked jewellery store; training on weights, purity and billing.",
        resp: "Show designs, weigh and bill jewellery, assist with old-gold exchange under supervision, security checks at close.",
        min: 15000, max: 20000, hours: "10:30 am – 8:30 pm", holiday: "Monday", stay: "free",
        stayDetails: "Staff accommodation above showroom (shared).", meals: "Lunch", deductions: "No deductions",
        deposit: 0, edu: "12", exp: "lt1", langs: ["Hindi", "Marwari", "English"],
        skills: ["customer", "weighing", "billing", "stock", "pricing"], learn: "", join: "2026-11-25", daysAgo: 7, stayConfirmed: true },
      { emp: 6, title: "Mechanic Helper (Trainee)", industry: "garage", locality: "Kukatpally",
        desc: "Learn car servicing by working next to a senior mechanic.",
        resp: "Assist with oil change, washing, tyre rotation and basic servicing under supervision.",
        min: 9000, max: 12000, hours: "9:00 am – 7:30 pm", holiday: "Monday", stay: "free",
        stayDetails: "Room behind garage with fan, bath. Shared with 2 helpers.", meals: "Lunch & dinner", deductions: "No deductions",
        edu: "10", exp: "fresher", langs: ["Hindi", "Punjabi"], skills: ["basic", "service", "diagnose", "repair"],
        learn: "Senior mechanic Gurdeep (15 yrs) mentors trainees. After 8–12 months you'll work on brakes and clutch with supervision.",
        join: "2026-11-08", openings: 2, daysAgo: 10, learnConfirmed: true, stayConfirmed: true },
      { emp: 7, title: "Furniture Showroom Sales Associate", industry: "furniture", locality: "Andheri East",
        desc: "Help families choose furniture; learn quotation, measurement and delivery coordination.",
        resp: "Customer walk-ins, product explanations, measurement visits with senior, follow up on deliveries.",
        min: 15000, max: 19000, hours: "10:30 am – 8:30 pm", holiday: "Tuesday", stay: "paid", stayCost: 3500,
        stayDetails: "Shared flat arranged near station; ₹3,500/month rent share.", meals: "None", benefits: "Sales commission 1% above target",
        deductions: "₹3,500 rent share only", edu: "12", exp: "lt1", langs: ["Hindi", "English", "Marathi"],
        skills: ["products", "customer", "measure", "delivery", "pricing"], learn: "You'll shadow a senior designer for site measurement.",
        join: "2026-11-30", daysAgo: 14, learnConfirmed: true, stayConfirmed: true },
      { emp: 2, title: "Mobile Repair Technician Trainee", industry: "mobile_repair", locality: "Camp",
        desc: "Learn screen, battery and software repair at our service counter.",
        resp: "Open and assemble phones, replace screens/batteries, log jobs, talk to customers about repair time.",
        min: 10000, max: 13000, hours: "10:30 am – 8:30 pm", holiday: "Wednesday", stay: "none", deductions: "No deductions",
        edu: "10", exp: "fresher", langs: ["Hindi"], skills: ["diagnose", "screen", "software", "customer"],
        learn: "Month 1: tools & screens. Months 2–4: software and board basics. Chip-level is for experienced staff only.", join: "2026-11-18", daysAgo: 8, learnConfirmed: true },
      { emp: 8, title: "Tailoring Shop Assistant", industry: "menswear", locality: "Itwari",
        desc: "Small shop, small team — you'll do a bit of everything.",
        resp: "Customer measurement, billing, shop upkeep.",
        min: 8000, max: 10000, hours: "10 am – 9 pm", holiday: "", stay: "none", deductions: "",
        edu: "any", exp: "fresher", langs: ["Hindi"], skills: [], learn: "", join: "2026-12-10", daysAgo: 15 },
    ];
    const insJob = db.prepare(`INSERT INTO jobs
      (employer_id,title,industry,city,locality,description,responsibilities,salary_min,salary_max,salary_period,hours,weekly_holiday,
       accommodation,accommodation_cost,accommodation_details,accommodation_confirmed,meals,benefits,deductions,deposit_amount,
       education_req,experience_req,languages,skills_offered,learning_notes,learning_confirmed,joining_date,openings,status,created_at,updated_at)
      VALUES (@employer_id,@title,@industry,@city,@locality,@desc,@resp,@min,@max,'month',@hours,@holiday,@stay,@stayCost,@stayDetails,@stayConf,@meals,@benefits,
       @deductions,@deposit,@edu,@exp,@langs,@skills,@learn,@learnConf,@join,@openings,'open',datetime('now', @ago),datetime('now', @ago))`);
    const empCity = (idx: number) => (idx < emps.length ? emps[idx].city : "Nagpur");
    const jobIds: number[] = [];
    for (const j of jobs) {
      const id = insJob.run({
        employer_id: j.emp < emps.length ? empIds[j.emp] : (db.prepare("SELECT id FROM employers WHERE business_name='New Look Tailors'").get() as { id: number }).id,
        title: j.title, industry: j.industry, city: empCity(j.emp), locality: j.locality, desc: j.desc, resp: j.resp,
        min: j.min, max: j.max, hours: j.hours, holiday: j.holiday, stay: j.stay, stayCost: j.stayCost ?? 0,
        stayDetails: j.stayDetails ?? "", stayConf: j.stayConfirmed ? 1 : 0, meals: j.meals ?? "", benefits: j.benefits ?? "",
        deductions: j.deductions, deposit: j.deposit ?? 0, edu: j.edu, exp: j.exp, langs: JSON.stringify(j.langs),
        skills: JSON.stringify(j.skills), learn: j.learn, learnConf: j.learnConfirmed ? 1 : 0, join: j.join,
        openings: j.openings ?? 1, ago: `-${j.daysAgo} days`,
      }).lastInsertRowid as number;
      jobIds.push(id);
    }

    // ---- candidates --------------------------------------------------
    const insProfile = db.prepare(`INSERT INTO candidate_profiles
      (user_id,district,education,languages,experience,industries,cities,relocate,needs_accommodation,goals,learn_notes,age,family_name,family_phone,completed)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`);
    const c1 = user.run("candidate", "Mahendra Singh Rathore", "+919000000201", null).lastInsertRowid as number;
    insProfile.run(c1, "Jodhpur", "12", JSON.stringify(["Hindi", "Marwari", "English"]), "Helped in father's kirana shop for 2 years.",
      JSON.stringify(["menswear", "garment_wholesale", "mobile_retail"]), JSON.stringify(["Surat", "Ahmedabad", "Pune"]), 1, 1,
      JSON.stringify(["learn", "family"]), "Billing, buying and how to talk to suppliers.", 19, "Bhanwar Singh (Father)", "+919000000211");
    const c2 = user.run("candidate", "Ravi Meena", "+919000000202", null).lastInsertRowid as number;
    insProfile.run(c2, "Dausa", "10", JSON.stringify(["Hindi"]), "", JSON.stringify(["auto_parts", "garage", "hardware"]),
      JSON.stringify(["Delhi NCR", "Indore"]), 1, 1, JSON.stringify(["job", "explore"]), "", 18, "Kailash Meena (Uncle)", "+919000000212");
    const c3 = user.run("candidate", "Pooja Choudhary", "+919000000203", null).lastInsertRowid as number;
    insProfile.run(c3, "Sikar", "graduate", JSON.stringify(["Hindi", "English", "Marwari"]), "Part-time cashier at a mall for 8 months.",
      JSON.stringify(["menswear", "jewellery", "furniture"]), JSON.stringify(["Mumbai", "Bengaluru", "Pune"]), 1, 1,
      JSON.stringify(["manager"]), "Showroom management.", 22, null, null);

    // ---- applications, reports, feedback -------------------------------
    const app = db.prepare("INSERT INTO applications (job_id,candidate_id,message,status,created_at) VALUES (?,?,?,?,datetime('now', ?))");
    const a1 = app.run(jobIds[0], c1, "I helped in my father's shop and want to learn the business properly.", "interview", "-1 days").lastInsertRowid as number;
    app.run(jobIds[2], c1, "Ready to relocate anytime.", "applied", "-1 days");
    app.run(jobIds[4], c2, "I can join immediately.", "contacted", "-2 days");
    app.run(jobIds[5], c2, "", "applied", "-1 days");
    const a5 = app.run(jobIds[7], c3, "I have retail experience and want to move into showroom management.", "selected", "-3 days").lastInsertRowid as number;
    app.run(jobIds[0], c3, "", "applied", "-1 days");

    db.prepare("INSERT INTO reports (job_id,employer_id,reporter_id,type,details,status,created_at) VALUES (?,?,?,?,?,?,datetime('now','-1 days'))")
      .run(jobIds[11], (db.prepare("SELECT employer_id e FROM jobs WHERE id=?").get(jobIds[11]) as { e: number }).e, c2, "misleading",
        "Listing says weekly holiday is 'flexible' but shop owner said it's open all 7 days.", "open");
    db.prepare("INSERT INTO reports (job_id,employer_id,reporter_id,type,details,status,resolution,created_at) VALUES (?,?,?,?,?,?,?,datetime('now','-9 days'))")
      .run(jobIds[2], empIds[1], c1, "other", "Wanted to confirm the dorm location.", "resolved", "Confirmed with employer; address added to listing.");
    void a1; void a5;

    // Hindi versions written by two employers
    db.prepare("UPDATE jobs SET description_hi=?, responsibilities_hi=?, learning_notes_hi=? WHERE id=?").run(
      "हमारे शोरूम में ट्रेनी के रूप में जुड़ें। शुरुआत ग्राहकों की मदद से होगी और धीरे-धीरे पूरा शोरूम चलाना सीखेंगे।",
      "ग्राहकों का स्वागत और मदद, कपड़े तह करना और सजाना, बिलिंग काउंटर पर मदद, ट्रायल रूम साफ़ रखना, साइज़ और सामान की जानकारी सीखना।",
      "6 महीने बाद ट्रेनी स्टॉक गिनती में मदद करते हैं; 12 महीने बाद सप्लायर से मिलते समय ख़रीद मैनेजर के साथ बैठते हैं। हर कोई ख़रीद में नहीं जाता — यह मेहनत और जगह पर निर्भर है।",
      jobIds[0]);
    db.prepare("UPDATE jobs SET description_hi=?, responsibilities_hi=? WHERE id=?").run(
      "बड़े गारमेंट थोक व्यापारी की गोदाम और डिस्पैच टीम में काम।",
      "कपड़े की गाँठें लेना और जाँचना, स्टॉक जमाना, ऑर्डर पैक करना, ट्रांसपोर्ट वालों से तालमेल।",
      jobIds[2]);

    // fields added by later migrations
    const users = db.prepare("SELECT id, phone FROM users WHERE phone IS NOT NULL").all() as { id: number; phone: string }[];
    for (const u of users) db.prepare("UPDATE users SET phone_norm=? WHERE id=?").run(normalizePhone(u.phone), u.id);
    db.prepare("UPDATE jobs SET expires_at = datetime(created_at, '+30 days') WHERE expires_at IS NULL").run();
    db.prepare("UPDATE employers SET gst_norm = gst_number WHERE gst_number IS NOT NULL").run();
    // Mahendra and Pooja chose to share their numbers; Ravi talks through chat only
    db.prepare("UPDATE applications SET share_phone = 1 WHERE candidate_id IN (?, ?)").run(c1, c3);
    db.prepare("UPDATE candidate_profiles SET searchable = 1 WHERE user_id IN (?, ?)").run(c1, c3);
    // a conversation so the inbox isn't empty in the demo
    db.prepare("INSERT INTO messages (application_id, sender_id, body, created_at) VALUES (?,?,?,datetime('now','-1 days'))").run(a1, c1, "I helped in my father's shop and want to learn the business properly.");
    db.prepare("INSERT INTO messages (application_id, sender_id, body, created_at) VALUES (?,?,?,datetime('now','-20 hours'))").run(a1, (db.prepare("SELECT user_id FROM employers WHERE id=?").get(empIds[0]) as { user_id: number }).user_id, "Namaste Mahendra. Can you come for a video interview on Saturday at 11?");
    db.prepare("INSERT INTO messages (application_id, sender_id, body, kind, created_at) VALUES (?,NULL,'status:interview','system',datetime('now','-20 hours'))").run(a1);
    // Pooja joined the furniture showroom 40 days ago — the 30-day check-in is due
    db.prepare("UPDATE applications SET status='joined', joined_at=date('now','-40 days') WHERE id=?").run(a5);
    db.prepare("INSERT INTO job_alerts (user_id, label, industry, city) VALUES (?, 'Men’s clothing in Surat', 'menswear', 'Surat')").run(c1);
    // a few days of listing views for the analytics panels
    const viewStmt = db.prepare("INSERT OR IGNORE INTO job_views (job_id, day, views) VALUES (?, date('now', ?), ?)");
    jobIds.forEach((jid, i) => { for (let d = 0; d < 14; d++) viewStmt.run(jid, `-${d} days`, ((jid * 7 + d * 3 + i) % 9) + (d < 3 ? 4 : 1)); });
  });
  tx();
}
