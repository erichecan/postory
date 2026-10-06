"use server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { sendMail } from "@/lib/mail";
export type AssessmentState =
  { ok?: boolean; error?: string; fields?: Record<string, string> } | undefined;
const schema = z.object({
  businessType: z.enum([
    "Beauty & Wellness",
    "Restaurant & Food",
    "Home Services & Contractors",
    "Fitness & Health",
    "Retail & Boutiques",
    "Professional Services",
    "Other",
  ]),
  shopName: z.string().trim().min(1, "Business name is required.").max(128),
  location: z.string().trim().min(1, "Business location is required.").max(255),
  email: z.union([
    z.literal(""),
    z.email("Enter a valid email address.").max(254),
  ]),
  website: z.union([
    z.literal(""),
    z
      .url("Enter a full URL beginning with https://.")
      .max(500)
      .refine((s) => /^https?:\/\//i.test(s), "Use an http or https URL."),
  ]),
  goal: z.enum([
    "Attract more customers",
    "Increase bookings",
    "Build brand awareness",
    "Improve social media consistency",
    "Promote services or products",
  ]),
  details: z.string().trim().max(500),
});
export async function submitAssessment(
  _: AssessmentState,
  formData: FormData,
): Promise<AssessmentState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const e of parsed.error.issues) {
      const key = String(e.path[0]);
      fields[key] ??= e.message;
    }
    return { error: "Please check the highlighted fields.", fields };
  }
  if (!process.env.RESEND_API_KEY)
    return {
      error:
        "Online assessment delivery is not configured yet. Your information has not been submitted. Please try again later.",
    };
  const d = parsed.data;
  try {
    await sendMail({
      to: process.env.LEAD_NOTIFY_EMAIL ?? "szahua@gmail.com",
      subject: `PoStory assessment: ${d.shopName.replace(/[\r\n]/g, " ")}`,
      text: `Business: ${d.shopName}\nIndustry: ${d.businessType}\nLocation: ${d.location}\nReply to: ${d.email || "Not supplied"}\nWebsite/social: ${d.website || "Not supplied"}\nGoal: ${d.goal}\nDetails: ${d.details || "Not supplied"}`,
    });
    return { ok: true };
  } catch {
    return {
      error:
        "We couldn’t deliver your assessment. Your information has not been submitted. Please try again.",
    };
  }
}

export async function submitFeedback(
  _: AssessmentState,
  formData: FormData,
): Promise<AssessmentState> {
  const user = await requireUser();
  const parsed = z
    .object({
      subject: z.string().trim().min(1).max(200),
      message: z.string().trim().min(1, "Please enter your message.").max(2000),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: "Please enter a message of up to 2,000 characters." };
  if (!process.env.RESEND_API_KEY)
    return {
      error:
        "Message delivery is not configured yet. Your message has not been sent.",
    };
  try {
    await sendMail({
      to: process.env.LEAD_NOTIFY_EMAIL ?? "szahua@gmail.com",
      subject: `PoStory customer feedback: ${parsed.data.subject.replace(/[\r\n]/g, " ")}`,
      text: `Customer: ${user.name} (${user.id})\nCampaign/content: ${parsed.data.subject}\n\n${parsed.data.message}`,
    });
    return { ok: true };
  } catch {
    return { error: "We couldn’t deliver your message. Please try again." };
  }
}
