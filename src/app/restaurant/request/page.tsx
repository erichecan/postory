import { RestaurantBriefForm } from "@/components/restaurant/restaurant-brief-form";
import { RestaurantRequestBackLink } from "@/components/restaurant/restaurant-request-back-link";
import { getTranslations } from "next-intl/server";

export default async function RestaurantRequestPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const t = await getTranslations("restaurantRequest.page");
  const { ref = "" } = await searchParams;
  const referral = /^[A-Za-z0-9_.-]{1,256}$/.test(ref) ? ref : "";
  return <main className="w-full flex-1 bg-background px-4 py-10"><div className="mx-auto mb-7 max-w-6xl"><RestaurantRequestBackLink label={t("back")}/><p className="mt-5 text-sm font-semibold uppercase tracking-widest text-primary">{t("eyebrow")}</p><h1 className="mt-3 text-3xl font-semibold">{t("title")}</h1><p className="mt-2 text-muted-foreground">{t("description")}</p></div><RestaurantBriefForm referral={referral} /></main>;
}
