import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, normalizePhone } from "./db";

export type Role = "candidate" | "employer" | "admin";
export type AdminRole = "super" | "verifier" | "moderator" | "analyst";
export type User = {
  id: number;
  clerk_id: string | null;
  role: Role | null;
  name: string;
  phone: string | null;
  phone_norm: string | null;
  email: string | null;
  suspended: number;
  suspended_reason: string | null;
  admin_role: AdminRole | null;
  lang: "en" | "hi";
  notify_whatsapp: number;
  notify_sms: number;
};

export type Permission = "view" | "export" | "verify" | "moderate" | "manage_users";
const PERMISSIONS: Record<AdminRole, Permission[]> = {
  super: ["view", "export", "verify", "moderate", "manage_users"],
  verifier: ["view", "verify"],
  moderator: ["view", "moderate"],
  analyst: ["view", "export"],
};
export const ADMIN_ROLES = Object.keys(PERMISSIONS) as AdminRole[];

export function adminRole(u: Pick<User, "role" | "admin_role"> | null): AdminRole | null {
  if (!u || u.role !== "admin") return null;
  return u.admin_role ?? "super";
}

export function can(u: Pick<User, "role" | "admin_role"> | null, p: Permission): boolean {
  const r = adminRole(u);
  return r ? PERMISSIONS[r].includes(p) : false;
}

const hasClerkKeys = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);
/** Auth bypass is on while AUTH_BYPASS=true or while Clerk keys are missing. */
export const BYPASS = process.env.AUTH_BYPASS === "true" || !hasClerkKeys;

export const DEV_COOKIE = "dev_uid";

export async function getCurrentUser(): Promise<User | null> {
  const db = getDb();
  if (BYPASS) {
    const c = await cookies();
    const id = Number(c.get(DEV_COOKIE)?.value);
    if (!id) return null;
    return (db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined) ?? null;
  }

  const { auth, currentUser } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) return null;
  const existing = db.prepare("SELECT * FROM users WHERE clerk_id = ?").get(userId) as User | undefined;
  if (existing) return existing;

  const cu = await currentUser();
  const email = cu?.primaryEmailAddress?.emailAddress ?? null;
  const phone = cu?.primaryPhoneNumber?.phoneNumber ?? null;
  const name = [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") || email || phone || "New user";
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const role: Role | null =
    (email && admins.includes(email.toLowerCase())) || cu?.publicMetadata?.role === "admin" ? "admin" : null;
  const info = db
    .prepare("INSERT INTO users (clerk_id, role, name, phone, phone_norm, email) VALUES (?,?,?,?,?,?)")
    .run(userId, role, name, phone, normalizePhone(phone), email);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid) as User;
}

/** Require a signed-in user; optionally require a specific role. */
export async function requireUser(role?: Role): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.suspended) redirect("/suspended");
  if (!user.role) redirect("/onboarding");
  if (role && user.role !== role && user.role !== "admin") redirect("/");
  if (role === "admin" && user.role !== "admin") redirect("/");
  return user;
}

/** Require an admin who holds a specific permission. */
export async function requireAdmin(p: Permission = "view"): Promise<User> {
  const user = await requireUser("admin");
  if (!can(user, p)) redirect("/admin?denied=1");
  return user;
}
