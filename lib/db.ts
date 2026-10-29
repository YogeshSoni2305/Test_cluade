import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const globalForDb = globalThis as unknown as { __db?: Database.Database };

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clerk_id TEXT UNIQUE,
  role TEXT CHECK (role IN ('candidate','employer','admin')),
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS candidate_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  district TEXT,
  education TEXT,
  languages TEXT NOT NULL DEFAULT '[]',
  experience TEXT NOT NULL DEFAULT '',
  industries TEXT NOT NULL DEFAULT '[]',
  cities TEXT NOT NULL DEFAULT '[]',
  relocate INTEGER NOT NULL DEFAULT 1,
  needs_accommodation INTEGER NOT NULL DEFAULT 1,
  goals TEXT NOT NULL DEFAULT '[]',
  learn_notes TEXT NOT NULL DEFAULT '',
  age INTEGER,
  family_name TEXT,
  family_phone TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS employers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL,
  business_type TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  years_in_business INTEGER,
  staff_count INTEGER,
  about TEXT NOT NULL DEFAULT '',
  gst_number TEXT,
  id_proof_note TEXT,
  origin_district TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unsubmitted'
    CHECK (verification_status IN ('unsubmitted','pending','verified','rejected')),
  verified_checks TEXT NOT NULL DEFAULT '[]',
  verification_note TEXT,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employer_id INTEGER NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  industry TEXT NOT NULL,
  city TEXT NOT NULL,
  locality TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  responsibilities TEXT NOT NULL DEFAULT '',
  salary_min INTEGER NOT NULL,
  salary_max INTEGER NOT NULL,
  salary_period TEXT NOT NULL DEFAULT 'month',
  hours TEXT NOT NULL DEFAULT '',
  weekly_holiday TEXT NOT NULL DEFAULT '',
  accommodation TEXT NOT NULL DEFAULT 'none',
  accommodation_cost INTEGER NOT NULL DEFAULT 0,
  accommodation_details TEXT NOT NULL DEFAULT '',
  accommodation_confirmed INTEGER NOT NULL DEFAULT 0,
  meals TEXT NOT NULL DEFAULT '',
  benefits TEXT NOT NULL DEFAULT '',
  deductions TEXT NOT NULL DEFAULT '',
  deposit_amount INTEGER NOT NULL DEFAULT 0,
  education_req TEXT NOT NULL DEFAULT 'any',
  experience_req TEXT NOT NULL DEFAULT 'fresher',
  languages TEXT NOT NULL DEFAULT '[]',
  skills_offered TEXT NOT NULL DEFAULT '[]',
  learning_notes TEXT NOT NULL DEFAULT '',
  learning_confirmed INTEGER NOT NULL DEFAULT 0,
  joining_date TEXT,
  openings INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','filled','closed','removed')),
  removed_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_employer ON jobs(employer_id);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'applied',
  employer_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (job_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS saved_jobs (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  employer_id INTEGER REFERENCES employers(id) ON DELETE SET NULL,
  reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','dismissed')),
  resolution TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_role TEXT NOT NULL CHECK (from_role IN ('candidate','employer')),
  checkpoint TEXT NOT NULL DEFAULT 'joined',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  terms_matched INTEGER,
  still_working INTEGER,
  comment TEXT NOT NULL DEFAULT '',
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (application_id, from_role, checkpoint)
);
`;

export function getDb(): Database.Database {
  if (globalForDb.__db) return globalForDb.__db;
  const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  globalForDb.__db = db;
  return db;
}

export function parseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
