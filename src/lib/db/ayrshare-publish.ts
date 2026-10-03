import "server-only";
import { getAyrshareGateway, type PublishResult } from "@/lib/ayrshare";
import { getAyrshareProfileKey } from "@/lib/db/social";
import type { PublishPlatformId } from "@/lib/platforms";

export type PublishOutcome = {
  publishStatus: PublishResult["overallStatus"];
  publishError: string | null;
  ayrsharePostId: string | undefined;
};

// 从 scheduleDesignAction 里抽出来的真实发布逻辑，不动行为，只是让 WhatsApp
// 审核通过后的 cron 也能复用同一条经过生产验证的路径，而不是另写一遍。
export async function publishDesignToAyrshare(input: {
  userId: string;
  caption: string;
  mediaUrl: string;
  platforms: PublishPlatformId[];
  scheduledAt: Date;
}): Promise<PublishOutcome> {
  try {
    const profileKey = await getAyrshareProfileKey(input.userId);
    if (!profileKey) throw new Error("no ayrshare profile on file");
    const result = await getAyrshareGateway().publish({
      profileKey,
      caption: input.caption,
      mediaUrl: input.mediaUrl,
      platforms: input.platforms,
      scheduleDate: input.scheduledAt,
    });
    const publishError =
      result.overallStatus === "SUCCESS"
        ? null
        : result.perPlatform
            .filter((p) => p.status === "error")
            .map((p) => `${p.platform}: ${p.error ?? "error"}`)
            .join("; ");
    return { publishStatus: result.overallStatus, publishError, ayrsharePostId: result.postId };
  } catch (err) {
    return { publishStatus: "FAILED", publishError: err instanceof Error ? err.message : "unknown", ayrsharePostId: undefined };
  }
}
