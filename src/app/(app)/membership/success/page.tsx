import { getTranslations } from "next-intl/server";
import { PaymentResult } from "@/components/billing/payment-result";
import { requireUser } from "@/lib/auth/session";
import { getCustomerPlanRow } from "@/lib/db/stripe-billing";

export default async function PaymentSuccessPage({ searchParams }: PageProps<"/membership/success">) {
  const user = await requireUser();
  const { topup } = await searchParams;
  const [t, plan] = await Promise.all([getTranslations("billing.result"), getCustomerPlanRow(user.id)]);
  const back = { href: "/membership", label: t("backToMembership") };
  const credits = typeof topup === "string" ? Number.parseInt(topup, 10) : NaN;

  if (Number.isInteger(credits) && credits > 0) {
    return <PaymentResult tone="success" title={t("successTitle")} body={t("successTopup", { count: credits })} primary={back} />;
  }
  if (plan?.status === "ACTIVE") {
    return <PaymentResult tone="success" title={t("active")} body={t("activeBody")} primary={back} />;
  }
  return <PaymentResult tone="pending" title={t("pending")} body={`${t("successSubscription")} ${t("pendingHint")}`} primary={{ href: "/membership/success", label: t("refresh") }} secondary={back} />;
}
