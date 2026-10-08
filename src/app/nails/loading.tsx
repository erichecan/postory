import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("nails");
  return <div className="nails-main" role="status"><p className="py-16 text-center text-sm text-muted-foreground">{t("loading")}</p></div>;
}
