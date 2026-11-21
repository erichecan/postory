import "server-only";
import { prisma } from "@/lib/db/client";

export const isContentShopId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-z0-9]{10,40}$/.test(value);

export async function ownedContentShop(ownerId: string, shopId: string) {
  if (!isContentShopId(shopId)) return null;
  return prisma.contentBrandShop.findFirst({where:{id:shopId,ownerId}});
}
