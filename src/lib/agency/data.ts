import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/auth/session";
import { getBrandProfile } from "@/lib/db/profiles";
import { listSocialAccounts } from "@/lib/db/social";
import { prisma } from "@/lib/db/client";
import type { AgencyData, Campaign, ContentItem } from "./types";
export const getAgencyData = cache(async (): Promise<AgencyData> => {
  const user = await requireUser();
  const [profile, accounts, designs] = await Promise.all([
    getBrandProfile(user.id),
    listSocialAccounts(user.id),
    prisma.design.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        exportedImageUrl: true,
        caption: true,
        platforms: true,
        scheduledAt: true,
        createdAt: true,
        status: true,
        publishStatus: true,
        calendarSlot: {
          select: {
            campaignTemplate: {
              select: { id: true, nameEn: true, captionAngle: true },
            },
            date: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 200,
    }),
  ]);
  const items: ContentItem[] = designs.map((d) => ({
    id: d.id,
    title: d.title,
    image: d.exportedImageUrl,
    caption: d.caption ?? undefined,
    platform: d.platforms[0] ?? "instagram",
    date: (d.scheduledAt ?? d.calendarSlot?.date ?? d.createdAt)
      .toISOString()
      .slice(0, 10),
    time: d.scheduledAt
      ? d.scheduledAt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "UTC",
        }) + " UTC"
      : "Not scheduled",
    category: d.calendarSlot?.campaignTemplate?.nameEn ?? "Content",
    status:
      d.publishStatus === "SUCCESS"
        ? "Published"
        : d.status === "SCHEDULED"
          ? "Scheduled"
          : "In Progress",
  }));
  const groups = new Map<string, Campaign>();
  for (let i = 0; i < designs.length; i++) {
    const d = designs[i],
      item = items[i];
    if (!d.calendarSlot?.campaignTemplate) continue;
    const template = d.calendarSlot.campaignTemplate;
    const month = item.date.slice(0, 7);
    const key = `${template.id}--${month}`;
    if (!groups.has(key)) {
      const start = `${month}-01`;
      const [y, m] = month.split("-").map(Number);
      const end = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      groups.set(key, {
        id: key,
        name: template.nameEn,
        description: template.captionAngle,
        start,
        end,
        cover: d.exportedImageUrl,
        status:
          today < start ? "Upcoming" : today > end ? "Completed" : "Active",
        items: [],
      });
    }
    groups.get(key)!.items.push(item);
  }
  return {
    demo: false,
    name: user.name,
    shop: profile?.shopName ?? "Your Business",
    profile,
    accounts: accounts.map((a) => ({
      platform: a.platform,
      handle: a.handle,
      connected: !!a.connectedAt,
    })),
    campaigns: [...groups.values()],
    items,
  };
});
