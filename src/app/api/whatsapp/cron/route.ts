import type { NextRequest } from "next/server";
import { autoApproveDueRequests } from "@/lib/db/approval";

// 给 Cloud Scheduler / 本地定时任务调用，不对外登录态开放，靠一个只有运维知道的密钥，
// 和用户账号体系完全无关——这类"内部机器调用"的路由不应该挂在普通鉴权上。
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("Authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const result = await autoApproveDueRequests();
  return Response.json({ ok: true, ...result });
}
