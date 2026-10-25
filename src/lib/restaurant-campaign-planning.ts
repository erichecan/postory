export const restaurantSocialPlatforms = [
  { id: "instagram", label: "Instagram", weight: 2 },
  { id: "facebook", label: "Facebook", weight: 2 },
  { id: "tiktok", label: "TikTok", weight: 1 },
] as const;

export type RestaurantSocialPlatform = (typeof restaurantSocialPlatforms)[number]["id"];

export function getRestaurantPlatformDistribution(
  totalPosts: number,
  selectedPlatforms: readonly string[],
) {
  const selected = restaurantSocialPlatforms.filter((platform) => selectedPlatforms.includes(platform.id));
  if (!selected.length || totalPosts <= 0) return [];

  const totalWeight = selected.reduce((sum, platform) => sum + platform.weight, 0);
  const allocations = selected.map((platform, index) => {
    const exact = (totalPosts * platform.weight) / totalWeight;
    return { ...platform, count: Math.floor(exact), remainder: exact % 1, index };
  });
  let unassigned = totalPosts - allocations.reduce((sum, allocation) => sum + allocation.count, 0);
  for (const allocation of [...allocations].sort((a, b) => b.remainder - a.remainder || a.index - b.index)) {
    if (unassigned <= 0) break;
    allocation.count += 1;
    unassigned -= 1;
  }

  return allocations.map(({ id, label, count }) => ({ id, label, count }));
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
