"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { s, int, fail, safeNext, withParam } from "@/lib/form";
import { checkLimit } from "@/lib/ratelimit";
import { describeAlert } from "@/lib/alerts";
import { INDUSTRIES, CITIES } from "@/lib/constants";
import { track } from "@/lib/analytics";

export async function createAlert(fd: FormData) {
  const user = await requireUser("candidate");
  const back = safeNext(s(fd, "next"), "/jobs");
  const limited = await checkLimit("alert", user.id);
  if (limited) fail(back, limited);
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) n FROM job_alerts WHERE user_id=? AND active=1").get(user.id) as { n: number }).n;
  if (count >= 10) fail(back, "You can keep up to 10 active alerts. Remove one first.");
  const a = {
    q: s(fd, "q").slice(0, 60),
    industry: INDUSTRIES.some((i) => i.id === s(fd, "industry")) ? s(fd, "industry") : "",
    city: CITIES.includes(s(fd, "city")) ? s(fd, "city") : "",
    min_salary: Math.max(0, int(fd, "minSalary")),
    stay: ["yes", "free"].includes(s(fd, "stay")) ? s(fd, "stay") : "",
    verified_only: s(fd, "verified") === "1" ? 1 : 0,
  };
  const dupe = db.prepare("SELECT 1 FROM job_alerts WHERE user_id=? AND active=1 AND q=? AND industry=? AND city=? AND min_salary=? AND stay=? AND verified_only=?")
    .get(user.id, a.q, a.industry, a.city, a.min_salary, a.stay, a.verified_only);
  if (!dupe) {
    db.prepare("INSERT INTO job_alerts (user_id, label, q, industry, city, min_salary, stay, verified_only) VALUES (?,?,?,?,?,?,?,?)")
      .run(user.id, describeAlert(a), a.q, a.industry, a.city, a.min_salary, a.stay, a.verified_only);
    track("alert_created", { industry: a.industry, city: a.city }, { userId: user.id });
  }
  redirect(withParam(back, "alert", "1"));
}

export async function updateAlert(fd: FormData) {
  const user = await requireUser("candidate");
  const id = int(fd, "alert_id");
  const op = s(fd, "op");
  const db = getDb();
  if (op === "delete") db.prepare("DELETE FROM job_alerts WHERE id=? AND user_id=?").run(id, user.id);
  if (op === "pause") db.prepare("UPDATE job_alerts SET active=0 WHERE id=? AND user_id=?").run(id, user.id);
  if (op === "resume") db.prepare("UPDATE job_alerts SET active=1 WHERE id=? AND user_id=?").run(id, user.id);
  redirect("/candidate/alerts");
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  getDb().prepare("UPDATE notifications SET read_at=datetime('now') WHERE user_id=? AND read_at IS NULL").run(user.id);
  redirect("/notifications");
}
