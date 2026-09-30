"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { appUrl } from "@/lib/app-url";
import { assertUser } from "@/lib/auth/session";
import { MAX_TOPUP_CREDITS, MIN_TOPUP_CREDITS, subscriptionLines } from "@/lib/billing/plan-math";
import { getStripeGateway } from "@/lib/billing/stripe-gateway";
import { chargeDesign, getEntitlements } from "@/lib/db/entitlements";
import { getCustomerPlanRow, getStripeCustomerId, saveStripeCustomerId } from "@/lib/db/stripe-billing";
import { DEMO_PHONE } from "@/lib/demo";

export type ChargeOutcome =
  | { ok: true; charged: number; duplicate: boolean }
  | { ok: false; reason: "insufficient"; need: number; have: number; hasPlan: boolean }
  | { ok: false; reason: "notFound" };

export async function chargeDesignAction(designId: string): Promise<ChargeOutcome> {
  const user = await assertUser();
  const id = z.string().min(1).max(40).parse(designId);
  const result = await chargeDesign(user.id, id);
  if (!result.found) return { ok: false, reason: "notFound" };
  if (!result.ok) {
    const { hasActivePlan } = await getEntitlements(user.id);
    return { ok: false, reason: "insufficient", need: result.need, have: result.have, hasPlan: hasActivePlan };
  }
  if (!result.duplicate) revalidatePath("/", "layout");
  return { ok: true, charged: result.charged, duplicate: result.duplicate };
}

export type CheckoutFailure = { ok: false; error: string };

async function billingError(key: "demo" | "noPlan" | "alreadyActive" | "freePlan" | "invalidQuantity" | "noCustomer" | "stripeFailed"): Promise<CheckoutFailure> {
  const t = await getTranslations("billing.checkout");
  return { ok: false, error: t(key) };
}

async function ensureCustomer(user: { id: string; email: string | null; name: string }) {
  const existing = await getStripeCustomerId(user.id);
  if (existing) return existing;
  const created = await getStripeGateway().createCustomer({ userId: user.id, email: user.email, name: user.name });
  return saveStripeCustomerId(user.id, created);
}

async function toStripe(create: () => Promise<string>): Promise<CheckoutFailure> {
  let url: string;
  try {
    url = await create();
  } catch (err) {
    console.error("[stripe]", err);
    return billingError("stripeFailed");
  }
  redirect(url);
}

export async function startCheckoutAction(): Promise<CheckoutFailure> {
  const user = await assertUser();
  if (user.phone === DEMO_PHONE) return billingError("demo");
  const plan = await getCustomerPlanRow(user.id);
  if (!plan) return billingError("noPlan");
  if (plan.status === "ACTIVE" || plan.status === "PAST_DUE") return billingError("alreadyActive");
  const lines = subscriptionLines(plan);
  if (lines.length === 0) return billingError("freePlan");
  const base = appUrl();
  return toStripe(async () =>
    getStripeGateway().createSubscriptionCheckout({
      customerId: await ensureCustomer(user),
      userId: user.id,
      currency: plan.currency,
      lines,
      successUrl: `${base}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}/membership/cancel`,
    }),
  );
}

export async function startTopupAction(quantity: number): Promise<CheckoutFailure> {
  const user = await assertUser();
  const q = z.number().int().min(MIN_TOPUP_CREDITS).max(MAX_TOPUP_CREDITS).safeParse(quantity);
  if (!q.success) return billingError("invalidQuantity");
  const ent = await getEntitlements(user.id);
  if (ent.topupBlocked === "demo") return billingError("demo");
  if (!ent.topup) return billingError("noPlan");
  const { currency, unitPrice } = ent.topup;
  const base = appUrl();
  return toStripe(async () =>
    getStripeGateway().createTopupCheckout({
      customerId: await ensureCustomer(user),
      userId: user.id,
      currency,
      unitAmount: unitPrice,
      quantity: q.data,
      successUrl: `${base}/membership/success?topup=${q.data}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}/membership/cancel`,
    }),
  );
}

export async function openBillingPortalAction(): Promise<CheckoutFailure> {
  const user = await assertUser();
  const customerId = await getStripeCustomerId(user.id);
  if (!customerId) return billingError("noCustomer");
  return toStripe(() => getStripeGateway().createPortal(customerId, `${appUrl()}/membership`));
}
