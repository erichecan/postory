export type FeatureValue = boolean | number | "custom" | "addon" | "all";

export const FEATURE_GROUPS = [
  { id: "quota", features: [{ id: "monthlyCredits", unit: "images" }, { id: "monthlyVideos", unit: "videos" }, { id: "topup" }] },
  { id: "platforms", features: [{ id: "basePlatforms" }, { id: "extraPlatforms" }, { id: "schedule" }] },
  { id: "create", features: [{ id: "templates" }, { id: "aiImages" }, { id: "multiRound" }, { id: "brandFill" }] },
  { id: "service", features: [{ id: "prioritySupport" }, { id: "dedicatedDesigner" }, { id: "contentPlanning" }] },
] as const;

export type FeatureId = (typeof FEATURE_GROUPS)[number]["features"][number]["id"];
export type FeatureUnit = "images" | "videos";
export type TierFeatures = Record<FeatureId, FeatureValue>;

export const FEATURE_IDS: FeatureId[] = FEATURE_GROUPS.flatMap((g) => g.features.map((f): FeatureId => f.id));
