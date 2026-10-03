import type { NextRequest } from "next/server";
import { runDailyOutreachScan } from "@/lib/db/outreach";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("Authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const result = await runDailyOutreachScan();
  return Response.json({ ok: true, ...result });
}
