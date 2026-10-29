import { getDb } from "../lib/db";
import { seed } from "../lib/seed";

const db = getDb();
db.exec(`DELETE FROM messages; DELETE FROM notifications; DELETE FROM invitations; DELETE FROM experience_letters; DELETE FROM job_alerts;
DELETE FROM job_views; DELETE FROM events; DELETE FROM rate_limits; DELETE FROM audit_log; DELETE FROM kv WHERE key != 'app_secret';
DELETE FROM feedback; DELETE FROM reports; DELETE FROM saved_jobs; DELETE FROM applications;
DELETE FROM jobs; DELETE FROM employers; DELETE FROM candidate_profiles; DELETE FROM users;`);
seed();
console.log("Seeded demo data.");
