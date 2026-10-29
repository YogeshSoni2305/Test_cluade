import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

/** Marks a notification read, then forwards to its link. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/sign-in", req.url));
  const n = getDb().prepare("SELECT link FROM notifications WHERE id=? AND user_id=?").get(Number(id), user.id) as { link: string | null } | undefined;
  if (n) getDb().prepare("UPDATE notifications SET read_at=COALESCE(read_at, datetime('now')) WHERE id=?").run(Number(id));
  const target = n?.link && n.link.startsWith("/") && !n.link.startsWith("//") ? n.link : "/notifications";
  return NextResponse.redirect(new URL(target, req.url), 303);
}
