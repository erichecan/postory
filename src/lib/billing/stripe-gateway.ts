import "server-only";
import { randomBytes } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import Stripe from "stripe";
import type { Currency } from "@/types/commerce";
import type { SubscriptionLine } from "./plan-math";

export const MEMBERSHIP_PRODUCT_ID = "postory_membership";
export const CREDITS_PRODUCT_ID = "postory_credits";

const PRODUCT_NAMES: Record<string, string> = {
  [MEMBERSHIP_PRODUCT_ID]: "PoStory Membership",
  [CREDITS_PRODUCT_ID]: "PoStory Credits",
};

export type SubscriptionCheckoutInput = { customerId: string; userId: string; currency: Currency; lines: SubscriptionLine[]; successUrl: string; cancelUrl: string };
export type TopupCheckoutInput = { customerId: string; userId: string; currency: Currency; unitAmount: number; quantity: number; successUrl: string; cancelUrl: string };

export type StripeGateway = {
  mode: "live" | "fake";
  createCustomer(input: { userId: string; email: string | null; name: string }): Promise<string>;
  createSubscriptionCheckout(input: SubscriptionCheckoutInput): Promise<string>;
  createTopupCheckout(input: TopupCheckoutInput): Promise<string>;
  createPortal(customerId: string, returnUrl: string): Promise<string>;
  replaceSubscriptionItems(subscriptionId: string, currency: Currency, lines: SubscriptionLine[]): Promise<void>;
  cancelSubscription(subscriptionId: string): Promise<void>;
};

const lower = (c: Currency) => c.toLowerCase();

function liveGateway(secretKey: string): StripeGateway {
  const stripe = new Stripe(secretKey);
  const ensured = new Set<string>();

  async function ensureProduct(id: string) {
    if (ensured.has(id)) return id;
    try {
      await stripe.products.retrieve(id);
    } catch (err) {
      if (!(err instanceof Stripe.errors.StripeInvalidRequestError) || err.statusCode !== 404) throw err;
      await stripe.products.create({ id, name: PRODUCT_NAMES[id] });
    }
    ensured.add(id);
    return id;
  }

  async function recurringItems(currency: Currency, lines: SubscriptionLine[]) {
    const product = await ensureProduct(MEMBERSHIP_PRODUCT_ID);
    return lines.map((l) => ({
      price_data: { currency: lower(currency), product, unit_amount: l.unitAmount, recurring: { interval: "month" as const } },
      quantity: l.quantity,
      metadata: { line: l.key },
    }));
  }

  return {
    mode: "live",
    async createCustomer({ userId, email, name }) {
      const c = await stripe.customers.create({ email: email ?? undefined, name, metadata: { userId } });
      return c.id;
    },
    async createSubscriptionCheckout({ customerId, userId, currency, lines, successUrl, cancelUrl }) {
      const items = await recurringItems(currency, lines);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        client_reference_id: userId,
        line_items: items.map(({ price_data, quantity }) => ({ price_data, quantity })),
        subscription_data: { metadata: { userId } },
        metadata: { userId, kind: "subscription" },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      if (!session.url) throw new Error("checkout session has no url");
      return session.url;
    },
    async createTopupCheckout({ customerId, userId, currency, unitAmount, quantity, successUrl, cancelUrl }) {
      const product = await ensureProduct(CREDITS_PRODUCT_ID);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        client_reference_id: userId,
        line_items: [{ price_data: { currency: lower(currency), product, unit_amount: unitAmount }, quantity }],
        payment_intent_data: { metadata: { userId, kind: "topup", credits: String(quantity) } },
        metadata: { userId, kind: "topup", credits: String(quantity) },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      if (!session.url) throw new Error("checkout session has no url");
      return session.url;
    },
    async createPortal(customerId, returnUrl) {
      const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
      return session.url;
    },
    async replaceSubscriptionItems(subscriptionId, currency, lines) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const items = await recurringItems(currency, lines);
      await stripe.subscriptions.update(subscriptionId, {
        items: [...sub.items.data.map((i) => ({ id: i.id, deleted: true })), ...items],
        proration_behavior: "none",
      });
    },
    async cancelSubscription(subscriptionId) {
      await stripe.subscriptions.cancel(subscriptionId);
    },
  };
}

export const FAKE_LOG = path.join(process.cwd(), ".data", "stripe-fake", "log.jsonl");

function fakeGateway(): StripeGateway {
  const id = (prefix: string) => `${prefix}_fake_${randomBytes(8).toString("hex")}`;
  async function log(op: string, data: Record<string, unknown>) {
    await mkdir(path.dirname(FAKE_LOG), { recursive: true });
    await appendFile(FAKE_LOG, `${JSON.stringify({ op, at: new Date().toISOString(), ...data })}\n`);
  }
  const successWith = (url: string, sessionId: string) => url.replace("{CHECKOUT_SESSION_ID}", sessionId);

  return {
    mode: "fake",
    async createCustomer(input) {
      const customerId = id("cus");
      await log("customer", { customerId, ...input });
      return customerId;
    },
    async createSubscriptionCheckout(input) {
      const sessionId = id("cs");
      await log("checkout.subscription", { sessionId, ...input });
      return successWith(input.successUrl, sessionId);
    },
    async createTopupCheckout(input) {
      const sessionId = id("cs");
      await log("checkout.topup", { sessionId, ...input });
      return successWith(input.successUrl, sessionId);
    },
    async createPortal(customerId, returnUrl) {
      await log("portal", { customerId, returnUrl });
      return `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}portal=fake`;
    },
    async replaceSubscriptionItems(subscriptionId, currency, lines) {
      await log("subscription.replaceItems", { subscriptionId, currency, lines });
    },
    async cancelSubscription(subscriptionId) {
      await log("subscription.cancel", { subscriptionId });
    },
  };
}

export function getStripeGateway(): StripeGateway {
  const key = process.env.STRIPE_SECRET_KEY;
  if (process.env.STRIPE_MODE === "fake" || (!key && process.env.NODE_ENV !== "production")) return fakeGateway();
  if (!key) throw new Error("STRIPE_SECRET_KEY is required in production");
  return liveGateway(key);
}

export function verifyWebhook(payload: string, signature: string | null): Stripe.Event | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signature) return null;
  try {
    return Stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return null;
  }
}
