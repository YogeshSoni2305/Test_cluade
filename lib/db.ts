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

/**
 * Forward-only migrations. Each entry runs once, in order, tracked by PRAGMA user_version.
 * Never edit a shipped migration — append a new one.
 */
const MIGRATIONS: ((db: Database.Database) => void)[] = [
  // 1 — trust & safety, messaging, alerts, letters, analytics
  (db) => {
    db.exec(`
      ALTER TABLE users ADD COLUMN phone_norm TEXT;
      ALTER TABLE users ADD COLUMN suspended INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN suspended_reason TEXT;
      ALTER TABLE users ADD COLUMN admin_role TEXT;
      ALTER TABLE users ADD COLUMN lang TEXT NOT NULL DEFAULT 'en';
      ALTER TABLE users ADD COLUMN notify_whatsapp INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE users ADD COLUMN notify_sms INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN last_seen_at TEXT;
      CREATE INDEX IF NOT EXISTS idx_users_phone_norm ON users(phone_norm);

      ALTER TABLE candidate_profiles ADD COLUMN searchable INTEGER NOT NULL DEFAULT 0;

      ALTER TABLE employers ADD COLUMN gst_norm TEXT;
      ALTER TABLE employers ADD COLUMN flagged_reason TEXT;

      ALTER TABLE jobs ADD COLUMN expires_at TEXT;
      ALTER TABLE jobs ADD COLUMN expiry_reminded INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE jobs ADD COLUMN flagged_reason TEXT;
      ALTER TABLE jobs ADD COLUMN description_hi TEXT NOT NULL DEFAULT '';
      ALTER TABLE jobs ADD COLUMN responsibilities_hi TEXT NOT NULL DEFAULT '';
      ALTER TABLE jobs ADD COLUMN learning_notes_hi TEXT NOT NULL DEFAULT '';
      UPDATE jobs SET expires_at = datetime(created_at, '+30 days') WHERE expires_at IS NULL;

      ALTER TABLE applications ADD COLUMN share_phone INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE applications ADD COLUMN source TEXT NOT NULL DEFAULT 'direct';
      ALTER TABLE applications ADD COLUMN joined_at TEXT;
      ALTER TABLE applications ADD COLUMN left_at TEXT;
      ALTER TABLE applications ADD COLUMN blocked_by INTEGER;
      -- applications made before chat existed shared the phone number on apply
      UPDATE applications SET share_phone = 1;

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        body TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'text',
        flagged TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        read_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_messages_app ON messages(application_id, id);

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL DEFAULT '',
        link TEXT,
        channels TEXT NOT NULL DEFAULT 'in_app',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        read_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);

      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        actor_name TEXT,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id INTEGER,
        details TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity, entity_id);

      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT NOT NULL,
        window_start INTEGER NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (key, window_start)
      );

      CREATE TABLE IF NOT EXISTS job_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        label TEXT NOT NULL DEFAULT '',
        q TEXT NOT NULL DEFAULT '',
        industry TEXT NOT NULL DEFAULT '',
        city TEXT NOT NULL DEFAULT '',
        min_salary INTEGER NOT NULL DEFAULT 0,
        stay TEXT NOT NULL DEFAULT '',
        verified_only INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        last_matched_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS invitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        responded_at TEXT,
        UNIQUE (job_id, candidate_id)
      );

      CREATE TABLE IF NOT EXISTS experience_letters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        -- snapshot fields keep the letter valid even if the employer's account is later deleted
        application_id INTEGER UNIQUE REFERENCES applications(id) ON DELETE SET NULL,
        candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        candidate_name TEXT NOT NULL,
        candidate_district TEXT,
        business_name TEXT NOT NULL,
        business_city TEXT NOT NULL,
        owner_name TEXT NOT NULL DEFAULT '',
        employer_verified INTEGER NOT NULL DEFAULT 0,
        code TEXT NOT NULL UNIQUE,
        role_title TEXT NOT NULL,
        industry TEXT NOT NULL,
        from_date TEXT NOT NULL,
        to_date TEXT NOT NULL,
        skills TEXT NOT NULL DEFAULT '[]',
        remarks TEXT NOT NULL DEFAULT '',
        issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        issued_at TEXT NOT NULL DEFAULT (datetime('now')),
        revoked INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS job_views (
        job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        day TEXT NOT NULL,
        views INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (job_id, day)
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT NOT NULL DEFAULT (datetime('now')),
        session TEXT,
        user_id INTEGER,
        name TEXT NOT NULL,
        path TEXT,
        referrer TEXT,
        utm_source TEXT,
        props TEXT NOT NULL DEFAULT '{}'
      );
      CREATE INDEX IF NOT EXISTS idx_events_name_ts ON events(name, ts);

      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    // backfill normalised phones
    const rows = db.prepare("SELECT id, phone FROM users WHERE phone IS NOT NULL").all() as { id: number; phone: string }[];
    const upd = db.prepare("UPDATE users SET phone_norm = ? WHERE id = ?");
    for (const r of rows) upd.run(normalizePhone(r.phone), r.id);
  },
];

/** Normalise an Indian mobile number to +91XXXXXXXXXX; returns null if it isn't one. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length !== 10 || !/^[6-9]/.test(d)) return null;
  return "+91" + d;
}

export function migrate(db: Database.Database) {
  const current = db.pragma("user_version", { simple: true }) as number;
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      MIGRATIONS[v](db);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
}

export function getDb(): Database.Database {
  if (globalForDb.__db) return globalForDb.__db;
  const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  migrate(db);
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
