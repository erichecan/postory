import { getTranslations } from "next-intl/server";
import { PaymentResult } from "@/components/billing/payment-result";
import { requireUser } from "@/lib/auth/session";

export default async function PaymentCancelPage() {
  await requireUser();
  const t = await getTranslations("billing.result");
  return <PaymentResult tone="cancel" title={t("cancelTitle")} body={t("cancelBody")} primary={{ href: "/membership", label: t("backToMembership") }} />;
}
