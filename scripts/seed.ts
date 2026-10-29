import { getDb } from "../lib/db";
import { seed } from "../lib/seed";

const db = getDb();
db.exec(`DELETE FROM feedback; DELETE FROM reports; DELETE FROM saved_jobs; DELETE FROM applications;
DELETE FROM jobs; DELETE FROM employers; DELETE FROM candidate_profiles; DELETE FROM users;`);
seed();
console.log("Seeded demo data.");
