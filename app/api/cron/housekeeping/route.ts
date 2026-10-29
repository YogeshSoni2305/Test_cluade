import { NextResponse, type NextRequest } from "next/server";
import { runHousekeeping } from "@/lib/housekeeping";

/** For an external scheduler (cron, Vercel Cron, GitHub Actions). Requires `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.json(runHousekeeping());
}
