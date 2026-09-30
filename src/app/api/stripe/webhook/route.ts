import type { NextRequest } from "next/server";
import { verifyWebhook } from "@/lib/billing/stripe-gateway";
import { handleStripeEvent } from "@/lib/billing/stripe-webhook";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const event = verifyWebhook(payload, req.headers.get("stripe-signature"));
  if (!event) return Response.json({ error: "invalid signature" }, { status: 400 });
  try {
    const result = await handleStripeEvent(event);
    return Response.json({ received: true, result });
  } catch (err) {
    console.error(`[stripe ${event.id} ${event.type}]`, err);
    return Response.json({ error: "handler failed" }, { status: 500 });
  }
}
