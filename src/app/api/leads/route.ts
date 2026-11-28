import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/db/client";

const allowed = new Set(["business", "contact", "email", "phone", "location", "industry", "social", "clientCount", "clientIndustries", "googleReviewUrl", "consent", "notes", "type"]);
const clean = (v: FormDataEntryValue | null) => typeof v === "string" ? v.trim().slice(0, 2000) : "";

export async function POST(request: Request) {
  const form = await request.formData();
  if (clean(form.get("website"))) return Response.redirect(new URL("/apply?submitted=1", request.url), 303);
  const type = clean(form.get("type"));
  if (type !== "shop" && type !== "partner") return new Response("Invalid form type", { status: 400 });
  const values = Object.fromEntries([...allowed].map((key) => [key, clean(form.get(key))]));
  values.platforms = form.getAll("platforms").map(clean).filter(Boolean).join(", ");
  if (!values.business || !values.contact || !values.email || !values.phone || !values.location || (type === "shop" && (!values.industry || !values.platforms || values.consent !== "yes")) || (type === "partner" && !values.clientCount)) return new Response("Please complete the required fields.", { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return new Response("Please enter a valid email.", { status: 400 });
  const limits: Record<string, number> = { business: 160, contact: 128, email: 254, phone: 40, location: 255, industry: 128, platforms: 255, social: 255, clientCount: 255, clientIndustries: 255, googleReviewUrl: 500, notes: 2000 };
  if (Object.entries(limits).some(([key, max]) => values[key].length > max)) return new Response("One or more fields are too long.", { status: 400 });
  if (values.googleReviewUrl && !/^https?:\/\//i.test(values.googleReviewUrl)) return new Response("Please enter a valid review page link.", { status: 400 });
  if (!process.env.RESEND_API_KEY) return new Response("Applications are temporarily unavailable. Please email eric@postory.ca.", { status: 503 });
  const label = type === "shop" ? "Shop experience application" : "Partner introduction request";
  const details = Object.entries(values).filter(([key, value]) => key !== "type" && value).map(([key, value]) => `${key}: ${value}`).join("\n");
  try {
    await prisma.websiteLead.create({ data: {
      type: type === "shop" ? "SHOP" : "PARTNER",
      businessName: values.business,
      contactName: values.contact,
      industry: (type === "shop" ? values.industry : values.clientIndustries) || null,
      email: values.email,
      phone: values.phone,
      location: values.location,
      platforms: values.platforms || null,
      socialOrClientCount: type === "shop" ? values.social || null : values.clientCount || null,
      googleReviewUrl: values.googleReviewUrl || null,
      notes: values.notes || null,
      experienceConfirmed: type === "shop" && values.consent === "yes",
    } });
  } catch {
    return new Response("We couldn’t save your request. Please email eric@postory.ca.", { status: 503 });
  }
  try {
    await sendMail({ to: process.env.LEAD_NOTIFY_EMAIL ?? "eric@postory.ca", subject: `PoStory ${label}: ${values.business.replace(/[\r\n]/g, " ")}`, text: `${label}\n${details}` });
    await sendMail({ to: values.email, subject: "We received your note — PoStory", text: type === "shop"
      ? `Hi ${values.contact},\n\nThanks for telling us about ${values.business}. Eric will review your details, prepare a design sample in your shop’s style, and follow up to arrange a short call. We’ll share a tailored quote directly with you after that conversation.\n\nEric · Postory, Toronto\neric@postory.ca`
      : `Hi ${values.contact},\n\nThanks for your interest in partnering with PoStory. Eric will reply within one business day to arrange an introduction and discuss whether our white-label content production fits your clients.\n\nEric · Postory, Toronto\neric@postory.ca` });
  } catch {
    return Response.redirect(new URL(`/apply?type=${type}&submitted=1&delivery=failed`, request.url), 303);
  }
  return Response.redirect(new URL(`/apply?type=${type}&submitted=1`, request.url), 303);
}
