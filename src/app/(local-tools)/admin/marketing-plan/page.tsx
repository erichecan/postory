import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { VideoMarketingPlanner } from "@/components/admin/video-marketing-planner";
import { requireAdmin } from "@/lib/auth/session";
import { isLoopbackHost, isVideoLabLocalAccessEnabled } from "@/lib/auth/video-lab-local-access";

export default async function AdminVideoMarketingPlanPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (process.env.ENABLE_VIDEO_LAB !== "true") notFound();
  const params = await searchParams;
  const handoff = typeof params.handoff === "string" ? params.handoff : null;
  const requestHeaders = await headers();
  const requestHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const localAccess = isVideoLabLocalAccessEnabled() && isLoopbackHost(requestHost);
  if (!localAccess) await requireAdmin();
  return handoff ? <VideoMarketingPlanner handoffId={handoff} /> : <main className="mx-auto max-w-3xl px-4 py-12"><p className="rounded-xl border bg-card p-6 text-sm">营销计划没有对应的识别结果，请从视频识别结果页进入。</p></main>;
}
