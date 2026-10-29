"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { ADMIN_ROLES, requireAdmin, type AdminRole } from "@/lib/auth";
import { s, int, fail, safeNext, withParam } from "@/lib/form";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";

export async function adminSuspendUser(fd: FormData) {
  const admin = await requireAdmin("moderate");
  const id = int(fd, "user_id");
  const back = safeNext(s(fd, "next"), "/admin/users");
  if (id === admin.id) fail(back, "You can’t suspend yourself.");
  const target = getDb().prepare("SELECT role, admin_role FROM users WHERE id=?").get(id) as { role: string; admin_role: string | null } | undefined;
  if (!target) redirect(back);
  if (target!.role === "admin" && (admin.admin_role ?? "super") !== "super") fail(back, "Only a super admin can suspend another admin.");
  const suspend = s(fd, "op") === "suspend";
  const reason = s(fd, "reason").slice(0, 300);
  if (suspend && reason.length < 5) fail(back, "Give a reason (shown to the user).");
  getDb().prepare("UPDATE users SET suspended=?, suspended_reason=? WHERE id=?").run(suspend ? 1 : 0, suspend ? reason : null, id);
  if (suspend) {
    // hide a suspended employer's listings while suspended
    getDb().prepare("UPDATE jobs SET status='closed', updated_at=datetime('now') WHERE status='open' AND employer_id IN (SELECT id FROM employers WHERE user_id=?)").run(id);
  } else {
    notify(id, { kind: "account", en: { title: "Your account has been restored" }, hi: { title: "आपका खाता फिर से चालू है" }, link: "/" });
  }
  audit({ id: admin.id, name: admin.name }, suspend ? "user.suspend" : "user.unsuspend", "user", id, { reason });
  redirect(withParam(back, "done", "1"));
}

export async function adminSetRole(fd: FormData) {
  const admin = await requireAdmin("manage_users");
  const id = int(fd, "user_id");
  const role = s(fd, "admin_role");
  const back = safeNext(s(fd, "next"), "/admin/users");
  const db = getDb();
  const target = db.prepare("SELECT role, COALESCE(admin_role,'super') ar FROM users WHERE id=?").get(id) as { role: string; ar: string } | undefined;
  if (!target) redirect(back);
  if (role === "none") {
    if (target!.role !== "admin") redirect(back);
    if (id === admin.id) fail(back, "You can’t remove your own admin access.");
    const supers = (db.prepare("SELECT COUNT(*) n FROM users WHERE role='admin' AND COALESCE(admin_role,'super')='super' AND id != ?").get(id) as { n: number }).n;
    if (target!.ar === "super" && !supers) fail(back, "There must be at least one super admin.");
    db.prepare("UPDATE users SET role='candidate', admin_role=NULL WHERE id=?").run(id);
  } else {
    if (!ADMIN_ROLES.includes(role as AdminRole)) fail(back, "Unknown role.");
    if (target!.role !== "admin" && target!.role !== null) fail(back, "Only staff accounts can be given admin roles. Create a separate account for staff.");
    if (id === admin.id && role !== "super") {
      const supers = (db.prepare("SELECT COUNT(*) n FROM users WHERE role='admin' AND COALESCE(admin_role,'super')='super' AND id != ?").get(id) as { n: number }).n;
      if (!supers) fail(back, "There must be at least one super admin.");
    }
    db.prepare("UPDATE users SET role='admin', admin_role=? WHERE id=?").run(role, id);
  }
  audit({ id: admin.id, name: admin.name }, "user.set_admin_role", "user", id, { role });
  redirect(withParam(back, "done", "1"));
}
