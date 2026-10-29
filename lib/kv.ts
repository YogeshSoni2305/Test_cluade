import crypto from "node:crypto";
import { getDb } from "./db";

export function kvGet(key: string): string | null {
  const r = getDb().prepare("SELECT value FROM kv WHERE key = ?").get(key) as { value: string } | undefined;
  return r?.value ?? null;
}

export function kvSet(key: string, value: string) {
  getDb()
    .prepare("INSERT INTO kv (key, value, updated_at) VALUES (?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at")
    .run(key, value);
}

/** Server secret for signing tokens: APP_SECRET, or a random one persisted on first use. */
export function appSecret(): string {
  if (process.env.APP_SECRET) return process.env.APP_SECRET;
  let s = kvGet("app_secret");
  if (!s) {
    s = crypto.randomBytes(32).toString("hex");
    kvSet("app_secret", s);
  }
  return s;
}
