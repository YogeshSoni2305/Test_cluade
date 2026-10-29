import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const hasKeys = Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const bypass = process.env.AUTH_BYPASS === "true" || !hasKeys;

const isProtected = createRouteMatcher(["/candidate(.*)", "/admin(.*)", "/feedback(.*)", "/onboarding(.*)", "/messages(.*)", "/notifications(.*)", "/account(.*)"]);
// /employer is public (landing for employers); sub-pages require sign-in
const isEmployerPrivate = createRouteMatcher(["/employer/(.+)"]);

const clerk = clerkMiddleware(async (auth, req) => {
  if (isProtected(req) || isEmployerPrivate(req)) await auth.protect();
});

export default function proxy(req: NextRequest, ev: Parameters<typeof clerk>[1]) {
  // Auth bypass: no Clerk involvement at all, demo cookie auth is handled in lib/auth.ts
  if (bypass) return NextResponse.next();
  return clerk(req, ev);
}

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
