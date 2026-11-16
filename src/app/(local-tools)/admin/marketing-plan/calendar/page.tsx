import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { VideoMarketingCalendar } from "@/components/admin/video-marketing-calendar";
import { requireAdmin } from "@/lib/auth/session";
import { isLoopbackHost, isVideoLabLocalAccessEnabled } from "@/lib/auth/video-lab-local-access";

export default async function AdminVideoMarketingCalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (process.env.ENABLE_VIDEO_LAB !== "true") notFound();
  const params = await searchParams;
  const handoff = typeof params.handoff === "string" ? params.handoff : null;
  const sample = params.sample === "sushi";
  const requestHeaders = await headers();
  const requestHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const localAccess = isVideoLabLocalAccessEnabled() && isLoopbackHost(requestHost);
  if (!localAccess) await requireAdmin();
  return handoff || sample ? <VideoMarketingCalendar handoffId={handoff ?? "demo-sushi-marketing-week-2026-11"} sample={sample} /> : <main className="mx-auto max-w-3xl px-4 py-12"><p className="rounded-xl border bg-card p-6 text-sm">找不到计划结果，请从营销计划设置页进入。</p></main>;
}
