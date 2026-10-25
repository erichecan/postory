export const restaurantSocialPlatforms = [
  { id: "instagram", label: "Instagram", weight: 2 },
  { id: "facebook", label: "Facebook", weight: 2 },
  { id: "tiktok", label: "TikTok", weight: 1 },
] as const;

export type RestaurantSocialPlatform = (typeof restaurantSocialPlatforms)[number]["id"];

const tiktokVideoCountByPackage: Record<number, number> = { 20: 4, 30: 8 };

function allocateByWeight(totalPosts: number, platforms: typeof restaurantSocialPlatforms[number][]) {
  if (!platforms.length) return new Map<RestaurantSocialPlatform, number>();
  const totalWeight = platforms.reduce((sum, platform) => sum + platform.weight, 0);
  const allocations = platforms.map((platform, index) => {
    const exact = (totalPosts * platform.weight) / totalWeight;
    return { ...platform, count: Math.floor(exact), remainder: exact % 1, index };
  });
  let unassigned = totalPosts - allocations.reduce((sum, allocation) => sum + allocation.count, 0);
  for (const allocation of [...allocations].sort((a, b) => b.remainder - a.remainder || a.index - b.index)) {
    if (unassigned <= 0) break;
    allocation.count += 1;
    unassigned -= 1;
  }
  return new Map(allocations.map(({ id, count }) => [id, count]));
}

export function getRestaurantPlatformDistribution(
  totalPosts: number,
  selectedPlatforms: readonly string[],
) {
  const selected = restaurantSocialPlatforms.filter((platform) => selectedPlatforms.includes(platform.id));
  if (!selected.length || totalPosts <= 0) return [];
  const tiktok = selected.find((platform) => platform.id === "tiktok");
  const feedPlatforms = selected.filter((platform) => platform.id !== "tiktok");
  const tiktokCount = tiktok ? Math.min(tiktokVideoCountByPackage[totalPosts] ?? Math.round(totalPosts * 0.267), totalPosts) : 0;
  const feedAllocations = allocateByWeight(totalPosts - tiktokCount, feedPlatforms);
  return selected.map(({ id, label }) => ({ id, label, count: id === "tiktok" ? tiktokCount : feedAllocations.get(id) ?? 0 }));
}

export function getRestaurantPlatformSequence(
  totalPosts: number,
  selectedPlatforms: readonly string[],
): RestaurantSocialPlatform[] {
  return getRestaurantPlatformDistribution(totalPosts, selectedPlatforms)
    .flatMap(({ id, count }) => Array.from({ length: count }, (_, index) => ({
      id,
      position: (index + 0.5) / count,
    })))
    .sort((a, b) => a.position - b.position)
    .map(({ id }) => id as RestaurantSocialPlatform);
}
