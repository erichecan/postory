"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { assertAdmin } from "@/lib/auth/session";
import { grantAgencyAccess } from "@/lib/db/agency-access";
import { getTrialRequestById, markTrialConverted } from "@/lib/db/partner-trials";
import { createUser, findUserByEmail } from "@/lib/db/users";
import { emailSchema, nameSchema, passwordSchema, phoneSchema } from "@/lib/validation";

const convertSchema = z.object({
  trialRequestId: z.string().min(1).max(40),
  email: emailSchema,
  phone: z.union([z.literal(""), phoneSchema]).optional(),
  name: nameSchema,
  password: passwordSchema,
  agencyEmail: z.union([z.literal(""), emailSchema]).optional(),
});

export type ConvertTrialState = { error?: string } | undefined;

export async function adminConvertTrialAction(_: ConvertTrialState, formData: FormData): Promise<ConvertTrialState> {
  await assertAdmin();
  const t = await getTranslations("admin.partnerTrials.errors");
  const parsed = convertSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t("invalid") };
  const { trialRequestId, email, phone, name, password, agencyEmail } = parsed.data;

  const trial = await getTrialRequestById(trialRequestId);
  if (!trial) return { error: t("notFound") };
  if (trial.status === "CONVERTED") return { error: t("alreadyConverted") };

  let agencyUserId = trial.agencyUserId;
  if (!agencyUserId) {
    if (!agencyEmail) return { error: t("agencyEmailRequired") };
    const agencyUser = await findUserByEmail(agencyEmail);
    if (!agencyUser) return { error: t("agencyNotFound") };
    agencyUserId = agencyUser.id;
  }

  let clientUserId: string;
  try {
    const created = await createUser({ email, phone: phone || undefined, name, password, source: "OFFLINE", emailVerified: true });
    clientUserId = created.id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: t("emailTaken") };
    throw e;
  }

  await grantAgencyAccess(agencyUserId, clientUserId);
  await markTrialConverted(trialRequestId, clientUserId);

  redirect(`/admin/accounts/${clientUserId}`);
}
