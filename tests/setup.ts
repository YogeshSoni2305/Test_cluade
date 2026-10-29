import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

// A fresh SQLite file per test file; lib/db.ts migrates it on first use.
process.env.DATABASE_PATH = path.join(os.tmpdir(), `rk-unit-${crypto.randomUUID()}.db`);
process.env.APP_SECRET = "test-secret";
process.env.SITE_URL = "https://example.test";
