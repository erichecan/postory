import "server-only";
import type Stripe from "stripe";
import type { PlanStatus } from "@/generated/prisma/client";
import {
  claimSubscription,
  grantTopup,
  isEventProcessed,
  markEventProcessed,
  recordInvoicePaid,
  resolveStripeUser,
  revokeTopup,
  setStatusBySubscription,
  type SubscriptionClaim,
} from "@/lib/db/stripe-billing";
import { getStripeGateway } from "./stripe-gateway";
import { MAX_TOPUP_CREDITS, MIN_TOPUP_CREDITS } from "./plan-math";

const idOf = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : (v?.id ?? null));
const fromUnix = (s: number) => new Date(s * 1000);

const SUBSCRIPTION_STATUS: Partial<Record<Stripe.Subscription.Status, PlanStatus>> = {
  active: "ACTIVE",
  trialing: "ACTIVE",
  past_due: "PAST_DUE",
  unpaid: "PAST_DUE",
  canceled: "CANCELED",
  incomplete_expired: "CANCELED",
};

async function settleClaim(claim: SubscriptionClaim, userId: string, subscriptionId: string): Promise<"processed" | "ignored"> {
  if (claim === "claimed") return "processed";
  if (claim === "duplicate") {
    console.error(`[stripe] duplicate subscription ${subscriptionId} for user ${userId}: canceling it; refund its first invoice manually`);
    await getStripeGateway()
      .cancelSubscription(subscriptionId)
      .catch((err: unknown) => console.error(`[stripe] cancel duplicate ${subscriptionId} failed`, err));
  }
  return "ignored";
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = await resolveStripeUser({ userId: session.metadata?.userId ?? session.client_reference_id, customerId: idOf(session.customer) });
  if (!userId) return "ignored";
  if (session.mode === "subscription") {
    const subscriptionId = idOf(session.subscription);
    if (!subscriptionId) return "ignored";
    return settleClaim(await claimSubscription(userId, subscriptionId), userId, subscriptionId);
  }
  if (session.mode === "payment" && session.metadata?.kind === "topup" && session.payment_status === "paid") {
    const credits = Number(session.metadata.credits);
    const paymentId = idOf(session.payment_intent) ?? session.id;
    if (!Number.isInteger(credits) || credits < MIN_TOPUP_CREDITS || credits > MAX_TOPUP_CREDITS) return "ignored";
    await grantTopup(userId, paymentId, credits);
    return "processed";
  }
  return "ignored";
}

async function onInvoicePaid(invoice: Stripe.Invoice) {
  const details = invoice.parent?.subscription_details;
  const subscriptionId = idOf(details?.subscription);
  if (!subscriptionId || !invoice.id) return "ignored";
  const userId = await resolveStripeUser({ subscriptionId, customerId: idOf(invoice.customer), userId: details?.metadata?.userId });
  if (!userId) return "ignored";
  const period = invoice.lines.data.find((l) => l.period)?.period ?? { start: invoice.period_start, end: invoice.period_end };
  const claim = await recordInvoicePaid(userId, { id: invoice.id, subscriptionId, periodStart: fromUnix(period.start), periodEnd: fromUnix(period.end) });
  return settleClaim(claim, userId, subscriptionId);
}

async function onInvoiceFailed(invoice: Stripe.Invoice) {
  const subscriptionId = idOf(invoice.parent?.subscription_details?.subscription);
  return subscriptionId && (await setStatusBySubscription(subscriptionId, "PAST_DUE")) ? "processed" : "ignored";
}

async function onSubscriptionChanged(sub: Stripe.Subscription, deleted: boolean) {
  const status = deleted ? "CANCELED" : SUBSCRIPTION_STATUS[sub.status];
  if (!status) return "ignored";
  const end = sub.items.data[0]?.current_period_end;
  return (await setStatusBySubscription(sub.id, status, end ? fromUnix(end) : undefined)) ? "processed" : "ignored";
}

async function onChargeRefunded(charge: Stripe.Charge) {
  const paymentId = idOf(charge.payment_intent);
  if (!paymentId || !charge.refunded) return "ignored";
  return (await revokeTopup(paymentId)) > 0 ? "processed" : "ignored";
}

async function dispatch(event: Stripe.Event): Promise<"processed" | "ignored"> {
  switch (event.type) {
    case "checkout.session.completed":
      return onCheckoutCompleted(event.data.object);
    case "invoice.paid":
      return onInvoicePaid(event.data.object);
    case "invoice.payment_failed":
      return onInvoiceFailed(event.data.object);
    case "customer.subscription.updated":
      return onSubscriptionChanged(event.data.object, false);
    case "customer.subscription.deleted":
      return onSubscriptionChanged(event.data.object, true);
    case "charge.refunded":
      return onChargeRefunded(event.data.object);
    default:
      return "ignored";
  }
}

export async function handleStripeEvent(event: Stripe.Event): Promise<"processed" | "ignored" | "duplicate"> {
  if (await isEventProcessed(event.id)) return "duplicate";
  const result = await dispatch(event);
  await markEventProcessed(event.id, event.type);
  return result;
}
