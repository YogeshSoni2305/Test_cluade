"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { BYPASS, DEV_COOKIE, requireUser } from "@/lib/auth";
import { s, bool, fail } from "@/lib/form";
import { deleteUserData } from "@/lib/account";
import { audit } from "@/lib/audit";

export async function saveAccountSettings(fd: FormData) {
  const user = await requireUser();
  const lang = s(fd, "lang") === "hi" ? "hi" : "en";
  const db = getDb();
  db.prepare("UPDATE users SET lang=?, notify_whatsapp=?, notify_sms=? WHERE id=?")
    .run(lang, bool(fd, "notify_whatsapp") ? 1 : 0, bool(fd, "notify_sms") ? 1 : 0, user.id);
  if (user.role === "candidate") {
    db.prepare("UPDATE candidate_profiles SET searchable=? WHERE user_id=?").run(bool(fd, "searchable") ? 1 : 0, user.id);
  }
  (await cookies()).set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  redirect("/account?saved=1");
}

export async function deleteAccount(fd: FormData) {
  const user = await requireUser();
  const confirm = s(fd, "confirm").toUpperCase();
  if (confirm !== "DELETE" && s(fd, "confirm") !== "हटाएँ") fail("/account#delete", "Type DELETE to confirm.");
  if (user.role === "admin") {
    const others = (getDb().prepare("SELECT COUNT(*) n FROM users WHERE role='admin' AND COALESCE(admin_role,'super')='super' AND id != ?").get(user.id) as { n: number }).n;
    if (!others && (user.admin_role ?? "super") === "super") fail("/account#delete", "You are the last super admin. Make someone else a super admin first.");
  }
  audit({ id: user.id, name: user.name }, "account.delete", "user", user.id, { role: user.role, reason: s(fd, "reason").slice(0, 200) });
  if (!BYPASS && user.clerk_id) {
    const { clerkClient } = await import("@clerk/nextjs/server");
    try {
      await (await clerkClient()).users.deleteUser(user.clerk_id);
    } catch {
      fail("/account#delete", "We couldn’t delete your sign-in account right now. Please try again.");
    }
  }
  deleteUserData(user.id);
  (await cookies()).delete(DEV_COOKIE);
  redirect("/?deleted=1");
}
