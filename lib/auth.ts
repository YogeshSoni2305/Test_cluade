import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";

export type Role = "candidate" | "employer" | "admin";
export type User = {
  id: number;
  clerk_id: string | null;
  role: Role | null;
  name: string;
  phone: string | null;
  email: string | null;
};

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
    .prepare("INSERT INTO users (clerk_id, role, name, phone, email) VALUES (?,?,?,?,?)")
    .run(userId, role, name, phone, email);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid) as User;
}

/** Require a signed-in user; optionally require a specific role. */
export async function requireUser(role?: Role): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.role) redirect("/onboarding");
  if (role && user.role !== role && user.role !== "admin") redirect("/");
  if (role === "admin" && user.role !== "admin") redirect("/");
  return user;
}
